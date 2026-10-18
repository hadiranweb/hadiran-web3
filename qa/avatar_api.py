"""Real, local PostgreSQL avatar persistence and authorization tests. Never connects to production."""
import json,urllib.request,urllib.error
from pathlib import Path
B='http://127.0.0.1:3002';checks=[]
class Client:
 def __init__(self):self.cookie=''
 def call(self,path,method='GET',body=None,expected=200):
  h={'Content-Type':'application/json'}
  if self.cookie:h['Cookie']=self.cookie
  r=urllib.request.Request(B+path,data=None if body is None else json.dumps(body).encode(),headers=h,method=method)
  try:res=urllib.request.urlopen(r)
  except urllib.error.HTTPError as e:res=e
  raw=res.read().decode();assert res.status==expected,(path,res.status,raw[:400]);self.headers=res.headers
  return json.loads(raw)
 def login(self,phone):
  self.call('/api/auth/password/login','POST',{'phone':phone,'password':'Integration-QA-2026'});self.cookie=self.headers['Set-Cookie'].split(';')[0];assert self.cookie.count('.')==2

def check(s):checks.append(s);print('PASS',s,flush=True)
a=Client();owner=Client();member=Client()
for path in ['/api/account/avatar','/api/account/avatar/image']:a.call(path,expected=401)
a.call('/api/account/avatar','PATCH',{'variant':1},expected=401);check('Anonymous cannot read, change or fetch a private account photo')
owner.login('09121234567');member.login('09121234568');o=owner.call('/api/auth/me')['account'];m=member.call('/api/auth/me')['account'];assert o['role']=='owner' and m['role']=='member'
for client,account in [(owner,o),(member,m)]:
 avatar=client.call('/api/account/avatar')['avatar'];assert 0<=avatar['variant']<8 and avatar['photoUrl'] is None;assert avatar==account['avatar'];assert 'no-store' in client.headers['Cache-Control']
check('Stable automatic defaults available in real login/me and authenticated metadata API')
for value in [-1,8,1.5,'2',None,True,{},[1]]:owner.call('/api/account/avatar','PATCH',{'variant':value},expected=400)
owner.call('/api/account/avatar','PATCH',None,expected=400);check('Strict integer 0–7 validation rejects malformed avatar choices')
original=m['avatar'];saved=(o['avatar']['variant']+1)%8;result=owner.call('/api/account/avatar','PATCH',{'variant':saved});assert result['avatar']['variant']==saved
assert member.call('/api/account/avatar')['avatar']==original
newsession=Client();newsession.login('09121234567');assert newsession.call('/api/auth/me')['account']['avatar']['variant']==saved
owner.call('/api/account/avatar/image',expected=404);assert 'no-store' in owner.headers['Cache-Control'];check('Preset persists across new real JWT sessions, never changes another account; no fake photo')
for c in [owner,member]:
 c.call('/api/account/onboarding','POST',{'step':'policies','accept':True});c.call('/api/account/onboarding','POST',{'step':'profile','givenName':'آزمون','familyName':'پروفایل'})
Path('qa/avatar-api-results.json').write_text(json.dumps({'status':'PASS','checks':checks,'database':'disposable local hadiran_integration_qa only','owner_saved_variant':saved},ensure_ascii=False,indent=2))
