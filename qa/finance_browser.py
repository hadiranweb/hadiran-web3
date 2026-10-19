"""P05 UI against real local PostgreSQL/production build; no production traffic."""
import json,urllib.request,urllib.error,subprocess,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE='http://127.0.0.1:3002';SITE='https://finance.test';checks=[];cases=[];errors=[];bad=[];writes=[]
clients=json.loads(Path('/home/user/.cache/finance-qa-clients.json').read_text());fixture=json.loads(Path('qa/finance-fixture.json').read_text())
def sql(query):
 code="const {Client}=require('pg');const c=new Client({connectionString:'postgresql://hadiran_qa:local-qa-only@127.0.0.1:5432/hadiran_integration_qa'});(async()=>{await c.connect();await c.query(process.argv[1])})().finally(()=>c.end())"
 subprocess.run(['node','-e',code,query],check=True)
def proxy(route):
 r=route.request;headers={k:v for k,v in r.headers.items() if k.lower() not in ['host','accept-encoding','content-length']};headers['Host']='finance.test';headers['X-Forwarded-Proto']='https'
 try:res=urllib.request.urlopen(urllib.request.Request(BASE+r.url.split('finance.test',1)[1],data=r.post_data_buffer,headers=headers,method=r.method))
 except urllib.error.HTTPError as e:res=e
 route.fulfill(status=res.status,headers={k:v for k,v in res.headers.items() if k.lower() not in ['content-length','content-encoding','connection','transfer-encoding']},body=res.read())
def check(s):checks.append(s);print('PASS',s,flush=True)
def cookie(ctx,who):ctx.add_cookies([{'name':'hadiran_session','value':clients[who].split('=',1)[1],'url':SITE,'secure':True,'httpOnly':True,'sameSite':'Lax'}])
def fits(p,label):assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(label,p.evaluate('document.documentElement.scrollWidth'),p.viewport_size)
with sync_playwright() as pw:
 browser=pw.chromium.launch(args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':1440,'height':1050});cookie(ctx,'owner');page=ctx.new_page();page.route(SITE+'/**',proxy);page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append([r.status,r.url]) if r.status>=500 else None);page.on('request',lambda r:writes.append([r.method,r.url]) if r.method not in ['GET','HEAD','OPTIONS'] else None)
 report='/workspace/finance?period=custom&from=1405-01-01&to=1405-01-01';orders='/workspace/shop/orders?period=all&product=f05-product'
 page.goto(SITE+report);expect(page.locator('.fc-page')).to_have_attribute('data-source','live');expect(page.locator('.fc-money-card')).to_have_count(2);expect(page.locator('[data-currency="IRR"]')).to_contain_text('تومان');expect(page.locator('.fc-source').first).to_contain_text('تهران');expect(page.locator('[data-finance-order]')).to_have_count(9);assert page.locator('[data-finance-order="f05-high"]').count()==0
 page.evaluate('document.fonts.ready');page.screenshot(path='qa/finance-report-light.png',full_page=True)
 page.locator('[data-currency="USD"]').click();expect(page.locator('.fc-money-card')).to_have_count(1);expect(page.locator('[data-finance-order]')).to_have_count(1);expect(page.locator('[data-finance-order]')).to_have_attribute('data-finance-order','f05-usd-row')
 check('Real settlement report, Persian/Tehran dates and exact per-currency source drill-down')
 page.goto(SITE+orders);expect(page.locator('[data-finance-order]')).to_have_count(20);page.get_by_role('link',name='بعدی',exact=True).click();expect(page.locator('[data-finance-order]')).to_have_count(15)
 page.goto(SITE+orders);page.locator('[data-finance-state="awaiting_confirmation"]').click();expect(page.locator('[data-finance-order]')).to_have_count(6)
 page.locator('input[name=q]').fill('not-a-real-order');page.get_by_role('button',name='اعمال فیلتر',exact=True).click();expect(page.locator('[data-finance-order]')).to_have_count(0);expect(page.locator('.fc-empty').last).to_contain_text('پیدا نشد')
 page.goto(SITE+report);page.locator('[data-finance-order="f05-first"] h3 a').click();expect(page.locator('h1')).to_have_text('جزئیات سفارش');expect(page.locator('.fc-history')).to_contain_text('بازسازی نشده');page.go_back();expect(page.locator('.fc-page')).to_be_visible()
 page.goto(SITE+'/workspace/finance?period=custom&from=1404-12-30&to=1405-01-01');expect(page.locator('main p[role=alert]')).to_be_visible()
 check('State facets, complete pagination, genuine no-match, canonical details/back and strict invalid-date UI')
 for locale in ['fa','en']:
  ctx.add_cookies([{'name':f"hadiran-workspace-{fixture['owner']}-locale",'value':locale,'url':SITE}])
  for theme in ['light','dark']:
   for width in [320,375,768,1280,1440,1920]:
    page.set_viewport_size({'width':width,'height':1000})
    for name,path in [('report',report),('orders',orders),('empty',orders+'&q=absent-value')]:
     page.goto(SITE+path);expect(page.locator('html')).to_have_attribute('lang',locale);page.evaluate('(theme)=>{document.documentElement.dataset.theme=theme;localStorage.setItem("hadiran-theme",theme)}',theme);fits(page,(locale,theme,width,name));cases.append([locale,theme,width,name])
  page.set_viewport_size({'width':320,'height':1000});page.goto(SITE+orders);page.add_style_tag(content='html{font-size:200% !important}');fits(page,(locale,'200%'))
 check('72 owner layouts: FA/EN, light/dark, report/orders/empty, 320–1920px; 200% text at 320px')
 ctx.add_cookies([{'name':f"hadiran-workspace-{fixture['owner']}-locale",'value':'fa','url':SITE}]);page.set_viewport_size({'width':375,'height':1000});page.goto(SITE+orders+'&state=awaiting_confirmation');page.evaluate('document.documentElement.dataset.theme="dark"');page.screenshot(path='qa/finance-orders-mobile-dark.png',full_page=True)
 assert not writes,writes
 check('Report/filters/pagination/locale/refresh browsing does not create financial writes')
 personal=browser.new_context(viewport={'width':375,'height':1000});cookie(personal,'member');p=personal.new_page();p.route(SITE+'/**',proxy);p.on('pageerror',lambda e:errors.append(str(e)));p.goto(SITE+'/account/purchases?period=all&q=f05-row-01');expect(p.locator('[data-finance-order]')).to_have_count(0);p.goto(SITE+'/account/purchases?period=all');expect(p.locator('.fc-page')).to_have_attribute('data-source','live');fits(p,'personal-mobile');p.screenshot(path='qa/finance-personal-mobile.png',full_page=True)
 p.goto(SITE+'/shop/orders/f05-row-01');expect(p.locator('h1')).not_to_have_text('محصول آزمایشی f05-product')
 p.goto(SITE+'/account/purchases?period=all');p.add_style_tag(content='html{font-size:200% !important}');fits(p,'personal-200%')
 check('Member purchase/access history is private; foreign order cannot be opened; mobile and 200% reflow')
 # Explicit, local-only confirmation through the existing component.
 sql("delete from shop_orders where id='f05-ui-order'; insert into shop_listings(id,slug,title_fa,amount,currency,published) values('f05-ui','f05-ui','کالای بازبینی آزمایشی',120001,'IRR',true) on conflict(id) do nothing; insert into shop_orders(id,buyer_id,listing_id,amount,currency,state,payment_reference,original_amount) select 'f05-ui-order',id,'f05-ui',120001,'IRR','awaiting_confirmation','QA-UI-REF',120001 from accounts where phone='09121234569'")
 page.set_viewport_size({'width':1440,'height':1050});page.goto(SITE+'/workspace/shop/orders/f05-ui-order');expect(page.get_by_role('button',name='تأیید دریافت',exact=True)).to_be_visible();page.get_by_role('button',name='تأیید دریافت',exact=True).click();expect(page.get_by_role('button',name='تأیید دریافت',exact=True)).to_have_count(0,timeout=15000);expect(page.locator('.fc-history')).to_contain_text('تأیید دریافت');expect(page.locator('.fc-history')).to_contain_text('مدیر');page.screenshot(path='qa/finance-order-history-light.png',full_page=True);assert len(writes)==1,writes
 check('Explicit owner confirmation uses the existing endpoint once, refreshes status and displays actor/time history')
 page.emulate_media(reduced_motion='reduce');page.goto(SITE+report);assert page.locator('.fc-page').evaluate('(el)=>el.getAnimations({subtree:true}).filter(a=>a.playState==="running").length')==0
 assert not errors,errors;assert not bad,bad
 # Actual no-DB owner preview is unknown, not zero or fake financial amounts.
 nodb=browser.new_context(viewport={'width':375,'height':1000});p=nodb.new_page();p.goto('http://127.0.0.1:3001/signin?next=/workspace/finance');p.get_by_role('textbox',name='شمارهٔ موبایل').fill('09121234567');p.get_by_role('button',name='ارسال کد',exact=True).click();p.get_by_role('textbox',name='کد پیامک‌شده').fill('123456');p.get_by_role('button',name='ورود',exact=True).click();expect(p.locator('.fc-page')).to_have_attribute('data-source','preview');expect(p.locator('.fc-money-card')).to_have_count(0);expect(p.locator('.fc-notice')).to_contain_text('نامشخص');fits(p,'no-db')
 check('Reduced motion remains still; genuine no-DB preview has unknown amounts/counts, no samples')
 Path('qa/finance-browser-results.json').write_text(json.dumps({'passed':True,'checks':checks,'layout_cases':len(cases),'cases':cases,'text_zoom':'200% at 320px','browser_errors':errors,'http_5xx':bad,'write_requests':writes},ensure_ascii=False,indent=2));browser.close()
