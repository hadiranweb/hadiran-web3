"""P04 real local PostgreSQL/JWT UI tests; HTTPS is proxied in Chromium, not a deployment test."""
import json,urllib.request,urllib.error,http.cookies,re,subprocess,time
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE='http://127.0.0.1:3002';SITE='https://network.test';fixture=json.loads(Path('qa/network-fixture.json').read_text());checks=[];cases=[];errors=[];bad=[];writes=[]
def check(name):checks.append(name);print('PASS',name,flush=True)
def proxy(route):
 r=route.request;headers={k:v for k,v in r.headers.items() if k.lower() not in ['host','accept-encoding','content-length']};headers['Host']='network.test';headers['X-Forwarded-Proto']='https'
 try:response=urllib.request.urlopen(urllib.request.Request(BASE+r.url.split('network.test',1)[1],data=r.post_data_buffer,headers=headers,method=r.method))
 except urllib.error.HTTPError as e:response=e
 route.fulfill(status=response.status,headers={k:v for k,v in response.headers.items() if k.lower() not in ['content-length','content-encoding','connection','transfer-encoding']},body=response.read())
def cookie():
 req=urllib.request.Request(BASE+'/api/auth/password/login',data=json.dumps({'phone':'09121234567','password':'Integration-QA-2026'}).encode(),headers={'Content-Type':'application/json'})
 res=urllib.request.urlopen(req);jar=http.cookies.SimpleCookie();jar.load(res.headers['Set-Cookie']);return jar['hadiran_session'].value
# Disposable local QA only; production limits are unchanged.
subprocess.run(['node','-e',"const {Client}=require('pg');const url='postgresql://hadiran_qa:local-qa-only@127.0.0.1:5432/hadiran_integration_qa';const u=new URL(url);if(u.hostname!=='127.0.0.1'||u.pathname!=='/hadiran_integration_qa')throw Error('Local QA only');const c=new Client({connectionString:url});(async()=>{await c.connect();await c.query('TRUNCATE rate_limit_buckets')})().finally(()=>c.end())"],check=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':1440,'height':1100});ctx.add_cookies([{'name':'hadiran_session','value':cookie(),'url':SITE,'secure':True,'httpOnly':True,'sameSite':'Lax'}]);page=ctx.new_page();page.route(SITE+'/**',proxy);page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append([r.status,r.url]) if r.status>=500 else None);page.on('request',lambda r:writes.append([r.method,r.url]) if r.method not in ['GET','HEAD','OPTIONS'] else None)
 branch='/workspace/network?root='+fixture['child'];broad='/workspace/network?root='+fixture['root']
 page.goto(SITE+branch);expect(page.locator('.ng-home')).to_have_attribute('data-source','live');expect(page.locator('[data-network-code]')).to_have_count(4);expect(page.locator('[data-network-edge]')).to_have_count(3)
 stage=page.locator('.ng-canvas > svg');transform=page.locator('[data-network-transform]');initial=transform.get_attribute('transform');stage.focus();page.keyboard.press('ArrowRight');assert transform.get_attribute('transform')!=initial
 page.keyboard.press('+');expect(page.locator('.ng-tools output')).to_have_text('120%');page.keyboard.press('Home');expect(page.locator('.ng-tools output')).to_have_text('100%')
 rect=stage.bounding_box();page.mouse.move(rect['x']+20,rect['y']+20);page.mouse.down();page.mouse.move(rect['x']+80,rect['y']+60,steps=4);page.mouse.up();assert transform.get_attribute('transform')!=initial;page.get_by_role('button',name='بازنشانی گراف',exact=True).click()
 node=page.locator('[data-network-code="'+fixture['child']+'"]');node.focus();page.keyboard.press('Enter');expect(page.locator('.ng-detail[open]')).to_be_visible();expect(page.locator('.ng-detail')).to_contain_text(fixture['child']);page.keyboard.press('Escape');expect(page.locator('.ng-detail')).not_to_be_visible();expect(node).to_be_focused()
 check('Native SVG edges/nodes, keyboard and pointer pan, zoom/reset and accessible details with focus restoration')
 page.locator('.ng-tree summary').click();expect(page.locator('.ng-tree > ul > li')).to_have_count(1);expect(page.locator('.ng-tree button')).to_have_count(4)
 page.get_by_role('button',name='نمای گسترده',exact=True).click();expect(page.locator('.ng-expanded')).to_be_visible();assert page.locator('.ng-expanded').bounding_box()['x']==0
 page.locator('.ng-search input').focus();page.keyboard.press('Shift+Tab');assert page.evaluate('document.activeElement.closest(".ng-expanded")!==null');page.keyboard.press('Tab');expect(page.locator('.ng-search input')).to_be_focused()
 node=page.locator('[data-network-code="'+fixture['child']+'"]');node.focus();page.keyboard.press('Enter');expect(page.locator('.ng-detail[open]')).to_be_visible();page.keyboard.press('Escape');expect(page.locator('.ng-expanded')).to_be_visible();page.keyboard.press('Escape');expect(page.locator('.ng-expanded')).to_have_count(0)
 check('Nested text tree retained; fullscreen view confines focus, respects modal Escape and restores the normal layout')
 page.goto(SITE+broad);expect(page.locator('[data-network-code]')).to_have_count(120);expect(page.locator('.ng-warning')).to_contain_text('همهٔ روابط بارگیری نشده‌اند')
 page.locator('.ng-search input').fill('شاخه آزمایشی');page.locator('.ng-filters select').first.select_option('author');page.get_by_role('button',name='اعمال',exact=True).click();expect(page.locator('[data-directory-code]')).to_have_count(12);expect(page.locator('.ng-home')).to_have_attribute('data-source','live')
 page.goto(SITE+branch);page.locator('[data-network-code="'+fixture['child']+'"]').click();page.locator('.ng-detail').get_by_role('link',name='بازکردن شاخهٔ این حساب',exact=True).click();expect(page.locator('[data-network-code]')).to_have_count(4);expect(page.locator('.ng-detail[open]')).to_have_count(0)
 page.get_by_role('link',name='بعدی',exact=True).click();expect(page).to_have_url(re.compile('page=2'));expect(page.locator('[data-directory-code]')).to_have_count(20)
 page.goto(SITE+'/workspace/network?q=not-present');expect(page.locator('[data-directory-code]')).to_have_count(0);expect(page.get_by_text('حسابی با این فیلتر پیدا نشد.',exact=True)).to_be_visible()
 check('Bounded large graph, source-backed search/role filter, URL branch navigation, directory pagination and genuine no-match state')
 page.goto(SITE+'/workspace/network?root='+fixture['cycle']);expect(page.locator('[data-network-code]')).to_have_count(2);expect(page.locator('[data-network-edge]')).to_have_count(2);expect(page.locator('.ng-warning')).to_contain_text('حلقه')
 page.goto(SITE+'/workspace/network?root='+fixture['self']);expect(page.locator('[data-network-edge]')).to_have_count(1);assert 'C' in page.locator('[data-network-edge]').get_attribute('d')
 page.goto(SITE+'/workspace/network?root='+fixture['orphan']);page.locator('[data-network-code]').click();expect(page.locator('.ng-detail')).to_contain_text('خارج از حساب‌های فعال');page.keyboard.press('Escape')
 check('Real cycles and self-links render without recursion failure; unavailable parent is not presented as an invented relationship')
 for locale in ['fa','en']:
  ctx.add_cookies([{'name':'hadiran-workspace-1-locale','value':locale,'url':SITE}])
  for theme in ['light','dark']:
   for width in [320,375,768,1280,1440,1920]:
    for state,path in [('branch',branch),('bounded',broad),('empty','/workspace/network?q=not-present')]:
     page.set_viewport_size({'width':width,'height':1100});page.goto(SITE+path);expect(page.locator('.ng-home')).to_have_attribute('data-source','live');expect(page.locator('html')).to_have_attribute('lang',locale)
     page.evaluate("v=>{localStorage.setItem('hadiran-theme',v);document.documentElement.dataset.theme=v;document.documentElement.classList.toggle('dark',v==='dark')}",theme)
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(locale,theme,width,state)
     cases.append({'locale':locale,'theme':theme,'width':width,'state':state})
     if locale=='fa' and theme=='light' and width==1440 and state=='branch':page.screenshot(path='qa/network-branch-light.png',full_page=True)
     if locale=='fa' and theme=='dark' and width==375 and state=='branch':page.screenshot(path='qa/network-mobile-dark.png',full_page=True)
     if locale=='en' and theme=='dark' and width==1440 and state=='bounded':page.screenshot(path='qa/network-bounded-en-dark.png',full_page=True)
 check('72 layouts across FA/EN, light/dark, branch/large/no-match states and 320–1920px')
 for locale in ['fa','en']:
  ctx.add_cookies([{'name':'hadiran-workspace-1-locale','value':locale,'url':SITE}]);page.set_viewport_size({'width':320,'height':1000});page.goto(SITE+branch);expect(page.locator('html')).to_have_attribute('lang',locale);page.add_style_tag(content='html{font-size:200% !important}');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),locale
 check('200% text reflow at 320 CSS pixels in both languages')
 page.set_viewport_size({'width':1440,'height':1100});page.emulate_media(reduced_motion='reduce');page.goto(SITE+branch);page.wait_for_function("()=>{const e=document.querySelector('.ng-canvas > svg');return e && Math.abs(e.viewBox.baseVal.width-e.getBoundingClientRect().width)<1}");stage=page.locator('[data-network-transform]');start=stage.get_attribute('transform');page.wait_for_timeout(400);assert stage.get_attribute('transform')==start
 assert not errors,errors;assert not bad,bad;assert not writes,writes
 check('Reduced motion has no perpetual graph movement; zero UI writes, exceptions or HTTP 5xx')
 browser.close()
Path('qa/network-browser-results.json').write_text(json.dumps({'passed':True,'checks':checks,'layout_cases':len(cases),'cases':cases,'browser_errors':errors,'http_5xx':bad,'write_requests':writes},ensure_ascii=False,indent=2))
