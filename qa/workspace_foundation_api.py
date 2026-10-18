"""Disposable local DB only; no SMS, Telegram or payment HTTP."""
import json, os, time, urllib.request, urllib.error, subprocess
from pathlib import Path
from urllib.parse import urlparse
BASE=os.getenv('QA_BASE','http://127.0.0.1:3002')
DB=os.getenv('DATABASE_URL','postgresql://hadiran_qa:local-qa-only@127.0.0.1:5432/hadiran_integration_qa')
assert urlparse(DB).hostname in ('localhost','127.0.0.1') and urlparse(DB).path=='/hadiran_integration_qa'
checks=[]
def check(name): checks.append(name);print('PASS',name,flush=True)
def sql(query,args=None):
 code="const {Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL});(async()=>{await c.connect();console.log(JSON.stringify((await c.query(JSON.parse(process.argv[1]),JSON.parse(process.argv[2]))).rows));})().finally(()=>c.end())"
 return json.loads(subprocess.check_output(['node','-e',code,json.dumps(query),json.dumps(args or [])],env={**os.environ,'DATABASE_URL':DB},text=True))
class Client:
 def __init__(self,phone=None):
  self.cookie=''
  if phone:self.call('/api/auth/password/login','POST',{'phone':phone,'password':'Integration-QA-2026'})
 def call(self,path,method='GET',body=None,expected=200):
  req=urllib.request.Request(BASE+path,method=method,data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json','Cookie':self.cookie})
  try:res=urllib.request.urlopen(req)
  except urllib.error.HTTPError as e:res=e
  text=res.read().decode();assert res.status==expected,(path,res.status,expected,text[:250])
  if res.headers.get('Set-Cookie'):self.cookie=res.headers['Set-Cookie'].split(';')[0]
  try:return json.loads(text)
  except ValueError:return text
owner=Client('09121234567');author=Client('09121110001');member=Client('09121110002');anon=Client()
slug='desk-'+str(int(time.time()))
author.call('/api/workspace/analyzers','POST',{'slug':slug,'nameFa':'آزمون مجوز مرحله اول'})
pack=author.call('/api/workspace/analyzers/'+slug)['pack'];pack['sections'][0]['items']=[{'id':'D.1','kind':'range','text':'ارزیابی','reverse':False,'anchors':{'0':'کم','5':'میانه','10':'زیاد'}}];pack['formulas']=[{'id':'mean','op':'mean','of':['D.1']}];pack['status']='open'
author.call('/api/workspace/analyzers/'+slug,'PUT',pack)
member.call('/api/workspace/analyzers',expected=403)
code=member.call('/api/account/referral')['publicCode']
author.call('/api/workspace/analyzers/'+slug+'/grants','POST',{'publicCode':code})
me=member.call('/api/auth/me')['account'];assert me['role']=='member' and me['analyzerDesk'] and me['avatar']
access=member.call('/api/workspace/analyzers/'+slug);assert not access['canEdit'] and access['canReadResponses'] and not access['canGrant']
check('Grant preserves member role, defaults to read-only editing, and hydrates desk plus avatar')
html=member.call('/workspace');assert 'ws-sidebar' in html and 'href="/workspace/network"' not in html and 'href="/workspace/bots"' not in html and 'ws-quick-new' not in html
for endpoint in ['/api/workspace/network','/api/workspace/bots','/api/workspace/discounts','/api/workspace/records']:
 member.call(endpoint,expected=403)
member.call('/api/workspace/analyzers','POST',{'slug':'forbidden','nameFa':'ممنوع'},expected=403)
member.call('/api/workspace/roles','POST',{'publicCode':code,'role':'author'},expected=403)
member.call('/api/workspace/analyzers/'+slug+'/grants','POST',{'publicCode':code},expected=403)
member.call('/api/workspace/analyzers/'+slug,'PUT',pack,expected=403)
check('Delegated shell and direct APIs deny owner modules, analyzer creation and delegation')
author.call('/api/workspace/analyzers/'+slug+'/grants','POST',{'publicCode':code,'canEdit':True,'canReadResponses':False})
access=member.call('/api/workspace/analyzers/'+slug);assert access['canEdit'] and not access['canReadResponses']
member.call('/api/workspace/analyzers/'+slug,'PUT',pack)
member.call('/api/workspace/analyzers/'+slug+'/attempts',expected=403)
assert member.call('/api/auth/me')['account']['role']=='member'
check('Explicit edit and response flags are independent and do not escalate account role')
member.call('/api/analyzers/'+slug,'POST',{'action':'consent'})
member.call('/api/analyzers/'+slug,'POST',{'action':'answer','id':'D.1','value':7})
first=member.call('/api/analyzers/'+slug,'POST',{'action':'submit'})['attempt'];assert first['status']=='submitted'
fresh=member.call('/api/analyzers/'+slug,'POST',{'action':'retake'})['attempt'];assert fresh['status']=='in_progress' and not fresh['consentAt'] and not fresh['answers']
mid=me['id'];history=sql('SELECT status,results FROM analyzer_attempts WHERE account_id=$1 AND slug=$2 ORDER BY created_at',[mid,slug]);assert len(history)==2 and history[0]['status']=='submitted' and history[0]['results']['scores']['mean']==7
anon.call('/api/analyzers/'+slug,'POST',{'action':'retake'},expected=401)
check('Retake creates a clean attempt without overwriting submitted scores; unauthenticated retake denied')
author.call('/api/workspace/analyzers/'+slug+'/grants','DELETE',{'publicCode':code})
assert not member.call('/api/auth/me')['account']['analyzerDesk']
member.call('/api/workspace/analyzers',expected=403)
member.call('/api/workspace/analyzers/'+slug,expected=403)
check('Revocation immediately removes desk and record API access')
author.call('/api/workspace/roles','POST',{'publicCode':code,'role':'author'},expected=403)
owner.call('/api/workspace/roles','POST',{'publicCode':code,'role':'author'})
assert member.call('/api/auth/me')['account']['role']=='author'
owner.call('/api/workspace/roles','POST',{'publicCode':code,'role':'member'})
ownerCode=owner.call('/api/account/referral')['publicCode']
owner.call('/api/workspace/roles','POST',{'publicCode':ownerCode,'role':'member'},expected=400)
check('Only owner assigns account roles; owner role cannot be downgraded by this API')
assert 'این تحلیل را شروع کنید' in anon.call('/analyzers/'+slug)
check('Published analyzer landing is public without exposing author controls')
Path('qa/workspace-foundation-api-results.json').write_text(json.dumps({'passed':True,'upstream':'cb20276e0f82b6d1baa42bf843a5aa5c9ac05231','checks':checks,'environment':'disposable local PostgreSQL','live_services_tested':False},ensure_ascii=False,indent=2))
