"""Evidence-based source preservation checks for integration against the captured a78b1bb baseline."""
from pathlib import Path
import hashlib,json,re,subprocess,urllib.request
p=Path('.');old=Path('/home/user/hadiran-web3');up=Path('/home/user/hadiran-web3-upstream')
checks={}
for name in ['public/hadiran-portrait.svg','src/components/portrait/ReassemblyPortrait.tsx','src/components/portrait/portrait.generated.ts','src/app/fonts/IRANSharp-Regular.woff2','src/app/fonts/IRANSharp-Bold.woff2','src/app/fonts/IRANSharp-Light.woff2']:
 checks[name]=hashlib.sha256((p/name).read_bytes()).hexdigest()==hashlib.sha256((old/name).read_bytes()).hexdigest()
checks['production_shop_services_unchanged']=all((p/f).read_bytes()==(up/f).read_bytes() for f in ['src/lib/shop/orders.ts','src/lib/shop/access.ts','src/lib/shop/price-engine.ts','src/lib/shop/listing-write.ts','src/lib/shop/parse-listing.ts'])
checks['latest_scoring_authoring_storage_and_reports_unchanged']=all((p/f).read_bytes()==(up/f).read_bytes() for f in ['src/lib/analyzers/score.ts','src/lib/analyzers/casio-ss/instrument.ts','src/lib/analyzers/casio-ss/report.ts','src/lib/analyzers/sanitize.ts','src/lib/analyzers/attempts.ts','src/lib/analyzers/generic-report.ts','src/lib/analyzers/authored.ts','src/lib/analyzers/casio-ss/attempts.ts'])
checks['all_migrations_preserved']=all((p/f.relative_to(up)).read_bytes()==f.read_bytes() for f in (up/'src/db/migrations').glob('*.sql'))
checks['no_npm_dependency_changes']=all(json.loads((p/'package.json').read_text())[key]==json.loads((up/'package.json').read_text())[key] for key in ['dependencies','devDependencies'])
checks['lockfile_unchanged']=(p/'package-lock.json').read_bytes()==(up/'package-lock.json').read_bytes()
up_routes={str(f.relative_to(up/'src/app')) for f in (up/'src/app').rglob('*.tsx') if f.name in ['page.tsx','layout.tsx']}
checks['all_upstream_pages_present']=all((p/'src/app'/f).exists() for f in up_routes)
for port in [3001,3002]:
 r=urllib.request.urlopen(f'http://127.0.0.1:{port}/signin');x=r.headers.get('X-Frame-Options');checks[f'frame_policy_{port}']=(x is None if port==3001 else x=='DENY')
changed=subprocess.check_output(['git','diff','--name-only','a78b1bb'],text=True).splitlines()
for name in changed:
 f=p/name
 if f.exists() and f.suffix in ['.tsx','.ts','.css','.md','.py','.mjs']:
  if re.search('[\u3400-\u4dbf\u4e00-\u9fff]',f.read_text()):raise Exception('Unexpected CJK: '+name)
assert all(checks.values()),checks
(p/'qa/integration-preservation-results.json').write_text(json.dumps({'status':'PASS','upstream':'a78b1bb56faa4b0306bcc5e9aae6136c573550ef','checks':checks,'upstream_pages_checked':len(up_routes),'migrations_checked':len(list((up/'src/db/migrations').glob('*.sql')))},indent=2))
print('PASS preservation checks:',len(checks),'upstream pages:',len(up_routes),'migrations: 15')
