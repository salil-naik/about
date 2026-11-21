import React,{useMemo,useRef,useEffect} from 'react';
import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
function vaporTexture(){
  const c=document.createElement('canvas');c.width=c.height=128;
  const ctx=c.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,'#e8eeecb0');gradient.addColorStop(.35,'#e8eeec70');gradient.addColorStop(1,'#e8eeec00');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);
}
export default function PadVapor({time,landing=false}){
  const group=useRef(),texture=useMemo(vaporTexture,[]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  useFrame(({clock})=>{
    const strength=landing?THREE.MathUtils.smoothstep(time,81146,81154):Math.sin(Math.PI*THREE.MathUtils.clamp((time+3)/21,0,1));
    group.current?.children.forEach((sprite,i)=>{
      const cycle=(clock.elapsedTime*.15+i*.131)%1,angle=i*2.399;
      const spread=landing?2+cycle*6:9+cycle*27;
      sprite.position.set(Math.cos(angle)*spread+cycle*(landing?4:15),(landing?-2:8)+cycle*(landing?6:10),Math.sin(angle)*spread);
      sprite.scale.setScalar((landing?5:21)*(1+cycle));
      sprite.material.opacity=strength*(landing?.14:.2)*Math.sin(Math.PI*cycle);
    });
  });
  return <group ref={group}>{Array.from({length:landing?7:12},(_,i)=><sprite key={i}><spriteMaterial map={texture} transparent depthWrite={false} opacity={0} color="#e4e9e5"/></sprite>)}</group>;
}
