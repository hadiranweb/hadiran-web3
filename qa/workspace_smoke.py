import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
BASE='http://127.0.0.1:3000'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1040},color_scheme='light')
 page=context.new_page()
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/workspace'); expect(page).to_have_url(__import__('re').compile('/signin'))
 assert context.request.patch(BASE+'/api/workspace/collaborations/1',data={'status':'accepted'}).status==401
 response=context.request.post(BASE+'/api/auth/otp/verify',data={'phone':'09121234567','code':'123456'})
 assert response.ok,response.text()
 page.goto(BASE+'/workspace'); expect(page.locator('h1')).to_have_text('میز کار')
 assert page.locator('.site-header').count()==0
 assert page.locator('.site-footer').count()==0
 sidebar=page.locator('.ws-sidebar').bounding_box(); assert sidebar['x']>1000,sidebar
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='qa/workspace-fa-light.png',full_page=True)
 # Collapse persists.
 page.locator('.ws-collapse').click(); expect(page.locator('.ws-shell')).to_have_class(__import__('re').compile('ws-is-collapsed'))
 page.reload(); expect(page.locator('.ws-shell')).to_have_class(__import__('re').compile('ws-is-collapsed'))
 page.locator('.ws-collapse').click()
 # English mirrors sidebar and persists through reload.
 page.locator('.ws-language').click(); expect(page.locator('h1')).to_have_text('Overview')
 assert page.locator('.ws-sidebar').bounding_box()['x']==0
 page.reload(); expect(page.locator('h1')).to_have_text('Overview'); assert page.locator('html').get_attribute('dir')=='ltr'
 # Dark selection.
 page.locator('.ws-topbar .theme-trigger').click(); page.locator('.ws-topbar .theme-option').filter(has_text='Dark').click()
 expect(page.locator('html')).to_have_attribute('data-theme','dark')
 page.locator('.ws-topbar .theme-trigger').click()
 page.screenshot(path='qa/workspace-en-dark.png',full_page=True)
 page.locator('.ws-language').click()
 # Knowledge search, edit in shell, create and persistent browser record.
 page.locator('.ws-navigation a[href="/workspace/knowledge"]').click(); expect(page.locator('h1')).to_contain_text('دانشنامه')
 page.get_by_role('textbox',name='جست‌وجو در رکوردها').fill('معماری'); expect(page.locator('.ws-table tbody tr')).to_have_count(1)
 page.get_by_role('textbox',name='جست‌وجو در رکوردها').fill('not-found'); expect(page.get_by_role('heading',name='چیزی پیدا نشد')).to_be_visible()
 page.get_by_role('button',name='پاک‌کردن فیلترها').click()
 page.get_by_role('button',name='کارت',exact=True).click(); expect(page.locator('.ws-record-card')).to_have_count(4)
 page.locator('.ws-card-title').first.click(); expect(page.locator('dialog[open]')).to_be_visible()
 page.get_by_role('link',name='ویرایش یادداشت').click(); expect(page.locator('h1')).to_have_text('ویرایش یادداشت')
 page.get_by_label('عنوان فارسی').fill('یادداشت ویرایش شده')
 page.get_by_role('button',name='ذخیره آزمایشی',exact=True).click(); expect(page.get_by_role('status')).to_contain_text('در این مرورگر ذخیره شد')
 page.get_by_role('link',name='دیدن فهرست').click(); expect(page.locator('.ws-table')).to_contain_text('یادداشت ویرایش شده')
 page.locator('.ws-quick-new').click(); expect(page.locator('h1')).to_have_text('یادداشت جدید')
 page.get_by_label('عنوان فارسی').fill('یادداشت تست مرورگر'); page.get_by_label('متن یادداشت').fill('## تست\nمحتوای آزمایشی برای کنترل عملکرد ذخیره‌سازی.')
 page.get_by_role('button',name='ذخیره آزمایشی',exact=True).click(); expect(page.get_by_role('status')).to_contain_text('در این مرورگر ذخیره شد')
 page.get_by_role('link',name='دیدن فهرست').click(); expect(page).to_have_url(BASE+'/workspace/knowledge'); page.reload(); expect(page.locator('.ws-table')).to_contain_text('یادداشت تست مرورگر')
 # Product create/edit/search, survives reload.
 page.locator('.ws-navigation a[href="/workspace/shop"]').click()
 page.get_by_role('button',name='محصول جدید',exact=True).click()
 page.get_by_label('نام محصول',exact=False).first.fill('بستهٔ تست مرورگر')
 page.locator('input[name="price"]').fill('420000')
 page.get_by_role('button',name='ذخیره آزمایشی',exact=True).click()
 expect(page.locator('.ws-table')).to_contain_text('بستهٔ تست مرورگر')
 page.reload(); expect(page.locator('.ws-table')).to_contain_text('بستهٔ تست مرورگر')
 page.get_by_role('button',name='ویرایش: بستهٔ تست مرورگر').click()
 page.locator('input[name="title"]').fill('محصول ویرایش شده')
 page.get_by_role('button',name='ذخیره آزمایشی',exact=True).click(); expect(page.locator('.ws-table')).to_contain_text('محصول ویرایش شده')
 # Kanban and collaboration state.
 page.locator('.ws-navigation a[href="/workspace/projects"]').click(); page.get_by_role('button',name='کانبان',exact=True).click(); expect(page.locator('.ws-kanban-column')).to_have_count(3)
 page.locator('.ws-navigation a[href="/workspace/collaborations"]').click(); page.locator('.ws-table-name').first.click()
 page.locator('dialog[open] select').select_option('accepted'); expect(page.locator('.ws-success')).to_contain_text('به‌روز شد')
 page.locator('dialog[open]').get_by_role('button',name='بستن',exact=True).click(); page.reload(); expect(page.locator('.ws-table')).to_contain_text('پذیرفته')
 # Settings and module search.
 page.locator('.ws-navigation a[href="/workspace/settings"]').click(); page.get_by_label('زبان رابط کاربری',exact=True).select_option('en'); expect(page.locator('h1')).to_have_text('Settings')
 page.keyboard.press('Control+k'); expect(page.locator('.ws-search-dialog')).to_be_visible(); page.get_by_role('textbox',name='Search modules').fill('products'); expect(page.locator('.ws-search-results a')).to_have_count(1); page.locator('.ws-search-results a').click(); expect(page.locator('h1')).to_contain_text('Products')
 # Mobile navigation and no horizontal page overflow.
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),page.evaluate('[document.documentElement.scrollWidth,innerWidth]')
 page.locator('.ws-mobile-toggle').click(); expect(page.locator('.ws-sidebar')).to_be_visible(); page.screenshot(path='qa/workspace-mobile-menu.png',full_page=True)
 page.keyboard.press('Escape'); expect(page.locator('.ws-shell')).not_to_have_class(__import__('re').compile('ws-mobile-open'))
 page.locator('.ws-mobile-toggle').click(); page.locator('.ws-navigation a[href="/workspace"]').click(); expect(page.locator('h1')).to_have_text('Overview')
 page.screenshot(path='qa/workspace-mobile.png',full_page=True)
 # Return to public site restores Persian direction and chrome.
 page.locator('.ws-mobile-toggle').click(); page.get_by_role('link',name='View website',exact=True).click(); expect(page.locator('.site-header')).to_be_visible(); expect(page.locator('html')).to_have_attribute('dir','rtl')
 # Logout and access protection.
 page.goto(BASE+'/workspace'); page.set_viewport_size({'width':1440,'height':1040}); page.get_by_role('button',name='Sign out',exact=True).click(); expect(page).to_have_url(__import__('re').compile('/signin'))
 page.goto(BASE+'/workspace/shop'); expect(page).to_have_url(__import__('re').compile('/signin'))
 assert not errors,errors
 print(json.dumps({'status':'passed','checks':['auth guard','RTL/LTR','sidebar persistence','theme','notes create/edit','products create/edit','search/filter','project kanban','collaboration status','settings','module search','mobile layout','public chrome restored','logout'],'browser_errors':errors},ensure_ascii=False,indent=2))
 browser.close()
