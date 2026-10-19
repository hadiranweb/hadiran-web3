"""Actual no-database UI, distinct from the injected unit failure."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
B='http://127.0.0.1:3001';errors=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(args=['--no-sandbox']);p=browser.new_page(viewport={'width':375,'height':950});p.on('pageerror',lambda e:errors.append(str(e)));p.goto(B+'/signin?next=/workspace/network');p.get_by_role('textbox',name='شمارهٔ موبایل').fill('09121234567');p.get_by_role('button',name='ارسال کد',exact=True).click();p.get_by_role('textbox',name='کد پیامک‌شده').fill('123456');p.get_by_role('button',name='ورود',exact=True).click();expect(p.locator('.ng-home')).to_have_attribute('data-source','preview');expect(p.locator('[data-network-code]')).to_have_count(0);expect(p.locator('.ng-search input')).to_be_disabled();expect(p.locator('.ng-caption')).to_contain_text('—');assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;browser.close()
Path('qa/network-unavailable-browser-results.json').write_text(json.dumps({'passed':True,'checks':['Real no-DB owner UI has unknown counts, no synthetic nodes, disabled search and no browser errors']},indent=2))
print('PASS Real no-DB UI is unknown, not zero or a sample graph')
