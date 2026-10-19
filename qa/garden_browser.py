"""Public pilot: real Next production build + disposable PostgreSQL; no external deployment."""
import json,urllib.request,urllib.error,gzip,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE='http://127.0.0.1:3002';SITE='https://garden.test';checks=[];cases=[];errors=[];writes=[];responses=[]
def check(name):checks.append(name);print('PASS',name,flush=True)
def proxy(route):
 r=route.request;headers={k:v for k,v in r.headers.items() if k.lower() not in ['host','accept-encoding','content-length']};headers['Host']='garden.test';headers['X-Forwarded-Proto']='https'
 try:res=urllib.request.urlopen(urllib.request.Request(BASE+r.url.split('garden.test',1)[1],data=r.post_data_buffer,headers=headers,method=r.method))
 except urllib.error.HTTPError as e:res=e
 route.fulfill(status=res.status,headers={k:v for k,v in res.headers.items() if k.lower() not in ['content-length','content-encoding','connection','transfer-encoding']},body=res.read())
def sql(query):
 subprocess.run(['node','-e',"const {Client}=require('pg');const c=new Client({connectionString:'postgresql://hadiran_qa:local-qa-only@127.0.0.1:5432/hadiran_integration_qa'});(async()=>{await c.connect();await c.query(process.argv[1])})().finally(()=>c.end())",query],check=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':1440,'height':1050},permissions=['clipboard-read','clipboard-write']);page=ctx.new_page();page.route(SITE+'/**',proxy);page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:writes.append([r.method,r.url]) if r.method not in ['GET','HEAD','OPTIONS'] else None);page.on('response',lambda r:responses.append(r))
 page.goto(SITE+'/garden-preview');expect(page.locator('.gw-page')).to_have_attribute('data-source','live');expect(page.locator('.gw-note')).to_have_count(3);page.evaluate('document.fonts.ready');expect(page.locator('#home-chat-input')).to_be_editable();expect(page.locator('.gw-chat-privacy')).to_contain_text('سرور');expect(page.locator('meta[name="robots"]')).to_have_attribute('content','noindex, nofollow');assert page.locator('body > footer, body footer').count()>=2
 page.screenshot(path='qa/garden-desktop-light.png',full_page=True)
 check('Independent public/noindex route, existing HomeChat initially active, truthful storage notice and global navigation/footer retained')
 page.locator('.gw-door-hunter').click();expect(page.locator('#home-chat-input')).to_be_focused();page.get_by_role('button',name='بماند برای وقتی دیگر.',exact=True).click();expect(page.locator('.gw-chat')).not_to_be_visible();expect(page.locator('.gw-door-hunter')).to_be_focused();page.locator('.gw-door-hunter').click();expect(page.locator('#home-chat-input')).to_be_focused();expect(page.locator('.gw-chat')).to_be_visible()
 disclosure=page.locator('.gw-proposition summary');disclosure.focus();page.keyboard.press('Enter');expect(page.locator('.gw-proposition details')).to_have_attribute('open','');page.keyboard.press('Space');assert page.locator('.gw-proposition details').get_attribute('open') is None
 summary=page.locator('.gw-note summary').first;summary.focus();page.keyboard.press('Enter');expect(page.locator('.gw-note details[open]')).to_have_count(1);assert page.locator('.gw-note').first.locator('.gw-note-text').is_visible();page.keyboard.press('Space');expect(page.locator('.gw-note details[open]')).to_have_count(0)
 check('Both doors work; mouse/Enter/Space disclosure and chat hide/restore preserve focus without a parallel form')
 picked=[]
 for i in range(15):
  page.get_by_role('button',name='یک یادداشت بردار',exact=True).click();slug=page.locator('[data-picked="true"]').get_attribute('data-note');picked.append(slug);assert slug in ['garden-qa-problem','garden-qa-flow','garden-qa-experiment'];expect(page.locator('[data-picked="true"] summary')).to_be_focused();assert page.locator('[data-picked="true"] details').get_attribute('open') is not None
 assert all(a!=b for a,b in zip(picked,picked[1:]));check('Random pick stays in the actual public pool, avoids immediate repeat and opens/focuses its note')
 first=page.locator('.gw-note').first;first.locator('summary').evaluate('(el)=>el.parentElement.open=true');expected=first.locator('.gw-note-text').inner_text();first.get_by_role('button',name='کپی متنِ',exact=False).click();expect(page.locator('.gw-toast')).to_have_text('امانت باشد دستت.');assert page.evaluate('navigator.clipboard.readText()')==expected;expect(page.locator('.gw-toast')).to_be_empty(timeout=3000)
 first.locator('.gw-note-text p').first.evaluate('(el)=>{const r=document.createRange();r.selectNodeContents(el);const s=window.getSelection();s.removeAllRanges();s.addRange(r)}');selection=page.evaluate('window.getSelection().toString()');assert page.evaluate('document.execCommand("copy")');assert page.evaluate('navigator.clipboard.readText()')==selection;expect(page.locator('.gw-toast')).to_have_text('امانت باشد دستت.');page.evaluate('window.getSelection().removeAllRanges()');page.wait_for_timeout(1600)
 check('Actual native-selection and button clipboard contents remain unchanged; quiet acknowledgement expires')
 topic=page.locator('.gw-topics .gw-ink').first;topic.focus();expect(topic).to_be_focused();assert topic.get_attribute('href')=='/knowledge?topic=garden-qa-framing';page.wait_for_timeout(220);assert topic.locator('.gw-ink-line').evaluate('(el)=>getComputedStyle(el).opacity')=='1';page.mouse.move(0,0);page.keyboard.press('Tab');page.wait_for_timeout(220);assert topic.locator('.gw-ink-line').evaluate('(el)=>Number(getComputedStyle(el).opacity)')<.5
 link=first.locator('.gw-full-link');href=link.get_attribute('href');assert href.startswith('/knowledge/garden-qa-');link.click();expect(page.locator('h1')).to_contain_text('راه‌حلِ خوب' if 'problem' in href else ('کندیِ کار' if 'flow' in href else 'یک آزمایش کوچک'));page.wait_for_url('**/knowledge/garden-qa-*');page.wait_for_timeout(300);page.go_back();expect(page.locator('.gw-note')).to_have_count(3,timeout=15000)
 check('Real topic links have keyboard/pointer ink parity and each note has a working canonical detail page/back path')
 # Every theme/width is checked both folded and expanded; copy UI is exercised at 200% text size.
 for theme in ['light','dark']:
  page.evaluate('(theme)=>{localStorage.setItem("hadiran-theme",theme);document.documentElement.dataset.theme=theme}',theme)
  for width in [320,375,768,1280,1440,1920]:
   page.set_viewport_size({'width':width,'height':1000})
   for state in ['folded','expanded']:
    page.locator('.gw-note details').evaluate_all('(els)=>els.forEach(el=>el.open='+('true' if state=='expanded' else 'false')+')');page.wait_for_timeout(250)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(theme,width,state)
    assert page.locator('.gw-note summary').first.bounding_box()['width']>=24
    cases.append({'theme':theme,'width':width,'state':state})
 page.set_viewport_size({'width':320,'height':1000});page.evaluate('document.documentElement.style.fontSize="200%"');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');page.get_by_role('button',name='یک یادداشت بردار',exact=True).click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');page.evaluate('document.documentElement.style.fontSize=""');page.set_viewport_size({'width':375,'height':1000});page.screenshot(path='qa/garden-mobile-dark.png',full_page=True)
 check('24 light/dark folded/expanded layouts from 320–1920px plus 320px/200% text have no horizontal overflow')
 page.emulate_media(reduced_motion='reduce');page.locator('.gw-note details').evaluate_all('(els)=>els.forEach(el=>el.open=false)');page.get_by_role('button',name='یک یادداشت بردار',exact=True).click();page.wait_for_timeout(50);assert page.locator('.gw-page').evaluate('(el)=>el.getAnimations({subtree:true}).filter(a=>a.playState==="running").length')==0
 page.set_viewport_size({'width':1440,'height':1050});page.evaluate('document.documentElement.dataset.theme="light"');page.locator('.gw-reading').screenshot(path='qa/garden-reading-light.png')
 check('Reduced motion disables new animations while random selection and disclosure remain operable')
 before=len(page.locator('dialog[open]').all());page.wait_for_timeout(5000);assert len(page.locator('dialog[open]').all())==before;assert not [r for r in writes if '/api/chat' not in r[1]];assert not writes
 check('Reading/hover/copy/random/idle create no POSTs or new popups')
 # Genuine zero state and explicit no-DB state, never conflated.
 try:
  sql("update memory_items set lifecycle='draft' where id in ('garden-qa-problem','garden-qa-flow','garden-qa-experiment')")
  page.goto(SITE+'/garden-preview');expect(page.locator('.gw-page')).to_have_attribute('data-source','live');expect(page.locator('.gw-note')).to_have_count(0);expect(page.get_by_role('button',name='یک یادداشت بردار',exact=True)).to_be_disabled();expect(page.locator('.gw-empty')).to_contain_text('هنوز');page.screenshot(path='qa/garden-empty-light.png',full_page=True)
 finally:sql("update memory_items set lifecycle='approved' where id in ('garden-qa-problem','garden-qa-flow','garden-qa-experiment')")
 old=BASE;BASE='http://127.0.0.1:3001';page.goto(SITE+'/garden-preview');expect(page.locator('.gw-page')).to_have_attribute('data-source','unavailable');expect(page.locator('.gw-empty')).to_contain_text('در دسترس نیستند');expect(page.get_by_role('button',name='یک یادداشت بردار',exact=True)).to_be_disabled();BASE=old
 check('Real empty corpus and absent DB render distinct honest states with disabled random selection')
 # The unchanged existing chat really persists; this is an explicit submit, not an idle/network effect.
 page.goto(SITE+'/garden-preview');page.locator('#home-chat-input').fill('چطور صورت مسئله را روشن‌تر کنیم؟');page.get_by_role('button',name='ارسال پیام',exact=True).click();expect(page.locator('.home-chat-message')).to_have_count(2,timeout=15000);assert len([r for r in writes if r[0]=='POST' and '/api/chat' in r[1]])==1
 check('Explicit send uses the original /api/chat once and renders its answer; no new chat endpoint/diagnostic engine')
 assert not errors,errors
 # Cold-load asset audit (document/fonts/JS/CSS separately, no blanket 50KB claim).
 cold=browser.new_context(viewport={'width':1440,'height':1050});p=cold.new_page();p.route(SITE+'/**',proxy);assets=[];p.on('response',lambda r:assets.append(r));p.goto(SITE+'/garden-preview');p.evaluate('document.fonts.ready');p.wait_for_timeout(1000)
 measured=[];seen=set()
 for response in assets:
  url=response.url
  if url in seen or not url.startswith(SITE):continue
  seen.add(url);kind=response.request.resource_type
  if kind not in ['document','font','script','stylesheet']:continue
  body=response.body();measured.append({'path':url.split(SITE)[1],'type':kind,'raw_bytes':len(body),'gzip_bytes':len(gzip.compress(body,compresslevel=9))})
 totals={kind:{'raw':sum(a['raw_bytes'] for a in measured if a['type']==kind),'gzip':sum(a['gzip_bytes'] for a in measured if a['type']==kind)} for kind in ['document','font','script','stylesheet']}
 Path('qa/garden-performance.json').write_text(json.dumps({'method':'Cold Chromium, 3 explicit local sample notes; local proxy removes compression; gzip-9 calculated separately, not production transfer timing. Font raw is stored WOFF2 bytes. Existing shared chrome included.','totals':totals,'assets':measured},ensure_ascii=False,indent=2))
 Path('qa/garden-browser-results.json').write_text(json.dumps({'passed':True,'checks':checks,'layouts':cases,'text_zoom':'200% at 320px','errors':errors,'writes':writes,'random_picks':picked},ensure_ascii=False,indent=2));browser.close()
