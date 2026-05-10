import ast
import base64
import binascii
import html as html_lib
import json
import re
import unicodedata


API_BASE_URL = 'https://bsre.zonaprop.com.ar/v4/postings'
PUBLIC_POSTING_URL = 'https://www.zonaprop.com.ar/propiedades/clasificado/propiedad-{}.html'
IMAGE_URL_SEPARATOR = '|'

NUMBER_PATTERN = re.compile(r'\d+(?:[\.\s]\d{3})*(?:,\d+)?|\d+(?:\.\d+)?')
CURRENCY_PATTERN = re.compile(r'(USD|U\$S|ARS|\$)', re.IGNORECASE)
EMAIL_PATTERN = re.compile(r'[\w.+-]+@[\w-]+(?:\.[\w-]+)+')

FEATURE_ID_DICT = {
    'CFT100': 'square_meters_area',
    'CFT101': 'covered_square_meters_area',
    'CFT1': 'rooms',
    'CFT2': 'bedrooms',
    'CFT3': 'bathrooms',
    'CFT4': 'parking',
    'CFT7': 'parking',
    'CFT5': 'age',
}


class Scraper:
    def __init__(self, browser, api_base_url=API_BASE_URL, public_url_template=PUBLIC_POSTING_URL):
        self.browser = browser
        self.api_base_url = api_base_url.rstrip('/')
        self.public_url_template = public_url_template

    def scrap_property(self, posting_id):
        posting = self.fetch_posting(posting_id)
        return self.parse_property(posting, posting_id)

    def fetch_posting(self, posting_id):
        return self.fetch_public_posting(posting_id)

    def fetch_api_posting(self, posting_id):
        url = f'{self.api_base_url}/{posting_id}'
        data = self.browser.get_json(url)
        return self.extract_posting_payload(data)

    def fetch_public_posting(self, posting_id):
        url = self.public_url_template.format(posting_id)
        response = self.browser.get(url, timeout=30, allow_redirects=True)
        try:
            response.raise_for_status()
        except Exception as error:
            raise RuntimeError(
                f'Could not fetch Zonaprop posting {posting_id}: HTTP {response.status_code}'
            ) from error
        return self.parse_public_posting_html(response.text, response.url, posting_id)

    def parse_public_posting_html(self, page, final_url=None, posting_id=None):
        aviso_info = self.extract_aviso_info(page)
        if not aviso_info:
            raise RuntimeError('Could not find avisoInfo in Zonaprop public posting page')

        map_lat = self.decode_base64_number(aviso_info.get('mapLat'))
        map_lng = self.decode_base64_number(aviso_info.get('mapLng'))
        prices_data = aviso_info.get('pricesData') or []
        publisher = aviso_info.get('publisher') or {}
        real_estate_type = aviso_info.get('realEstateType') or {}
        contact = self.build_contact_data(aviso_info, publisher)

        return {
            'id': str(aviso_info.get('idAviso') or posting_id or ''),
            'url': final_url or aviso_info.get('url'),
            'posting_type': aviso_info.get('postingType'),
            'site': 'ZP',
            'online': aviso_info.get('status') == 'ONLINE',
            'title': aviso_info.get('postingTitle') or aviso_info.get('generatedTitle'),
            'description': aviso_info.get('description'),
            'real_estate_type': real_estate_type.get('name') if isinstance(real_estate_type, dict) else real_estate_type,
            'prices': self.build_price_lines_from_public_data(prices_data),
            'expenses': self.build_expenses_line(aviso_info.get('expenses')),
            'publisher': {
                'id': publisher.get('id') or publisher.get('publisherId'),
                'name': publisher.get('name'),
                'url': publisher.get('url'),
                'logo': publisher.get('urlLogo'),
                'license': publisher.get('license'),
                'premier': aviso_info.get('premier') or publisher.get('premium'),
                'type_id': publisher.get('publisherTypeId'),
                'partial_phone': publisher.get('partialPhone') or aviso_info.get('partialPhone'),
            },
            'location': {
                'address': aviso_info.get('address'),
                'location': aviso_info.get('location'),
                'geolocation': {
                    'latitude': map_lat,
                    'longitude': map_lng,
                },
            },
            'contact_preferences': {
                'has_whatsapp': bool(contact.get('whatsapp')),
            },
            'contact': contact,
            'pictures': aviso_info.get('pictures') or [],
            'videos_urls': self.build_video_urls(aviso_info.get('videos') or []),
            'main_features': self.build_main_features_from_public_data(aviso_info.get('mainFeatures') or {}),
            'features': aviso_info.get('generalFeatures'),
            'posting_codes': self.build_posting_codes(aviso_info),
            'publication_statistics': self.extract_const_string(page, 'antiquity'),
        }

    def extract_aviso_info(self, page):
        block = self.extract_js_const_block(page, 'avisoInfo')
        variables = {
            'mapLatOf': self.extract_const_string(page, 'mapLatOf'),
            'mapLngOf': self.extract_const_string(page, 'mapLngOf'),
            'urlMapOf': self.extract_const_string(page, 'urlMapOf'),
        }
        for name, value in variables.items():
            block = re.sub(rf'(?<![\w]){name}(?![\w])', repr(value), block)

        block = re.sub(r'\bfalse\b', 'False', block)
        block = re.sub(r'\btrue\b', 'True', block)
        block = re.sub(r'\bnull\b', 'None', block)
        return ast.literal_eval(block)

    def extract_js_const_block(self, page, name):
        marker = f'const {name} ='
        index = page.find(marker)
        if index == -1:
            raise RuntimeError(f'Could not find JS const {name}')
        start = page.find('{', index)
        if start == -1:
            raise RuntimeError(f'Could not find object start for JS const {name}')

        depth = 0
        quote = None
        escaping = False
        for pos in range(start, len(page)):
            char = page[pos]
            if quote is not None:
                if escaping:
                    escaping = False
                elif char == '\\':
                    escaping = True
                elif char == quote:
                    quote = None
            else:
                if char in ('"', "'"):
                    quote = char
                elif char == '{':
                    depth += 1
                elif char == '}':
                    depth -= 1
                    if depth == 0:
                        return page[start:pos + 1]
        raise RuntimeError(f'Could not find object end for JS const {name}')

    def extract_const_string(self, page, name):
        match = re.search(rf'const\s+{name}\s*=\s*(["\'])(.*?)\1', page, re.S)
        return match.group(2) if match is not None else None

    def decode_base64_number(self, value):
        if not value:
            return None
        try:
            return float(base64.b64decode(value).decode('utf-8'))
        except (ValueError, UnicodeDecodeError, binascii.Error):
            return None

    def build_price_lines_from_public_data(self, prices_data):
        result = []
        if not isinstance(prices_data, list):
            return result
        for operation in prices_data:
            operation_type = operation.get('operationType') or {}
            operation_name = operation_type.get('name') or ''
            for price in operation.get('prices') or []:
                currency = price.get('currency') or ''
                formatted = price.get('formattedAmount')
                amount = price.get('amount')
                if formatted is not None:
                    result.append(f'{operation_name} {currency} {formatted}')
                elif amount is not None:
                    result.append(f'{operation_name} {currency} {amount}')
        return result

    def build_expenses_line(self, value):
        if value in (None, '', 'None'):
            return None
        return f'expensas $ {value}'

    def build_contact_data(self, aviso_info, publisher):
        whatsapp = self.clean_text(aviso_info.get('whatsApp') or publisher.get('whatsApp'))
        whatsapp_digits = self.extract_digits(whatsapp)
        phone = self.clean_text(
            aviso_info.get('phone') or publisher.get('phone') or publisher.get('mainPhone')
        )
        email = self.first_present(aviso_info, ['email', 'mail'])
        email = email or self.first_present(publisher, ['email', 'mail'])
        description_emails = self.extract_emails(aviso_info.get('description'))

        return {
            'whatsapp': whatsapp,
            'whatsapp_digits': whatsapp_digits,
            'whatsapp_url': self.build_whatsapp_url(whatsapp_digits),
            'partial_phone': self.clean_text(
                aviso_info.get('partialPhone') or publisher.get('partialPhone')
            ),
            'phone': phone,
            'contact_phone': phone or whatsapp,
            'email': self.clean_text(email),
            'emails_in_description': description_emails,
        }

    def extract_digits(self, text):
        if text is None:
            return None
        digits = re.sub(r'\D+', '', str(text))
        return digits or None

    def build_whatsapp_url(self, digits):
        if not digits:
            return None
        return f'https://wa.me/{digits}'

    def extract_emails(self, text):
        if not text:
            return []
        return sorted(set(EMAIL_PATTERN.findall(str(text))))

    def build_video_urls(self, videos):
        result = []
        if not isinstance(videos, list):
            return result
        for video in videos:
            reference = video.get('reference') if isinstance(video, dict) else video
            if not reference:
                continue
            if str(reference).startswith('http'):
                result.append(reference)
            else:
                result.append(f'https://www.youtube.com/embed/{reference}')
        return result

    def build_main_features_from_public_data(self, features):
        result = []
        if not isinstance(features, dict):
            return result
        for feature_id, feature in features.items():
            if not isinstance(feature, dict):
                continue
            value = feature.get('value')
            if value is None:
                continue
            label = feature.get('label')
            measure = feature.get('measure')
            text = ' '.join(str(part) for part in [value, measure, label] if part)
            result.append({'id': feature_id, 'value': text})
        return result

    def build_posting_codes(self, aviso_info):
        codes = []
        if aviso_info.get('postingCode'):
            codes.append(f"Cód. del anunciante: {aviso_info.get('postingCode')}")
        if aviso_info.get('idAviso'):
            codes.append(f"Cód. Zonaprop: {aviso_info.get('idAviso')}")
        return ' | '.join(codes) if codes else None

    def extract_posting_payload(self, data):
        if not isinstance(data, dict):
            return {}
        for key in ['posting', 'data', 'result']:
            value = data.get(key)
            if isinstance(value, dict):
                if isinstance(value.get('posting'), dict):
                    return value['posting']
                return value
        return data

    def parse_property(self, posting, posting_id=None):
        location = posting.get('location') or {}
        publisher = posting.get('publisher') or {}
        contact_preferences = posting.get('contact_preferences') or {}
        contact = posting.get('contact') or {}
        features = self.parse_main_features(posting.get('main_features') or [])
        price_data = self.parse_prices(posting)
        images = self.extract_image_urls(posting)
        videos = self.extract_video_urls(posting)

        property_data = {
            'url': self.ensure_absolute_url(posting.get('url')),
            'posting_id': str(posting.get('id') or posting.get('posting_id') or posting_id or ''),
            'posting_type': self.clean_text(posting.get('posting_type') or posting.get('operation_type')),
            'site': self.clean_text(posting.get('site')),
            'online': posting.get('online'),
            'title': self.clean_text(posting.get('title')),
            'description': self.clean_text(posting.get('description')),
            'real_estate_type': self.clean_text(posting.get('real_estate_type')),
            'image_urls': IMAGE_URL_SEPARATOR.join(images),
            'image_count': len(images),
            'video_urls': IMAGE_URL_SEPARATOR.join(videos),
            'address': self.extract_address(location),
            'address_visibility': self.extract_address_visibility(location),
            'neighborhood': self.extract_neighborhood(location),
            'location_label': self.extract_location_label(location),
            'city': self.extract_city(location),
            'latitude': self.extract_latitude(location),
            'longitude': self.extract_longitude(location),
            'price_value': price_data.get('price_value'),
            'price_type': price_data.get('price_type'),
            'expenses_value': price_data.get('expenses_value'),
            'expenses_type': price_data.get('expenses_type'),
            'publisher_id': publisher.get('id'),
            'publisher_name': self.clean_text(publisher.get('name')),
            'publisher_url': self.ensure_absolute_url(publisher.get('url')),
            'publisher_logo': publisher.get('logo'),
            'publisher_license': self.clean_text(publisher.get('license')),
            'publisher_premier': publisher.get('premier'),
            'publisher_type_id': publisher.get('type_id'),
            'publisher_partial_phone': self.clean_text(publisher.get('partial_phone')),
            'has_whatsapp': contact_preferences.get('has_whatsapp'),
            'seller_whatsapp': self.clean_text(contact.get('whatsapp')),
            'seller_whatsapp_digits': self.clean_text(contact.get('whatsapp_digits')),
            'seller_whatsapp_url': contact.get('whatsapp_url'),
            'seller_phone': self.clean_text(contact.get('phone')),
            'seller_contact_phone': self.clean_text(contact.get('contact_phone')),
            'seller_partial_phone': self.clean_text(contact.get('partial_phone')),
            'seller_email': self.clean_text(contact.get('email')),
            'seller_emails_in_description': IMAGE_URL_SEPARATOR.join(
                self.extract_text_list(contact.get('emails_in_description'))
            ),
            'pills': IMAGE_URL_SEPARATOR.join(self.extract_text_list(posting.get('pills'))),
            'posting_codes': self.to_json_text(posting.get('posting_codes')),
            'features': self.to_json_text(posting.get('features')),
            'publication_statistics': self.to_json_text(posting.get('publication_statistics')),
        }
        property_data.update(features)
        return property_data

    def parse_prices(self, posting):
        price_lines = self.extract_price_lines(posting.get('prices'))
        explicit_expenses = posting.get('expenses') or posting.get('maintenance_price')
        if explicit_expenses is not None:
            price_lines.append(f'expensas {explicit_expenses}')

        result = {
            'price_value': None,
            'price_type': None,
            'expenses_value': None,
            'expenses_type': None,
        }

        for line in price_lines:
            value, currency = self.parse_currency_value(line)
            if value is None:
                continue
            normalized = self.normalize_text(line)
            if 'expensa' in normalized:
                if result['expenses_value'] is None:
                    result['expenses_value'] = value
                    result['expenses_type'] = currency
            elif result['price_value'] is None:
                result['price_value'] = value
                result['price_type'] = currency

        if result['price_value'] is None:
            value, currency = self.parse_currency_value(posting.get('price'))
            result['price_value'] = value
            result['price_type'] = currency

        return result

    def extract_price_lines(self, prices):
        if prices is None:
            return []
        if isinstance(prices, str):
            return [prices]
        if isinstance(prices, dict):
            return self.extract_price_lines_from_dict(prices)
        if not isinstance(prices, list):
            return [str(prices)]

        result = []
        for item in prices:
            if isinstance(item, dict):
                result += self.extract_price_lines_from_dict(item)
            else:
                result += self.extract_text_list(item)
        return result

    def extract_price_lines_from_dict(self, value):
        if 'label' in value and 'value' in value:
            return [f"{value.get('label')} {value.get('value')}"]
        if 'operation_type' in value and 'price' in value:
            return [f"{value.get('operation_type')} {value.get('price')}"]
        if 'operationType' in value and 'price' in value:
            return [f"{value.get('operationType')} {value.get('price')}"]
        return self.extract_text_list(value)

    def extract_text_list(self, value):
        if value is None:
            return []
        if isinstance(value, str):
            return [self.clean_text(value)] if self.clean_text(value) else []
        if isinstance(value, (int, float, bool)):
            return [str(value)]
        if isinstance(value, list):
            result = []
            for item in value:
                result += self.extract_text_list(item)
            return result
        if isinstance(value, dict):
            preferred_keys = [
                'price',
                'formatted_price',
                'formattedPrice',
                'amount',
                'value',
                'label',
                'name',
                'text',
                'description',
            ]
            result = []
            for key in preferred_keys:
                if key in value:
                    result += self.extract_text_list(value[key])
            if not result:
                for child in value.values():
                    result += self.extract_text_list(child)
            return result
        return []

    def parse_main_features(self, main_features):
        features = {}
        if not isinstance(main_features, list):
            return features

        for feature in main_features:
            if isinstance(feature, dict):
                feature_id = feature.get('id') or feature.get('feature_id')
                text = self.first_present(feature, ['value', 'label', 'name', 'description', 'text'])
                field = FEATURE_ID_DICT.get(str(feature_id)) if feature_id is not None else None
            else:
                text = str(feature)
                field = None

            parsed_field, parsed_value = self.parse_feature_value(text)
            field = field or parsed_field
            if field is not None and parsed_value is None:
                parsed_value = self.parse_number(text)
                if parsed_value is not None and field not in [
                    'square_meters_area',
                    'covered_square_meters_area',
                ]:
                    parsed_value = int(parsed_value)
            if field is not None and parsed_value is not None:
                features[field] = parsed_value

        return features

    def parse_feature_value(self, text):
        if text is None:
            return None, None
        normalized = self.normalize_text(text)
        value = self.parse_number(text)
        if value is None:
            return None, None
        if 'm2' in normalized or 'm 2' in normalized:
            if 'cub' in normalized:
                return 'covered_square_meters_area', value
            return 'square_meters_area', value
        if 'amb' in normalized:
            return 'rooms', int(value)
        if 'dorm' in normalized:
            return 'bedrooms', int(value)
        if 'ban' in normalized:
            return 'bathrooms', int(value)
        if 'coch' in normalized or 'garage' in normalized:
            return 'parking', int(value)
        if 'ano' in normalized or 'antig' in normalized:
            return 'age', int(value)
        return None, None

    def parse_currency_value(self, text):
        if text is None:
            return None, None
        text = str(text)
        currency_match = CURRENCY_PATTERN.search(text)
        value = self.parse_number(text)
        if value is None:
            return None, None
        currency = None
        if currency_match is not None:
            currency = currency_match.group(1).upper().replace('U$S', 'USD')
        return value, currency

    def parse_number(self, text):
        if text is None:
            return None
        match = NUMBER_PATTERN.search(str(text))
        if match is None:
            return None
        value = match.group(0).replace('.', '').replace(' ', '').replace(',', '.')
        try:
            number = float(value)
        except ValueError:
            return None
        return int(number) if number.is_integer() else number

    def extract_image_urls(self, posting):
        urls = []
        for key in ['pictures_urls', 'picturesUrls', 'image_urls', 'images', 'pictures']:
            urls += self.extract_urls_from_value(posting.get(key))

        visible_pictures = posting.get('visiblePictures') or {}
        urls += self.extract_urls_from_value(visible_pictures.get('pictures'))
        return self.dedupe_urls(urls)

    def extract_video_urls(self, posting):
        urls = []
        for key in ['videos_urls', 'video_urls', 'videos']:
            urls += self.extract_urls_from_value(posting.get(key))
        return self.dedupe_urls(urls)

    def extract_urls_from_value(self, value):
        if value is None:
            return []
        if isinstance(value, str):
            return [value.split('?')[0]] if value.startswith('http') else []
        if isinstance(value, list):
            urls = []
            ordered_items = sorted(
                value,
                key=lambda item: item.get('order', 0) if isinstance(item, dict) else 0,
            )
            for item in ordered_items:
                urls += self.extract_urls_from_value(item)
            return urls
        if isinstance(value, dict):
            for key in ['url730x532', 'url720x532', 'url360x266', 'url', 'src']:
                if key in value:
                    return self.extract_urls_from_value(value[key])
        return []

    def dedupe_urls(self, urls):
        result = []
        seen = set()
        for url in urls:
            if url and url not in seen:
                seen.add(url)
                result.append(url)
        return result

    def extract_address(self, location):
        address = location.get('address') if isinstance(location, dict) else None
        if isinstance(address, dict):
            return self.clean_text(address.get('name') or address.get('label') or address.get('value'))
        return self.clean_text(address)

    def extract_address_visibility(self, location):
        address = location.get('address') if isinstance(location, dict) else None
        if isinstance(address, dict):
            return address.get('visibility')
        return location.get('visibility') if isinstance(location, dict) else None

    def extract_neighborhood(self, location):
        loc = location.get('location') if isinstance(location, dict) else None
        if isinstance(loc, dict):
            return self.clean_text(loc.get('name') or loc.get('label') or loc.get('value'))
        if isinstance(loc, str):
            return self.clean_text(loc.split(',')[0])
        return self.clean_text(location.get('neighborhood')) if isinstance(location, dict) else None

    def extract_location_label(self, location):
        loc = location.get('location') if isinstance(location, dict) else None
        if isinstance(loc, dict):
            return self.clean_text(loc.get('label') or loc.get('name'))
        return self.clean_text(loc)

    def extract_city(self, location):
        loc = location.get('location') if isinstance(location, dict) else None
        if isinstance(loc, dict):
            parent = loc.get('parent') or {}
            if isinstance(parent, dict):
                return self.clean_text(parent.get('name') or parent.get('label'))
            return self.clean_text(parent)
        if isinstance(loc, str):
            parts = [part.strip() for part in loc.split(',') if part.strip()]
            return parts[1] if len(parts) > 1 else None
        return self.clean_text(location.get('city')) if isinstance(location, dict) else None

    def extract_latitude(self, location):
        geo = self.extract_geolocation(location)
        return geo.get('latitude') or geo.get('lat')

    def extract_longitude(self, location):
        geo = self.extract_geolocation(location)
        return geo.get('longitude') or geo.get('lng') or geo.get('lon')

    def extract_geolocation(self, location):
        if not isinstance(location, dict):
            return {}
        geo = location.get('geolocation') or {}
        if isinstance(geo, dict):
            return geo
        posting_geo = location.get('postingGeolocation') or {}
        if isinstance(posting_geo, dict):
            return posting_geo.get('geolocation') or {}
        return {}

    def ensure_absolute_url(self, url):
        url = self.clean_text(url)
        if not url:
            return None
        if url.startswith('http'):
            return url
        return f'https://www.zonaprop.com.ar{url if url.startswith("/") else "/" + url}'

    def clean_text(self, text):
        if text is None:
            return None
        text = str(text)
        text = re.sub(r'<br\s*/?>', ' ', text, flags=re.I)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = html_lib.unescape(text)
        text = text.replace('\n', ' ')
        text = text.replace('\t', ' ')
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        return text or None

    def normalize_text(self, text):
        text = self.clean_text(text) or ''
        text = unicodedata.normalize('NFKD', text)
        text = ''.join(char for char in text if not unicodedata.combining(char))
        return text.lower()

    def first_present(self, data, keys):
        for key in keys:
            value = data.get(key)
            if value is not None:
                return value
        return None

    def to_json_text(self, value):
        if value is None:
            return None
        return json.dumps(value, ensure_ascii=False)
