"""Pinned upstream bot editor against local production build; no Telegram connection."""
import json,urllib.request,urllib.error
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE='http://127.0.0.1:3002';SITE='https://bot-editor.test';cookies=json.loads(Path('/home/user/.cache/sync-docs-clients.json').read_text());checks=[];layouts=[];errors=[];exfil=[]
def api(path,body=None):
 req=urllib.request.Request(BASE+path,data=None if body is None else json.dumps(body).encode(),headers={'Cookie':cookies['owner'],'Content-Type':'application/json'},method='GET' if body is None else 'PUT');return json.load(urllib.request.urlopen(req))
def proxy(route):
 r=route.request;headers={k:v for k,v in r.headers.items() if k.lower() not in ['host','accept-encoding','content-length']};headers['Host']='bot-editor.test';headers['X-Forwarded-Proto']='https'
 try:v=urllib.request.urlopen(urllib.request.Request(BASE+r.url.split('bot-editor.test',1)[1],data=r.post_data_buffer,headers=headers,method=r.method))
 except urllib.error.HTTPError as e:v=e
 route.fulfill(status=v.status,headers={k:v for k,v in v.headers.items() if k.lower() not in ['content-length','content-encoding','connection','transfer-encoding']},body=v.read())
def check(s):checks.append(s);print('PASS',s,flush=True)
route='/api/workspace/analyzers/casio-ss';original=api(route)['pack'];template='**{exam}**\n{n}/{total}\n{question}\n---\n<script>window.pwned=true</script><img src="https://exfil.invalid/probe">'
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(args=['--no-sandbox']);c=b.new_context(viewport={'width':1440,'height':1050});c.add_cookies([{'name':'hadiran_session','value':cookies['owner'].split('=',1)[1],'url':SITE,'secure':True,'httpOnly':True,'sameSite':'Lax'}]);p=c.new_page();p.route(SITE+'/**',proxy);p.route('https://exfil.invalid/**',lambda r:(exfil.append(r.request.url),r.abort()));p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(SITE+'/workspace/analyzers/casio-ss');p.get_by_role('button',name='ربات',exact=True).click();section=p.locator('section').filter(has=p.get_by_role('heading',name='نحوه نمایش در ربات',exact=True));expect(section).to_be_visible();cm=section.locator('.cm-content');cm.click();cm.press('ControlOrMeta+A');cm.press('Backspace');p.keyboard.insert_text(template);expect(section.locator('b').first).to_contain_text(original['nameFa']);assert section.locator('script,img').count()==0;assert not p.evaluate('Boolean(window.pwned)');assert not exfil
  p.get_by_role('button',name='ذخیره',exact=True).click();expect(p.get_by_text('ذخیره شد.',exact=True)).to_be_visible();assert api(route)['pack']['botDisplay']['questionTemplateFa']==template
  p.reload();p.get_by_role('button',name='ربات',exact=True).click();expect(p.locator('.cm-content')).to_contain_text('<script>');check('Same CodeMirror edits, saves and reloads a per-exam Markdown question template; raw HTML stays escaped in preview')
  for theme in ['light','dark']:
   for width in [320,375,768,1440,1920]:
    p.set_viewport_size({'width':width,'height':1000});p.evaluate('(x)=>document.documentElement.dataset.theme=x',theme);assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(theme,width);layouts.append([theme,width])
  p.set_viewport_size({'width':320,'height':1000});p.add_style_tag(content='html{font-size:200% !important}');assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),p.evaluate('Array.from(document.querySelectorAll(".repo-module *")).filter(e=>e.getBoundingClientRect().right>innerWidth+1||e.getBoundingClientRect().left < -1).map(e=>[e.tagName,e.className,e.getBoundingClientRect().width,e.textContent.slice(0,70)]).filter(x=>!String(x[1]).startsWith("cm-")).slice(0,40)');p.screenshot(path='qa/sync-bot-editor-mobile.png',full_page=False);check('New bot editor reflows at ten light/dark 320–1920px layouts and 200% text');p.add_style_tag(content='html{font-size:100% !important}');p.set_viewport_size({'width':1440,'height':1050});cm=p.locator('.cm-content');cm.click();cm.press('ControlOrMeta+A');p.keyboard.insert_text('**{exam}**\n{n} از {total}\n**{question}**\n---');section=p.locator('section').filter(has=p.get_by_role('heading',name='نحوه نمایش در ربات',exact=True));section.evaluate('(el)=>el.scrollIntoView({block:"start"})');p.evaluate('window.scrollBy(0,-85)');p.screenshot(path='qa/sync-bot-editor.png',full_page=False);p.set_viewport_size({'width':375,'height':1000});section.evaluate('(el)=>el.scrollIntoView({block:"start"})');p.screenshot(path='qa/sync-bot-editor-mobile.png',full_page=False)
  assert not errors,errors;assert not exfil,exfil;b.close()
finally:api(route,original)
Path('qa/sync-bot-display-browser-results.json').write_text(json.dumps({'passed':True,'upstream':'12362039e94140c9ca0536e3a1842191b4e7afd8','checks':checks,'layouts':layouts,'pageerrors':errors,'externalRequests':exfil,'live_telegram':False},ensure_ascii=False,indent=2))
