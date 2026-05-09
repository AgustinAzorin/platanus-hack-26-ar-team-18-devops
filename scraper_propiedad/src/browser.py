import certifi
import cloudscraper
import requests
import urllib3


class Browser():
    def __init__(self, verify_ssl=True):
        self.verify_ssl = verify_ssl
        self.verify = certifi.where() if verify_ssl else False
        if not verify_ssl:
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

        # cloudscraper's SSL adapter breaks with verify=False on Python 3.13.
        # Use requests directly for the explicit insecure mode.
        self.scraper = cloudscraper.create_scraper() if verify_ssl else requests.Session()
        self.scraper.headers.update({
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
            'Referer': 'https://www.zonaprop.com.ar/',
            'User-Agent': (
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/124.0 Safari/537.36'
            ),
        })

    def get(self, url, **kwargs):
        kwargs.setdefault('verify', self.verify)
        try:
            return self.scraper.get(url, **kwargs)
        except requests.exceptions.SSLError as error:
            raise RuntimeError(
                'SSL certificate verification failed. '
                'On macOS with python.org Python, run the script with --insecure '
                'or install/update local Python certificates.'
            ) from error

    def get_text(self, url):
        response = self.get(url, timeout=30)
        response.raise_for_status()
        return response.text

    def get_json(self, url):
        response = self.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
