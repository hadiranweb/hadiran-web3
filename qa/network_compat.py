"""Legacy endpoint shape and bounded-response timing on the disposable local DB."""
from pathlib import Path
import json,time,statistics
exec(Path('qa/network_api.py').read_text().split("sql('TRUNCATE rate_limit_buckets')")[0])
owner=Client('09121234567');member=Client('09121110002');author=Client('09121110001')
legacy=owner.call('/api/workspace/network');assert set(legacy)=={'tree'}
stack=list(legacy['tree']);seen=[]
while stack:
 row=stack.pop();assert set(row)=={'publicCode','nameFa','roleFa','children'};seen.append(row['publicCode']);stack.extend(row['children'])
assert len(seen)==len(set(seen))
for actor in [member,author]:actor.call('/api/workspace/network',expected=403)
check('Existing owner-only tree API retains its nested public-code contract')
fixture=json.loads(Path('qa/network-fixture.json').read_text());timings=[];sizes=[]
for _ in range(10):
 start=time.monotonic();data=owner.call('/api/workspace/network/overview?root='+fixture['root']);timings.append((time.monotonic()-start)*1000);assert len(data['nodes'])==120;sizes.append(len(json.dumps(data).encode()))
assert max(sizes)<100000
check('Bounded response remains under 100 KB at the 120-node cap')
Path('qa/network-compat-results.json').write_text(json.dumps({'passed':True,'checks':checks,'timing_scope':'local HTTP only; not a production SLA','dataset_accounts':data['total'],'requests':10,'median_ms':round(statistics.median(timings),1),'max_ms':round(max(timings),1),'max_response_bytes':max(sizes)},indent=2))
print('Timing',round(statistics.median(timings),1),'ms median;',max(sizes),'bytes')
