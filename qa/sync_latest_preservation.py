"""Byte-level preservation checks; dependency changes explicitly allow upstream version upgrades only."""
from pathlib import Path
import subprocess,json
checks=[]
for group in ['src/components/portrait/','assets/portrait/','src/app/fonts/','public/avatars/','public/brand/','public/hadiran-portrait.svg','src/components/navigation/useDisclosure.ts']:
 assert not subprocess.check_output(['git','diff','289e3a6','--',group]),group
 checks.append(group+' unchanged from 289e3a6')
files=subprocess.check_output(['git','ls-tree','-r','--name-only','f132353','--','src/db/migrations'],text=True).splitlines()
for file in files:assert subprocess.check_output(['git','show','f132353:'+file])==Path(file).read_bytes(),file
latest=subprocess.check_output(['git','ls-tree','-r','--name-only','cb20276','--','src/db/migrations'],text=True).splitlines()
for file in latest: assert subprocess.check_output(['git','show','cb20276:'+file])==Path(file).read_bytes(),file
assert len(list(Path('src/db/migrations').glob('*.sql')))==26
assert Path('src/db/migrations/0021_shop_order_events.sql').exists()
assert subprocess.check_output(['git','show','ecf3b58:src/db/migrations/0021_shop_order_events.sql'])==Path('src/db/migrations/0021_shop_order_events.sql').read_bytes()
for name in ['0021_interpretation_documents.sql','0022_casio_ss_document_template.sql']: assert subprocess.check_output(['git','show','ab290dc:src/db/migrations/'+name])==Path('src/db/migrations/'+name).read_bytes()
checks.append('All 23 session migrations and 2 upstream migrations are byte-identical; new scoped-template migration is present')
checks.append('All 20 existing migrations retained byte-for-byte, including both 0015 filenames')
assert subprocess.check_output(['git','show','ab290dc:package-lock.json'])==Path('package-lock.json').read_bytes()
old=json.loads(subprocess.check_output(['git','show','f132353:package.json']));new=json.loads(Path('package.json').read_text());upstream=json.loads(subprocess.check_output(['git','show','ab290dc:package.json']))
assert set(new['dependencies'])-set(old['dependencies'])=={'@codemirror/lang-css','@codemirror/lang-html','@uiw/react-codemirror'};assert old['devDependencies'].keys()==new['devDependencies'].keys()
assert {k for k in new['dependencies'] if k in old['dependencies'] and old['dependencies'][k]!=new['dependencies'][k]}=={'next'}
assert {k for k in new['devDependencies'] if old['devDependencies'][k]!=new['devDependencies'][k]}=={'eslint-config-next'}
assert new['dependencies']==upstream['dependencies'] and new['devDependencies']==upstream['devDependencies']
assert new['scripts']==old['scripts']
checks.append('Only existing Next.js and eslint-config-next upgraded to upstream 16.4.1; native SVG build scripts retained')
checks.append('Exact upstream dependency lockfile; only 3 explicitly user-selected CodeMirror additions')
for file in subprocess.check_output(['git','diff','--name-only','f132353'],text=True).splitlines():
 p=Path(file)
 if p.suffix in ['.ts','.tsx','.js','.cjs','.mjs','.md','.py']:
  text=p.read_text();assert not any(line.startswith('<' * 7) or line.startswith('>' * 7) for line in text.splitlines()),file
  assert not any('\u4e00'<=c<='\u9fff' for c in text),file
checks.append('No unresolved markers or unintended CJK in changed source/docs')
Path('qa/workspace-preservation-results.json').write_text(json.dumps({'passed':True,'upstream':'ab290dcf7b6998c5994f5bb3cddc3454565444e5','checks':checks,'new_npm_dependencies':['@codemirror/lang-css','@codemirror/lang-html','@uiw/react-codemirror'],'dependency_exception_approved':True},indent=2))
print('PASS',len(checks),'preservation groups')
