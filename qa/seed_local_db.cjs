/** DESTRUCTIVE fixture reset is hard-locked to a disposable local DB with the exact QA name. */
const {Pool}=require('pg');
const {randomBytes,scryptSync}=require('crypto');
const url=new URL(process.env.DATABASE_URL || 'http://missing');
if (!['127.0.0.1','localhost'].includes(url.hostname) || url.pathname!=='/hadiran_integration_qa') throw new Error('Refusing to reset a non-QA database');
const db=new Pool({connectionString:url.toString()});
(async()=>{
 const {rows}=await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_hadiran_schema_migrations'");
 if(rows.length) await db.query('TRUNCATE '+rows.map(r=>'"'+r.tablename.replaceAll('"','""')+'"').join(',')+' RESTART IDENTITY CASCADE');
 const salt=randomBytes(16);const hash=`scrypt$16384$8$1$${salt.toString('hex')}$${scryptSync('Integration-QA-2026',salt,32).toString('hex')}`;
 for (const [phone,role] of [['09121234567','owner'],['09121234568','member'],['09121234569','member']]) await db.query('INSERT INTO accounts(phone,role,password_hash,phone_verified_at) VALUES($1,$2,$3,NOW())',[phone,role,hash]);
 console.log('Reset and seeded ONLY hadiran_integration_qa');
})().finally(()=>db.end());
