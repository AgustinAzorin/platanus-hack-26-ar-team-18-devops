import argparse
import sys

from src import utils


def main(posting_id_input, output_format='both', output_dir='data', include_raw=False, verify_ssl=True):
    from src.browser import Browser
    from src.scraper import Scraper

    posting_id = utils.parse_posting_id(posting_id_input)
    print(f'Running property scraper for posting_id {posting_id}')

    browser = Browser(verify_ssl=verify_ssl)
    scraper = Scraper(browser)
    raw_posting = scraper.fetch_posting(posting_id)
    property_data = scraper.parse_property(raw_posting, posting_id)

    if output_format in ['csv', 'both']:
        filename = utils.get_filename_from_datetime(posting_id, 'csv', output_dir)
        utils.save_rows_to_csv([property_data], filename)
        print(f'CSV saved to {filename}')

    if output_format in ['json', 'both']:
        payload = {'property': property_data}
        if include_raw:
            payload['raw'] = raw_posting
        filename = utils.get_filename_from_datetime(posting_id, 'json', output_dir)
        utils.save_json(payload, filename)
        print(f'JSON saved to {filename}')

    print('Scrap finished !!!')
    return property_data


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Scrape a Zonaprop classified by posting id')
    parser.add_argument('posting_id', help='Zonaprop posting id or classified URL')
    parser.add_argument(
        '--format',
        choices=['csv', 'json', 'both'],
        default='both',
        help='output format',
    )
    parser.add_argument('--output-dir', default='data', help='directory for generated files')
    parser.add_argument('--raw', action='store_true', help='include raw API payload in JSON output')
    parser.add_argument(
        '--insecure',
        action='store_true',
        help='disable SSL certificate verification for environments with broken local certs',
    )
    args = parser.parse_args()

    try:
        main(
            args.posting_id,
            output_format=args.format,
            output_dir=args.output_dir,
            include_raw=args.raw,
            verify_ssl=not args.insecure,
        )
    except (RuntimeError, ValueError) as error:
        sys.exit(str(error))
