#!/usr/bin/env python3
"""
Simple checker that fetches the site's index.html from a local static server and
checks all linked assets (href/src) for HTTP status.
Usage: python check_assets.py [PORT]
"""
import sys
import re
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
BASE = f'http://127.0.0.1:{PORT}/'

def fetch(url):
    try:
        req = Request(url, method='GET')
        with urlopen(req, timeout=6) as r:
            return r.getcode(), r.read()
    except Exception as e:
        return None, str(e)

def head(url):
    try:
        req = Request(url, method='HEAD')
        with urlopen(req, timeout=6) as r:
            return r.getcode()
    except Exception as e:
        return None

if __name__ == '__main__':
    print(f'Checking {BASE}index.html ...')
    code, data = fetch(urljoin(BASE, 'index.html'))
    if not code:
        print('Failed to fetch index.html:', data)
        sys.exit(1)
    print('index.html ->', code)
    html = data.decode('utf-8', errors='replace')

    # find src and href values
    pattern = re.compile(r"(?:src|href)=\"([^\"]+)\"", re.IGNORECASE)
    matches = pattern.findall(html)
    # dedupe
    assets = sorted(set(matches))
    print(f'Found {len(assets)} linked resources in index.html')

    for a in assets:
        # ignore anchors and mailto
        if a.startswith('#') or a.startswith('mailto:'):
            continue
        # build absolute url
        parsed = urlparse(a)
        if parsed.scheme in ('http','https'):
            url = a
        else:
            url = urljoin(BASE, a.lstrip('/'))
        code = head(url)
        status = code if code is not None else 'ERROR'
        print(f'{a} -> {url} -> {status}')

    print('\nDone.')
