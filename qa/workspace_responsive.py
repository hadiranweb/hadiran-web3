from playwright.sync_api import sync_playwright, expect
BASE='http://127.0.0.1:3000'
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);c=b.new_context();c.request.post(BASE+'/api/auth/otp/verify',data={'phone':'09121234567','code':'123456'});page=c.new_page()
 for language in ['fa','en']:
  c.add_cookies([{'name':'hadiran-workspace-locale','value':language,'url':BASE}])
  for width in [320,390,768,1024,1440]:
   page.set_viewport_size({'width':width,'height':900})
   for route in ['','/knowledge','/projects','/collaborations','/shop','/settings','/capture']:
    page.goto(BASE+'/workspace'+route);page.wait_for_selector('.ws-page');
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(language,width,route,page.evaluate('[document.documentElement.scrollWidth,innerWidth]'))
  print(language,'all 7 workspace routes fit 5 viewport widths')
 page.goto(BASE+'/workspace/settings');page.locator('.ws-topbar .theme-trigger').click();page.locator('.ws-topbar .theme-option').filter(has_text='System').click();page.locator('.ws-topbar .theme-trigger').click()
 page.emulate_media(color_scheme='dark');expect(page.locator('html')).to_have_attribute('data-theme','dark')
 page.emulate_media(color_scheme='light');expect(page.locator('html')).to_have_attribute('data-theme','light')
 print('System theme follows device changes')
 for width in [320,390,768,1024,1440]:
  page.set_viewport_size({'width':width,'height':900});page.goto(BASE+'/');page.wait_for_selector('.site-header');
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),('public',width,page.evaluate('[document.documentElement.scrollWidth,innerWidth]'))
 print('Public home fits 5 viewport widths')
 b.close()
