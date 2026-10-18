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

# Every write in this suite is confined to the disposable database above.
sql('TRUNCATE rate_limit_buckets')
for query in ["DELETE FROM shop_orders WHERE id LIKE 'rh-%'", "DELETE FROM analyzer_attempts WHERE slug LIKE 'rh-%'", "DELETE FROM analyzer_packs WHERE slug LIKE 'rh-%'", "DELETE FROM shop_listings WHERE id LIKE 'SL_rh-%'"]:
 sql(query)
for phone in ['09121110004','09121110005','09121110006','09121110007']:
 sql("INSERT INTO accounts(phone,given_name,family_name,role,password_hash,password_set_at,phone_verified_at,policies_accepted_at,policies_version,onboarding_completed_at) SELECT $1,'عضو','آزمایشی','member',password_hash,password_set_at,NOW(),policies_accepted_at,policies_version,onboarding_completed_at FROM accounts WHERE phone='09121110002' ON CONFLICT(phone) DO NOTHING",[phone])
owner=Client('09121234567');author=Client('09121110001');member=Client('09121110002');other=Client('09121110004');viewer=Client('09121110005');reader=Client('09121110006');empty=Client('09121110007');anon=Client()
actors={'owner':owner,'author':author,'member':member,'other':other,'viewer':viewer,'reader':reader,'empty':empty}
ids={name:actor.call('/api/auth/me')['account']['id'] for name,actor in actors.items()}
for path in ['/api/account/overview','/api/workspace/analyzer-overview']:anon.call(path,expected=401)
member.call('/api/workspace/analyzer-overview',expected=403)
check('Anonymous rejected and ordinary member cannot access author/owner overview APIs')
nonce=str(int(time.time()));prefix='rh-'+nonce
private=prefix+'-private';viewslug=prefix+'-view';readslug=prefix+'-responses';editslug=prefix+'-edit'
for slug in [private,viewslug,readslug,editslug]:owner.call('/api/workspace/analyzers','POST',{'slug':slug,'nameFa':'آزمون دسترسی '+slug.rsplit('-',1)[1]})
basepack=owner.call('/api/workspace/analyzers/'+private)['pack']
basepack['version']='1.0'
basepack['sections']=[{'id':'section-1','titleFa':'بخش آزمایشی','items':[{'kind':'range','id':'Q1','text':'پرسش آزمون آزمایشی','reverse':False,'anchors':{'0':'کم','5':'متوسط','10':'زیاد'}}]}]
rows=[]
for i in range(25):
 pack={**basepack,'slug':prefix+'-author-'+str(i).zfill(2),'nameFa':'آزمون ساختهٔ من '+str(i+1),'status':'draft' if i<24 else 'open'};rows.append({'pack':pack,'owner':ids['author']})
for i in range(44):
 pack={**basepack,'slug':prefix+'-personal-'+str(i).zfill(2),'nameFa':('آزمون ناتمام ' if i<22 else 'گزارش شخصی ')+str(i%22+1),'status':'open'};rows.append({'pack':pack,'owner':ids['owner']})
sql("INSERT INTO analyzer_packs(slug,status,pack,created_by) SELECT r->'pack'->>'slug',r->'pack'->>'status',r->'pack',(r->>'owner')::int FROM jsonb_array_elements($1::jsonb) r",[json.dumps(rows)])
for slug,who,edit,responses in [(viewslug,'viewer',False,False),(readslug,'reader',False,True),(editslug,'author',True,False)]:
 sql('INSERT INTO analyzer_grants(slug,account_id,can_edit,can_read_responses) VALUES($1,$2,$3,$4)',[slug,ids[who],edit,responses])
listing='SL_'+prefix
sql("INSERT INTO shop_listings(id,slug,title_fa,amount,currency,published) VALUES($1,$2,'محصول شخصی عضو',123456,'IRR',true)",[listing,prefix])
sql("INSERT INTO shop_orders(id,buyer_id,listing_id,amount,currency,state) SELECT $1||'_'||lpad(i::text,2,'0'),$2,$3,123456,'IRR','awaiting_payment_reference' FROM generate_series(0,22) i",[prefix,ids['member'],listing])
otherorder=prefix+'-other'
sql("INSERT INTO shop_orders(id,buyer_id,listing_id,amount,currency,state,payment_reference) VALUES($1,$2,$3,555000,'IRR','awaiting_confirmation','PRIVATE-OTHER-REFERENCE')",[otherorder,ids['other'],listing])
for i in range(44):
 slug=prefix+'-personal-'+str(i).zfill(2);status='in_progress' if i<22 else 'submitted'
 sql("INSERT INTO analyzer_attempts(account_id,slug,instrument_version,status,answers,results,submitted_at) VALUES($1,$2,'1.0',$3::varchar,$4::jsonb,$5::jsonb,CASE WHEN $3='submitted' THEN NOW() ELSE NULL END)",[ids['member'],slug,status,json.dumps({'Q1':5,'private':'ANSWER-MUST-NOT-APPEAR'}),json.dumps({'version':'1.0','effective':{'Q1':5},'scores':{},'private':'RESULT-MUST-NOT-APPEAR'})])
# A historical submission must not advertise a report while a new attempt is open.
sql("INSERT INTO analyzer_attempts(account_id,slug,instrument_version,status,submitted_at) VALUES($1,$2,'0.9','submitted','2020-01-01')",[ids['member'],prefix+'-personal-00'])
sql("INSERT INTO casio_attempts(account_id,instrument_version,status,submitted_at) VALUES($1,'0.1','submitted',NOW())",[ids['other']])
current=member.call('/api/account/overview');assert current['source']=='live' and current['asOf']
assert current['counts']['orders']==sql('SELECT count(*)::int n FROM shop_orders WHERE buyer_id=$1',[ids['member']])[0]['n']
assert current['counts']['inProgress']>=22 and current['counts']['reports']>=22
assert otherorder not in json.dumps(current) and 'PRIVATE-OTHER' not in json.dumps(current)
for secret in ['ANSWER-MUST','RESULT-MUST','"answers"','"results"','"buyerId"']:assert secret not in json.dumps(current)
assert member.call('/api/account/overview?accountId='+str(ids['other']))['counts']==current['counts']
assert empty.call('/api/account/overview')['counts']=={'orders':0,'inProgress':0,'reports':0}
check('Personal snapshot is scoped by session, exact counts, no answers/results or cross-account metadata')
for kind in ['orders','inProgress','reports']:
 n=current['counts'][kind];items=[]
 for page in range(1,(n+19)//20+1):items+=member.call('/api/account/overview?kind='+kind+'&page='+str(page))['items']
 assert len(items)==n and len({r['key'] for r in items})==n
 if kind=='inProgress':assert any(r['href']=='/analyzers/'+prefix+'-personal-00' for r in items)
 if kind=='reports':assert not any(r['href']=='/analyzers/'+prefix+'-personal-00/report' for r in items)
 assert all(r['kind']==kind for r in items)
assert member.call('/api/account/overview?kind=bad&page=-2')['page']==1
assert 'PRIVATE-OTHER-REFERENCE' not in member.call('/shop/orders/'+otherorder,expected=404)
assert 'محصول شخصی عضو' in member.call('/shop/orders/'+prefix+'_00')
check('Personal orders and current attempts paginate without duplicates; report links do not target historical attempts')
for who in ['author','viewer','reader','owner']:
 actor=actors[who];legacy=actor.call('/api/workspace/analyzers')['authored'];new=actor.call('/api/workspace/analyzer-overview');assert new['source']=='live'
 expected={'all':len(legacy),'mine':sql('select count(*)::int n from analyzer_packs where created_by=$1',[ids[who]])[0]['n'],'drafts':sum(x['status']=='draft' and x['canEdit'] for x in legacy),'responses':sum(x['canReadResponses'] for x in legacy)}
 assert new['counts']==expected,(who,new['counts'],expected)
 seen=[]
 for page in range(1,(expected['all']+19)//20+1):seen+=actor.call('/api/workspace/analyzer-overview?page='+str(page))['items']
 assert len(seen)==expected['all'] and {r['slug'] for r in seen}=={r['slug'] for r in legacy}
 assert len({r['slug'] for r in seen})==len(seen)
 for row in seen:
  old=next(x for x in legacy if x['slug']==row['slug']);assert row['edit']==old['canEdit'] and row['responses']==old['canReadResponses'] and row['grant']==old['canGrant']
 for flt in ['drafts','responses','mine']:
  selected=actor.call('/api/workspace/analyzer-overview?filter='+flt)
  for row in selected['items']:assert (row['status']=='draft' and row['edit']) if flt=='drafts' else row['responses'] if flt=='responses' else row['mine']
check('Author/delegated/owner metadata and four full counts match existing access rules, with deterministic pagination')
assert private not in json.dumps(author.call('/api/workspace/analyzer-overview'))
assert viewer.call('/api/workspace/analyzer-overview')['counts']=={'all':1,'drafts':0,'responses':0,'mine':0}
viewer.call('/api/workspace/analyzers/'+viewslug+'/attempts',expected=403)
viewer.call('/api/workspace/analyzers/'+viewslug,'PUT',basepack,expected=403)
viewer.call('/api/workspace/analyzers/'+viewslug+'/grants','POST',{},expected=403)
assert viewer.call('/api/auth/me')['account']['role']=='member'
check('View-only delegation does not promote member or permit edit, responses, grants or owner data')
# Revocation must immediately remove the card and enforce the source route.
sql('DELETE FROM analyzer_grants WHERE account_id=$1 AND slug=$2',[ids['viewer'],viewslug])
viewer.call('/api/workspace/analyzer-overview',expected=403);viewer.call('/api/workspace/analyzers/'+viewslug,expected=403)
sql('INSERT INTO analyzer_grants(slug,account_id,can_edit,can_read_responses) VALUES($1,$2,false,false)',[viewslug,ids['viewer']])
check('Revoked grants take effect without cached cross-account metadata')
# Unknown/closed analyzer stays visible as the owner’s record, without a broken action link.
sql("UPDATE analyzer_packs SET status='archived', pack=jsonb_set(pack,'{status}','\"archived\"'::jsonb) WHERE slug=$1",[prefix+'-personal-43'])
closed=member.call('/api/account/overview?kind=reports');allreports=closed['items']+member.call('/api/account/overview?kind=reports&page=2')['items'];assert next(x for x in allreports if x['key'].split(':')[1]==prefix+'-personal-43')['href'] is None
# Source updates, not localStorage or fixtures.
sql("UPDATE shop_orders SET state='cancelled',updated_at=NOW() WHERE id=$1",[prefix+'_00'])
assert next(x for x in member.call('/api/account/overview?kind=orders')['items'] if x['key']=='order:'+prefix+'_00')['status']=='cancelled'
assert all(x['kind'] in ['orders','notes','analyzers','bots'] for x in owner.call('/api/workspace/overview')['recent'])
check('Closed instruments do not get misleading report actions; snapshots reflect source changes and multi-source owner activity')
fixture={'prefix':prefix,'ids':ids,'viewSlug':viewslug,'readSlug':readslug,'editSlug':editslug,'privateSlug':private,'ownSlug':prefix+'-author-00','reportSlug':prefix+'-personal-22','continueSlug':prefix+'-personal-00','orderId':prefix+'_01','otherOrderId':otherorder}
Path('qa/role-home-fixture.json').write_text(json.dumps(fixture,indent=2))
Path('qa/role-home-api-results.json').write_text(json.dumps({'passed':True,'checks':checks,'database':'disposable local PostgreSQL','production_database_tested':False},indent=2))
