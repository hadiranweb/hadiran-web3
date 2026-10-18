"""1ed9ea7: local PostgreSQL-only API checks; no real Telegram/Worker traffic."""
import json,os,subprocess,urllib.request,urllib.error
from pathlib import Path
BASE='http://127.0.0.1:3002';DB='postgresql://hadiran_qa:local-qa-only@127.0.0.1:5432/hadiran_integration_qa';checks=[]
def sql(query,args=[]):
 code="const {Client}=require('pg');const u=new URL(process.env.DATABASE_URL);if(u.hostname!=='127.0.0.1'||u.pathname!=='/hadiran_integration_qa')throw Error('Local QA only');const c=new Client({connectionString:u.toString()});(async()=>{await c.connect();console.log(JSON.stringify((await c.query(JSON.parse(process.argv[1]),JSON.parse(process.argv[2]))).rows))})().finally(()=>c.end());"
 return json.loads(subprocess.check_output(['node','-e',code,json.dumps(query),json.dumps(args)],env={**os.environ,'DATABASE_URL':DB},text=True))
class Client:
 def __init__(self,phone=None):
  self.cookie=''
  if phone:self.call('/api/auth/password/login','POST',{'phone':phone,'password':'Integration-QA-2026'})
 def call(self,path,method='GET',body=None,expected=200,headers={}):
  h={'Content-Type':'application/json',**headers}
  if self.cookie:h['Cookie']=self.cookie
  req=urllib.request.Request(BASE+path,method=method,headers=h,data=None if body is None else json.dumps(body).encode())
  try:r=urllib.request.urlopen(req)
  except urllib.error.HTTPError as e:r=e
  raw=r.read().decode();assert r.status==expected,(path,r.status,raw[:200])
  if r.headers.get('Set-Cookie'):self.cookie=r.headers['Set-Cookie'].split(';')[0]
  try:return json.loads(raw)
  except:return raw

def check(name):checks.append(name);print('PASS',name,flush=True)
owner,author,member,anon=[Client(phone) for phone in ['09121234567','09121110001','09121234568',None]]
code=author.call('/api/account/referral')['publicCode']
owner.call('/api/workspace/analyzers/casio-ss/grants','POST',{'publicCode':code})
rows=author.call('/api/workspace/analyzers/casio-ss/attempts')['items'];assert len(rows)==1
row=rows[0];assert row['gate']['bandId']=='yellow' and len(row['gate']['dimensions'])==3
assert row['rawAnswers'] and row['rawResults']['scores']['gate-band']=='yellow'
member.call('/api/workspace/analyzers/casio-ss/attempts',expected=403)
anon.call('/api/workspace/analyzers/casio-ss/attempts',expected=401)
check('Granted author receives gate/detailed interpretation snapshots; member/anonymous workspace API denied')
pack=owner.call('/api/workspace/analyzers/casio-ss')['pack'];previous=dict(pack['report'])
try:
 pack['report']['userSummaryTemplateFa']='خلاصهٔ اختصاصی {business}؛ {maturity}؛ {gate-band}؛ {unknown}'
 owner.call('/api/workspace/analyzers/casio-ss','PUT',pack)
 html=member.call('/analyzers/casio-ss/report')
 assert 'خلاصهٔ اختصاصی' in html and 'کسب‌وکار آزمایشی' in html
 assert 'ارزیابی زرد' not in html and 'درخت کلیدواژه' not in html
 assert '{gate-band}' not in html and '{unknown}' not in html
 check('Persisted custom member summary interpolates server-side without detailed tree or gate label')
finally:
 pack['report']=previous;owner.call('/api/workspace/analyzers/casio-ss','PUT',pack)
# Missing/wrong shared secret must never invoke Telegram. Paused, valid update only records receipt.
bot=owner.call('/api/workspace/bots','POST',{'titleFa':'ربات بررسی وب‌هوک محلی','analyzerSlug':'casio-ss'})['bot'];bid=bot['id'];secret='local-only-fake-hook-secret'
try:
 # Existing AES-GCM helper loaded with the existing TS compiler; never use real tokens.
 loader=Path('qa/sync_telegram_mock.cjs').read_text().split("const {pool}=require('../src/db/index.ts');")[0]
 encrypted=subprocess.check_output(['node','-e',loader+"console.log(require('./src/lib/bots/secret.ts').sealSecret('"+secret+"'))"],env={**os.environ,'DATABASE_URL':DB,'HADIRAN_JWT_SECRET':'local-qa-secret-only-648b623-at-least-32-characters'},text=True).strip()
 sql("UPDATE bots SET status='paused',webhook_secret_cipher=$1 WHERE id=$2",[encrypted,bid])
 anon.call('/api/bots/telegram/'+bid+'/webhook','POST',{'update_id':1},expected=401)
 diagnostic=sql('SELECT last_error,last_webhook_at FROM bots WHERE id=$1',[bid])[0]
 assert 'خالی' in diagnostic['last_error'] and diagnostic['last_webhook_at'] is None
 anon.call('/api/bots/telegram/'+bid+'/webhook','POST',{'update_id':1},expected=401,headers={'X-Telegram-Bot-Api-Secret-Token':'wrong'})
 assert 'یکی نیست' in sql('SELECT last_error FROM bots WHERE id=$1',[bid])[0]['last_error']
 assert anon.call('/api/bots/telegram/'+bid+'/webhook','POST',{'update_id':1,'message':{'text':'/start'}},headers={'X-Telegram-Bot-Api-Secret-Token':secret})['ok']
 hit=sql('SELECT last_webhook_at,last_update_kind FROM bots WHERE id=$1',[bid])[0];assert hit['last_webhook_at'] and hit['last_update_kind']=='message'
 check('Webhook missing/wrong-secret diagnostics and authenticated paused ACK with recorded receipt')
finally:owner.call('/api/workspace/bots/'+bid,'DELETE',{})
Path('qa/sync-latest-api-results.json').write_text(json.dumps({'passed':True,'upstream':'1ed9ea7661d766245975654de22377534af53eb4','checks':checks,'external_telegram_tested':False},ensure_ascii=False,indent=2))
