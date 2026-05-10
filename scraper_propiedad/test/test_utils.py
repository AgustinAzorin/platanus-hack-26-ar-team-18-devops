import json
import os

from src import utils


def test_parse_posting_id_from_id():
    assert utils.parse_posting_id('12345678') == '12345678'


def test_parse_posting_id_from_clasificado_url():
    url = 'https://www.zonaprop.com.ar/propiedades/clasificado/test-12345678.html'
    assert utils.parse_posting_id(url) == '12345678'


def test_save_outputs(tmp_path):
    csv_file = tmp_path / 'out.csv'
    json_file = tmp_path / 'out.json'

    utils.save_rows_to_csv([{'posting_id': '123'}], str(csv_file))
    utils.save_json({'posting_id': '123'}, str(json_file))

    assert os.path.exists(csv_file)
    assert json.loads(json_file.read_text())['posting_id'] == '123'
