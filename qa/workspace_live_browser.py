"""Real local DB/JWT through simulated HTTPS; not a production deployment test."""
import json,urllib.request,urllib.error,http.cookies
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE='http://127.0.0.1:3002';fixture=json.loads(Path('qa/workspace-live-fixture.json').read_text());checks=[];cases=[];errors=[];bad=[]
def check(name):checks.append(name);print('PASS',name,flush=True)
def proxy(route):
 request=route.request;headers={k:v for k,v in request.headers.items() if k.lower() not in ['host','accept-encoding','content-length']};headers['Host']='ops.test';headers['X-Forwarded-Proto']='https'
 try:response=urllib.request.urlopen(urllib.request.Request(BASE+request.url.split('ops.test',1)[1],data=request.post_data_buffer,headers=headers,method=request.method))
 except urllib.error.HTTPError as error:response=error
 route.fulfill(status=response.status,headers={k:v for k,v in response.headers.items() if k.lower() not in ['content-length','content-encoding','connection','transfer-encoding']},body=response.read())
def cookie(phone):
 request=urllib.request.Request(BASE+'/api/auth/password/login',data=json.dumps({'phone':phone,'password':'Integration-QA-2026'}).encode(),headers={'Content-Type':'application/json'})
 response=urllib.request.urlopen(request);jar=http.cookies.SimpleCookie();jar.load(response.headers['Set-Cookie']);return jar['hadiran_session'].value
with sync_playwright() as pw:
 browser=pw.chromium.launch(args=['--no-sandbox']);context=browser.new_context(viewport={'width':1440,'height':1100})
 context.add_cookies([{'name':'hadiran_session','value':cookie('09121234567'),'url':'https://ops.test','secure':True,'httpOnly':True,'sameSite':'Lax'}])
 page=context.new_page();page.route('https://ops.test/**',proxy);page.on('pageerror',lambda error:errors.append(str(error)));page.on('response',lambda response:bad.append([response.status,response.url]) if response.status>=500 else None)
 page.goto('https://ops.test/workspace');expect(page.locator('.wo-overview')).to_have_attribute('data-source','live');assert page.locator('.ws-navigation a[href^="/workspace/preview"]').count()==1
 page.get_by_role('link',name='نمونهٔ بصری مرحلهٔ ۲',exact=True).click();expect(page.locator('.dp-preview')).to_have_attribute('data-section','home');expect(page.locator('.dp-sample').first).to_have_text('دادهٔ نمونه')
 page.get_by_role('link',name='میزکار متصل',exact=True).click();expect(page.locator('.wo-overview')).to_have_attribute('data-source','live')
 check('Stage-two prototype is visible in sidebar and connected header, with a working return link')
 page.locator('[data-metric="orders"]').click();expect(page.locator('.wo-overview')).to_be_visible();expect(page.locator('[data-action-kind="orders"]')).to_have_count(20)
 page.get_by_role('link',name='بعدی',exact=True).click();expect(page).to_have_url(__import__('re').compile('page=2'));expect(page.locator('[data-action-kind="orders"]')).to_have_count(20)
 page.goto('https://ops.test/workspace/shop/orders/'+fixture['orderId']);expect(page.get_by_role('heading',name='جزئیات سفارش',exact=True)).to_be_visible();expect(page.get_by_text('QA-REFERENCE',exact=True)).to_be_visible()
 page.goto('https://ops.test/workspace/collaborations?record='+str(fixture['collaborationId']));expect(page.locator('.ws-detail-dialog[open]')).to_be_visible();expect(page.locator('.ws-detail-dialog[open]')).to_contain_text('همکاری در انتظار بررسی');page.keyboard.press('Escape')
 check('KPI opens paginated exact source list; order and collaboration deep links open their real records')
 page.goto('https://ops.test/workspace');updated=page.evaluate("async id=>{const r=await fetch('/api/workspace/records/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({titleFa:'یادداشت به‌روز از پایگاه'})});return r.ok}",fixture['noteId']);assert updated
 page.get_by_role('button',name='به‌روزرسانی',exact=True).click();expect(page.locator('.wo-overview').get_by_text('یادداشت به‌روز از پایگاه',exact=True).first).to_be_visible()
 check('Refresh reads persisted record changes rather than sample/localStorage data')
 paths=['/workspace','/workspace/actions?kind=orders','/workspace/shop/orders/'+fixture['orderId']]
 for locale in ['fa','en']:
  page.goto('https://ops.test/workspace')
  if page.locator('html').get_attribute('lang')!=locale:page.locator('.ws-language').click()
  for theme in ['light','dark']:
   page.evaluate("theme=>{document.documentElement.dataset.theme=theme;document.documentElement.classList.toggle('dark',theme==='dark');localStorage.setItem('hadiran-theme',theme)}",theme)
   for path in paths:
    page.goto('https://ops.test'+path)
    for width in [320,390,768,1440,1920]:
     page.set_viewport_size({'width':width,'height':1100});page.wait_for_timeout(40);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(locale,theme,path,width);cases.append([locale,theme,path,width])
   page.goto('https://ops.test/workspace');page.set_viewport_size({'width':1440,'height':1100})
   if locale=='fa':page.screenshot(path='qa/workspace-live-'+theme+'.png',full_page=True)
   if locale=='fa' and theme=='light':page.set_viewport_size({'width':390,'height':1000});page.screenshot(path='qa/workspace-live-mobile.png',full_page=True)
 check('60 live-record layouts across FA/EN, light/dark and 320–1920px')
 page.set_viewport_size({'width':320,'height':1000});page.add_style_tag(content='html{font-size:200% !important}');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 check('Connected home reflows at 200% text and 320 CSS pixels')
 # Persist language/sidebar for one account, then use another real owner in the same browser.
 page.goto('https://ops.test/workspace');page.set_viewport_size({'width':1440,'height':1100});expect(page.locator('.ws-shell')).to_have_attribute('dir','ltr');page.locator('.ws-collapse').click();expect(page.locator('.ws-shell')).to_have_class(__import__('re').compile('ws-is-collapsed'))
 context.add_cookies([{'name':'hadiran_session','value':cookie('09121110003'),'url':'https://ops.test','secure':True,'httpOnly':True,'sameSite':'Lax'}]);page.reload();expect(page.locator('.ws-shell')).to_have_attribute('dir','rtl');assert 'ws-is-collapsed' not in page.locator('.ws-shell').get_attribute('class')
 check('Account switch cannot inherit another owner’s language or sidebar preference')
 assert not errors,errors;assert not bad,bad;browser.close()
Path('qa/workspace-live-browser-results.json').write_text(json.dumps({'passed':True,'checks':checks,'layout_cases':len(cases),'browser_errors':errors,'http_5xx':bad,'environment':'real local DB with simulated HTTPS','production_database_tested':False},ensure_ascii=False,indent=2))
