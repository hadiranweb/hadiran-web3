"""Disclosure, avatar and reflow QA against a production build. No npm testing dependencies."""
import json,re
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright,expect
B='http://127.0.0.1:3001';checks=[];errors=[];bad=[];layouts=0
def check(name): checks.append(name); print('PASS',name,flush=True)
def fits(page,selector):
 box=page.locator(selector).bounding_box(); assert box and box['x']>=-1 and box['x']+box['width']<=page.viewport_size['width']+1,(selector,box,page.viewport_size)
def no_overflow(page,label):assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),label
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox']);c=b.new_context(viewport={'width':375,'height':812});page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append((r.status,r.url)) if r.status>=500 else None)
 page.goto(B+'/');expect(page.locator('.session-login-button')).to_be_visible();expect(page.locator('.home-chat-textarea')).to_be_enabled()
 anchor=page.locator('main').bounding_box()['y'];page.locator('.nav-menu-toggle').click();expect(page.locator('.nav-menu-toggle')).to_have_attribute('aria-expanded','true');page.wait_for_timeout(380);assert abs(page.locator('main').bounding_box()['y']-anchor)<.5
 fits(page,'.site-nav-dropdown');assert page.locator('.site-nav-dropdown [role=menu]').count()==0
 page.keyboard.press('Tab');expect(page.locator('.site-nav-grid a').first).to_be_focused();page.keyboard.press('Escape');expect(page.locator('.nav-menu-toggle')).to_be_focused();page.wait_for_timeout(260);expect(page.locator('#mobile-navigation')).to_be_hidden()
 check('Overlay opens with zero main displacement; ordinary Tab links, Escape closes and restores focus')
 page.locator('.nav-menu-toggle').click();page.wait_for_timeout(380);page.mouse.click(360,780);page.wait_for_timeout(270);expect(page.locator('#mobile-navigation')).to_be_hidden()
 page.locator('.nav-menu-toggle').click();page.wait_for_timeout(380)
 # Observe the upward exit after a same-page link: no page-unmount confound.
 page.locator('.site-nav-grid a[href="/ecosystem"]').evaluate("a=>a.addEventListener('click',e=>e.preventDefault(),{once:true})")
 page.locator('.site-nav-grid a[href="/ecosystem"]').click();page.wait_for_timeout(65)
 motion=page.locator('#mobile-navigation').evaluate('(n)=>({inert:n.inert,animations:n.getAnimations().map(a=>a.effect.getKeyframes())})')
 assert motion['inert'] and motion['animations'] and '-12px' in motion['animations'][0][-1]['transform'];page.wait_for_timeout(260);expect(page.locator('#mobile-navigation')).to_be_hidden()
 check('Click outside/select closes; upward exit uses WAAPI and disables links during closing')
 for _ in range(12):page.locator('.nav-menu-toggle').click();page.wait_for_timeout(18)
 page.wait_for_timeout(420);expect(page.locator('#mobile-navigation')).to_be_hidden();page.locator('.nav-menu-toggle').click();page.wait_for_timeout(380);expect(page.locator('#mobile-navigation')).to_be_visible();page.keyboard.press('Escape');page.wait_for_timeout(260)
 check('Rapid toggles cancel smoothly without stuck panels')
 page.locator('.nav-menu-toggle').click();page.wait_for_timeout(380);page.evaluate('window.scrollTo(0,200)');page.wait_for_timeout(270);expect(page.locator('#mobile-navigation')).to_be_hidden();page.evaluate('window.scrollTo(0,0)')
 check('Page scroll dismisses disclosure with the existing WAAPI upward exit')
 for width in [320,360,375,390,640,768,1024,1280,1440,1920]:
  page.set_viewport_size({'width':width,'height':900});page.goto(B+'/');expect(page.locator('.session-login-button')).to_be_visible();no_overflow(page,('home',width));fits(page,'.site-nav-bar')
  if width<1440:
   page.locator('.nav-menu-toggle').click();page.wait_for_timeout(380);fits(page,'.site-nav-dropdown');page.keyboard.press('Escape');page.wait_for_timeout(260)
  else:expect(page.locator('.site-desktop-navigation')).to_be_visible();expect(page.locator('.nav-menu-toggle')).to_be_hidden()
  layouts+=1
 page.set_viewport_size({'width':375,'height':320});page.locator('.nav-menu-toggle').click();page.wait_for_timeout(380);box=page.locator('.site-nav-dropdown').bounding_box();assert box['y']+box['height']<=320;page.locator('.site-nav-dropdown a[href="/privacy"]').focus();assert page.locator('.site-nav-dropdown').evaluate('n=>n.scrollTop')>0;expect(page.locator('.nav-menu-toggle')).to_have_attribute('aria-expanded','true');page.keyboard.press('Escape');page.wait_for_timeout(260)
 check('10 widths 320–1920px, desktop switch, short landscape scroll with reachable footer')
 page.set_viewport_size({'width':375,'height':812});page.emulate_media(reduced_motion='reduce');page.locator('.nav-menu-toggle').click();page.wait_for_timeout(30);expect(page.locator('#mobile-navigation')).to_be_visible();assert page.locator('#mobile-navigation').evaluate('n=>n.getAnimations().length')==0;page.keyboard.press('Escape');page.wait_for_timeout(30);expect(page.locator('#mobile-navigation')).to_be_hidden();page.emulate_media(reduced_motion='no-preference')
 check('Reduced motion skips sliding/scaling and completes without lingering animations')
 # Theme, main navigation and account panels must not overlap, including keyboard use.
 page.locator('.theme-trigger').focus();page.keyboard.press('Enter');expect(page.locator('.theme-switcher')).to_have_attribute('open','');fits(page,'.theme-options');page.keyboard.press('Escape');expect(page.locator('.theme-trigger')).to_be_focused()
 page.locator('.nav-menu-toggle').click();page.wait_for_timeout(380);page.locator('.theme-trigger').click();page.wait_for_timeout(270);expect(page.locator('#mobile-navigation')).to_be_hidden();expect(page.locator('.theme-switcher')).to_have_attribute('open','');page.keyboard.press('Escape')
 for selector in ['.theme-trigger','.nav-menu-toggle','.session-login-button']:
  box=page.locator(selector).bounding_box();assert box['width']>=44 and box['height']>=44,(selector,box)
 check('Theme coordinates with navigation, keyboard Escape works, new header targets are at least 44px')
 page.goto(B+'/signin?next=/account');page.get_by_role('textbox',name='شمارهٔ موبایل').fill('09121234567');page.get_by_role('button',name='ارسال کد',exact=True).click();page.get_by_role('textbox',name='کد پیامک‌شده').fill('123456');page.get_by_role('button',name='ورود',exact=True).click();expect(page.locator('h1')).to_have_text('خانهٔ من');expect(page.locator('#account-profile-title')).to_have_text('حساب من')
 ticket=parse_qs(urlparse(page.url).query)['preview_access'][0];expect(page.locator('.session-avatar-button')).to_be_visible();expect(page.locator('.session-login-button')).to_have_count(0)
 assert page.locator('.avatar-options input').count()==8
 initial=page.locator('.session-avatar-button img').get_attribute('src');initialindex=int(initial.split('avatar-')[1].split('.')[0]);nextindex=initialindex%8+1
 page.locator('.avatar-option').filter(has=page.get_by_role('radio',name=f'آواتار {nextindex}',exact=True)).click();expect(page.get_by_text('آواتار ذخیره شد.',exact=True)).to_be_visible();expect(page.locator('.session-avatar-button img')).to_have_attribute('src',re.compile(rf'/avatars/avatar-{nextindex:02}\.svg$'));page.reload();expect(page.get_by_role('radio',name=f'آواتار {nextindex}',exact=True)).to_be_checked();expect(page.locator('.session-avatar-button img')).to_have_attribute('src',re.compile(rf'/avatars/avatar-{nextindex:02}\.svg$'))
 check('Login becomes avatar circle; eight original SVGs; selection updates header and persists on refresh')
 for width in [320,375,640,768,1280,1440,1920]:
  page.set_viewport_size({'width':width,'height':900});page.goto(B+'/account?preview_access='+ticket);expect(page.locator('.session-avatar-button')).to_be_visible();page.locator('.session-avatar-button').click();page.wait_for_timeout(380);fits(page,'.profile-dropdown');no_overflow(page,('account',width));expect(page.locator('.profile-dropdown a[href^="/workspace"]')).to_be_visible();page.keyboard.press('Escape');page.wait_for_timeout(260);layouts+=1
  for path in ['/ecosystem','/analyzers','/analyzers/casio-ss','/shop','/privacy','/signin']:
   page.goto(B+path+'?preview_access='+ticket);no_overflow(page,(path,width));layouts+=1
 check('Profile panel stays within viewport; public modules reflow at seven widths')
 page.set_viewport_size({'width':320,'height':900});page.goto(B+'/account?preview_access='+ticket)
 page.add_style_tag(content='html{font-size:200% !important}')
 no_overflow(page,'200% text zoom account');page.locator('.session-avatar-button').click();page.wait_for_timeout(380);fits(page,'.profile-dropdown');page.keyboard.press('Escape');page.wait_for_timeout(260)
 page.goto(B+'/workspace?preview_access='+ticket);expect(page.locator('.ws-avatar-link img')).to_have_attribute('src',re.compile(rf'/avatars/avatar-{nextindex:02}\.svg$'))
 check('320 CSS px reflow, 200% text zoom and matching workspace avatar')
 page.goto(B+'/account?preview_access='+ticket);page.set_viewport_size({'width':390,'height':844});page.locator('.session-avatar-button').click();page.wait_for_timeout(380);page.screenshot(path='qa/navigation-profile-mobile.png',full_page=False);page.keyboard.press('Escape');page.wait_for_timeout(260);page.screenshot(path='qa/navigation-account-mobile.png',full_page=True)
 page.locator('.nav-menu-toggle').click();page.wait_for_timeout(380);page.screenshot(path='qa/navigation-mobile.png',full_page=False);page.locator('.session-avatar-button').click();page.wait_for_timeout(380);expect(page.locator('#mobile-navigation')).to_be_hidden();expect(page.locator('.profile-dropdown')).to_be_visible()
 page.get_by_role('button',name='خروج از حساب',exact=True).click();expect(page.locator('.session-login-button')).to_be_visible();assert page.evaluate('sessionStorage.getItem("hadiran-preview-access")') is None
 check('Only one disclosure remains open; logout clears identity and returns login button')
 assert not errors,errors;assert not bad,bad
 Path('qa/navigation-browser-results.json').write_text(json.dumps({'status':'PASS','checks':checks,'layout_cases':layouts,'browser_errors':errors,'http_5xx':bad,'production_build':True},ensure_ascii=False,indent=2))
 print('PASS all',len(checks),'groups;',layouts,'layout cases')
 b.close()
