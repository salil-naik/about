import React,{useMemo,useRef,useEffect} from 'react';
import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {dimensions} from './flight15Geometry';
import {CATCH_PIN_HEIGHT} from './starbaseScene';

// Metre-sized, original procedural models. Silhouettes and hardware are
// representative rather than a manufacturing CAD model of Ship 42/Booster 19.
function Steel({dark=false}){
  return <meshStandardMaterial color={dark?'#303b42':'#bccbd0'} metalness={dark?.2:.48} roughness={dark?.72:.38} emissive={dark?'#647986':'#879da9'} emissiveIntensity={dark?.08:.07}/>;
}
function Seam({y,radius=4.51,heavy=false}){
  return <mesh castShadow receiveShadow position={[0,y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[radius,heavy?.09:.025,4,64]}/><meshBasicMaterial color={heavy?'#b6c7cc':'#758e9a'} transparent opacity={heavy?.7:.35}/></mesh>;
}
function Fin({fore=false,angle=0}){
  const geometry=useMemo(()=>{
    const shape=new THREE.Shape();
    const points=fore?[[4.3,33],[4.3,39],[6.9,37],[7.1,33.8]]:[[4.3,2.5],[4.3,14.5],[9,8.5],[9,3.8]];
    points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
    const g=new THREE.ExtrudeGeometry(shape,{depth:fore?.28:.4,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.1,bevelThickness:.08});g.translate(0,0,fore?-.14:-.2);return g;
  },[fore]);
  const edges=useMemo(()=>new THREE.EdgesGeometry(geometry,30),[geometry]);
  useEffect(()=>()=>{geometry.dispose();edges.dispose();},[geometry,edges]);
  return <group rotation={[0,angle,0]}><mesh castShadow receiveShadow geometry={geometry}><Steel dark/></mesh><lineSegments geometry={edges}><lineBasicMaterial color="#a6bdc7" transparent opacity={.65}/></lineSegments><mesh castShadow receiveShadow position={[4.35,fore?36:8,0]}><cylinderGeometry args={[.23,.23,fore?6:11,8]}/><Steel/></mesh></group>;
}
function Engine({x,z,vacuum=false}){
  return <group position={[x,1.65,z]}>
    <mesh castShadow receiveShadow position={[0,-.65,0]}><cylinderGeometry args={[vacuum?.45:.3,vacuum?1.15:.64,1.8,20,1,true]}/><meshStandardMaterial color="#536470" metalness={.65} roughness={.42} side={THREE.DoubleSide} emissive="#33434e" emissiveIntensity={.2}/></mesh>
    <mesh castShadow receiveShadow position={[0,.48,0]}><cylinderGeometry args={[.3,.3,.8,12]}/><Steel/></mesh>
    <mesh castShadow receiveShadow position={[0,-1.56,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[vacuum?1.15:.64,.055,5,20]}/><meshBasicMaterial color="#8a9da6"/></mesh>
  </group>;
}
const flameVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const flameFragment=`uniform float tick;uniform float power;varying vec2 vUv;void main(){
 float along=vUv.y;
 float ripple=.86+.14*sin(along*42.-tick*21.+sin(vUv.x*30.+tick*8.));
 float fade=smoothstep(0.,.12,along)*(.38+.5*along)*power;
 vec3 color=mix(vec3(.5,.65,1.),vec3(1.,.78,.5),smoothstep(.35,.95,along));
 color=mix(color,vec3(1.,.97,.87),pow(along,2.));
 gl_FragColor=vec4(color,fade*ripple);
}`;
function Exhaust({length=45,power=1}){
  const group=useRef(),material=useRef();
  const uniforms=useMemo(()=>({tick:{value:0},power:{value:power}}),[]);
  uniforms.power.value=power;
  const profile=useMemo(()=>[new THREE.Vector2(0,-length),new THREE.Vector2(1.1,-length*.82),new THREE.Vector2(2.4,-length*.5),new THREE.Vector2(3.5,-length*.16),new THREE.Vector2(2.4,-1.3)],[length]);
  useFrame(({clock})=>{if(material.current){material.current.uniforms.tick.value=clock.elapsedTime;material.current.uniforms.power.value=power;}if(group.current)group.current.scale.y=1+.035*Math.sin(clock.elapsedTime*23);});
  return <group ref={group}>
    <mesh><latheGeometry args={[profile,32]}/><shaderMaterial ref={material} vertexShader={flameVertex} fragmentShader={flameFragment} uniforms={uniforms} transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending}/></mesh>
    <mesh position={[0,-length*.22-1,0]} rotation={[Math.PI,0,0]}><coneGeometry args={[1.5,length*.44,24]}/><meshBasicMaterial color="#f5f2de" transparent opacity={.55*power} depthWrite={false} blending={THREE.AdditiveBlending}/></mesh>
  </group>;
}
export function StarshipModel({burn=false,power=1,opacity=1}){
  const group=useRef();
  useFrame(()=>{group.current?.traverse(node=>{if(!node.material)return;for(const m of Array.isArray(node.material)?node.material:[node.material]){if(m.isShaderMaterial||m.blending===THREE.AdditiveBlending)continue;m.userData.initialTransparent??=m.transparent;m.userData.initialOpacity??=m.opacity;m.transparent=opacity<1||m.userData.initialTransparent;m.opacity=m.userData.initialOpacity*opacity;}});});
  const nose=useMemo(()=>Array.from({length:25},(_,i)=>{const u=i/24;return new THREE.Vector2(4.5*Math.cos(u*Math.PI/2),38+u*14.1);}),[]);
  return <group ref={group}>
    <mesh castShadow receiveShadow position={[0,19,0]}><cylinderGeometry args={[4.5,4.5,38,64,1,true]}/><Steel/></mesh>
    <mesh><latheGeometry args={[nose,64]}/><Steel/></mesh>
    <mesh castShadow receiveShadow position={[0,19,0]} rotation={[0,Math.PI/2,0]}><cylinderGeometry args={[4.515,4.515,37.7,40,1,true,0,Math.PI]}/><Steel dark/></mesh>
    {[-1,1].map(k=><mesh castShadow key={'pin'+k} position={[k*5.2,CATCH_PIN_HEIGHT,0]}><boxGeometry args={[2.4,.45,.65]}/><Steel/></mesh>)}
    {[0,Math.PI].map(a=><React.Fragment key={a}><Fin angle={a}/><Fin angle={a} fore/></React.Fragment>)}
    {[1,7,13,19,25,31,37.9].map(y=><Seam key={y} y={y} heavy={y===1||y===37.9}/>)}
    {[0,1,2].map(i=><React.Fragment key={i}><Engine x={Math.cos(i*2*Math.PI/3)*1.25} z={Math.sin(i*2*Math.PI/3)*1.25}/><Engine vacuum x={Math.cos((i+.5)*2*Math.PI/3)*2.9} z={Math.sin((i+.5)*2*Math.PI/3)*2.9}/></React.Fragment>)}
    {burn&&<Exhaust length={burn==='landing'?18:45} power={power}/>}
  </group>;
}
function GridFin({angle}){
  return <group rotation={[0,angle,0]} position={[0,66.5,0]}>
    <mesh castShadow receiveShadow position={[6.7,0,0]}><boxGeometry args={[4.8,.4,3.3]}/><Steel dark/></mesh>
    {[-1.5,-.5,.5,1.5].map(x=><mesh castShadow receiveShadow key={'x'+x} position={[6.7+x,.3,0]}><boxGeometry args={[.1,.65,3.4]}/><Steel/></mesh>)}
    {[-1.6,-.8,0,.8,1.6].map(z=><mesh castShadow receiveShadow key={'z'+z} position={[6.7,.3,z]}><boxGeometry args={[4.8,.65,.1]}/><Steel/></mesh>)}
    <mesh castShadow receiveShadow position={[4.7,0,0]}><boxGeometry args={[1.2,1.2,1]}/><Steel/></mesh>
  </group>;
}
export function SuperHeavyModel({burn=false,power=1,opacity=1}){
  const group=useRef();
  useFrame(()=>{group.current?.traverse(node=>{
    if(!node.material)return;
    for(const m of Array.isArray(node.material)?node.material:[node.material]){
      // Exhaust keeps its own additive fade and is disabled at the end of burn.
      if(m.isShaderMaterial||m.blending===THREE.AdditiveBlending)continue;
      m.transparent=opacity<1;m.opacity=opacity;
    }
  });});
  const engines=useMemo(()=>[...[0,1,2].map(i=>[Math.cos(i*2*Math.PI/3)*.8,Math.sin(i*2*Math.PI/3)*.8]),...Array.from({length:10},(_,i)=>[Math.cos(i*2*Math.PI/10)*2,Math.sin(i*2*Math.PI/10)*2]),...Array.from({length:20},(_,i)=>[Math.cos(i*2*Math.PI/20)*3.5,Math.sin(i*2*Math.PI/20)*3.5])],[]);
  return <group ref={group}>
    <mesh castShadow receiveShadow position={[0,dimensions.booster/2,0]}><cylinderGeometry args={[4.5,4.5,dimensions.booster,64,1,true]}/><Steel/></mesh>
    <mesh castShadow receiveShadow position={[0,71,0]}><cylinderGeometry args={[4.53,4.53,2.5,64,1,true]}/><Steel dark/></mesh>
    {Array.from({length:12},(_,i)=><Seam key={i} y={2+i*6} heavy={i===0||i===11}/>)}
    {[0,2*Math.PI/3,4*Math.PI/3].map(a=><GridFin key={a} angle={a}/>)}
    {[-1,1].map(side=><mesh key={'support'+side} castShadow position={[side*5.2,66.5,0]}><boxGeometry args={[2.4,.45,.9]}/><Steel/></mesh>)}
    {engines.map(([x,z],i)=><Engine key={i} x={x} z={z}/>)}
    {burn&&<Exhaust length={burn==='landing'?25:55} power={power}/>}
  </group>;
}
