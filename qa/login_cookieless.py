"""Regression: deny ALL cookies, including partitioned, in an embedded HTTPS preview."""
import urllib.request
import urllib.error
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright, expect
BASE = 'http://127.0.0.1:3000'
def proxy(route):
    request = route.request
    headers = {k: v for k, v in request.headers.items() if k not in ['host', 'accept-encoding', 'content-length', 'cookie', 'authorization', 'x-hadiran-preview-ticket']}
    headers['Host'] = 'preview.test'; headers['X-Forwarded-Proto'] = 'https'
    req = urllib.request.Request(BASE + request.url.split('preview.test', 1)[1], data=request.post_data_buffer, method=request.method, headers=headers)
    try: response = urllib.request.urlopen(req)
    except urllib.error.HTTPError as error: response = error
    route.fulfill(status=response.status, headers={k: v for k, v in response.headers.items() if k.lower() not in ['transfer-encoding', 'connection', 'content-encoding', 'content-length', 'set-cookie']}, body=response.read())
with sync_playwright() as p:
    browser=p.chromium.launch(args=['--no-sandbox'])
    c=browser.new_context(viewport={'width':1440,'height':1100})
    page=c.new_page(); errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('https://preview.test/**',proxy)
    page.route('https://arena.example/',lambda route:route.fulfill(content_type='text/html',body='<iframe src="https://preview.test/signin?next=/workspace" width="1250" height="950"></iframe>'))
    page.goto('https://arena.example/'); frame=page.frame_locator('iframe')
    frame.get_by_role('textbox',name='شمارهٔ موبایل').fill('۰۹۱۲۱۲۳۴۵۶۷')
    frame.get_by_role('button',name='ارسال کد',exact=True).click()
    frame.get_by_role('textbox',name='کد پیامک‌شده').fill('۱۲۳۴۵۶')
    frame.get_by_role('button',name='ورود',exact=True).click()
    expect(frame.locator('h1')).to_have_text('میز کار')
    ticket=parse_qs(urlparse(page.frames[-1].url).query)['preview_access'][0]
    assert not c.cookies(),'A cookie was stored despite the deny-all test'
    page.reload();expect(frame.locator('h1')).to_have_text('میز کار')
    for route,title in [('knowledge','دانشنامه'),('projects','پروژه‌ها'),('collaborations','پیشنهادهای همکاری'),('shop','محصولات'),('settings','تنظیمات')]:
        frame.locator(f'.ws-navigation a[href^="/workspace/{route}?"]').click()
        expect(frame.locator('h1')).to_contain_text(title)
        assert parse_qs(urlparse(page.frames[-1].url).query)['preview_access'][0]==ticket
    frame.locator('.ws-quick-new').click();expect(frame.locator('h1')).to_have_text('یادداشت جدید')
    frame.get_by_label('عنوان فارسی').fill('تست بدون کوکی')
    frame.get_by_label('متن یادداشت').fill('این یادداشت برای تست مسدودبودن کامل کوکی است.')
    frame.get_by_role('button',name='ذخیره آزمایشی',exact=True).click();expect(frame.get_by_role('status')).to_contain_text('در این مرورگر ذخیره شد')
    frame.get_by_role('link',name='دیدن فهرست').click();expect(frame.locator('.ws-table')).to_contain_text('تست بدون کوکی')
    frame.get_by_role('button',name='خروج از حساب',exact=True).click();expect(frame.locator('h1')).to_have_text('ورود با موبایل')
    # A logged-out ticket cannot be replayed. A changed signature cannot authenticate.
    for value in [ticket,ticket[:-1]+('x' if ticket[-1]!='x' else 'z')]:
        response=c.request.get(BASE+'/workspace?preview_access='+value,max_redirects=0)
        assert response.status in (307,303),response.status
    assert not c.cookies() and not errors,errors
    print('PASS: all cookies denied; Persian form login; refresh; all modules; note save; logout; revoked and tampered ticket rejected; no browser errors.')
    browser.close()
