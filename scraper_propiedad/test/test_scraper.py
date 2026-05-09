from src.scraper import Scraper


class FakeBrowser:
    def __init__(self, payload):
        self.payload = payload
        self.requested_url = None

    def get(self, url, **kwargs):
        self.requested_url = url
        return FakeResponse(self.payload)

    def get_json(self, url):
        self.requested_url = url
        return self.payload


class FakeResponse:
    def __init__(self, text, url=None, status_code=200):
        self.text = text
        self.url = url or (
            'https://www.zonaprop.com.ar/propiedades/clasificado/'
            'alquiler-departamento-palermo-12345678.html'
        )
        self.status_code = status_code

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f'HTTP {self.status_code}')


def sample_public_page():
    return '''
        <script>
            const mapLatOf = "LTM0LjU4";
            const mapLngOf = "LTU4LjQy";
            const urlMapOf = "";
            const avisoInfo = {
                "idAviso": 12345678,
                "url": "/propiedades/clasificado/alquiler-departamento-palermo-12345678.html",
                "postingType": "Alquiler",
                "status": "ONLINE",
                "postingTitle": "Departamento en Palermo",
                "description": "Muy luminoso<br>con balcon. Contacto: ventas@test.com",
                "realEstateType": {"name": "Departamento"},
                "pricesData": [
                    {
                        "operationType": {"name": "Alquiler"},
                        "prices": [{"currency": "USD", "formattedAmount": "850", "amount": 850}]
                    }
                ],
                "expenses": "120000",
                "publisher": {
                    "id": 99,
                    "name": "Inmobiliaria Test",
                    "url": "/inmobiliarias/test_99-inmuebles.html",
                    "urlLogo": "https://logo.png",
                    "license": "CMCPSI 1234",
                    "partialPhone": "11444",
                    "publisherTypeId": 2
                },
                "partialPhone": "11444",
                "address": "Av. Siempre Viva 123",
                "location": {
                    "name": "Palermo",
                    "label": "Palermo, Capital Federal",
                    "parent": {"name": "Capital Federal"}
                },
                "mapLat": mapLatOf,
                "mapLng": mapLngOf,
                "whatsApp": "54 9 1144445555",
                "pictures": [
                    {"url730x532": "https://img.zonaprop.com/1.jpg?token=a", "order": 1},
                    {"url730x532": "https://img.zonaprop.com/2.jpg", "order": 2}
                ],
                "mainFeatures": {
                    "CFT100": {"value": "55", "measure": "m²", "label": "tot."},
                    "CFT101": {"value": "50", "measure": "m²", "label": "cub."},
                    "CFT1": {"value": "3", "measure": null, "label": "amb."},
                    "CFT2": {"value": "2", "measure": null, "label": "dorm."},
                    "CFT3": {"value": "1", "measure": null, "label": "baño"},
                    "CFT7": {"value": "1", "measure": null, "label": "coch."}
                },
                "generalFeatures": [],
                "videos": []
            },
        </script>
    '''


def test_scrap_property_fetches_by_id_and_normalizes_payload():
    browser = FakeBrowser(sample_public_page())
    scraper = Scraper(browser)

    property_data = scraper.scrap_property('12345678')

    assert browser.requested_url == (
        'https://www.zonaprop.com.ar/propiedades/clasificado/propiedad-12345678.html'
    )
    assert property_data['posting_id'] == '12345678'
    assert property_data['url'] == (
        'https://www.zonaprop.com.ar/propiedades/clasificado/'
        'alquiler-departamento-palermo-12345678.html'
    )
    assert property_data['title'] == 'Departamento en Palermo'
    assert property_data['description'] == 'Muy luminoso con balcon. Contacto: ventas@test.com'
    assert property_data['price_value'] == 850
    assert property_data['price_type'] == 'USD'
    assert property_data['expenses_value'] == 120000
    assert property_data['expenses_type'] == '$'
    assert property_data['square_meters_area'] == 55
    assert property_data['covered_square_meters_area'] == 50
    assert property_data['rooms'] == 3
    assert property_data['bedrooms'] == 2
    assert property_data['bathrooms'] == 1
    assert property_data['parking'] == 1
    assert property_data['image_count'] == 2
    assert property_data['image_urls'] == (
        'https://img.zonaprop.com/1.jpg|https://img.zonaprop.com/2.jpg'
    )
    assert property_data['address'] == 'Av. Siempre Viva 123'
    assert property_data['neighborhood'] == 'Palermo'
    assert property_data['city'] == 'Capital Federal'
    assert property_data['latitude'] == -34.58
    assert property_data['longitude'] == -58.42
    assert property_data['publisher_name'] == 'Inmobiliaria Test'
    assert property_data['publisher_url'] == (
        'https://www.zonaprop.com.ar/inmobiliarias/test_99-inmuebles.html'
    )
    assert property_data['publisher_license'] == 'CMCPSI 1234'
    assert property_data['publisher_type_id'] == 2
    assert property_data['publisher_partial_phone'] == '11444'
    assert property_data['has_whatsapp'] is True
    assert property_data['seller_whatsapp'] == '54 9 1144445555'
    assert property_data['seller_whatsapp_digits'] == '5491144445555'
    assert property_data['seller_whatsapp_url'] == 'https://wa.me/5491144445555'
    assert property_data['seller_contact_phone'] == '54 9 1144445555'
    assert property_data['seller_partial_phone'] == '11444'
    assert property_data['seller_emails_in_description'] == 'ventas@test.com'


def test_parse_feature_value_from_text_without_feature_id():
    scraper = Scraper(FakeBrowser({}))

    assert scraper.parse_feature_value('2 baños') == ('bathrooms', 2)
    assert scraper.parse_feature_value('42 m² cubiertos') == ('covered_square_meters_area', 42)
    assert scraper.parse_feature_value('65 m² totales') == ('square_meters_area', 65)
