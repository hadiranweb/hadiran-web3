"""New modules: real JWT via simulated HTTPS/local DB; responsive light/dark and role-aware shell."""
import json,urllib.request,urllib.error,http.cookies
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE='http://127.0.0.1:3002';errors=[];bad=[];cases=[]
def proxy(route):
 req=route.request;headers={k:v for k,v in req.headers.items() if k.lower() not in ['host','accept-encoding','content-length']};headers['Host']='sync.test';headers['X-Forwarded-Proto']='https'
 try:r=urllib.request.urlopen(urllib.request.Request(BASE+req.url.split('sync.test',1)[1],data=req.post_data_buffer,headers=headers,method=req.method))
 except urllib.error.HTTPError as e:r=e
 route.fulfill(status=r.status,headers={k:v for k,v in r.headers.items() if k.lower() not in ['content-length','content-encoding','connection','transfer-encoding']},body=r.read())
def cookie(phone):
 req=urllib.request.Request(BASE+'/api/auth/password/login',data=json.dumps({'phone':phone,'password':'Integration-QA-2026'}).encode(),headers={'Content-Type':'application/json'})
 r=urllib.request.urlopen(req);assert r.status==200
 jar=http.cookies.SimpleCookie();jar.load(r.headers['Set-Cookie']);return jar['hadiran_session'].value
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 for role,phone,paths in [('owner','09121234567',['/workspace/bots','/workspace/bots/new','/workspace/network','/workspace/referrals','/workspace/discounts','/workspace/analyzers/casio-ss']),('author','09121110001',['/workspace/analyzers','/workspace/analyzers/new','/workspace/referrals'])]:
  c=b.new_context();c.add_cookies([{'name':'hadiran_session','value':cookie(phone),'url':'https://sync.test','secure':True,'httpOnly':True,'sameSite':'Lax'}]);page=c.new_page();page.route('https://sync.test/**',proxy);page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append([r.status,r.url]) if r.status>=500 else None)
  page.goto('https://sync.test/workspace/analyzers');expect(page.locator('.ws-shell')).to_be_visible();expect(page.get_by_role('dialog')).not_to_be_visible()
  if role=='author':
   assert page.locator('.ws-navigation a[href="/workspace/bots"]').count()==0
   assert page.locator('.ws-navigation a[href="/workspace/referrals"]').count()==1
  else:assert page.locator('.ws-navigation a[href="/workspace/bots"]').count()==1
  if role=='owner':
   created=page.evaluate("async()=>{const r=await fetch('/api/workspace/bots',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({titleFa:'ربات بررسی رابط',analyzerSlug:'casio-ss'})});if(!r.ok)throw new Error('create failed');return r.json()}")
   paths=paths+['/workspace/bots/'+created['bot']['id']]
  for path in paths:
   page.goto('https://sync.test'+path);expect(page.locator('h1')).to_be_visible()
   for theme in ['light','dark']:
    page.evaluate("v=>{document.documentElement.dataset.theme=v;document.documentElement.classList.toggle('dark',v==='dark');localStorage.setItem('hadiran-theme',v)}",theme)
    for width in [320,390,768,1440]:
     page.set_viewport_size({'width':width,'height':900});page.wait_for_timeout(60)
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(role,path,theme,width,page.evaluate('document.documentElement.scrollWidth'))
     cases.append([role,path,theme,width])
   if '/workspace/bots/' in path and not path.endswith('/new'):
    expect(page.get_by_role('heading',name='گفتگوی ربات')).to_be_visible();page.screenshot(path='qa/sync-bot-editor-dark.png',full_page=False)
   if path=='/workspace/bots/new':
    assert page.locator('input').count()>0
   if role=='owner' and path=='/workspace/analyzers/casio-ss':
    page.get_by_role('button',name='پاسخ‌ها',exact=True).click();expect(page.get_by_text('ثبت‌شده از',exact=False)).to_be_visible();page.screenshot(path='qa/sync-analyzer-responses.png',full_page=False)
    page.get_by_role('button',name='دسترسی',exact=True).click();expect(page.get_by_role('button',name='اعطا',exact=True)).to_be_visible()
   if path=='/workspace/discounts':
    page.screenshot(path='qa/sync-discounts-dark.png',full_page=False)
  # Real shell locale switch and physical sidebar placement.
  page.goto('https://sync.test'+paths[0]);page.set_viewport_size({'width':1440,'height':900});page.locator('.ws-language').click();expect(page.locator('.ws-shell')).to_have_attribute('dir','ltr');assert page.locator('.ws-sidebar').bounding_box()['x']<5
  page.locator('.ws-language').click();expect(page.locator('.ws-shell')).to_have_attribute('dir','rtl');assert page.locator('.ws-sidebar').bounding_box()['x']>1000
  page.set_viewport_size({'width':390,'height':844});page.locator('.ws-mobile-toggle').click();expect(page.locator('.ws-sidebar')).to_be_visible();page.keyboard.press('Escape');assert not page.locator('.ws-shell').get_attribute('class').endswith('ws-mobile-open')
  if role=='author':page.screenshot(path='qa/sync-author-mobile.png',full_page=False)
  c.close()
 assert not errors,errors
 assert not bad,bad
 Path('qa/sync-upstream-browser-results.json').write_text(json.dumps({'passed':True,'layout_cases':len(cases),'cases':cases,'checks':['owner/author role-filtered sidebar','new response and grant tabs','new modules mobile/light/dark reflow','Persian RTL and English LTR sidebar','mobile Escape close'],'browser_errors':errors,'http_5xx':bad,'note':'Real local DB/JWT with simulated HTTPS; no external Telegram'},ensure_ascii=False,indent=2))
 print('PASS',len(cases),'layout cases; no browser exceptions or HTTP 5xx')
 b.close()
