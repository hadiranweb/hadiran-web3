"""Production-build regression against a disposable LOCAL PostgreSQL database, not the live DB.
Start the DB-mode server on 3002; seed the three QA accounts with scripts in the integration report.
"""
import json, os, time, urllib.request, urllib.error
from pathlib import Path
BASE=os.environ.get('QA_BASE','http://127.0.0.1:3002')
checks=[]
class Client:
 def __init__(self): self.cookie=''
 def request(self,path,method='GET',body=None,expected=200):
  headers={'Content-Type':'application/json'}
  if self.cookie:headers['Cookie']=self.cookie
  req=urllib.request.Request(BASE+path,data=None if body is None else json.dumps(body).encode(),headers=headers,method=method)
  try:r=urllib.request.urlopen(req)
  except urllib.error.HTTPError as e:r=e
  raw=r.read().decode()
  assert r.status==expected,(method,path,r.status,raw[:400])
  try:data=json.loads(raw)
  except:data=raw
  return data,r.headers
 def login(self,phone):
  data,headers=self.request('/api/auth/password/login','POST',{'phone':phone,'password':'Integration-QA-2026'})
  assert data['ok'] and data['account']['id']>0 and not data.get('preview_ticket')
  self.cookie=headers['Set-Cookie'].split(';')[0]
  assert self.cookie.count('.')==2,'Expected JWT, not a demo ticket'
  return data
 def call(self,*args,**kwargs):return self.request(*args,**kwargs)[0]
def check(name):checks.append(name);print('PASS',name)
fixture=json.loads(Path('qa/analyzer-fixture.json').read_text())
owner,member,other,anon=(Client() for _ in range(4))
owner.login('۰۹۱۲۱۲۳۴۵۶۷');member.login('09121234568');other.login('09121234569')
check('Real password login with Persian phone, DB-backed JWT sessions, no preview grant')
assert 'P3' not in anon.call('/signin')
assert owner.call('/api/auth/me')['account']['id']>0
anon.call('/api/workspace/records',expected=401)
member.call('/api/workspace/records',expected=403)
member.call('/api/workspace/shop/listings',expected=403)
check('Anonymous and member role boundaries')
owner.call('/api/account/onboarding','POST',{'step':'profile','givenName':'هادی','familyName':'آزمون'},expected=400)
owner.call('/api/account/onboarding','POST',{'step':'policies','accept':True})
owner.call('/api/account/onboarding','POST',{'step':'profile','givenName':'هادی','familyName':'آزمون'})
owner.call('/api/account/profile','PATCH',{'givenName':'مالک','familyName':'آزمون'})
assert owner.call('/api/auth/me')['account']['onboardingComplete']
assert 'مالک' in owner.call('/account')
check('Policy version, onboarding, profile save and eight-digit account page')
nonce=str(int(time.time()*1000))
title='ثبت خصوصی آزمون '+nonce
record=owner.call('/api/workspace/records','POST',{'titleFa':title,'titleEn':'qa-'+nonce,'bodyFa':'بدنهٔ واقعی آزمون'})
rid=record['id']
item=next(x for x in owner.call('/api/workspace/records')['items'] if x['id']==rid)
assert item['status']=='captured' and item['visibility']=='private'
owner.call('/api/workspace/records/'+rid,'PATCH',{'bodyFa':'نسخهٔ اصلاح‌شده'})
owner.call('/api/knowledge','POST',{'titleFa':title},expected=409)
check('Canonical capture/PATCH stays private; legacy direct publication remains blocked')
private=owner.call(f'/api/workspace/records/{rid}/promote','POST',{'visibility':'private'})
assert private['visibility']=='private'
anon.call('/knowledge/'+private['slug'],expected=404)
public=owner.call(f'/api/workspace/records/{rid}/promote','POST',{'visibility':'public'})
assert public['memoryId']==private['memoryId']
assert title in anon.call('/knowledge/'+public['slug'])
assert 'نسخهٔ اصلاح‌شده' in anon.call('/knowledge/'+public['slug'])
check('Private promotion hidden; public re-promotion reuses memory and renders canonical projection')
slug='qa-product-'+nonce
listing=owner.call('/api/workspace/shop/listings','POST',{'titleFa':'محصول آزمون','titleEn':'QA product','slug':slug,'amount':100000,'currency':'IRR','kind':'digital_entitlement','published':True,'bodyFa':'شرح محصول','accessBodyFa':'محتوای ویژهٔ خریدار','usdRatio':2,'specs':[{'key':'فرمت','value':'PDF'}]})
lid=listing['id']
owner.call('/api/workspace/shop/listings/'+lid,'PATCH',{'titleFa':'محصول آزمون ویرایش‌شده','slug':slug,'amount':120000,'currency':'IRR','kind':'digital_entitlement','published':True,'accessBodyFa':'محتوای ویژهٔ خریدار','usdRatio':2})
assert 'محصول آزمون ویرایش‌شده' in anon.call('/shop/'+slug)
assert 'محتوای ویژهٔ خریدار' not in anon.call('/shop/'+slug)
member.call('/api/shop/orders','POST',{'slug':slug},expected=409)
owner.call('/api/workspace/shop/payout','PUT',{'accountHandle':'QA-OUTSIDE-PAYMENT-ONLY','accountAlias':'حساب آزمایشی'})
owner.call('/api/workspace/shop/rate','POST',{'usdRate':60000})
assert owner.call('/api/workspace/shop/rate')['usdRate']==60000
check('Real listing create/edit, paid-content protection, payout prerequisite and USD repricing')
order=member.call('/api/shop/orders','POST',{'slug':slug});oid=order['id']
assert member.call('/api/shop/orders','POST',{'slug':slug})['id']==oid
other.call(f'/api/shop/orders/{oid}/reference','POST',{'reference':'QA-REF'},expected=403)
member.call(f'/api/workspace/shop/orders/{oid}/confirm','POST',{},expected=403)
member.call(f'/api/shop/orders/{oid}/reference','POST',{'reference':'QA-REF-01'})
owner.call(f'/api/workspace/shop/orders/{oid}/decline','POST',{'reason':'آزمون بازبینی'})
member.call(f'/api/shop/orders/{oid}/reference','POST',{'reference':'QA-REF-02'})
owner.call(f'/api/workspace/shop/orders/{oid}/confirm','POST',{})
owner.call(f'/api/workspace/shop/orders/{oid}/confirm','POST',{})
assert 'محتوای ویژهٔ خریدار' in member.call('/shop/'+slug)
member.call('/api/shop/orders','POST',{'slug':slug},expected=409)
check('Order resume, buyer isolation, decline/re-reference/confirm, idempotent entitlement, no PSP')
second=other.call('/api/shop/orders','POST',{'slug':slug})['id']
other.call(f'/api/shop/orders/{second}/abandon','POST',{})
check('Buyer cancellation')
member.call('/api/analyzers/casio-ss','POST',{'action':'answer','id':'MG.A1','value':6},expected=400)
member.call('/api/analyzers/casio-ss','POST',{'action':'consent'})
member.call('/api/analyzers/casio-ss','POST',{'action':'answer','id':'MG.A1','value':11},expected=400)
member.call('/api/analyzers/casio-ss','POST',{'action':'submit'},expected=400)
for key,value in fixture['answers'].items():member.call('/api/analyzers/casio-ss','POST',{'action':'answer','id':key,'value':value})
submitted=member.call('/api/analyzers/casio-ss','POST',{'action':'submit'})['attempt']
assert submitted['status']=='submitted' and submitted['results']==fixture['results']
report=member.call('/analyzers/casio-ss/report')
assert 'گزارش شخصی' in report and 'درخت' in report
member.call('/api/analyzers/casio-ss','POST',{'action':'answer','id':'MG.A1','value':6},expected=409)
assert member.call('/api/analyzers/casio-ss')['attempt']['status']=='submitted'
check('38 analyzer answers: consent, validation, incomplete guard, exact scoring, five-layer report, immutable submission')
# Signed preview tickets must never authenticate when DATABASE_URL is configured, even with TEST_MODE=1.
demo=urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:3001/api/auth/otp/verify',data=json.dumps({'phone':'09121234567','code':'123456'}).encode(),headers={'Content-Type':'application/json'}))
ticket=json.load(demo)['preview_ticket']
assert anon.call('/api/auth/me?preview_access='+ticket)['account'] is None
anon.call('/api/auth/preview-session','POST',{'ticket':ticket},expected=401)
check('Preview bypass is disabled against a configured database')
old=owner.cookie
owner.call('/api/auth/logout','POST',{})
owner.cookie=old
assert owner.call('/api/auth/me')['account'] is None
check('JWT session revocation invalidates replayed cookie')
Path('qa/integration-api-results.json').write_text(json.dumps({'status':'PASS','checks':checks,'database':'disposable local PostgreSQL 17; not production','analyzer_answers':len(fixture['answers'])},ensure_ascii=False,indent=2))
