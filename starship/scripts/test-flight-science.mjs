import {build} from 'esbuild';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const directory=await mkdtemp(join(tmpdir(),'flight-science-'));
try{
 const result=await build({stdin:{contents:`
  import assert from 'node:assert/strict';
  import * as THREE from 'three';
  import {samples,positionAt,xyz,dimensions,earthKm} from './src/flight15Geometry';
  import {shipFix,boosterFix,shipOrigin,shipAxis,boosterOrigin,boosterAxis,SEPARATION,CATCH,METRE} from './src/globeMission';
  import {cameraPose,cameraNearPlane,blendCameraPose} from './src/globeCamera';
  import {activeReturnCheck,returnChecks} from './src/returnRegions';
  import {astronomyAt} from './src/missionAstronomy';
  import provenance from './src/data/mission-provenance.json';
  import {catchMechanism,catchPosition,shipRotation,siteRotation,siteOrigin,TOWER_POSITION,armYaw,CATCH_PIN_HEIGHT,CATCH_PIN_HALF_HEIGHT,ARM_HALF_HEIGHT} from './src/starbaseScene';
  import {geoContains} from 'd3-geo';
  import {feature} from 'topojson-client';
  import world from 'world-atlas/countries-10m.json';
  assert.equal(provenance.matchedFixes,provenance.totalFixes);assert.equal(provenance.totalFixes,samples.length);
  // Keep every measured point exact; only terminal catch timing is reconstructed.
  for(const p of samples){const actual=positionAt(p[0]);for(let i=1;i<4;i++)assert.ok(Math.abs(actual[i]-p[i])<1e-8,'Measured fix must be retained');}
  function derivative(fn,t){const a=fn(t-.001),b=fn(t+.001);return a.slice(1).map((v,i)=>(b[i+1]-v)/.002);}
  for(const t of [29.5,59.5,149.5,81096.8,81136.8]){
    const left=derivative(shipFix,t-.002),right=derivative(shipFix,t+.002);
    for(let i=0;i<3;i++)assert.ok(Math.abs(left[i]-right[i])<.002,'C1 interpolation prevents fix-boundary staggering');
  }
  for(let t=81128;t<=CATCH;t+=.1)assert.ok(shipFix(t)[3]>=.105-1e-9,'Catch interpolation must not sink through the tower');
  assert.equal(dimensions.tower,144.5);assert.equal(METRE*earthKm*1000,1);
  const mechanism=catchMechanism(CATCH),towerInverse=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),armYaw).invert();
  assert.ok(mechanism.gap-.625>dimensions.diameter/2,'Catch rails must clear the barrel instead of forming a platform below it');
  for(const side of [-1,1]){
    const pin=new THREE.Vector3(side*5.2,CATCH_PIN_HEIGHT,0).multiplyScalar(METRE).applyQuaternion(shipRotation(CATCH)).add(shipOrigin(CATCH));
    const local=pin.sub(siteOrigin).applyQuaternion(siteRotation.clone().invert()).multiplyScalar(1/METRE).sub(TOWER_POSITION).applyQuaternion(towerInverse);
    assert.ok(Math.abs(local.y-CATCH_PIN_HALF_HEIGHT-(mechanism.height+ARM_HALF_HEIGHT))<.001,'Side lifting pins rest on the top of the catch rails');
    assert.ok(local.x>0&&local.x<38,'Ship lies within the reach of the arms');
    assert.ok(Math.abs(Math.abs(local.z)-mechanism.gap)<1.2+.625,'Pins overlap the rails on both sides of the barrel');
  }
  assert.ok(CATCH_PIN_HEIGHT>30,'Engine section must hang freely well below the support');

  const splitShipBase=shipOrigin(SEPARATION),boosterTop=boosterOrigin(SEPARATION).addScaledVector(boosterAxis(SEPARATION),dimensions.booster*METRE);
  assert.ok(splitShipBase.distanceTo(boosterTop)<1e-12,'Tilted stages meet at the exact rendered attachment point');
  const attached=t=>shipOrigin(t).addScaledVector(shipAxis(t),-dimensions.booster*METRE);
  const before=attached(SEPARATION-.001),after=boosterOrigin(SEPARATION+.001);
  assert.ok(before.distanceTo(after)/METRE<5,'Detachment has no metre-scale snap');
  for(const t of [141,146,164,190,330,395]){
    const a=boosterOrigin(t-.001),b=boosterOrigin(t+.001);
    assert.ok(a.distanceTo(b)/METRE<5,'Booster motion remains continuous at phase boundaries');
    assert.ok(boosterAxis(t-.001).angleTo(boosterAxis(t+.001))<.001,'Booster attitude has no phase snap');
  }
  const terminal=boosterFix(395);
  assert.ok(Math.abs(terminal[3]*1000-dimensions.booster/2)<.001,'Booster base reaches sea level with its centre half a body length above it');
  assert.ok(new THREE.Vector3(...xyz(boosterFix(395))).distanceTo(new THREE.Vector3(...xyz(boosterFix(394.999))))/METRE<.001,'Illustrated touchdown velocity tends to zero');
  for(let t=141;t<=395;t+=.1)assert.ok(boosterFix(t)[3]>=dimensions.booster/2000-1e-8,'Illustrative booster track never passes below the sea');
  for(let t=175;t<=320;t+=.1)assert.ok(cameraPose(t).position.length()>1,'Orbital pullback stays outside Earth');
  const from=cameraPose(200,'booster'),to=cameraPose(200,'ship');
  for(let u=0;u<=1;u+=.01)assert.ok(blendCameraPose(from,to,u).position.length()>=1,'Follow-target transition cannot pass through Earth');
  assert.ok(blendCameraPose(from,to,0).position.distanceTo(from.position)<1e-12);
  assert.ok(blendCameraPose(from,to,1).position.distanceTo(to.position)<1e-12);
  const boostStep=new THREE.Vector3(...xyz(boosterFix(SEPARATION+.001))).sub(new THREE.Vector3(...xyz(boosterFix(SEPARATION))));
  assert.ok(boostStep.length()*earthKm<.01,'Booster cannot teleport kilometres on separation');
  const ground=cameraPose(-3),observerHeight=(ground.position.length()-1)*earthKm*1000;
  assert.ok(observerHeight>1.9&&observerHeight<2.1,'Opening camera is at a 2 m observer height');
  for(const region of returnChecks){assert.equal(activeReturnCheck(region.time).name,region.name);}
  assert.equal(activeReturnCheck(5266).country,'United States');assert.equal(activeReturnCheck(26135).country,'Chile');
  const countries=feature(world,world.objects.countries).features;
  const chile=countries.find(f=>f.properties.name==='Chile'),india=countries.find(f=>f.properties.name==='India');
  const chileRegion=activeReturnCheck(26135),currentShip=shipFix(26135);
  assert.ok(geoContains(chile,[chileRegion.lon,chileRegion.lat]),'Chile annotation lies in the actual Chile polygon');
  assert.ok(geoContains(india,[currentShip[2],currentShip[1]]),'At the return decision the published ship track is over India');
  assert.ok(!geoContains(chile,[currentShip[2],currentShip[1]]),'A scheduled return decision is not a Chile flyover');

  for(const target of ['moon','sun']){
    const pose=cameraPose(0,target),regular=cameraPose(0);
    assert.ok(pose.position.distanceTo(regular.position)<1e-12,'Looking at a body cannot move that body or the observer');
    const near=cameraNearPlane(pose.position,pose.target);
    assert.ok(near*earthKm*1000<.11,'Celestial viewing near the pad retains nearby ground and the horizon');
    assert.ok(near>0,'Near plane remains positive');
    const camera=new THREE.PerspectiveCamera(45,1456/852,1e-8,50000);camera.position.copy(pose.position);camera.up.copy(pose.up);camera.lookAt(pose.target);camera.updateMatrixWorld();
    const body=new THREE.Vector3(...astronomyAt(0)[target]),screen=body.clone().project(camera);
    assert.ok(Math.abs(screen.x)<1e-7&&Math.abs(screen.y)<1e-7,'Actual celestial direction projects to optical axis');
    if(target==='moon'){
      const astro=astronomyAt(0),pixels=astro.moonRadius*852/(body.distanceTo(pose.position)*Math.tan(Math.PI/8));
      assert.ok(pixels>8&&pixels<11,'Physical lunar angular size is approximately 9 pixels at this viewport, never enlarged');
    }
  }
  console.log('Flight science: published fixes, smooth sample/catch interpolation, scale, separation continuity, 2 m ground camera, return-region geography and unmodified Sun/Moon view directions passed.');
 `,resolveDir:process.cwd()},bundle:true,platform:'node',write:false});
 const file=join(directory,'check.cjs');await writeFile(file,result.outputFiles[0].contents);process.stdout.write(execFileSync(process.execPath,[file]));
}finally{await rm(directory,{recursive:true,force:true});}
