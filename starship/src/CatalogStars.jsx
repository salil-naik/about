import {useMission} from './MissionContext';
import React,{useMemo,useEffect} from 'react';
import * as THREE from 'three';
import catalog from './data/stars.json';
import {earthKm} from './flight15Geometry';
import {earthFixedVector} from './missionAstronomy';

export default function CatalogStars({time}) {
  const {date:missionDate}=useMission();
  const geometry=useMemo(()=>{
    const points=[],magnitudes=[];
    for(const [ra,dec,mag] of catalog.stars){
      const a=ra*Math.PI/12, d=dec*Math.PI/180;
      points.push(20*Math.cos(d)*Math.cos(a),20*Math.cos(d)*Math.sin(a),20*Math.sin(d));
      magnitudes.push(mag);
    }
    const result=new THREE.BufferGeometry();
    result.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    result.setAttribute('magnitude',new THREE.Float32BufferAttribute(magnitudes,1));
    return result;
  },[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const date=missionDate(time);
  const axes=[[1,0,0],[0,1,0],[0,0,1]].map(v=>new THREE.Vector3(...earthFixedVector(v,date)).multiplyScalar(earthKm));
  const matrix=new THREE.Matrix4().makeBasis(...axes);
  return <points ref={node=>node?.layers.set(2)} geometry={geometry} matrix={matrix} matrixAutoUpdate={false} frustumCulled={false}>
    <shaderMaterial transparent depthWrite={false}
      vertexShader={`attribute float magnitude;varying float intensity;
        void main(){intensity=clamp(pow(10.,-.16*(magnitude-1.)),.12,1.);
        gl_PointSize=clamp(3.3-magnitude*.35,1.,3.6);
        gl_Position=projectionMatrix*vec4(mat3(modelViewMatrix)*position,1.);}`}
      fragmentShader={`varying float intensity;
        void main(){float r=length(gl_PointCoord-.5);float a=(1.-smoothstep(.1,.5,r))*intensity*.8;
        gl_FragColor=vec4(.86,.91,1.,a);}`}/>
  </points>;
}
