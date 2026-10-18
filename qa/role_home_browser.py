"""Real local DB sessions through simulated HTTPS; no production deployment claim."""
import json,urllib.request,urllib.error,http.cookies,re,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE='http://127.0.0.1:3002';SITE='https://role.test';fixture=json.loads(Path('qa/role-home-fixture.json').read_text());checks=[];cases=[];errors=[];bad=[];forbidden=[]
# Reset only this suite's disposable order and local rate buckets for repeatability.
assert fixture['orderId'].startswith('rh-')
subprocess.run(['node','-e',"const {Client}=require('pg');const url='postgresql://hadiran_qa:local-qa-only@127.0.0.1:5432/hadiran_integration_qa';const u=new URL(url);if(u.hostname!=='127.0.0.1'||u.pathname!=='/hadiran_integration_qa')throw Error('Local QA only');const c=new Client({connectionString:url});(async()=>{await c.connect();await c.query('TRUNCATE rate_limit_buckets');await c.query(\"UPDATE shop_orders SET state='awaiting_payment_reference',updated_at=NOW() WHERE id=$1\",[process.argv[1]])})().finally(()=>c.end())",fixture['orderId']],check=True)
def check(name):checks.append(name);print('PASS',name,flush=True)
def proxy(route):
 request=route.request;headers={k:v for k,v in request.headers.items() if k.lower() not in ['host','accept-encoding','content-length']};headers['Host']='role.test';headers['X-Forwarded-Proto']='https'
 try:response=urllib.request.urlopen(urllib.request.Request(BASE+request.url.split('role.test',1)[1],data=request.post_data_buffer,headers=headers,method=request.method))
 except urllib.error.HTTPError as error:response=error
 route.fulfill(status=response.status,headers={k:v for k,v in response.headers.items() if k.lower() not in ['content-length','content-encoding','connection','transfer-encoding']},body=response.read())
def cookie(phone):
 request=urllib.request.Request(BASE+'/api/auth/password/login',data=json.dumps({'phone':phone,'password':'Integration-QA-2026'}).encode(),headers={'Content-Type':'application/json'})
 response=urllib.request.urlopen(request);jar=http.cookies.SimpleCookie();jar.load(response.headers['Set-Cookie']);return jar['hadiran_session'].value
phones={'member':'09121110002','author':'09121110001','viewer':'09121110005','reader':'09121110006','empty':'09121110007'}
with sync_playwright() as pw:
 browser=pw.chromium.launch(args=['--no-sandbox']);contexts={};pages={}
 for who,phone in phones.items():
  ctx=browser.new_context(viewport={'width':1440,'height':1100});ctx.add_cookies([{'name':'hadiran_session','value':cookie(phone),'url':SITE,'secure':True,'httpOnly':True,'sameSite':'Lax'}]);p=ctx.new_page();p.route(SITE+'/**',proxy);p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:bad.append([r.status,r.url]) if r.status>=500 else forbidden.append(r.url) if r.status in [401,403] else None);contexts[who]=ctx;pages[who]=p
 p=pages['member'];p.goto(SITE+'/account');expect(p.locator('.personal-home')).to_have_attribute('data-source','live');expect(p.locator('#account-profile')).to_be_visible();expect(p.locator('.account-avatar-panel')).to_be_visible()
 p.locator('[data-personal-metric="orders"]').click();expect(p.locator('[data-personal-key^="order:"]')).to_have_count(20);p.get_by_role('link',name='بعدی',exact=True).click();expect(p).to_have_url(re.compile('page=2'));expect(p.locator('[data-personal-key^="order:"]').first).to_be_visible()
 p.goto(SITE+'/shop/orders/'+fixture['orderId']);expect(p.get_by_role('heading',name='محصول شخصی عضو',exact=True)).to_be_visible();p.get_by_role('button',name='انصراف از سفارش',exact=True).click();expect(p.get_by_text('لغو شده',exact=True)).to_be_visible()
 p.goto(SITE+'/account');p.get_by_role('button',name='به‌روزرسانی',exact=True).click();expect(p.locator('.personal-home')).to_contain_text('لغو شده')
 check('Personal source list pagination, existing buyer action, persisted refresh and profile/avatar preservation')
 p.goto(SITE+'/account/activity?kind=inProgress&page=2');expect(p.locator('.personal-home a[href="/analyzers/'+fixture['continueSlug']+'"]').first).to_be_visible();p.locator('a[href="/analyzers/'+fixture['continueSlug']+'"]').first.click();expect(p).to_have_url(SITE+'/analyzers/'+fixture['continueSlug']);expect(p).to_have_title(re.compile('آزمون ناتمام 1'));expect(p.get_by_role('heading',name='قبل از شروع',exact=True)).to_be_visible()
 p.goto(SITE+'/analyzers/'+fixture['reportSlug']+'/report');expect(p.get_by_role('heading',name='گزارش شخصی 1',exact=True)).to_be_visible();expect(p.get_by_role('button',name='نوبت تازه')).to_be_visible()
 check('Continue and report routes open the existing account-scoped instrument runtime')
 p=pages['author'];p.goto(SITE+'/workspace/analyzers');expect(p.locator('.analyzer-home')).to_have_attribute('data-source','live');expect(p.locator('[data-desk-slug]')).to_have_count(20);expect(p.locator('.analyzer-home').get_by_role('link',name='آزمون تازه',exact=True)).to_be_visible();p.get_by_role('link',name='بعدی',exact=True).click();expect(p).to_have_url(re.compile('page=2'));p.locator('[data-desk-metric="drafts"]').click();expect(p).to_have_url(re.compile('filter=drafts'));expect(p.locator('[data-desk-slug]').first).to_be_visible()
 check('Author full counts drill down into editable drafts and a paginated source list')
 p=pages['viewer'];p.goto(SITE+'/workspace/analyzers');expect(p.locator('[data-desk-slug]')).to_have_count(1);expect(p.get_by_role('link',name='آزمون تازه',exact=True)).to_have_count(0);p.locator('[data-desk-slug] a').click();expect(p.get_by_role('button',name='مشخصات',exact=True)).to_be_visible();expect(p.get_by_role('button',name='پاسخ‌ها',exact=True)).to_have_count(0);expect(p.locator('#workspace-content fieldset')).to_have_attribute('disabled','');expect(p.locator('#workspace-content input').first).to_be_disabled();expect(p.get_by_role('button',name='ذخیره',exact=True)).to_have_count(0)
 p=pages['reader'];p.goto(SITE+'/workspace/analyzers');p.locator('[data-desk-slug] a').click();expect(p.get_by_role('button',name='پاسخ‌ها',exact=True)).to_be_visible();expect(p.get_by_role('button',name='ذخیره',exact=True)).to_have_count(0);expect(p.get_by_text('هنوز کسی این آزمون را پر نکرده.',exact=True)).to_be_visible()
 assert not forbidden,forbidden
 check('View-only delegates do not request forbidden responses; response-only delegates see permitted empty responses')
 for who in ['member','author','viewer','reader']:
  p=pages[who];path='/account' if who=='member' else '/workspace/analyzers';locales=['fa'] if who=='member' else ['fa','en']
  for locale in locales:
   if who!='member':contexts[who].add_cookies([{'name':f"hadiran-workspace-{fixture['ids'][who]}-locale",'value':locale,'url':SITE}])
   for theme in ['light','dark']:
    for width in [320,375,768,1280,1440,1920]:
     p.set_viewport_size({'width':width,'height':1100});p.goto(SITE+path);root=p.locator('.personal-home' if who=='member' else '.analyzer-home');expect(root).to_have_attribute('data-source','live')
     if who!='member':expect(p.locator('html')).to_have_attribute('lang',locale)
     p.evaluate("v=>{localStorage.setItem('hadiran-theme',v);document.documentElement.dataset.theme=v;document.documentElement.classList.toggle('dark',v==='dark')}",theme)
     assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(who,locale,theme,width)
     cases.append({'account':who,'locale':locale,'theme':theme,'width':width})
     if who=='member' and width==1440 and theme=='light':p.screenshot(path='qa/role-home-member-light.png',full_page=True)
     if who=='member' and width==375 and theme=='dark':p.screenshot(path='qa/role-home-member-mobile.png',full_page=True)
     if who=='author' and locale=='fa' and width==1440 and theme=='light':p.screenshot(path='qa/role-home-author-light.png',full_page=True)
     if who=='author' and locale=='en' and width==1440 and theme=='dark':p.screenshot(path='qa/role-home-author-en-dark.png',full_page=True)
 check('84 account-scoped layouts: four roles, supported FA/EN, light/dark and 320–1920px')
 for who in ['member','author','viewer','reader']:
  p=pages[who];p.set_viewport_size({'width':320,'height':1000});p.goto(SITE+('/account' if who=='member' else '/workspace/analyzers'));p.add_style_tag(content='html{font-size:200% !important}');assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),who
 check('All four role homes reflow at 200% text and 320 CSS pixels')
 p=pages['empty'];p.goto(SITE+'/account');expect(p.locator('.personal-home')).to_have_attribute('data-source','live');expect(p.locator('[data-personal-key]')).to_have_count(0);assert p.locator('[data-personal-metric] strong').all_text_contents()==['۰','۰','۰']
 assert not errors,errors;assert not bad,bad;assert not forbidden,forbidden
 check('Genuine empty state renders zero; no browser errors, HTTP 5xx or unexpected authorization failures')
 browser.close()
Path('qa/role-home-browser-results.json').write_text(json.dumps({'passed':True,'checks':checks,'layout_cases':len(cases),'cases':cases,'errors':errors,'http_5xx':bad,'unexpected_auth_errors':forbidden},ensure_ascii=False,indent=2))
