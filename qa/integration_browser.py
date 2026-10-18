"""Browser QA for the merged production build, including a simulated HTTPS iframe with all auth cookies removed."""
import json,re,urllib.request,urllib.error
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright,expect
BASE='http://127.0.0.1:3001'
checks=[]; errors=[];bad=[]
def proxy(route):
 request=route.request
 headers={k:v for k,v in request.headers.items() if k.lower() not in ['host','cookie','authorization','x-hadiran-preview-ticket','accept-encoding','content-length']}
 headers['Host']='preview.test';headers['X-Forwarded-Proto']='https'
 req=urllib.request.Request(BASE+request.url.split('preview.test',1)[1],data=request.post_data_buffer,headers=headers,method=request.method)
 try:r=urllib.request.urlopen(req)
 except urllib.error.HTTPError as e:r=e
 route.fulfill(status=r.status,headers={k:v for k,v in r.headers.items() if k.lower() not in ['set-cookie','content-length','content-encoding','connection','transfer-encoding']},body=r.read())
def check(name):checks.append(name);print('PASS',name)
with sync_playwright() as p:
 browser=p.chromium.launch(args=['--no-sandbox'])
 c=browser.new_context(viewport={'width':1440,'height':1000},color_scheme='light')
 page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append((r.status,r.url)) if r.status>=500 else None)
 page.goto(BASE+'/');expect(page.locator('.home-chat-textarea')).to_be_enabled()
 assert page.locator('a[href="/analyzers"]').count()>=2
 assert page.locator('a[href="/privacy"]').count()>=1
 assert page.evaluate('document.fonts.check("16px IRANSharp")') or 'iranSharp' in page.locator('html').get_attribute('class')
 page.screenshot(path='qa/integration-home.png',full_page=True)
 check('Homepage keeps portrait/chat, analyzer discovery and privacy navigation')
 page.goto(BASE+'/signin?next=/workspace');expect(page.get_by_text('ورود تستی داخلی',exact=False)).to_be_visible()
 page.get_by_role('textbox',name='شمارهٔ موبایل').fill('۰۹۱۲۱۲۳۴۵۶۷');page.get_by_role('button',name='ارسال کد',exact=True).click();page.get_by_role('textbox',name='کد پیامک‌شده').fill('۱۲۳۴۵۶');page.get_by_role('button',name='ورود',exact=True).click();expect(page.locator('h1')).to_have_text('میز کار')
 ticket=parse_qs(urlparse(page.url).query)['preview_access'][0]
 assert page.locator('.site-header').count()==0
 assert page.locator('.ws-sidebar').bounding_box()['x']>1000
 page.screenshot(path='qa/integration-overview.png',full_page=True)
 page.locator('.ws-quick-new').click();expect(page.locator('h1')).to_have_text('ثبت جدید')
 page.get_by_label('عنوان فارسی',exact=True).fill('ثبت مرورگری یکپارچه')
 page.get_by_label('بدنه (Markdown)').fill('متن آزمایشی برای پیش‌نمایش') if page.get_by_label('بدنه (Markdown)').count() else page.locator('textarea').last.fill('متن آزمایشی برای پیش‌نمایش')
 page.get_by_role('button',name='ذخیرهٔ ثبت (بدون انتشار)').click();expect(page.locator('h1')).to_have_text('ثبت مرورگری یکپارچه')
 rid=page.url.split('/records/')[1].split('?')[0]
 page.get_by_label('عنوان فارسی',exact=True).fill('ثبت ویرایش‌شدهٔ مرورگری')
 expect(page.get_by_role('button',name='ارتقا / انتشار')).to_be_disabled()
 page.get_by_role('button',name='ذخیرهٔ ثبت (بدون انتشار)').click();expect(page.get_by_role('button',name='ارتقا / انتشار')).to_be_enabled()
 expect(page.get_by_role('checkbox',name='انتشار عمومی روی /knowledge')).not_to_be_checked()
 page.get_by_role('button',name='ارتقا / انتشار').click();expect(page.get_by_role('status').filter(has_text='شبیه‌سازی')).to_be_visible()
 page.evaluate('window.scrollTo(0,0)');page.screenshot(path='qa/integration-record.png',full_page=True)
 check('Canonical editor: private save, saved-before-promote guard, private-by-default review, honest demo result')
 page.locator('.ws-navigation a').filter(has_text='دانشنامه').click();expect(page.locator('h1')).to_contain_text('دانشنامه');expect(page.locator('.ws-table')).to_contain_text('ثبت ویرایش‌شدهٔ مرورگری')
 page.get_by_role('textbox',name='جست‌وجو در رکوردها').fill('ثبت ویرایش‌شده');expect(page.locator('.ws-table tbody tr')).to_have_count(1)
 check('Canonical record list refresh, search and saved state')
 page.locator('.ws-navigation a').filter(has_text='فروشگاه').click();expect(page.locator('h1')).to_have_text('فروشگاه');assert page.get_by_role('button',name='اعمال نرخ').is_disabled();page.screenshot(path='qa/integration-shop.png',full_page=True)
 page.get_by_role('link',name='کالای جدید',exact=True).click();expect(page.locator('h1')).to_have_text('کالای جدید');assert page.locator('input[name=titleFa]').is_disabled()
 check('Complete real commerce UI remains present; no fake demo commerce writes')
 # Localized sidebar and both themes for all administrative modules, including new ones.
 routes=['/workspace','/workspace/knowledge','/workspace/projects','/workspace/collaborations','/workspace/shop','/workspace/shop/listings/new','/workspace/capture','/workspace/records/'+rid,'/workspace/settings','/workspace/analyzers']
 layouts=0
 for locale in ['fa','en']:
  for width in [375,768,1280,1440]:
   c.add_cookies([{'name':'hadiran-workspace-locale','value':locale,'url':BASE}])
   page.set_viewport_size({'width':width,'height':900})
   for path in routes:
    page.goto(BASE+path+'?preview_access='+ticket)
    expect(page.locator('.ws-shell')).to_be_visible();expect(page.locator('html')).to_have_attribute('dir','rtl' if locale=='fa' else 'ltr')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(locale,width,path,'overflow')
    if width>=1280:
     box=page.locator('.ws-sidebar').bounding_box();assert (box['x']>0 if locale=='fa' else box['x']==0),(locale,width,box)
    layouts+=1
 page.set_viewport_size({'width':1440,'height':1000});page.goto(BASE+'/workspace?preview_access='+ticket)
 page.locator('.ws-topbar .theme-trigger').click();page.locator('.ws-topbar .theme-option').filter(has_text='Dark').click();expect(page.locator('html')).to_have_attribute('data-theme','dark');page.locator('.ws-topbar .theme-trigger').click();page.screenshot(path='qa/integration-en-dark.png',full_page=True)
 assert page.evaluate('getComputedStyle(document.querySelector(".ws-panel")).backgroundColor')!='rgb(255, 255, 255)'
 page.reload();expect(page.locator('html')).to_have_attribute('data-theme','dark')
 page.locator('.ws-collapse').click();page.reload();expect(page.locator('.ws-shell')).to_have_class(re.compile('ws-is-collapsed'))
 page.locator('.ws-collapse').click();page.set_viewport_size({'width':375,'height':850});page.locator('.ws-mobile-toggle').click();expect(page.locator('.ws-sidebar')).to_have_attribute('aria-modal','true');page.screenshot(path='qa/integration-mobile-menu.png',full_page=True);page.keyboard.press('Escape');expect(page.locator('.ws-shell')).not_to_have_class(re.compile('ws-mobile-open'))
 check(f'{layouts} route/locale/viewport cases; RTL/LTR sidebar, dark persistence, collapse and mobile Escape')
 # Public/account/analyzer screens use the exact same semantic tokens.
 for path in ['/account','/analyzers','/analyzers/casio-ss','/privacy','/shop']:
  page.goto(BASE+path+'?preview_access='+ticket);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),path
 page.goto(BASE+'/account?preview_access='+ticket);page.get_by_label('نام',exact=True).fill('نام نمایشی');page.get_by_label('نام خانوادگی',exact=True).fill('آزمون');page.get_by_role('button',name='ذخیره',exact=True).click();expect(page.get_by_text('ذخیره شد.',exact=True)).to_be_visible();page.reload();expect(page.get_by_label('نام',exact=True)).to_have_value('نام نمایشی')
 check('New public/account/privacy/analyzer mobile screens; profile changes persist for the preview session')
 # Completely cookie-free simulated cross-site iframe, with Authorization and custom auth headers stripped.
 iframe=c.new_page();iframe.on('pageerror',lambda e:errors.append(str(e)));iframe.route('https://preview.test/**',proxy);iframe.route('https://arena.example/',lambda r:r.fulfill(content_type='text/html',body='<iframe src="https://preview.test/signin?next=/workspace" width="1250" height="950"></iframe>'))
 iframe.goto('https://arena.example/');frame=iframe.frame_locator('iframe')
 frame.get_by_role('textbox',name='شمارهٔ موبایل').fill('۰۹۱۲۱۲۳۴۵۶۷');frame.get_by_role('button',name='ارسال کد',exact=True).click();frame.get_by_role('textbox',name='کد پیامک‌شده').fill('١٢٣٤٥٦');frame.get_by_role('button',name='ورود',exact=True).click();expect(frame.locator('h1')).to_have_text('میز کار')
 assert not [x for x in c.cookies() if x['domain']=='preview.test']
 for label,title in [('دانشنامه','دانشنامه'),('فروشگاه','فروشگاه'),('تحلیلگرها','تحلیلگرها')]:
  frame.locator('.ws-navigation a').filter(has_text=label).click();expect(frame.locator('h1')).to_contain_text(title)
 frame.locator('.ws-navigation a').filter(has_text='حساب من').click();expect(frame.locator('h1')).to_have_text('حساب من');expect(frame.get_by_label('نام',exact=True)).to_have_value('مالک')
 # Return via a token-retaining client link; no cookies ever needed.
 frame.get_by_role('link',name='میز کار',exact=True).first.click();expect(frame.locator('h1')).to_have_text('میز کار')
 frame.locator('.ws-quick-new').click();frame.get_by_label('عنوان فارسی',exact=True).fill('ثبت بدون کوکی');frame.get_by_role('button',name='ذخیرهٔ ثبت (بدون انتشار)').click();expect(frame.locator('h1')).to_have_text('ثبت بدون کوکی');iframe.frames[-1].goto(iframe.frames[-1].url);expect(frame.locator('h1')).to_have_text('ثبت بدون کوکی')
 cookie_free_ticket=parse_qs(urlparse(iframe.frames[-1].url).query)['preview_access'][0]
 frame.get_by_role('button',name='خروج از حساب',exact=True).click();expect(frame.locator('h1')).to_have_text('ورود با موبایل')
 res=c.request.post(BASE+'/api/auth/preview-session',data={'ticket':cookie_free_ticket});assert res.status==401
 check('Cookie-free HTTPS iframe: Persian/Arabic OTP, modules, account, capture save/reload, isolated session and revocation')
 assert not errors,errors
 assert not bad,bad
 check('Zero browser runtime errors and zero HTTP 5xx in tested UI flows')
 Path('qa/integration-browser-results.json').write_text(json.dumps({'status':'PASS','checks':checks,'responsive_cases':layouts,'browser_errors':errors,'http_5xx':bad,'iframe':'simulated HTTPS proxy; not an external preview-host test'},ensure_ascii=False,indent=2))
 browser.close()
