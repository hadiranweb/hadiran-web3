"""Connected overview QA, hard-locked to a disposable local PostgreSQL DB."""
import json, os, subprocess, time, urllib.request, urllib.error
from pathlib import Path
from urllib.parse import urlparse
BASE='http://127.0.0.1:3002'
DB='postgresql://hadiran_qa:local-qa-only@127.0.0.1:5432/hadiran_integration_qa'
assert urlparse(DB).hostname=='127.0.0.1' and urlparse(DB).path=='/hadiran_integration_qa'
checks=[]
def check(name):checks.append(name);print('PASS',name,flush=True)
def sql(query,args=None):
 code="const {Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL});(async()=>{await c.connect();console.log(JSON.stringify((await c.query(JSON.parse(process.argv[1]),JSON.parse(process.argv[2]))).rows));})().finally(()=>c.end())"
 return json.loads(subprocess.check_output(['node','-e',code,json.dumps(query),json.dumps(args or [])],env={**os.environ,'DATABASE_URL':DB},text=True))
class Client:
 def __init__(self,phone=None):
  self.cookie=''
  if phone:self.call('/api/auth/password/login','POST',{'phone':phone,'password':'Integration-QA-2026'})
 def call(self,path,method='GET',body=None,expected=200):
  request=urllib.request.Request(BASE+path,method=method,data=None if body is None else json.dumps(body).encode(),headers={'Cookie':self.cookie,'Content-Type':'application/json'})
  try:res=urllib.request.urlopen(request)
  except urllib.error.HTTPError as error:res=error
  text=res.read().decode();assert res.status==expected,(path,res.status,expected,text[:300])
  if res.headers.get('Set-Cookie'):self.cookie=res.headers['Set-Cookie'].split(';')[0]
  if path.startswith('/api/workspace/overview') and res.status==200:assert 'no-store' in res.headers['Cache-Control']
  try:return json.loads(text)
  except ValueError:return text
owner=Client('09121234567');other=Client('09121110003');author=Client('09121110001');member=Client('09121110002');anon=Client()
for actor,status in [(anon,401),(author,403),(member,403)]:actor.call('/api/workspace/overview',expected=status)
check('Overview API requires owner session and private no-store responses')
aid=owner.call('/api/auth/me')['account']['id'];oid=other.call('/api/auth/me')['account']['id']
nonce=str(int(time.time()));listing='SL_OPS_'+nonce;prefix='SO_OPS_'+nonce
sql("INSERT INTO shop_listings(id,slug,title_fa,amount,currency,published) VALUES($1,$2,'محصول آزمون اتصال',2400000,'IRR',true)",[listing,'ops-'+nonce])
mid=member.call('/api/auth/me')['account']['id']
sql("INSERT INTO shop_orders(id,buyer_id,listing_id,amount,currency,state,payment_reference,updated_at) VALUES($1,$2,$3,2400000,'IRR','awaiting_confirmation','QA-REFERENCE','2020-01-01')",[prefix+'_00',mid,listing])
# Add the remaining rows in one parameterized statement.
sql("INSERT INTO shop_orders(id,buyer_id,listing_id,amount,currency,state,payment_reference,updated_at) SELECT $1||'_'||lpad(i::text,2,'0'),$2,$3,2400000,'IRR','awaiting_confirmation','QA-REFERENCE','2020-01-01' FROM generate_series(1,44) i",[prefix,mid,listing])
notes=[]
for account,label in [(aid,'یادداشت من برای بازبینی'),(oid,'یادداشت خصوصی مدیر دیگر')]:
 nid='SR_OPS_'+nonce+'_'+str(account);notes.append(nid);sql("INSERT INTO semantic_records(id,title_fa,status,owner_id,updated_at) VALUES($1,$2,'pending_review',$3,NOW())",[nid,label,account])
botids=[]
for account,label in [(aid,'ربات نیازمند بررسی'),(oid,'ربات خصوصی مدیر دیگر')]:
 bid='ops'+nonce+str(account);botids.append(bid);sql("INSERT INTO bots(id,owner_id,title_fa,last_error,token_cipher,webhook_secret_cipher) VALUES($1,$2,$3,'sensitive-failure-must-not-leak','sensitive-token-cipher','sensitive-hook-cipher')",[bid,account,label])
project=sql("INSERT INTO projects(slug,name_fa) VALUES($1,'پروژه آزمون اتصال') RETURNING id",['ops-'+nonce])[0]['id']
collab=sql("INSERT INTO collaborations(project_id,full_name,email,status) VALUES($1,'همکاری در انتظار بررسی','qa@example.test','submitted') RETURNING id",[project])[0]['id']
slug='ops-draft-'+nonce;owner.call('/api/workspace/analyzers','POST',{'slug':slug,'nameFa':'پیش‌نویس آزمون اتصال'})
after=owner.call('/api/workspace/overview');assert after['source']=='live' and after['asOf'];assert all(isinstance(v,int) for v in after['counts'].values())
expected={
 'orders':sql("SELECT count(*)::int AS n FROM shop_orders WHERE state='awaiting_confirmation'")[0]['n'],
 'notes':sql("SELECT count(*)::int AS n FROM semantic_records WHERE owner_id=$1 AND status='pending_review'",[aid])[0]['n'],
 'collaborations':sql("SELECT count(*)::int AS n FROM collaborations WHERE status='submitted'")[0]['n'],
 'analyzers':sql("SELECT count(*)::int AS n FROM analyzer_packs WHERE created_by=$1 AND status='draft'",[aid])[0]['n'],
 'bots':sql("SELECT count(*)::int AS n FROM bots WHERE owner_id=$1 AND last_error IS NOT NULL AND last_error<>''",[aid])[0]['n'],
}
assert after['counts']==expected and expected['orders']>=45
raw=json.dumps(after);assert notes[0] in raw and notes[1] not in raw;assert botids[0] in raw and botids[1] not in raw;assert 'sensitive-' not in raw and '2400000' in raw and 'IRR' in raw
other_data=other.call('/api/workspace/overview');other_raw=json.dumps(other_data);assert notes[1] in other_raw and notes[0] not in other_raw;assert botids[1] in other_raw and botids[0] not in other_raw
check('Five exact DB counts, private note/bot isolation and no bot secrets in payload')
seen=[];pages=(expected['orders']+19)//20
for page in range(1,pages+1):
 data=owner.call('/api/workspace/overview?kind=orders&page='+str(page));assert len(data['actions'])<=20;seen += [item['key'] for item in data['actions']]
assert len(seen)==expected['orders'] and len(set(seen))==len(seen)
assert owner.call('/api/workspace/overview?kind=orders&page=-1')['page']==1
assert owner.call('/api/workspace/overview?kind=orders&page=1000001')['page']==1
check('Counts are not capped at 40; deterministic 20-item pagination has no gaps or duplicates')
order_id=prefix+'_00';detail=owner.call('/workspace/shop/orders/'+order_id)
assert 'محصول آزمون اتصال' in detail and 'QA-REFERENCE' in detail
owner.call('/workspace/shop/orders/missing-'+nonce,expected=404)
for actor in [author,member]:assert 'QA-REFERENCE' not in actor.call('/workspace/shop/orders/'+order_id)
owner.call('/api/workspace/shop/orders/'+order_id+'/confirm','POST',{})
assert owner.call('/api/workspace/overview')['counts']['orders']==expected['orders']-1
assert sql('SELECT count(*)::int AS n FROM shop_entitlements WHERE order_id=$1',[order_id])[0]['n']==1
check('Direct source order page, missing-ID/role checks, and count decreases after existing confirm API')
owner.call('/api/workspace/collaborations/'+str(collab),'PATCH',{'status':'reviewed'})
assert owner.call('/api/workspace/overview')['counts']['collaborations']==expected['collaborations']-1
assert '/workspace/preview' in owner.call('/workspace')
assert owner.call('/api/workspace/overview?kind=not-a-kind')['filter'] is None
check('Existing collaboration write updates real queue; visual preview remains linked')
fixture={'orderId':prefix+'_01','noteId':notes[0],'collaborationId':collab,'botId':botids[0],'slug':slug,'ownerId':aid,'otherOwnerId':oid}
Path('qa/workspace-live-fixture.json').write_text(json.dumps(fixture,indent=2))
Path('qa/workspace-live-api-results.json').write_text(json.dumps({'passed':True,'checks':checks,'database':'disposable local PostgreSQL','production_database_tested':False,'counts':expected,'pagination_pages':pages,'fixture':fixture},ensure_ascii=False,indent=2))
