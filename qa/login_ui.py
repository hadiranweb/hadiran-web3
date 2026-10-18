"""Login regression: real form submission and an HTTPS cross-site iframe.
The fake HTTPS preview origin is routed to the local app; no external server is used.
"""
import urllib.request
import urllib.error
import re
from playwright.sync_api import sync_playwright, expect
BASE = 'http://127.0.0.1:3000'

def proxy(route):
    request = route.request
    headers = {k: v for k, v in request.headers.items() if k not in ['host', 'accept-encoding', 'content-length']}
    headers['Host'] = 'preview.test'
    headers['X-Forwarded-Proto'] = 'https'
    req = urllib.request.Request(BASE + request.url.split('preview.test', 1)[1], data=request.post_data_buffer, method=request.method, headers=headers)
    try:
        response = urllib.request.urlopen(req)
    except urllib.error.HTTPError as error:
        response = error
    route.fulfill(status=response.status, headers={k: v for k, v in response.headers.items() if k.lower() not in ['transfer-encoding', 'connection', 'content-encoding', 'content-length']}, body=response.read())

def fill_login(target, phone, code):
    target.get_by_role('textbox', name='شمارهٔ موبایل').fill(phone)
    target.get_by_role('button', name='ارسال کد', exact=True).click()
    target.get_by_role('textbox', name='کد پیامک‌شده').fill(code)
    expect(target.get_by_role('textbox', name='کد پیامک‌شده')).to_have_value('123456')
    target.get_by_role('button', name='ورود', exact=True).click()
    expect(target.locator('h1')).to_have_text('میز کار')

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--no-sandbox'])
    for phone, code in [('09121234567', '123456'), ('۰۹۱۲۱۲۳۴۵۶۷', '۱۲۳۴۵۶'), ('٠٩١٢١٢٣٤٥٦٧', '١٢٣٤٥٦')]:
        context = browser.new_context(viewport={'width': 1440, 'height': 1100})
        page = context.new_page()
        page.goto(BASE + '/signin')
        fill_login(page, phone, code)
        expect(page).to_have_url(re.compile(re.escape(BASE) + r'/workspace(?:\?.*)?$'))
        page.reload()
        expect(page.locator('h1')).to_have_text('میز کار')
        context.close()
    context = browser.new_context(viewport={'width': 1440, 'height': 1100})
    page = context.new_page()
    page.route('https://preview.test/**', proxy)
    page.route('https://arena.example/', lambda route: route.fulfill(content_type='text/html', body='<iframe src="https://preview.test/signin?next=/workspace" width="1250" height="950"></iframe>'))
    page.goto('https://arena.example/')
    frame = page.frame_locator('iframe')
    fill_login(frame, '۰۹۱۲۱۲۳۴۵۶۷', '۱۲۳۴۵۶')
    page.reload()
    expect(frame.locator('h1')).to_have_text('میز کار')
    frame.get_by_role('button', name='خروج از حساب', exact=True).click()
    expect(frame.locator('h1')).to_have_text('ورود با موبایل')
    assert not [cookie for cookie in context.cookies() if cookie['name'] == 'hadiran_preview_owner']
    browser.close()
    print('PASS: English/Persian/Arabic digits; default dashboard redirect; refresh; HTTPS cross-site iframe login and logout.')
