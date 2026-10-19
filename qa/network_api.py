"""Referral graph QA, hard-locked to a disposable local PostgreSQL DB."""
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
  self.headers=res.headers;text=res.read().decode();assert res.status==expected,(path,res.status,expected,text[:300])
  if res.headers.get('Set-Cookie'):self.cookie=res.headers['Set-Cookie'].split(';')[0]
  if path.startswith('/api/workspace/overview') and res.status==200:assert 'no-store' in res.headers['Cache-Control']
  try:return json.loads(text)
  except ValueError:return text

import secrets
sql('TRUNCATE rate_limit_buckets')
# Only this QA fixture namespace is replaced; the database URL is hard-locked above.
sql("DELETE FROM accounts WHERE phone LIKE '0998%'")
owner=Client('09121234567');author=Client('09121110001');member=Client('09121110002');other=Client('09121110003');anon=Client()
for actor,status in [(anon,401),(author,403),(member,403)]:actor.call('/api/workspace/network/overview?root=bad',expected=status)
check('Network requires owner before parsing a root; member and author cannot query it')
rows=[];used=set(r['code'] for r in sql('select code from account_public_codes'))
def add(name,parent=None,role='member',code=True,active=True):
 i=len(rows);value=None
 if code:
  value=str(secrets.randbelow(80000000)+10000000)
  while value in used:value=str(secrets.randbelow(80000000)+10000000)
  used.add(value)
 rows.append({'key':i,'phone':'0998'+str(i).zfill(7),'name':name,'parentKey':parent,'role':role,'code':value,'active':active});return i
root=add('خانواده آزمایشی هادیران',role='owner')
children=[]
for i in range(60):
 child=add('شاخه آزمایشی '+str(i+1),root,'author' if i%5==0 else 'member');children.append(child)
 for j in range(3):add('عضو آزمایشی '+str(i+1)+' ـ '+str(j+1),child)
chain=add('زنجیره آزمایشی');prior=chain
for i in range(8):prior=add('ادامه زنجیره '+str(i+1),prior)
cycleA=add('حلقه آزمایشی الف');cycleB=add('حلقه آزمایشی ب',cycleA);rows[cycleA]['parentKey']=cycleB
selfNode=add('حلقه خودمعرف');rows[selfNode]['parentKey']=selfNode
noCode=add('والد بدون کد',code=False);orphan=add('عضو با والد بدون کد',noCode)
inactive=add('والد غیرفعال',active=False);activeChild=add('عضو با والد غیرفعال',inactive)
for i in range(24):add('ریشه مستقل '+str(i+1))
# Single local-DB connection; parent links are assigned after all IDs exist.
code="""const {Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL});(async()=>{await c.connect();const rows=JSON.parse(process.argv[1]);for(const r of rows){r.id=(await c.query(\"INSERT INTO accounts(phone,given_name,family_name,role,is_active) VALUES($1,$2,'', $3,$4) RETURNING id\",[r.phone,r.name,r.role,r.active])).rows[0].id;if(r.code)await c.query('INSERT INTO account_public_codes(account_id,code) VALUES($1,$2)',[r.id,r.code]);}for(const r of rows)if(r.parentKey!==null)await c.query('UPDATE accounts SET referred_by_account_id=$1 WHERE id=$2',[rows[r.parentKey].id,r.id]);console.log(JSON.stringify(rows));})().finally(()=>c.end())"""
rows=json.loads(subprocess.check_output(['node','-e',code,json.dumps(rows)],env={**os.environ,'DATABASE_URL':DB},text=True))
rootCode=rows[root]['code'];childCode=rows[children[0]]['code'];before=sql('select count(*)::int n from account_public_codes')[0]['n']
data=owner.call('/api/workspace/network/overview');assert data['source']=='live' and data['asOf'];assert 'no-store' in owner.headers['Cache-Control']
assert data['total']==sql("select count(*)::int n from accounts a join account_public_codes c on c.account_id=a.id where a.is_active=true and c.code ~ '^[0-9]{8}$'")[0]['n']
assert data['withoutCode']==1 and data['rootTotal']>20 and len(data['directory'])==20 and len(data['nodes'])<=120 and data['truncated']
seen=[]
for page in range(1,(data['directoryTotal']+19)//20+1):seen += [n['code'] for n in owner.call('/api/workspace/network/overview?page='+str(page))['directory']]
assert len(seen)==data['total'] and len(set(seen))==len(seen)
assert other.call('/api/workspace/network/overview')['total']==data['total']
check('Exact active coded totals, uncoded account notice, owner-wide scope and complete stable 20-row directory pagination')
focus=owner.call('/api/workspace/network/overview?root='+rootCode+'&depth=2');assert len(focus['nodes'])==120 and focus['truncated'];assert len(focus['edges'])==119
assert max(n['depth'] for n in focus['nodes'])<=2
small=owner.call('/api/workspace/network/overview?root='+childCode+'&depth=1');assert len(small['nodes'])==4 and len(small['edges'])==3 and not small['truncated']
deep=owner.call('/api/workspace/network/overview?root='+rows[chain]['code']+'&depth=4');assert len(deep['nodes'])==5 and deep['truncated']
check('Broad views cap at 120 nodes; depth caps at four; selecting a child retrieves its real subtree')
for packet in [data,focus,small,deep]:
 nodecodes={n['code'] for n in packet['nodes']}
 for n in packet['nodes']+packet['directory']:assert set(n)=={'code','name','role','kind','referrerCode','hasReferrer','depth'} and len(n['code'])==8
 for edge in packet['edges']:
  assert edge['from'] in nodecodes and edge['to'] in nodecodes and edge['kind']=='account_referral'
  actual=sql('select pc.code from accounts a join account_public_codes c on c.account_id=a.id join account_public_codes pc on pc.account_id=a.referred_by_account_id where c.code=$1',[edge['to']])[0]['code'];assert actual==edge['from']
 raw=json.dumps(packet)
 for secret in ['"id"','"parent"','"phone"','"email"','"answers"','"results"','"amount"','"weight"']:assert secret not in raw
check('Every returned edge is backed by the recorded referrer; payload excludes internal IDs, contact, financial and assessment fields')
filtered=owner.call('/api/workspace/network/overview?q='+urllib.parse.quote('شاخه آزمایشی')+'&role=author&root='+rootCode)
assert filtered['directoryTotal']==12 and len(filtered['directory'])==12
assert all(n['role']=='author' for n in filtered['directory']);assert filtered['nodes']==focus['nodes']
assert owner.call('/api/workspace/network/overview?q=not-present')['directoryTotal']==0
assert owner.call('/api/workspace/network/overview?q='+urllib.parse.quote("%' OR 1=1 --"))['directoryTotal']==0
owner.call('/api/workspace/network/overview?root=123',expected=400);owner.call('/api/workspace/network/overview?root=00000000',expected=404)
assert owner.call('/api/workspace/network/overview?depth=99&page=-1')['query']['depth']==2
persian=str.maketrans('0123456789','۰۱۲۳۴۵۶۷۸۹');assert owner.call('/api/workspace/network/overview?root='+urllib.parse.quote(childCode.translate(persian)))['query']['root']==childCode
check('Server-side name/role search, literal SQL-safe input, Persian public codes and invalid/missing root handling')
for idx in [cycleA,selfNode]:
 packet=owner.call('/api/workspace/network/overview?root='+rows[idx]['code']);assert packet['cycle'] and len(packet['nodes'])<=2 and len(packet['edges'])>=1
for idx in [orphan,activeChild]:
 packet=owner.call('/api/workspace/network/overview?root='+rows[idx]['code']);assert len(packet['nodes'])==1 and not packet['edges'];assert packet['nodes'][0]['hasReferrer'] and packet['nodes'][0]['referrerCode'] is None
assert sql('select count(*)::int n from account_public_codes')[0]['n']==before
check('Cycles, self-referrals and unavailable parents are explicit; reading does not allocate public codes or rewrite relationships')
# A genuine empty database view is not the same as no DB. Reverted inside the test.
active=sql('select id from accounts where is_active=true');sql('update accounts set is_active=false where phone<>$1',['09121234567'])
empty=owner.call('/api/workspace/network/overview?role=author');assert empty['directoryTotal']==0
sql('update accounts set is_active=true where id=ANY($1::int[])',[[r['id'] for r in active]])
check('Genuine empty filtered directory remains a successful live snapshot')
fixture={'root':rootCode,'child':childCode,'chain':rows[chain]['code'],'cycle':rows[cycleA]['code'],'self':rows[selfNode]['code'],'orphan':rows[orphan]['code'],'total':data['total'],'fixtureAccounts':len(rows)}
Path('qa/network-fixture.json').write_text(json.dumps(fixture,indent=2))
Path('qa/network-api-results.json').write_text(json.dumps({'passed':True,'checks':checks,'dataset_accounts':data['total'],'max_nodes_tested':120,'production_database_tested':False},indent=2))
