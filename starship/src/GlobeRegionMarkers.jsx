import {useMission} from './MissionContext';
import React,{useRef} from 'react';
import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {xyz} from './flight15Geometry';
export default function GlobeRegionMarkers({time,onLocate}){
  const {returnCheck:activeReturnCheck}=useMission();
  const last=useRef(0),region=activeReturnCheck(time);
  useFrame(({camera,clock})=>{
    if(!region||clock.elapsedTime-last.current<.1)return;
    last.current=clock.elapsedTime;
    const p=new THREE.Vector3(...xyz([time,region.lat,region.lon,0])),screen=p.clone().project(camera);
    const ahead=p.clone().sub(camera.position).dot(camera.getWorldDirection(new THREE.Vector3()))>0;
    onLocate?.({label:region.name,kind:'return',detail:'Return option · '+region.country,x:(screen.x+1)*50,y:(1-screen.y)*50,visible:ahead&&p.dot(camera.position)>1&&Math.abs(screen.x)<.95&&Math.abs(screen.y)<.95});
  });
  return null;
}
