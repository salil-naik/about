import {useMission} from './MissionContext';
import React,{useMemo,useRef} from 'react';
import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
const moonVertex=`varying vec3 worldNormal;void main(){worldNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const moonFragment=`uniform vec3 lightDir;varying vec3 worldNormal;void main(){float day=max(0.,dot(normalize(worldNormal),lightDir));vec3 color=vec3(.63,.64,.63)*(.002+.998*day);gl_FragColor=vec4(color,1.);}`;
export default function CelestialBodies({time}){
  const {astronomyAt}=useMission();
  const astro=astronomyAt(time);
  const material=useRef();
  const uniforms=useMemo(()=>({lightDir:{value:new THREE.Vector3()}}),[]);
  uniforms.lightDir.value.fromArray(astro.sun).sub(new THREE.Vector3(...astro.moon)).normalize();
  useFrame(()=>{material.current?.uniforms.lightDir.value.fromArray(astro.sun).sub(new THREE.Vector3(...astro.moon)).normalize();});
  return <>
    <mesh ref={node=>node?.layers.set(1)} position={astro.moon} userData={{body:'Moon',radiusEarthUnits:astro.moonRadius}}><sphereGeometry args={[astro.moonRadius,64,48]}/><shaderMaterial ref={material} vertexShader={moonVertex} fragmentShader={moonFragment} uniforms={uniforms}/></mesh>
    <mesh ref={node=>node?.layers.set(1)} position={astro.sun} userData={{body:'Sun',radiusEarthUnits:astro.sunRadius}}><sphereGeometry args={[astro.sunRadius,48,32]}/><meshBasicMaterial color="#fff5df" toneMapped={false} fog={false}/></mesh>
  </>;
}
// Far celestial bodies use their physical positions and radii, with a separate
// depth range. This avoids expanding the near-ground camera's depth range by
// 150 million km and keeps metre-size launch/catch geometry stable.
export function AstronomicalRenderer(){
  const background=useMemo(()=>new THREE.PerspectiveCamera(),[]);
  useFrame(({gl,scene,camera})=>{
    const auto=gl.autoClear;
    gl.autoClear=false;gl.clear();
    background.copy(camera,false);background.near=.1;background.far=50000;
    background.updateProjectionMatrix();background.updateMatrixWorld();
    background.layers.set(2);gl.render(scene,background);
    background.layers.set(3);gl.render(scene,background);
    gl.clearDepth();background.layers.set(1);gl.render(scene,background);
    gl.clearDepth();camera.layers.set(0);gl.render(scene,camera);
    gl.autoClear=auto;
  },1);
  return null;
}
export function SunLighting({time}){
  const {astronomyAt}=useMission();
  const light=useRef(),position=new THREE.Vector3(...astronomyAt(time).sun).normalize().multiplyScalar(10);
  useFrame(()=>{if(light.current)light.current.position.copy(position);});
  return <><ambientLight intensity={.035}/><directionalLight ref={light} position={position} intensity={2.1} color="#fff4e6"/></>;
}
