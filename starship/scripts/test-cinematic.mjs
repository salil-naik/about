import {build} from 'esbuild';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const directory=await mkdtemp(join(tmpdir(),'starship-check-'));
try {
  const result=await build({stdin:{contents:`
    import assert from 'node:assert/strict';
    import {createMission} from './src/missionModel';
    const m=createMission(15);
    const {advance:advanceMission,rate:cinematicRate,fraction:missionFraction,timeAt:missionTime,markers:storyMarkers,cameraRange,cameraOrbit,shipFix,end:CATCH}=m;
    import site from './src/data/starbase-osm.json';
    assert.equal(cinematicRate(-3),10);assert.equal(cinematicRate(141),1);
    assert.equal(cinematicRate(180),25);assert.equal(cinematicRate(250),600);assert.equal(cinematicRate(330),600);
    assert.equal(cinematicRate(81140),1);
    for(const t of [500,1570,2101,5266,26135,74515,77757])assert.equal(cinematicRate(t),600,'No orbital checkpoint slowdown');
    assert.equal(advanceMission(-3,10),97);assert.equal(advanceMission(141,1),142);
    assert.equal(advanceMission(349,.1),409);
    assert.ok(advanceMission(81127,1)<81140);
    assert.equal(advanceMission(0,2,100),200);
    // Integrating a frame in parts must preserve pacing boundaries.
    for(const t of [131,152,170,349,469,1559,5175,26044,74424,79819,81127,81135]){
      const once=advanceMission(t,2);
      let parts=t;for(let i=0;i<120;i++)parts=advanceMission(parts,1/60);
      assert.ok(Math.abs(parts-once)<1e-5);
    }
    for(const [t] of storyMarkers)assert.ok(Math.abs(missionTime(missionFraction(t))-t)<1e-6);
    for(const t of [0,1,29.5,58,141,175,300,CATCH]){
      assert.ok(Number.isFinite(cameraRange(t)));
      assert.ok(Math.abs(cameraRange(t+.001)-cameraRange(t))<.0001);
    }
    assert.equal(cameraOrbit(141),0);assert.ok(cameraOrbit(175)>0);
    assert.ok(cameraOrbit(350)>.99);assert.ok(Math.abs(shipFix(CATCH)[3]-.105)<1e-9);
    assert.ok(site.features.length>200);
    assert.ok(site.features.some(f=>f.id==='1207227015'));
    assert.ok(site.features.some(f=>f.tags.highway));
    assert.ok(site.features.some(f=>f.tags.natural==='water'));
    for(const f of site.features)for(const point of f.points)assert.ok(point.every(Number.isFinite));
    let t=-3,steps=0;while(t<CATCH&&steps<20000){t=advanceMission(t,.1);steps++;}
    assert.equal(t,CATCH);assert.ok(steps<20000);
    console.log('Cinematic pacing, frame invariance, chapter seeks, camera continuity, catch alignment and OSM geometry passed. Automatic duration: '+steps/10+' s.');
  `,resolveDir:process.cwd()},bundle:true,platform:'node',write:false});
  const file=join(directory,'check.cjs');await writeFile(file,result.outputFiles[0].contents);
  process.stdout.write(execFileSync(process.execPath,[file]));
}finally{await rm(directory,{recursive:true,force:true});}
