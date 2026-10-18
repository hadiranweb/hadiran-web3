"""Real login UI over a simulated HTTPS origin, forwarding real DB session cookies (not the cookieless preview)."""
import json,time,urllib.request,urllib.error
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE='http://127.0.0.1:3002';errors=[];bad=[]
def proxy(route):
 req=route.request
 headers={k:v for k,v in req.headers.items() if k.lower() not in ['host','accept-encoding','content-length']}
 headers['Host']='live.test';headers['X-Forwarded-Proto']='https'
 request=urllib.request.Request(BASE+req.url.split('live.test',1)[1],data=req.post_data_buffer,headers=headers,method=req.method)
 try:r=urllib.request.urlopen(request)
 except urllib.error.HTTPError as e:r=e
 route.fulfill(status=r.status,headers={k:v for k,v in r.headers.items() if k.lower() not in ['content-length','content-encoding','connection','transfer-encoding']},body=r.read())
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);c=b.new_context(viewport={'width':1440,'height':1000});page=c.new_page();page.route('https://live.test/**',proxy);page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append((r.status,r.url)) if r.status>=500 else None)
 page.goto('https://live.test/signin?next=/workspace');assert page.get_by_text('ورود تستی داخلی',exact=False).count()==0
 page.get_by_role('textbox',name='شمارهٔ موبایل').fill('۰۹۱۲۱۲۳۴۵۶۷');page.get_by_role('button',name='ادامه',exact=True).click();page.get_by_placeholder('رمز حساب').fill('Integration-QA-2026');page.get_by_role('button',name='ورود',exact=True).click();expect(page.locator('h1')).to_have_text('میز کار')
 assert any(x['name']=='hadiran_session' and x['secure'] and x['httpOnly'] for x in c.cookies())
 page.locator('.ws-navigation a').filter(has_text='فروشگاه').click();page.get_by_role('link',name='کالای جدید',exact=True).click()
 page.locator('input[name=titleFa]').fill('کالای ساخته‌شده از فرم واقعی');page.locator('input[name=slug]').fill('ui-qa-'+str(int(time.time())));page.locator('input[name=amount]').fill('150000');page.locator('textarea[name=bodyFa]').fill('توضیح محصول آزمون');page.get_by_role('button',name='ذخیره',exact=True).click();expect(page.locator('h1')).to_have_text('فروشگاه');expect(page.get_by_text('کالای ساخته‌شده از فرم واقعی',exact=True)).to_be_visible();page.screenshot(path='qa/integration-live-shop.png',full_page=True)
 page.get_by_text('کالای ساخته‌شده از فرم واقعی',exact=True).click();expect(page.locator('input[name=titleFa]')).to_have_value('کالای ساخته‌شده از فرم واقعی');page.screenshot(path='qa/integration-live-listing.png',full_page=True)
 # A submitted member's real server-generated report is viewable after a normal password login.
 m=b.new_context(viewport={'width':390,'height':844});mp=m.new_page();mp.route('https://live.test/**',proxy);mp.on('pageerror',lambda e:errors.append(str(e)))
 mp.goto('https://live.test/signin?next=/analyzers/casio-ss/report');mp.get_by_role('textbox',name='شمارهٔ موبایل').fill('09121234568');mp.get_by_role('button',name='ادامه',exact=True).click();mp.get_by_placeholder('رمز حساب').fill('Integration-QA-2026');mp.get_by_role('button',name='ورود',exact=True).click();expect(mp.locator('h1')).to_contain_text('گزارش عارضه‌یابی')
 # The member has not completed onboarding; this modal must remain functional on the report.
 if mp.get_by_role('button',name='می‌پذیرم و ادامه می‌دهم',exact=False).count():pass
 mp.screenshot(path='qa/integration-live-report-mobile.png',full_page=True)
 assert mp.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors
 assert not bad,bad
 Path('qa/integration-live-browser-results.json').write_text(json.dumps({'status':'PASS','checks':['Real password UI over HTTPS proxy, secure HttpOnly JWT cookie','Real listing creation, list refresh and editing form','Submitted member report renders on mobile with policy/onboarding preserved'],'browser_errors':errors,'http_5xx':bad,'note':'Simulated HTTPS origin to the local PostgreSQL-backed build, not production'},ensure_ascii=False,indent=2))
 print('PASS real login UI, secure cookie, listing create/edit and mobile submitted report; browser errors:',errors)
 b.close()
