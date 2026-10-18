"""QA for upstream 648b623. Local disposable DB only; no external Telegram requests."""
import json, os, subprocess, time, urllib.request, urllib.error
from pathlib import Path
BASE=os.getenv('QA_BASE','http://127.0.0.1:3002')
assert BASE.startswith('http://127.0.0.1:'), 'Local QA only'
DB='postgresql://hadiran_qa:local-qa-only@127.0.0.1:5432/hadiran_integration_qa'
checks=[]
def check(name):checks.append(name);print('PASS',name,flush=True)
def sql(query,args=None):
 code="const {Client}=require('pg');let c=new Client({connectionString:process.env.DATABASE_URL});(async()=>{await c.connect();console.log(JSON.stringify((await c.query(JSON.parse(process.argv[1]),JSON.parse(process.argv[2]))).rows));})().finally(()=>c.end());"
 return json.loads(subprocess.check_output(['node','-e',code,json.dumps(query),json.dumps(args or [])],env={**os.environ,'DATABASE_URL':DB},text=True))
class Client:
 def __init__(self):self.cookie=''
 def call(self,path,method='GET',body=None,expected=200):
  h={'Content-Type':'application/json'}
  if self.cookie:h['Cookie']=self.cookie
  req=urllib.request.Request(BASE+path,data=None if body is None else json.dumps(body).encode(),headers=h,method=method)
  try:r=urllib.request.urlopen(req)
  except urllib.error.HTTPError as e:r=e
  raw=r.read().decode();assert r.status==expected,(method,path,r.status,expected,raw[:350])
  if r.headers.get('Set-Cookie'):self.cookie=r.headers['Set-Cookie'].split(';')[0]
  try:return json.loads(raw)
  except:return raw
 def login(self,phone):
  return self.call('/api/auth/password/login','POST',{'phone':phone,'password':'Integration-QA-2026'})
# Three dedicated fixtures; never alter production or reset existing regression evidence.
for phone,role in [('09121110001','author'),('09121110002','member'),('09121110003','owner')]:
 sql("INSERT INTO accounts(phone,role,password_hash,phone_verified_at,given_name,family_name,policies_accepted_at,policies_version,onboarding_completed_at) SELECT $1,$2::account_role,password_hash,NOW(),'آزمون','همگام‌سازی',NOW(),policies_version,NOW() FROM accounts WHERE phone='09121234567' ON CONFLICT(phone) DO NOTHING",[phone,role])
owner,author,member,secondOwner,anon=[Client() for _ in range(5)]
owner.login('09121234567');author.login('09121110001');member.login('09121110002');secondOwner.login('09121110003')
assert author.call('/api/auth/me')['account']['role']=='author'
check('Author role survives real password login and JWT session hydration')
for path in ['/api/workspace/bots','/api/workspace/discounts','/api/workspace/network','/api/workspace/referrals','/api/workspace/analyzers/casio-ss/attempts','/api/workspace/analyzers/casio-ss/grants','/api/account/referral']:
 anon.call(path,expected=401)
for path in ['/api/workspace/bots','/api/workspace/discounts','/api/workspace/network','/api/workspace/analyzers/casio-ss/grants','/api/workspace/shop/listings','/api/workspace/records']:
 author.call(path,expected=403)
for path in ['/api/workspace/analyzers','/api/workspace/referrals']:member.call(path,expected=403)
check('Anonymous, member, author and owner API role boundaries')
assert 'تحلیلگرها' in author.call('/workspace/analyzers')
assert 'کسانی که' in author.call('/workspace/referrals')
# urllib follows owner-page redirects; author lands in own analyzer list, never owner data.
assert 'آزمون تازه' in author.call('/workspace/projects')
check('Author can enter the existing RTL workspace shell; owner-only pages redirect safely')
nonce=str(int(time.time()));slug='sync-qa-'+nonce;private='sync-private-'+nonce
owner.call('/api/workspace/analyzers','POST',{'slug':slug,'nameFa':'آزمون همگام‌سازی جدید'})
owner.call('/api/workspace/analyzers','POST',{'slug':private,'nameFa':'آزمون خصوصی مالک'})
pack=owner.call('/api/workspace/analyzers/'+slug)['pack']
pack['sections'][0]['items']=[{'id':'QA.1','kind':'range','text':'آمادگی شما؟','reverse':False,'anchors':{'0':'کم','5':'میانه','10':'زیاد'}}]
pack['formulas']=[{'id':'qa-mean','op':'mean','of':['QA.1']}]
owner.call('/api/workspace/analyzers/'+slug,'PUT',pack)
author.call('/api/workspace/analyzers/'+slug,expected=403)
author.call('/api/workspace/analyzers/'+slug+'/attempts',expected=403)
code=author.call('/api/account/referral')['publicCode']
owner.call('/api/workspace/analyzers/'+slug+'/grants','POST',{'publicCode':code})
access=author.call('/api/workspace/analyzers/'+slug)
assert access['canEdit'] and access['canReadResponses'] and not access['canGrant']
assert slug in [x['slug'] for x in author.call('/api/workspace/analyzers')['authored']]
assert private not in [x['slug'] for x in author.call('/api/workspace/analyzers')['authored']]
check('Owner grants an analyzer by public code; author sees only accessible packs')
pack['status']='open';author.call('/api/workspace/analyzers/'+slug,'PUT',pack)
newslug='sync-author-'+nonce
author.call('/api/workspace/analyzers','POST',{'slug':newslug,'nameFa':'آزمون خود نویسنده'})
assert author.call('/api/workspace/analyzers/'+newslug)['canEdit']
check('Granted editing and author-owned analyzer creation persist')
# Direct fixture of reduced permissions verifies upstream access flags independently.
aid=author.call('/api/auth/me')['account']['id']
sql('UPDATE analyzer_grants SET can_edit=false,can_read_responses=false WHERE slug=$1 AND account_id=$2',[slug,aid])
assert not author.call('/api/workspace/analyzers/'+slug)['canEdit']
author.call('/api/workspace/analyzers/'+slug,'PUT',pack,expected=403)
author.call('/api/workspace/analyzers/'+slug+'/attempts',expected=403)
owner.call('/api/workspace/analyzers/'+slug+'/grants','POST',{'publicCode':code})
check('Read-only grants reject writes and response access at the server')
ownerCode=owner.call('/api/account/referral')['publicCode'];memberCode=member.call('/api/account/referral')['publicCode']
member.call('/api/account/referral','POST',{'referralCode':memberCode},expected=400)
member.call('/api/account/referral','POST',{'referralCode':ownerCode})
assert member.call('/api/account/referral')['referredBy']==ownerCode
owner.call('/api/account/referral','POST',{'referralCode':memberCode},expected=400)
member.call('/api/account/referral','POST',{'referralCode':code})
assert member.call('/api/account/referral')['referredBy']==ownerCode
assert memberCode in json.dumps(owner.call('/api/workspace/referrals'))
assert memberCode not in json.dumps(author.call('/api/workspace/referrals'))
assert memberCode in json.dumps(owner.call('/api/workspace/network'))
check('Referrer self/cycle rejection, immutable attribution and personal referral isolation')
discount='SYNC'+nonce
owner.call('/api/workspace/discounts','POST',{'code':'12345678','value':10},expected=400)
owner.call('/api/workspace/discounts','POST',{'code':discount,'value':101},expected=400)
owner.call('/api/workspace/discounts','POST',{'code':discount,'value':15,'scope':'analyzer','analyzerSlug':slug,'maxUses':3})
owner.call('/api/workspace/discounts','POST',{'code':discount,'value':15},expected=409)
check('Discount validation, analyzer scope and duplicate rejection')
member.call('/api/analyzers/'+slug,'POST',{'action':'consent','referralCode':ownerCode,'discountCode':discount})
member.call('/api/analyzers/'+slug,'POST',{'action':'answer','id':'QA.1','value':7})
result=member.call('/api/analyzers/'+slug,'POST',{'action':'submit'})['attempt']
assert result['results']['scores']['qa-mean']==7
rows=author.call('/api/workspace/analyzers/'+slug+'/attempts')['items']
assert len(rows)==1 and rows[0]['discountCode']==discount and rows[0]['referrerPublicCode']==ownerCode
check('Live respondent answers, scores, referral and discount metadata visible only with response permission')
owner.call('/api/workspace/discounts','PATCH',{'code':discount,'active':False})
author.call('/api/analyzers/'+slug,'POST',{'action':'consent','discountCode':discount},expected=400)
check('Disabled discounts cannot be redeemed')
owner.call('/api/workspace/analyzers/'+slug+'/grants','DELETE',{'publicCode':code})
author.call('/api/workspace/analyzers/'+slug,expected=403)
author.call('/api/workspace/analyzers/'+slug+'/attempts',expected=403)
assert author.call('/api/workspace/analyzers/'+newslug)['canEdit']
check('Grant revocation applies immediately without removing author-owned work')
owner.call('/api/workspace/bots','POST',{'titleFa':'ا'},expected=400)
bot=owner.call('/api/workspace/bots','POST',{'titleFa':'ربات آزمون بدون اتصال','analyzerSlug':slug})['bot'];bid=bot['id']
assert bot['status']=='disconnected' and not bot['hasToken']
assert bid not in [b['id'] for b in secondOwner.call('/api/workspace/bots')['items']]
secondOwner.call('/api/workspace/bots/'+bid,expected=404)
secondOwner.call('/api/workspace/bots/'+bid,'PATCH',{'titleFa':'ممنوع'},expected=404)
owner.call('/api/workspace/bots/'+bid,'PATCH',{'titleFa':'عنوان ویرایش‌شده'})
assert owner.call('/api/workspace/bots/'+bid)['bot']['titleFa']=='عنوان ویرایش‌شده'
check('Bot create/edit/list use owner isolation; tokens are not returned')
# Missing token/public HTTPS preconditions reject before outbound fetch; no live Telegram call.
owner.call('/api/workspace/bots/'+bid+'/connect','POST',{},expected=400)
anon.call('/api/bots/telegram/'+bid+'/webhook','POST',{'update_id':1},expected=401)
owner.call('/api/workspace/bots/'+bid,'DELETE',{})
owner.call('/api/workspace/bots/'+bid,expected=404)
check('Unauthenticated webhook and unconfigured connection rejected; local bot deletion')
Path('qa/sync-upstream-api-results.json').write_text(json.dumps({'upstream':'648b623515a21aa6f3bf2de3954080d4c50353e2','passed':True,'checks':checks,'external_telegram_tested':False},ensure_ascii=False,indent=2))
print('PASS',len(checks),'groups')
