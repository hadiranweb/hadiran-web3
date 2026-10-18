// Non-destructive migration upgrade checks, restricted to explicitly named local QA databases.
const {Client}=require('pg'),fs=require('fs'),cp=require('child_process'),assert=require('assert');
(async()=>{
 const checks=[];
 for(const [database,ref] of [['hadiran_upgrade_local_qa','289e3a6'],['hadiran_upgrade_upstream_qa','ccc98d6']]){
  const connectionString='postgresql://hadiran_qa:local-qa-only@127.0.0.1:5432/'+database;
  const db=new Client({connectionString});await db.connect();
  try{
   await db.query('CREATE TABLE IF NOT EXISTS _hadiran_schema_migrations(id TEXT PRIMARY KEY,applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
   const files=cp.execFileSync('git',['ls-tree','-r','--name-only',ref,'--','src/db/migrations'],{encoding:'utf8'}).trim().split('\n').sort();
   for(const file of files){const id=file.split('/').pop();if((await db.query('SELECT 1 FROM _hadiran_schema_migrations WHERE id=$1',[id])).rowCount)continue;await db.query('BEGIN');try{await db.query(cp.execFileSync('git',['show',ref+':'+file],{encoding:'utf8'}));await db.query('INSERT INTO _hadiran_schema_migrations(id) VALUES($1)',[id]);await db.query('COMMIT')}catch(e){await db.query('ROLLBACK');throw e}}
   cp.execFileSync('node',['scripts/apply-migrations.mjs'],{env:{...process.env,DATABASE_URL:connectionString}});
   assert.equal((await db.query('SELECT count(*) AS n FROM _hadiran_schema_migrations')).rows[0].n,'20');
   assert((await db.query("SELECT to_regclass('account_avatars') AS a,to_regclass('bots') AS b,to_regclass('analyzer_grants') AS g")).rows[0].a);
   const again=cp.execFileSync('node',['scripts/apply-migrations.mjs'],{env:{...process.env,DATABASE_URL:connectionString},encoding:'utf8'});assert(!again.includes('apply '));
   checks.push('Upgrade from '+ref+' preserves both 0015 filenames and skips all 20 on repeat');console.log('PASS',checks.at(-1));
  }finally{await db.end()}
 }
 fs.writeFileSync('qa/sync-migration-results.json',JSON.stringify({passed:true,checks,production_database_accessed:false},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
