import {useMission} from './MissionContext';
import React,{useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import StarbaseSite from './StarbaseSite';
import {xyz} from './flight15Geometry';
import {StarshipModel,SuperHeavyModel} from './VehicleModels';
import LocalTerrain from './LocalTerrain';
import PadVapor from './PadVapor';
const up=new THREE.Vector3(0,1,0);
function Outline({kind='cylinder',args,position,rotation,color='#dce9e3'}){
  const geometry=useMemo(()=>kind==='box'?new THREE.BoxGeometry(...args):kind==='cone'?new THREE.ConeGeometry(...args):new THREE.CylinderGeometry(...args),[kind,...args]);
  const edges=useMemo(()=>new THREE.EdgesGeometry(geometry,25),[geometry]);
  useEffect(()=>()=>{geometry.dispose();edges.dispose();},[geometry,edges]);
  return <group position={position} rotation={rotation}><mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color="#8d9b9c" roughness={.65} metalness={.3}/></mesh><lineSegments geometry={edges}><lineBasicMaterial color={color} transparent opacity={.28}/></lineSegments></group>;
}
function Tower({time}){
  const {dimensions,site:{catchMechanism,TOWER_POSITION,armYaw}}=useMission();
  const {height:armHeight,gap:armGap}=catchMechanism(time);
  const height=dimensions.tower,span=(height-2)/12;
  return <group position={TOWER_POSITION} rotation={[0,armYaw,0]}>
    {[[-6,-6],[-6,6],[6,-6],[6,6]].map(([x,z],i)=><Outline key={i} kind="box" args={[1.4,height-2,1.4]} position={[x,(height-2)/2,z]}/>)}
    <Outline kind="box" args={[3.5,height-3,3.5]} position={[-3,(height-3)/2,0]}/>
    {Array.from({length:12},(_,i)=><group key={i}>
      <Outline kind="box" args={[13,.6,13]} position={[0,i*span+1,0]}/>
      {[-1,1].flatMap(face=>[-1,1].map(diagonal=><React.Fragment key={face+':'+diagonal}>
        <Outline kind="box" args={[.4,Math.hypot(12,span),.4]} position={[0,i*span+span/2,face*6]} rotation={[0,0,diagonal*Math.atan2(12,span)]}/>
        <Outline kind="box" args={[.4,Math.hypot(12,span),.4]} position={[face*6,i*span+span/2,0]} rotation={[diagonal*Math.atan2(12,span),0,0]}/>
      </React.Fragment>))}
    </group>)}
    <Outline kind="box" args={[15,2,15]} position={[0,height-1,0]}/>
    {[-1,1].map(k=><group key={k} position={[0,armHeight,k*armGap]}>
      <Outline kind="box" args={[38,1.5,1.25]} position={[19,0,0]}/>
      <Outline kind="box" args={[36,.65,.8]} position={[18,-3.2,0]}/>
      {Array.from({length:7},(_,i)=><Outline key={i} kind="box" args={[.32,5,.32]} position={[2+i*5.2,-1.6,0]} rotation={[0,0,i%2?.96:-.96]}/>)}
      <Outline kind="box" args={[3,2.2,.5]} position={[21,1.6,k*.8]}/>
    </group>)}
  </group>;
}
function Locator({fix,label,detail,onLocate}){
  useFrame(({camera})=>{
    const p=new THREE.Vector3(...xyz(fix)),distance=camera.position.distanceTo(p);
    const projected=p.clone().project(camera);
    const ahead=p.clone().sub(camera.position).dot(camera.getWorldDirection(new THREE.Vector3()))>0;
    onLocate?.({label,detail,kind:'vehicle',x:(projected.x+1)*50,y:(1-projected.y)*50,visible:ahead&&p.dot(camera.position)>1&&distance>.0005&&Math.abs(projected.x)<1&&Math.abs(projected.y)<1});
  });
  return null;
}
export default function GlobeVehicles({time,overview,compact,onLocate}){
  const mission=useMission();
  const {shipFix,shipOrigin,boosterFix,boosterOrigin,boosterAxis,METRE,dimensions,stageSeconds:SEPARATION,end:CATCH,landing,cutoff,boosterSeconds,boosterAvailable,site:{siteOrigin,siteRotation,shipRotation,boosterRotation,launchPosition}}=mission;
  const fix=shipFix(time);
  const rotation=shipRotation(time);
  const boost=boosterFix(time),boostRotation=boosterRotation(time);
  const shipEng=mission.historical?.observationAt('ship',time).eng?.value;
  const boostEng=mission.historical?.observationAt('booster',time).eng?.value;
  const shipBurn=time<mission.flightEnd&&(shipEng!=null?shipEng>0:time<cutoff||time>=landing&&time<CATCH);
  const boostBurn=time<boosterSeconds&&(boostEng!=null?boostEng>0:time<SEPARATION+41||time>=boosterSeconds-25);
  const shipOpacity=mission.historical&&mission.shipOutcomeType==='lost'?1-THREE.MathUtils.smootherstep(time,mission.flightEnd,mission.flightEnd+5):1;
  const showSite=!compact||!overview&&(time<600||mission.shipCatch&&time>=landing-180);

  return <>
    {showSite&&<group position={siteOrigin} quaternion={siteRotation} scale={METRE}>
      <LocalTerrain compact={compact}/>
      {time>=-3&&time<18&&<group position={launchPosition}><PadVapor time={time}/></group>}
      <StarbaseSite/>
      <Tower time={time}/>
      <group position={launchPosition}><Outline kind="cylinder" args={[11,14,8.5,16]} position={[0,4.25,0]}/></group>

    </group>}
    <group position={shipOrigin(time)} quaternion={rotation} scale={METRE}>
      {mission.shipCatch&&time>=landing+10&&<PadVapor time={time-landing+81136} landing/>}
      {((time>=-3&&time<cutoff)||(time>=landing&&time<CATCH))&&<pointLight position={[0,time<SEPARATION?-dimensions.booster:0,0]} color="#ffb57a" intensity={.65} distance={80*METRE} decay={0}/>}
      <group scale={[1,dimensions.ship/52.1,1]}><StarshipModel opacity={shipOpacity} burn={time>=SEPARATION-2&&shipBurn?time>=landing?'landing':true:false} power={time>=CATCH-4?1-THREE.MathUtils.smootherstep(time,CATCH-4,CATCH):1}/></group>
      {time<SEPARATION&&<group position={[0,-dimensions.booster,0]}><group scale={[1,dimensions.booster/72.3,1]}><SuperHeavyModel burn={time>=-3&&(boostEng==null||boostEng>0)} opacity={shipOpacity}/></group></group>}
    </group>
    {boosterAvailable(time)&&<group position={boosterOrigin(time)} quaternion={boostRotation} scale={METRE}><group scale={[1,dimensions.booster/72.3,1]}><SuperHeavyModel burn={boostBurn?(time>=boosterSeconds-30?'landing':true):false} power={time>=boosterSeconds-5?1-THREE.MathUtils.smootherstep(time,boosterSeconds-5,boosterSeconds):1} opacity={1-THREE.MathUtils.smootherstep(time,boosterSeconds+(mission.boosterOutcomeType==='impact'?.1:2),boosterSeconds+(mission.boosterOutcomeType==='impact'?2.5:12))}/></group></group>}
    <Locator onLocate={onLocate} fix={fix} detail={mission.historical?'Estimated position':undefined} label={time<SEPARATION?'Starship / Super Heavy':'Starship'}/>
    {boosterAvailable(time)&&<Locator onLocate={onLocate} fix={boost} label="Super Heavy" detail={mission.historical?'Estimated ground track':time>=boosterSeconds?'End of illustrated route · not measured':mission.boosterCatch?'Illustrative tower return':'Illustrative offshore return'}/>}
  </>;
}
