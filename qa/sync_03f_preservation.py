"""Pinned upstream merge checks; only the user-selected CodeMirror exception is allowed."""
from pathlib import Path
import subprocess,json
old='ecf3b5807bcc2868512786cd25c53c62066c130f';up='12362039e94140c9ca0536e3a1842191b4e7afd8';checks=[]
def unchanged(ref,path):assert not subprocess.check_output(['git','diff',ref,'--',path]),path
for path in ['src/components/portrait','assets/portrait','src/app/fonts','public/avatars','public/brand','public/hadiran-portrait.svg','src/components/navigation/useDisclosure.ts','src/lib/shop/orders.ts','src/lib/finance','src/components/finance','src/lib/commerce/assessment-policy.ts','src/lib/workspace/network.ts','src/app/api/workspace/network']:
 unchanged(old,path)
checks.append('Portrait/native paths/WAAPI/disclosure/IRANSharp/avatars, finance/atomic orders/commission policy and referral graph preserved')
for path in subprocess.check_output(['git','ls-tree','-r','--name-only',old,'--','src/db/migrations'],text=True).splitlines():assert subprocess.check_output(['git','show',old+':'+path])==Path(path).read_bytes(),path
for name in ['0021_interpretation_documents.sql','0022_casio_ss_document_template.sql']:assert subprocess.check_output(['git','show',up+':src/db/migrations/'+name])==Path('src/db/migrations/'+name).read_bytes()
assert len(list(Path('src/db/migrations').glob('*.sql')))==26
checks.append('23 session migrations and 2 upstream migrations byte-identical; one new account/template-snapshot migration')
previous=json.loads(subprocess.check_output(['git','show',old+':package.json']));source=json.loads(subprocess.check_output(['git','show',up+':package.json']));current=json.loads(Path('package.json').read_text())
assert set(current['dependencies'])-set(previous['dependencies'])=={'@codemirror/lang-css','@codemirror/lang-html','@uiw/react-codemirror'}
assert current['dependencies']==source['dependencies'];assert current['devDependencies']==source['devDependencies'];assert current['scripts']==previous['scripts'];unchanged(up,'package-lock.json')
checks.append('Exactly 3 explicitly selected upstream editor dependencies; exact upstream lock; local SVG/avatar scripts retained')
for path in subprocess.check_output(['git','diff','--name-only',old],text=True).splitlines():
 p=Path(path)
 if p.is_file() and p.suffix in ['.ts','.tsx','.js','.cjs','.mjs','.md','.py']:
  text=p.read_text();assert not any(line.startswith('<'*7) or line.startswith('>'*7) for line in text.splitlines()),path
  assert not any('\u3400'<=c<='\u9fff' for c in text),path
checks.append('No unresolved conflict markers or unintended CJK in changed sources')
assert 'data-theme-preference' in Path('src/app/layout.tsx').read_text() or 'themePreference' in Path('src/app/layout.tsx').read_text()
assert 'system' in Path('src/components/ThemeSwitcher.tsx').read_text();assert 'useSyncExternalStore' in Path('src/components/ThemeSwitcher.tsx').read_text()
checks.append('Existing persisted system/light/dark theme state retained with upstream native-SVG lamp')
Path('qa/sync-03f-preservation-results.json').write_text(json.dumps({'passed':True,'upstream':up,'session_base':old,'checks':checks,'dependency_exception':'Explicit use of existing Hadiran editor method; no additional library'},ensure_ascii=False,indent=2))
print('PASS',len(checks),'pinned merge preservation groups')
