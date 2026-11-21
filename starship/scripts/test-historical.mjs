import {build} from 'esbuild';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const directory=await mkdtemp(join(tmpdir(),'historical-check-'));
try{
 const result=await build({stdin:{contents:`
 import assert from 'node:assert/strict';
 import * as THREE from 'three';
 import {createMission} from './src/missionModel';
 import {historicalData,observationAt} from './src/historicalTelemetry';
 const soft=[4,5,6,10,11,12];
 assert.equal(observationAt([[10,12,20],[20,22,30]],15),null,'A gap stays unavailable');
 assert.equal(observationAt([[10,12,20],[20,22,30]],11).value,20);
 for(let n=1;n<=12;n++){
  const m=createMission(n),h=m.historical;
  assert.ok(h);assert.equal(m.measured,false,'Webcast data is not a measured GPS track');
  assert.match(h.data.sha256,/^[a-f0-9]{64}$/);
  assert.ok(h.data.observations.ship.alt.length>20);
  for(const vehicle of ['ship','booster'])for(const [channel,rows] of Object.entries(h.data.observations[vehicle])){
   for(let i=0;i<rows.length;i++){
    const [a,b,v]=rows[i];assert.ok([a,b,v].every(Number.isFinite));assert.ok(a<=b);assert.ok(!i||a>=rows[i-1][0]);
    const observed=observationAt(rows,a);assert.ok(observed&&Number.isFinite(observed.value));
   }
  }
  assert.equal(m.events.find(e=>e.name==='Estimated max Q')?.quality,'telemetry-derived');
  assert.ok(m.events.every(e=>e.quality&&e.url));
  assert.equal(m.shipContactTime!=null,soft.includes(n));
  assert.equal(m.events.some(e=>e.name==='Ship splashdown'),soft.includes(n),'Losses cannot become landings');
  if(!soft.includes(n))assert.ok(m.shipFix(m.flightEnd)[3]>1,'Lost ship stays above Earth, no invented contact');
  else {
   const contact=m.shipContactTime;
   assert.ok(Math.abs(m.shipOrigin(contact).length()-1)<1e-7,'Engine base meets water at contact');
   assert.ok(m.shipAxis(contact+10).angleTo(m.shipAxis(contact))>1,'Ship settles sideways after contact');
   assert.ok(m.shipOrigin(contact+11).length()>1-1e-7,'No whole-vehicle sinking');
   for(let t=contact-30;t<=contact+12;t+=.25){assert.ok(Number.isFinite(m.cameraRange(t)));assert.ok(m.shipFix(t)[3]>=0);}
  }
  const apogee=Math.max(...m.samples.map(p=>p[3]));
  const rawPeak=Math.max(...h.data.observations.ship.alt.filter(p=>p[0]<=m.flightEnd).map(p=>p[2]));
  assert.ok(Math.abs(apogee-rawPeak)<3,'Fitted altitude agrees with the quantized webcast apogee on flight '+n);
  for(const t of [m.stageSeconds-1,m.stageSeconds+10,m.boosterSeconds-31,m.boosterSeconds-9,m.boosterSeconds+1]){
   if(!Number.isFinite(t))continue;
   let split=t;for(let i=0;i<120;i++)split=m.advance(split,1/60,null,'booster');
   assert.ok(Math.abs(split-m.advance(t,2,null,'booster'))<1e-5,'Frame invariant booster recovery pacing');
  }
 }
 const a=createMission(4),b=createMission(5);
 assert.equal(a.boosterSeconds,444,'SpaceX reported Flight 4 booster splashdown');
 assert.equal(a.events.find(e=>e.name==='Booster splashdown').quality,'reported');
 assert.equal(b.shipContactTime,3940,'SpaceX reported Flight 5 ship splashdown');
 assert.equal(b.events.find(e=>e.name==='Ship splashdown').quality,'reported');
 assert.equal(createMission(2).historical.coverageAt(200,'booster'),'Telemetry gap · estimated profile');
 assert.equal(createMission(2).events.find(e=>e.name==='Booster lost during boostback').quality,'reported-approximate');
 for(const n of [10,11,12]){const m=createMission(n),cutoff=m.events.find(e=>e.name==='Booster engine cutoff');assert.ok(cutoff.time<m.stageSeconds);assert.equal(cutoff.quality,'estimated');}
 assert.equal(createMission(9).boosterSamples,null,'No measured booster return is fabricated when the record ends at staging');
 assert.equal(createMission(12).boosterOutcomeType,'impact');
 assert.equal(createMission(12).historical.observationAt('booster',390).ended,true,'Frozen post-impact readouts cannot masquerade as live telemetry');
 assert.equal(createMission(10).shipContactTime,3998);assert.equal(createMission(11).shipContactTime,3976);
 assert.equal(createMission(10).events.find(e=>e.name==='Ship splashdown').quality,'catalog-reported');
 for(const n of [13,14]){const m=createMission(n);assert.ok(m.shipContactTime>=m.sourceEnd);assert.ok(m.positionEstimatedAt(m.sourceEnd+1));assert.ok(Math.abs(m.shipOrigin(m.shipContactTime).length()-1)<1e-7);}
 const impact=createMission(12),contact=impact.boosterContactTime;assert.ok(impact.boosterFix(contact-.1)[3]-impact.boosterFix(contact)[3]>.005,'Hard impact cannot ease to zero descent velocity');
 assert.equal(createMission(15).rate(26135),600,'Earlier-flight changes retain uninterrupted orbital cruise');
 console.log('Historical observations, missing-data labels, source confidence, apogees, recovery outcomes, water contact, settling and frame-independent recovery playback passed.');
 `,resolveDir:process.cwd()},bundle:true,platform:'node',write:false});
 const file=join(directory,'check.cjs');await writeFile(file,result.outputFiles[0].contents);process.stdout.write(execFileSync(process.execPath,[file]));
}finally{await rm(directory,{recursive:true,force:true});}
