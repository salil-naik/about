import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Readable } from 'node:stream';
import { spawnSync } from 'node:child_process';

const temp = await mkdtemp(join(tmpdir(), 'learn-waitlist-test-'));
try {
  const outfile = join(temp, 'waitlist.mjs');
  await build({entryPoints:['server/waitlist.ts'],outfile,bundle:true,platform:'node',format:'esm'});
  const {submitInterest,handleInterest} = await import(pathToFileURL(outfile));
  const valid={name:'Test Builder',email:'  TEST@example.invalid ',whatsapp:'+1 (555) 123-4567',experience:'new',course:'building',consent:'yes'};
  const config={url:'https://test.chatgpt.site',serviceToken:'test-service-token',writeKey:'test-write-key'};
  let calls=0;
  const success=async (url, options)=>{
    calls++;
    assert.equal(String(url),'https://test.chatgpt.site/api/interest');
    assert.equal(options.headers['OAI-Sites-Authorization'],'Bearer test-service-token');
    assert.equal(options.headers.Authorization,'Bearer test-write-key');
    assert.equal(JSON.parse(options.body).email,'test@example.invalid');
    assert.equal(JSON.parse(options.body).whatsapp,'+15551234567');
    return Response.json({ok:true});
  };
  for(const body of [null,[],{}, {...valid,consent:'no'}, {...valid,email:'bad'}, {...valid,whatsapp:'5551234567'}, {...valid,whatsapp:'+123'}, {...valid,experience:'bad'}, {...valid,name:'x'.repeat(101)}]) {
    assert.equal((await submitInterest(body,config,success)).status,400);
  }
  assert.equal(calls,0);
  assert.equal((await submitInterest({...valid,website:'bot.example'},config,success)).status,200);
  assert.equal(calls,0);
  assert.equal((await submitInterest(valid,{},success)).status,503);
  assert.equal((await submitInterest(valid,config,success)).status,200);
  assert.equal((await submitInterest(valid,config,async()=>new Response('<html>Sign in</html>'))).status,503);
  assert.equal((await submitInterest(valid,config,async()=>Response.json({ok:false}))).status,503);
  assert.equal((await submitInterest(valid,config,async()=>{throw new Error('offline')})).status,503);
  async function request(method, body, contentType='application/json') {
    const req=Readable.from([body]);req.method=method;req.headers={'content-type':contentType};
    const headers={};let output;
    const res={statusCode:200,setHeader:(k,v)=>headers[k]=v,end:v=>output=v};
    await handleInterest(req,res,{});return {status:res.statusCode,body:JSON.parse(output),headers};
  }
  assert.equal((await request('GET','')).status,405);
  assert.equal((await request('POST','invalid')).status,400);
  assert.equal((await request('POST','{}','text/plain')).status,403);
  assert.equal((await request('POST','x'.repeat(8193))).status,413);
  // Verify the deployed SQL's uniqueness and the API's upsert policy using SQLite.
  const migration=await readFile('services/learn-waitlist/drizzle/0000_good_wallflower.sql','utf8');
  const addWhatsapp=await readFile('services/learn-waitlist/drizzle/0001_little_blur.sql','utf8');
  const sqlite=spawnSync('python3',['-c',`import sqlite3,sys
c=sqlite3.connect(':memory:');c.executescript(sys.stdin.read().replace('--> statement-breakpoint',''))
sql='INSERT INTO interests(email,name,experience,course,consent,consent_text,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name,updated_at=excluded.updated_at'
c.execute(sql,('test@example.invalid','First','new','building','yes','consent','first','first'))
c.execute(sql,('test@example.invalid','Updated','new','building','yes','consent','second','second'))
assert c.execute('SELECT count(*),name,created_at,updated_at FROM interests').fetchone()==(1,'Updated','first','second')
assert c.execute('SELECT whatsapp FROM interests').fetchone()==(None,)
`],{input:migration+'\n'+addWhatsapp,encoding:'utf8'});
  assert.equal(sqlite.status,0,sqlite.stderr);
  console.log('Waitlist checks passed: validation, private forwarding, save acknowledgments, failure handling, request limits, and duplicate-email storage.');
} finally { await rm(temp,{recursive:true,force:true}); }
