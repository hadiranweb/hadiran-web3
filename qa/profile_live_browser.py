"""Real auth/member menu, public reflow and text-only zoom on the local DB-backed build."""
import json,re,urllib.request,urllib.error
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE='http://127.0.0.1:3002';errors=[];bad=[];cases=0;issues=[]
def proxy(route):
 r=route.request;h={k:v for k,v in r.headers.items() if k.lower() not in ['host','accept-encoding','content-length']};h['Host']='live.test';h['X-Forwarded-Proto']='https'
 req=urllib.request.Request(BASE+r.url.split('live.test',1)[1],data=r.post_data_buffer,headers=h,method=r.method)
 try:res=urllib.request.urlopen(req)
 except urllib.error.HTTPError as e:res=e
 route.fulfill(status=res.status,headers={k:v for k,v in res.headers.items() if k.lower() not in ['content-length','content-encoding','connection','transfer-encoding']},body=res.read())
def fit(page,label):
 global cases
 cases+=1
 if not page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'):
  offending=page.evaluate("""()=>[...document.querySelectorAll('body *')].filter(n=>n.checkVisibility()&&(n.getBoundingClientRect().left < -1 || n.getBoundingClientRect().right>innerWidth+1)).slice(0,15).map(n=>({tag:n.tagName,cls:n.className,text:n.innerText?.slice(0,50),x:n.getBoundingClientRect().x,width:n.getBoundingClientRect().width}))""")
  issues.append({'case':label,'elements':offending})
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);c=b.new_context(viewport={'width':375,'height':850});page=c.new_page();page.route('https://live.test/**',proxy);page.on('pageerror',lambda e:errors.append((page.url,str(e))));page.on('response',lambda r:bad.append((r.status,r.url)) if r.status>=500 else None)
 paths=['/','/ecosystem','/hadiran','/knowledge','/lab','/courses','/analyzers','/analyzers/casio-ss','/shop','/privacy','/contact','/signin']
 for width in [320,375,768,1280,1440]:
  page.set_viewport_size({'width':width,'height':900})
  for theme in ['light','dark']:
   for path in paths:
    page.goto('https://live.test'+path);page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);expect(page.locator('h1').first).to_be_visible();fit(page,(path,width,theme))
 print('Public reflow cases',cases,flush=True)
 page.set_viewport_size({'width':320,'height':900})
 for path in paths:
  page.goto('https://live.test'+path);page.add_style_tag(content='html{font-size:200% !important}');fit(page,(path,320,'200% text zoom'))
 page.goto('https://live.test/signin?next=/account');page.get_by_role('textbox',name='شمارهٔ موبایل').fill('09121234568');page.get_by_role('button',name='ادامه',exact=True).click();page.get_by_placeholder('رمز حساب').fill('Integration-QA-2026');page.get_by_role('button',name='ورود',exact=True).click();expect(page.locator('h1')).to_have_text('حساب من');expect(page.locator('.session-avatar-button')).to_be_visible();page.locator('.session-avatar-button').click();page.wait_for_timeout(380);assert page.locator('.profile-dropdown a[href^="/workspace"]').count()==0;expect(page.locator('.profile-dropdown a[href^="/account"]')).to_be_visible();page.keyboard.press('Escape');page.wait_for_timeout(260)
 expect(page.locator('.session-avatar-button')).to_be_focused();image=page.locator('.session-avatar-button img').get_attribute('src');index=int(image.split('avatar-')[1].split('.')[0]);nextindex=index%8+1;page.locator('.avatar-option').filter(has=page.get_by_role('radio',name=f'آواتار {nextindex}',exact=True)).click();expect(page.get_by_text('آواتار ذخیره شد.',exact=True)).to_be_visible();expect(page.locator('.session-avatar-button img')).to_have_attribute('src',re.compile(rf'/avatars/avatar-{nextindex:02}\.svg$'));page.reload();expect(page.get_by_role('radio',name=f'آواتار {nextindex}',exact=True)).to_be_checked();fit(page,('real member account',320))
 page.add_style_tag(content='html{font-size:200% !important}');fit(page,('real member account',320,'200% text zoom'));page.locator('.session-avatar-button').click();page.wait_for_timeout(380);box=page.locator('.profile-dropdown').bounding_box();assert box['x']>=0 and box['x']+box['width']<=321;page.keyboard.press('Escape');page.wait_for_timeout(260)
 page.goto('https://live.test/account');page.set_viewport_size({'width':1440,'height':1000});page.screenshot(path='qa/profile-real-account-desktop.png',full_page=True)
 print('issues',json.dumps(issues,ensure_ascii=False,indent=2),flush=True);assert not issues;assert not errors,errors;assert not bad,bad
 Path('qa/profile-live-browser-results.json').write_text(json.dumps({'status':'PASS','layout_cases':cases,'checks':['Public routes in 5 widths and 2 themes','All public routes at 320 CSS px and 200% text zoom','Real secure JWT member login; no owner management link','Real member avatar change, live header sync, reload persistence','Member dropdown in viewport at 200% zoom'],'browser_errors':errors,'http_5xx':bad,'production_build':True},ensure_ascii=False,indent=2));b.close()
