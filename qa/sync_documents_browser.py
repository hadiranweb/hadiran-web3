"""New upstream document tools in a real local production build. No external services."""
import json,urllib.request,urllib.error,re
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE='http://127.0.0.1:3002';SITE='https://sync.test';checks=[];cases=[];errors=[];bad=[];exfil=[]
cookies=json.loads(Path('/home/user/.cache/sync-docs-clients.json').read_text());fixture=json.loads(Path('qa/sync-documents-fixture.json').read_text())
def api(path,body=None):
 req=urllib.request.Request(BASE+path,data=None if body is None else json.dumps(body).encode(),headers={'Cookie':cookies['owner'],'Content-Type':'application/json'},method='GET' if body is None else 'PUT');return json.load(urllib.request.urlopen(req))
def proxy(route):
 req=route.request;headers={k:v for k,v in req.headers.items() if k.lower() not in ['host','accept-encoding','content-length']};headers['Host']='sync.test';headers['X-Forwarded-Proto']='https'
 try:r=urllib.request.urlopen(urllib.request.Request(BASE+req.url.split('sync.test',1)[1],data=req.post_data_buffer,headers=headers,method=req.method))
 except urllib.error.HTTPError as e:r=e
 route.fulfill(status=r.status,headers={k:v for k,v in r.headers.items() if k.lower() not in ['content-length','content-encoding','connection','transfer-encoding']},body=r.read())
def check(s):checks.append(s);print('PASS',s,flush=True)
def fits(p,label):assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(label,p.evaluate('document.documentElement.scrollWidth'),p.viewport_size)
def set_code(p,value):
 cm=p.locator('.cm-content').first;cm.click();cm.press('ControlOrMeta+A');cm.press('Backspace');p.keyboard.insert_text(value)
original=next(t['chrome'] for t in api('/api/workspace/document-templates')['templates'] if t['id']=='hadiran')
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1440,'height':1050});ctx.add_cookies([{'name':'hadiran_session','value':cookies['owner'].split('=',1)[1],'url':SITE,'secure':True,'httpOnly':True,'sameSite':'Lax'}]);p=ctx.new_page();p.route(SITE+'/**',proxy);p.route('https://exfil.invalid/**',lambda route:(exfil.append(route.request.url),route.abort()));p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:bad.append([r.status,r.url]) if r.status>=500 else None)
  p.goto(SITE+'/workspace/documents/'+str(fixture['documentId']));frame=p.frame_locator('iframe[data-document-surface]');expect(frame.locator('.doc-page').first).to_be_visible();assert frame.locator('.doc-page').count()>=5;assert frame.locator('svg').count()>=1;expect(frame.locator('body')).to_contain_text('عضو')
  assert frame.locator('body').evaluate('(el)=>getComputedStyle(el).fontFamily').lower().find('iransharp')>=0
  p.screenshot(path='qa/sync-document-casio.png',full_page=False)
  p.locator('iframe[data-document-surface]').evaluate('(el)=>{el.contentWindow.print=()=>el.contentWindow.__printCalled=true}');p.get_by_role('button',name='چاپ / ذخیره از مرورگر').click();assert p.locator('iframe[data-document-surface]').evaluate('(el)=>el.contentWindow.__printCalled')
  p.emulate_media(media='print');assert frame.locator('.doc-page').first.evaluate('(el)=>getComputedStyle(el).breakAfter')=='page';p.emulate_media(media='screen')
  check('Stored CASIO document renders real respondent, native SVG radar, IRANSharp and A4 page breaks; print targets isolated document')
  p.goto(SITE+'/workspace/documents');expect(p.get_by_role('heading',name='سندساز',exact=True)).to_be_visible();expect(p.locator('.cm-editor')).to_have_count(1)
  section=p.locator('section').filter(has=p.get_by_role('heading',name='ویرایشگر قالب',exact=True));section.locator('select').first.select_option('hadiran')
  sample='<section class="doc-page"><p data-hid="h100" style="margin:24px;font-size:20px">متن ثابت آزمایش</p><p data-hid="h101">{{personNameFa}}</p></section>'
  set_code(p,sample);expect(p.frame_locator('iframe').locator('body')).to_contain_text('نمونهٔ پیش‌نمایش')
  p.get_by_role('button',name='ذخیرهٔ قالب',exact=True).click();expect(p.get_by_text('ذخیره شد.',exact=True)).to_be_visible();p.reload();section=p.locator('section').filter(has=p.get_by_role('heading',name='ویرایشگر قالب',exact=True));section.locator('select').first.select_option('hadiran');expect(p.locator('.cm-content')).to_contain_text('{{personNameFa}}')
  check('Existing upstream CodeMirror edits and persists a private HTML template; variables render only in sample preview')
  p.get_by_role('button',name='ویرایش روی پیش‌نمایش',exact=True).click();fr=p.frame_locator('iframe');fr.locator('[data-hid="h100"]').click();overlay=p.locator('.cursor-move');expect(overlay).to_be_visible();box=overlay.bounding_box();p.locator('iframe').evaluate('(el)=>window.__previousDoc=el.contentDocument');p.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);p.mouse.down();p.mouse.move(box['x']+box['width']/2+22,box['y']+box['height']/2+16,steps=8);p.mouse.up();p.wait_for_function('document.querySelector("iframe").contentDocument!==window.__previousDoc && document.querySelector("iframe").contentDocument.readyState==="complete"');p.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');expect(fr.locator('[data-hid="h100"]')).to_have_attribute('style',re.compile('left:'));expect(overlay).to_be_visible()
  handle=p.locator('.cursor-nwse-resize');box=handle.bounding_box();p.mouse.move(box['x']+3,box['y']+3);p.mouse.down();p.mouse.move(box['x']+27,box['y']+20,steps=8);p.mouse.up();expect(fr.locator('[data-hid="h100"]')).to_have_attribute('style',re.compile('width:'));p.get_by_role('button',name='متن بزرگ‌تر',exact=True).click();p.screenshot(path='qa/sync-document-visual-editor.png',full_page=False)
  p.get_by_role('button',name='ویرایش کد',exact=True).click();source=p.locator('.cm-content').inner_text();assert '{{personNameFa}}' in source;assert 'width:' in source and ('left:' in source or 'top:' in source)
  check('Live element selection, drag, resize and font change write template styles without baking a sample variable into source')
  # Executable template/style content is isolated from the authenticated application.
  attack=sample+'<img src="https://exfil.invalid/private"><meta http-equiv="refresh" content="0;url=https://exfil.invalid/refresh"><script>parent.document.documentElement.dataset.pwned="yes"</script><style>body{color:red}</style>'
  set_code(p,attack);p.wait_for_timeout(400);assert p.locator('html').get_attribute('data-pwned') is None;expect(p.get_by_role('heading',name='سندساز',exact=True)).to_be_visible();assert not exfil,exfil;assert p.locator('iframe').get_attribute('sandbox')=='allow-same-origin allow-modals';p.get_by_role('button',name='ویرایش روی پیش‌نمایش',exact=True).click();p.wait_for_timeout(150);assert not exfil,exfil
  check('Sandbox/CSP blocks script and external image/refresh requests; template CSS does not escape into the application')
  p.goto(SITE+'/workspace/analyzers/casio-ss');p.get_by_role('button',name='ربات',exact=True).click();expect(p.get_by_role('heading',name='ربات‌هایی که این آزمون را می‌آورند')).to_be_visible();p.get_by_role('button',name='گزارش',exact=True).click();expect(p.get_by_text('قالب سند چندصفحه',exact=True)).to_be_visible()
  p.goto(SITE+'/');expect(p.locator('h1')).to_have_text('مسئله‌ات را بگو؛ با هم شفافش می‌کنیم');assert p.locator('.home-portrait-shell').count()==1;expect(p.locator('.theme-trigger svg')).to_be_visible();p.locator('.theme-trigger').click();expect(p.get_by_role('radio',name='مطابق سیستم',exact=True)).to_be_visible();p.get_by_role('radio',name='تاریک',exact=True).check();expect(p.locator('html')).to_have_attribute('data-theme','dark');p.locator('.theme-trigger').click();p.reload();expect(p.locator('html')).to_have_attribute('data-theme','dark');expect(p.locator('.portrait-reassembly')).to_have_attribute('data-phase',re.compile('complete|static'),timeout=15000);p.evaluate('document.fonts.ready');p.screenshot(path='qa/sync-home-copy-lamp.png',full_page=False)
  check('Author bot-path/template controls and approved public copy/lamp coexist with portrait and persisted three-state theme')
  for theme in ['light','dark']:
   for width in [320,375,768,1440,1920]:
    p.set_viewport_size({'width':width,'height':1000})
    for name,path in [('builder','/workspace/documents'),('document','/workspace/documents/'+str(fixture['documentId'])),('home','/')]:
     p.goto(SITE+path);p.evaluate('(x)=>document.documentElement.dataset.theme=x',theme);fits(p,(name,theme,width));cases.append([name,theme,width])
  p.set_viewport_size({'width':320,'height':1000});p.goto(SITE+'/workspace/documents');p.add_style_tag(content='html{font-size:200% !important}');fits(p,'200 percent text');p.screenshot(path='qa/sync-builder-mobile.png',full_page=False)
  check('30 new builder/document/home layouts at 320–1920px and 200 percent text reflow')
  assert not errors,errors;assert not bad,bad
  b.close()
finally:api('/api/workspace/document-templates/hadiran',{'chrome':original})
Path('qa/sync-documents-browser-results.json').write_text(json.dumps({'passed':True,'checks':checks,'layouts':cases,'pageerrors':errors,'http5xx':bad,'externalRequests':exfil},ensure_ascii=False,indent=2))
