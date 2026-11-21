import {useMission} from './MissionContext';
import React,{useMemo,useRef,useEffect} from 'react';
import * as THREE from 'three';
import {useFrame,useThree} from '@react-three/fiber';
import {METRE} from './globeMission';
const vertex=`varying vec3 worldPoint;void main(){vec4 p=modelMatrix*vec4(position,1.);worldPoint=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`;
const fragment=`varying vec3 worldPoint;uniform vec3 up;uniform vec3 sun;uniform float strength;uniform float daylight;uniform float sunAngle;
void main(){vec3 d=normalize(worldPoint-cameraPosition);float h=dot(d,up);
 float haze=1.-smoothstep(-.04,.65,h);
 vec3 sky=mix(vec3(.19,.32,.43),vec3(.58,.66,.67),haze);
 float glow=pow(max(0.,dot(d,sun)),32.);
 sky+=vec3(.14,.10,.045)*glow;
 float disc=smoothstep(cos(sunAngle),cos(sunAngle*.92),dot(d,sun));
 sky=mix(sky,vec3(1.,.91,.72),disc);
 gl_FragColor=vec4(sky,strength*daylight);
}`;
export default function CoastalAtmosphere({time,compact}){
  const {astronomyAt,site:{siteOrigin,siteUp}}=useMission();
  const material=useRef(),hemi=useRef(),shadowLight=useRef();
  const {scene}=useThree();
  const target=useMemo(()=>{const o=new THREE.Object3D();o.position.copy(siteOrigin).addScaledVector(siteUp,70*METRE);return o;},[]);
  const fog=useMemo(()=>new THREE.FogExp2('#8a9da5',0),[]);
  const uniforms=useMemo(()=>({up:{value:siteUp.clone()},sun:{value:new THREE.Vector3()},strength:{value:0},daylight:{value:0},sunAngle:{value:.00465}}),[]);
  useEffect(()=>{scene.add(target);return()=>{scene.remove(target);if(scene.fog===fog)scene.fog=null;};},[scene,target,fog]);
  useFrame(({camera})=>{
    const astro=astronomyAt(time),sun=new THREE.Vector3(...astro.sun).normalize();
    const height=Math.max(0,(camera.position.length()-1)*6371);
    const strength=1-THREE.MathUtils.smoothstep(height,.8,35);
    const daylight=THREE.MathUtils.smoothstep(camera.position.clone().normalize().dot(sun),-.08,.2);
    const live=material.current?.uniforms;
    if(live){live.up.value.copy(camera.position).normalize();live.sun.value.fromArray(astro.sun).sub(camera.position).normalize();live.sunAngle.value=Math.asin(astro.sunRadius/new THREE.Vector3(...astro.sun).sub(camera.position).length());live.strength.value=strength;live.daylight.value=daylight;}
    if(hemi.current){hemi.current.position.copy(camera.position).normalize();hemi.current.intensity=strength*daylight*.8;}
    fog.color.setRGB(.45,.55,.59).multiplyScalar(.35+.65*daylight);fog.density=100*strength*daylight;
    scene.fog=strength>.001?fog:null;
    if(shadowLight.current){
      shadowLight.current.position.copy(target.position).addScaledVector(sun,.02);
      const distance=camera.position.distanceTo(siteOrigin)/METRE;
      shadowLight.current.intensity=(1-THREE.MathUtils.smoothstep(distance,1500,10000))*THREE.MathUtils.smoothstep(siteUp.dot(sun),-.02,.06)*1.15;
    }
  });
  return <>
    <mesh ref={node=>node?.layers.set(3)} renderOrder={-1000}><sphereGeometry args={[20,32,24]}/><shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment} side={THREE.BackSide} transparent depthWrite={false} depthTest={false}/></mesh>
    <hemisphereLight ref={hemi} args={['#c3d5de','#6c735f',0]}/>
    <directionalLight ref={shadowLight} target={target} castShadow={!compact} color="#fff1d9" intensity={0} shadow-mapSize={compact?[512,512]:[2048,2048]} shadow-camera-left={-450*METRE} shadow-camera-right={450*METRE} shadow-camera-top={450*METRE} shadow-camera-bottom={-450*METRE} shadow-camera-near={.015} shadow-camera-far={.025} shadow-bias={-.00000001} shadow-normalBias={.12*METRE}/>
  </>;
}
