from pathlib import Path
import json,re,argparse
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser()
parser.add_argument('--preview',required=True,type=Path)
parser.add_argument('--output',required=True,type=Path)
parser.add_argument('--boundaries',type=Path)
args=parser.parse_args()
r=args.output.resolve();r.mkdir(parents=True,exist_ok=True);fixture=args.preview.resolve()
results=[];errors=[];network=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1200,'height':920},device_scale_factor=1)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda req:network.append(req.url) if req.url.startswith(('http:','https:')) else None)
 page.goto(fixture.as_uri());page.evaluate('document.fonts.ready')
 for template in ['hadiran','casio-ss','casio-research','system-diagnosis']:
  page.select_option('#template',template);page.evaluate('document.fonts.ready')
  assert page.locator('.view.active').count()==1
  assert page.locator('.view.active').get_attribute('data-template')==template
  assert '{{' not in page.locator('.view.active').inner_text()
  info=page.evaluate('''() => {const v=document.querySelector('.view.active');return {logicalPages:v.querySelectorAll('.doc-page').length,fontLoaded:document.fonts.check('16px IRANSharp'),font:getComputedStyle(v.querySelector('.doc-root')).fontFamily,clipped:[...v.querySelectorAll('.doc-page')].map((e,i)=>({page:i+1,scroll:e.scrollHeight,height:e.clientHeight,overflow:getComputedStyle(e).overflow})).filter(x=>x.scroll>x.height+3&&['hidden','clip'].includes(x.overflow))}}''')
  assert not info['clipped'],(template,info)
  assert info['fontLoaded'],(template,'IRANSharp not loaded')
  if template in ['casio-ss','casio-research']:page.screenshot(path=str(r/(template+'-desktop.png')))
  page.emulate_media(media='print');pdf=page.pdf(format='A4',print_background=True,prefer_css_page_size=True)
  page.emulate_media(media='screen')
  printed=len(re.findall(rb'/Type\s*/Page\b',pdf))
  assert printed == info['logicalPages'], (template, 'Unexpected print pagination', printed, info)
  (r/(template+'-print-qa.pdf')).write_bytes(pdf)
  results.append({'template':template,**info,'pdfPages':printed})
 # Controls still operate at a small viewport. A4 canvas intentionally scrolls horizontally.
 page.set_viewport_size({'width':390,'height':844});page.select_option('#template','casio-research');assert page.locator('.view.active').get_attribute('data-template')=='casio-research'
 page.screenshot(path=str(r/'research-mobile.png'))
 boundary_results=[]
 if args.boundaries:
  fonts=re.search(r'<style>(.*?)</style>',fixture.read_text(),re.S).group(1)
  for x in json.loads(args.boundaries.read_text()):
   page.set_content('<html dir="rtl"><style>'+fonts+'\n'+x['css']+'\n@page{size:A4;margin:0}body{margin:0}.doc-root{margin:0!important}</style><div class="'+x['className']+'">'+x['html']+'</div></html>')
   page.evaluate('document.fonts.ready');page.emulate_media(media='print')
   pdf=page.pdf(format='A4',print_background=True,prefer_css_page_size=True)
   logical=page.locator('.doc-page').count();printed=len(re.findall(rb'/Type\s*/Page\b',pdf))
   boundary_results.append({k:x[k] for k in ['id','count','patterns']}|{'logicalPages':logical,'pdfPages':printed,'pass':logical==printed})
  (r/'print-boundary-qa.json').write_text(json.dumps(boundary_results,indent=2)+'\n')
  assert all(x['pass'] for x in boundary_results),boundary_results
 browser.close()
assert not errors,errors
assert not network,network
out={'scope':'Offline synthetic report rendered by production template functions; not authenticated app/DB integration','templates':results,'javascriptErrors':errors,'externalRequests':network,'selectionWorksOnMobile':True,'printBoundaryCasesPassed':len(boundary_results)}
(r/'browser-qa.json').write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n');print(json.dumps(out,indent=2,ensure_ascii=False))
