"""Stage-two sample UI. Production build; no new npm packages or live mutations."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
BASE=os.getenv('QA_PREVIEW_BASE','http://127.0.0.1:3001')
checks=[];errors=[];bad=[];writes=[];layouts=[]
def check(name): checks.append(name); print('PASS',name,flush=True)
def fits(page,label):
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),(label,page.evaluate('document.documentElement.scrollWidth'),page.viewport_size)
def view(page,name):
 page.get_by_role('navigation',name='نماهای پیش‌نمایش' if page.locator('html').get_attribute('lang')=='fa' else 'Preview views').get_by_role('button',name=name,exact=True).click()
with sync_playwright() as pw:
 browser=pw.chromium.launch(args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1100});page=context.new_page()
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.on('response',lambda response:bad.append([response.status,response.url]) if response.status>=500 else None)
 page.goto(BASE+'/signin?next=/workspace/preview')
 assert 'شماره را بگذار' not in page.locator('body').inner_text()
 page.get_by_role('textbox',name='شمارهٔ موبایل').fill('09121234567');page.get_by_role('button',name='ارسال کد',exact=True).click()
 page.get_by_role('textbox',name='کد پیامک‌شده').fill('123456');page.get_by_role('button',name='ورود',exact=True).click()
 expect(page.locator('.dp-preview')).to_be_visible();page.on('request',lambda request:writes.append(request.url) if request.method not in ('GET','HEAD','OPTIONS') else None)
 expect(page.locator('.dp-sample').first).to_have_text('دادهٔ نمونه')
 check('Minimal login opens owner-only sample route; sample badge is explicit')
 page.wait_for_timeout(220);page.screenshot(path='qa/workspace-preview-home-light.png',full_page=True)
 page.locator('.dp-metrics > button').first.click();expect(page.locator('.dp-order-list > li')).to_have_count(2)
 page.locator('.dp-order-row').first.click();expect(page.locator('.dp-detail')).to_be_visible();expect(page.locator('.dp-detail')).to_contain_text('S-1047')
 page.keyboard.press('Tab');assert page.locator('.dp-detail').evaluate('dialog=>dialog.contains(document.activeElement)')
 page.keyboard.press('Escape');expect(page.locator('.dp-detail')).not_to_be_visible();expect(page.locator('.dp-order-row').first).to_be_focused()
 page.get_by_label('وضعیت سفارش').select_option('all');expect(page.locator('.dp-order-list > li')).to_have_count(7)
 page.get_by_label('جست‌وجوی سفارش',exact=True).fill('S-1045');expect(page.locator('.dp-order-list > li')).to_have_count(1)
 page.locator('.dp-order-row').click();page.get_by_role('button',name='نمایش در فهرست').click();expect(page.locator('.dp-detail')).not_to_be_visible();expect(page.locator('.dp-order-list > li')).to_have_count(1)
 page.get_by_label('جست‌وجوی سفارش',exact=True).fill('not-a-sample');expect(page.get_by_role('heading',name='سفارشی پیدا نشد')).to_be_visible()
 page.get_by_role('button',name='پاک‌کردن فیلترها').click();expect(page.locator('.dp-order-list > li')).to_have_count(7)
 page.get_by_label('بازهٔ زمانی').select_option('7');expect(page.locator('.dp-order-list > li')).to_have_count(5)
 page.get_by_label('بازهٔ زمانی').select_option('30')
 page.wait_for_timeout(220);page.screenshot(path='qa/workspace-preview-orders.png',full_page=True)
 check('KPI drill-down, independent filters, search, empty recovery and accessible detail dialog')
 view(page,'روابط');expect(page.locator('.dp-node')).to_have_count(7)
 page.get_by_role('button',name='بزرگ‌نمایی',exact=True).click();expect(page.locator('.dp-graph-tools')).to_contain_text('125%')
 page.get_by_role('button',name='بازنشانی گراف').click();expect(page.locator('.dp-graph-tools')).to_contain_text('100%')
 svg=page.locator('.dp-graph > svg');svg.focus();page.keyboard.press('ArrowRight');assert 'translate(24 0)' in svg.locator('> g').get_attribute('transform')
 page.keyboard.press('Home');assert 'translate(0 0)' in svg.locator('> g').get_attribute('transform')
 page.locator('.dp-node').nth(1).focus();page.keyboard.press('Enter');expect(page.locator('.dp-detail')).to_be_visible();expect(page.locator('.dp-detail')).to_contain_text('10000002');page.keyboard.press('Escape')
 page.get_by_label('جست‌وجوی رابطه').fill('10000007');page.get_by_text('فهرست متنی روابط',exact=True).click();expect(page.locator('.dp-directory li')).to_have_count(1)
 page.get_by_label('جست‌وجوی رابطه').fill('');page.get_by_label('فقط معرف‌های مستقیم').check();expect(page.locator('.dp-directory li')).to_have_count(3);page.get_by_label('فقط معرف‌های مستقیم').uncheck()
 page.wait_for_timeout(220);page.screenshot(path='qa/workspace-preview-graph.png',full_page=True)
 check('Native SVG graph supports zoom, keyboard pan/reset, node details, query and text directory')
 for locale in ['fa','en']:
  if locale=='en':page.locator('.ws-language').click()
  for theme in ['light','dark']:
   page.evaluate("theme=>{document.documentElement.dataset.theme=theme;document.documentElement.classList.toggle('dark',theme==='dark')}",theme)
   for section,label in [('home','نمای کلی' if locale=='fa' else 'Overview'),('graph','روابط' if locale=='fa' else 'Relationships'),('orders','سفارش‌ها' if locale=='fa' else 'Orders')]:
    view(page,label)
    for width in [320,390,768,1024,1440,1920]:
     page.set_viewport_size({'width':width,'height':1000});page.wait_for_timeout(40);fits(page,(section,locale,theme,width));layouts.append([section,locale,theme,width,'ready'])
    page.set_viewport_size({'width':320,'height':900})
    for state in ['loading','empty','error']:
     page.get_by_label('حالت نمایش' if locale=='fa' else 'Display state').select_option(state);fits(page,(section,locale,theme,state));expect(page.locator('[data-view-state]')).to_have_attribute('data-view-state',state);layouts.append([section,locale,theme,320,state])
    page.get_by_label('حالت نمایش' if locale=='fa' else 'Display state').select_option('ready')
   if locale=='fa':
    view(page,'نمای کلی');page.set_viewport_size({'width':1440,'height':1100})
    if theme=='dark':page.wait_for_timeout(220);page.screenshot(path='qa/workspace-preview-home-dark.png',full_page=True)
    page.set_viewport_size({'width':390,'height':950})
    if theme=='light':page.wait_for_timeout(220);page.screenshot(path='qa/workspace-preview-mobile.png',full_page=True)
   else:
    view(page,'Overview');page.set_viewport_size({'width':1440,'height':1100})
    if theme=='dark':page.wait_for_timeout(220);page.screenshot(path='qa/workspace-preview-en-dark.png',full_page=True)
 check('108 layout/state cases across FA/EN, light/dark and 320–1920px')
 page.set_viewport_size({'width':320,'height':1000});page.add_style_tag(content='html{font-size:200% !important}')
 for name in ['Overview','Relationships','Orders']:
  view(page,name);fits(page,('200% text',name))
 check('All three views reflow with 200% text at 320 CSS pixels')
 page.emulate_media(reduced_motion='reduce');view(page,'Overview');assert page.locator('[data-view-state]').evaluate('element=>element.getAnimations().length')==0
 assert not writes,writes;assert not errors,errors;assert not bad,bad
 check('Reduced motion; zero preview mutations, browser exceptions or HTTP 5xx')
 context.close()
 # The shared exam login popup is minimal too.
 context=browser.new_context();page=context.new_page();page.goto(BASE+'/analyzers/casio-ss');page.get_by_role('button',name='شروع کن',exact=True).click();expect(page.get_by_role('dialog')).to_be_visible();assert 'شماره را بگذار' not in page.get_by_role('dialog').inner_text();context.close()
 check('Exam popup no longer repeats the removed explanation')
 browser.close()
Path('qa/workspace-preview-browser-results.json').write_text(json.dumps({'passed':True,'checks':checks,'layout_cases':len(layouts),'cases':layouts,'browser_errors':errors,'http_5xx':bad,'preview_writes':writes,'data':'explicit sample fixtures','production_build':True},ensure_ascii=False,indent=2))
