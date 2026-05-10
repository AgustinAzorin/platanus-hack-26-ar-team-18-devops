import csv
import datetime
import json
import os
import re
from urllib.parse import urlparse


POSTING_ID_FROM_URL_RE = re.compile(r'-(\d+)\.html$')
POSTING_ID_FROM_API_RE = re.compile(r'/postings/(\d+)$')


def parse_posting_id(value):
    value = str(value).strip()
    if not value:
        raise ValueError('posting_id is required')
    if value.isdigit():
        return value

    parsed = urlparse(value)
    path = parsed.path.rstrip('/')

    match = POSTING_ID_FROM_API_RE.search(path)
    if match is not None:
        return match.group(1)

    filename = path.split('/')[-1]
    match = POSTING_ID_FROM_URL_RE.search(filename)
    if match is not None:
        return match.group(1)

    raise ValueError(f'Could not extract posting_id from {value}')


def get_filename_from_datetime(posting_id, extension, output_dir='data'):
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
    return os.path.join(output_dir, f'posting-{posting_id}-{timestamp}.{extension}')


def create_root_directory(filename):
    directory = os.path.dirname(filename)
    if directory:
        os.makedirs(directory, exist_ok=True)


def save_rows_to_csv(rows, filename):
    create_root_directory(filename)
    fieldnames = []
    for row in rows:
        for key in row.keys():
            if key not in fieldnames:
                fieldnames.append(key)

    with open(filename, 'w', encoding='utf-8', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def save_json(data, filename):
    create_root_directory(filename)
    with open(filename, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
