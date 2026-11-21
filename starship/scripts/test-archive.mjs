import {build} from 'esbuild';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const directory=await mkdtemp(join(tmpdir(),'archive-check-'));
try{
 const result=await build({stdin:{contents:`
 import assert from 'node:assert/strict';
 import * as THREE from 'three';
 import {createMission} from './src/missionModel';
 import {createSite} from './src/starbaseScene';
 import {cameraPose,blendCameraPose,followCameraPose} from './src/globeCamera';
 const finite=(x,msg)=>assert.ok(x.every(Number.isFinite),msg);
 for(let n=1;n<=15;n++){
  const m=createMission(n),site=createSite(m);
  assert.equal(m.number,n);assert.ok(m.end>m.start);assert.equal(m.boosterAvailable(0),false);
  assert.equal(m.shipCatch,n===15);assert.equal(m.boosterCatch,[5,7,8].includes(n));
  assert.equal(m.fraction(m.start),0);assert.equal(m.fraction(m.end),1);assert.equal(m.fraction(m.end+10),1);
  const times=[m.start,0,m.end,m.entry,m.landing,m.stageSeconds-.001,m.stageSeconds,m.stageSeconds+.001,m.boosterSeconds];
  for(let i=0;i<=200;i++)times.push(m.start+(m.end-m.start)*i/200);
  for(const t of times.filter(t=>Number.isFinite(t)&&t>=m.start&&t<=m.end)){
   finite(m.shipFix(t),'ship fix flight '+n);finite(m.shipOrigin(t).toArray(),'ship origin flight '+n);
   finite(m.boosterOrigin(t).toArray(),'booster origin flight '+n);
   finite(site.shipRotation(t).toArray(),'ship rotation flight '+n);finite(site.boosterRotation(t).toArray(),'booster rotation flight '+n);
   const pose=cameraPose(t,'ship',m);
   finite(pose.position.toArray(),'camera flight '+n);assert.ok(pose.position.length()>1,'Camera outside Earth on flight '+n);
   assert.ok(Math.abs(m.timeAt(m.fraction(t))-t)<1e-5,'Round-trip scrub flight '+n);
  }
  if(m.stage){
   const upper=m.shipOrigin(m.stageSeconds),lower=m.boosterOrigin(m.stageSeconds).addScaledVector(m.boosterAxis(m.stageSeconds),m.dimensions.booster*m.METRE);
   assert.ok(upper.distanceTo(lower)<1e-10,'Stage attachment flight '+n);
   for(let t=m.stageSeconds;t<=m.boosterSeconds;t+=1)assert.ok(m.boosterFix(t)[3]>=m.dimensions.booster/2000-.001,'Booster above ocean flight '+n);
  }else assert.equal(m.stageSeconds,Infinity);
  if(m.boosterCatch){
   const mechanism=site.catchMechanism(m.boosterSeconds),base=m.boosterOrigin(m.boosterSeconds).sub(site.siteOrigin).multiplyScalar(1/m.METRE).dot(site.siteUp);
   assert.ok(Math.abs(base+m.dimensions.booster*66.5/72.3-.225-(mechanism.height+.75))<.001,'Booster catch supports upper body');
  }
  if(m.measured)for(const p of m.samples){
   if(n===15&&p===m.samples.at(-1))continue;
   const fix=m.shipFix(p[0]);for(let j=1;j<4;j++)assert.ok(Math.abs(fix[j]-p[j])<1e-7,'Source fixes preserved on flight '+n);
  }
  const cover=cameraPose(-3,'ship',m,true),ground=cameraPose(-3,'ship',m);
  for(let u=0;u<=1;u+=.01)assert.ok(blendCameraPose(cover,ground,u).position.length()>1,'Opening approach outside Earth');
  assert.ok(m.events.every(e=>e.time>=m.start&&e.time<=m.end),'Events in flight '+n);
  const first=m.astronomyAt(0),again=m.astronomyAt(0);assert.deepEqual(first,again);
 }
 const a=createMission(1),b=createMission(15);assert.notDeepEqual(a.astronomyAt(0).moon,b.astronomyAt(0).moon,'Epoch cache separates flights');
 const m=createMission(15);
 // Fast ascent cannot leave the subject kilometres behind the camera target.
 for(const t of [10,30,60,105,145]){
  const desired=cameraPose(t,'ship',m),tracked=followCameraPose(cameraPose(t-1,'ship',m),desired,1/60);
  assert.ok(tracked.target.distanceTo(desired.target)<1e-12,'Close follow has no vehicle lag');
 }
 const entry=cameraPose(80139,'ship',m,false,true),earlier=cameraPose(80111,'ship',m,false,true);
 const anchored=followCameraPose(earlier,entry,1/60,true);
 assert.ok(anchored.target.distanceTo(entry.target)<1e-12,'Fast follow locks the ship target');
 assert.ok(anchored.position.clone().sub(anchored.target).normalize().distanceTo(entry.position.clone().sub(entry.target).normalize())<1e-12,'Fast follow locks viewing direction');

 for(const t of [18,132,141,153,175,240,489,79846,81128]){
   const p=cameraPose(t-.001,'ship',m),q=cameraPose(t+.001,'ship',m);
   assert.ok(p.position.distanceTo(q.position)<.001,'Continuous camera at '+t);
 }
 console.log('All 15 missions: finite geometry/cameras, staging continuity, source fixes, historical epochs, catch support, event bounds and scrub round trips passed.');
 `,resolveDir:process.cwd()},bundle:true,platform:'node',write:false});
 const file=join(directory,'check.cjs');await writeFile(file,result.outputFiles[0].contents);process.stdout.write(execFileSync(process.execPath,[file]));
}finally{await rm(directory,{recursive:true,force:true});}
