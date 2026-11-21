import {useMission} from './MissionContext';
import React,{Component,useMemo,useRef,useEffect,useState} from 'react';
import * as THREE from 'three';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import {geoArea,geoEquirectangular,geoPath} from 'd3-geo';
import {feature,mesh as topologyMesh} from 'topojson-client';
import world from 'world-atlas/countries-10m.json';
import {xyz} from './flight15Geometry';
import OrbitLocator from './OrbitLocator';
import CatalogStars from './CatalogStars';
import GlobeVehicles from './GlobeVehicles';
import CelestialBodies,{AstronomicalRenderer,SunLighting} from './CelestialBodies';
import GlobeRegionMarkers from './GlobeRegionMarkers';
import CoastalAtmosphere from './CoastalAtmosphere';
import Splashdown from './Splashdown';
import {cameraPose,cameraNearPlane,blendCameraPose,followCameraPose} from './globeCamera';

const vertex=`varying vec3 earthNormal;varying vec2 uv0;varying vec3 norm;varying vec3 eye;
void main(){earthNormal=normal;uv0=uv;norm=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);eye=-p.xyz;gl_Position=projectionMatrix*p;}`;
const fragment=`varying vec3 earthNormal;uniform sampler2D regionMask;uniform float regionChoice;uniform sampler2D surface;uniform sampler2D terrain;uniform float terrainReady;uniform float terrainStrength;uniform vec3 lightDir;uniform vec3 tint;varying vec2 uv0;varying vec3 norm;varying vec3 eye;
void main(){
 vec3 src=texture2D(surface,uv0).rgb;
 float landMask=smoothstep(.005,.035,src.g-src.b);
 vec3 detail=texture2D(terrain,uv0).rgb;
 float tone=dot(detail,vec3(.299,.587,.114));
 float nearby=dot(texture2D(terrain,uv0+vec2(.001,.001)).rgb,vec3(.299,.587,.114));
 float relief=clamp((tone-nearby)*1.8+(tone-.35)*.18,-.18,.18);
 src*=1.+relief*landMask*terrainReady*terrainStrength;
 vec3 n=normalize(norm);float nd=dot(normalize(earthNormal),normalize(lightDir));
 float day=max(0.,nd);
 float limb=pow(1.-max(0.,dot(n,normalize(eye))),4.);
 float rimStrength=smoothstep(1.02,1.5,length(cameraPosition))*.28;
 vec3 color=src*(.012+.988*day)+limb*tint*rimStrength*day;
 float localAir=1.-smoothstep(2./6371.,65./6371.,max(0.,length(cameraPosition)-1.));
 float observerDay=smoothstep(-.08,.2,dot(normalize(cameraPosition),normalize(lightDir)));
 float coastalHaze=smoothstep(.0004,.003,length(eye))*localAir*observerDay;
 color=mix(color,vec3(.58,.66,.67),coastalHaze);
 vec2 mask=texture2D(regionMask,uv0).rg;
 float region=regionChoice<.5?0.:(regionChoice<1.5?mask.g:mask.r);
 color=mix(color,vec3(.78,.46,.20),region*.65);
 gl_FragColor=vec4(color,1.);
}`;
function cartographicTexture(width,anisotropy){
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=width/2;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#334f64';ctx.fillRect(0,0,canvas.width,canvas.height);
  const projection=geoEquirectangular().scale(canvas.width/(2*Math.PI)).translate([canvas.width/2,canvas.height/2]);
  const path=geoPath(projection,ctx);
  const countries=feature(world,world.objects.countries);
  // Some tiny island rings in this dataset wind around the sphere's complement.
  // Normalize each polygon so one island cannot paint over the entire ocean.
  for(const country of countries.features){
    const polygons=country.geometry.type==='Polygon'?[country.geometry.coordinates]:country.geometry.coordinates;
    for(const rings of polygons){
      if(geoArea({type:'Polygon',coordinates:rings})>2*Math.PI){
        for(const ring of rings)ring.reverse();
      }
    }
  }
  ctx.beginPath();path(countries);
  const land=ctx.createLinearGradient(0,0,0,canvas.height);
  land.addColorStop(0,'#a6b9b0');
  land.addColorStop(.45,'#819d91');
  land.addColorStop(.75,'#8da79b');
  land.addColorStop(1,'#b2c2b8');
  ctx.fillStyle=land;ctx.fill();
  const texture=new THREE.CanvasTexture(canvas);
  texture.anisotropy=anisotropy;
  texture.minFilter=THREE.LinearMipmapLinearFilter;
  texture.magFilter=THREE.LinearFilter;
  return texture;
}
function MapBorders({coast=false}){
  const material=useRef();
  const geometry=useMemo(()=>{
    const vertices=[];
    const lines=topologyMesh(world,world.objects.countries,coast?(a,b)=>a===b:(a,b)=>a!==b).coordinates;
    for(const line of lines){
      for(let i=1;i<line.length;i++){
        const a=new THREE.Vector3(...xyz([0,line[i-1][1],line[i-1][0],0]));
        const b=new THREE.Vector3(...xyz([0,line[i][1],line[i][0],0]));
        const steps=Math.max(1,Math.ceil(a.angleTo(b)/(Math.PI/720)));
        let previous=a.clone().multiplyScalar(1.0001);
        for(let j=1;j<=steps;j++){
          const next=a.clone().lerp(b,j/steps).normalize().multiplyScalar(1.0001);
          vertices.push(...previous.toArray(),...next.toArray());previous=next;
        }
      }
    }
    return new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  },[coast]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  useFrame(({camera})=>{
    if(material.current){
      const zoom=THREE.MathUtils.smoothstep(camera.position.length(),1.2,3);
      const localFade=THREE.MathUtils.smoothstep(camera.position.length()-1,.008,.04);
      material.current.opacity=(coast?.26+.12*zoom:.16+.12*zoom)*localFade;
    }
  });
  return <lineSegments geometry={geometry}><lineBasicMaterial ref={material} color={coast?'#c0d3c9':'#3c615c'} transparent opacity={coast?.38:.28} depthWrite={false}/></lineSegments>;
}
function returnMaskTexture(width){
  const c=document.createElement('canvas');c.width=width;c.height=width/2;
  const ctx=c.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,c.width,c.height);
  const path=geoPath(geoEquirectangular().scale(c.width/(2*Math.PI)).translate([c.width/2,c.height/2]),ctx);
  const countries=feature(world,world.objects.countries).features;
  const chile=countries.find(f=>f.properties.name==='Chile');
  ctx.fillStyle='#ff0000';ctx.beginPath();path(chile);ctx.fill();
  const usa=countries.find(f=>f.properties.name==='United States of America');
  const hawaii={type:'MultiPolygon',coordinates:usa.geometry.coordinates.filter(poly=>poly[0].some(([lon,lat])=>lon>=-161&&lon<=-154&&lat>=18&&lat<=23))};
  ctx.fillStyle='#00ff00';ctx.beginPath();path(hawaii);ctx.fill();
  return new THREE.CanvasTexture(c);
}
function Surface({time,compact}){
  const {astronomyAt,returnCheck:activeReturnCheck}=useMission();
  const {gl}=useThree();
  const material=useRef();
  const [terrain,setTerrain]=useState(null);
  useEffect(()=>{
    let active=true;
    const map=new THREE.TextureLoader().load(import.meta.env.BASE_URL+'earth-day.jpg',()=>{if(active)setTerrain(map);});
    map.anisotropy=compact?1:gl.capabilities.getMaxAnisotropy();
    return()=>{active=false;map.dispose();};
  },[gl,compact]);
  const texture=useMemo(()=>cartographicTexture(Math.min(compact?2048:8192,gl.capabilities.maxTextureSize),compact?1:gl.capabilities.getMaxAnisotropy()),[gl,compact]);
  const regionMask=useMemo(()=>returnMaskTexture(compact?1024:4096),[compact]);
  useEffect(()=>()=>{texture.dispose();regionMask.dispose();},[texture,regionMask]);
  const uniforms=useMemo(()=>({surface:{value:texture},regionMask:{value:regionMask},regionChoice:{value:0},terrain:{value:terrain||texture},terrainReady:{value:terrain?1:0},terrainStrength:{value:.35},lightDir:{value:new THREE.Vector3()},tint:{value:new THREE.Color('#8eacc4')}}),[texture,terrain,regionMask]);
  uniforms.lightDir.value.fromArray(astronomyAt(time).sun).normalize();
  const region=activeReturnCheck(time);uniforms.regionChoice.value=region?(region.key==='hawaii'?1:2):0;
  useFrame(({camera})=>{
    // Update the material's live uniforms. React Three Fiber can reconcile a
    // fresh uniforms object when the terrain texture finishes loading.
    const live=material.current?.uniforms;
    if(!live)return;
    live.terrainStrength.value=THREE.MathUtils.lerp(1.8,.25,THREE.MathUtils.smoothstep(camera.position.length(),1.2,3));
    live.lightDir.value.fromArray(astronomyAt(time).sun).normalize();
    const check=activeReturnCheck(time);
    live.regionChoice.value=check?(check.key==='hawaii'?1:2):0;
  });
  return <><mesh><sphereGeometry args={compact?[1,128,96]:[1,384,256]}/><shaderMaterial ref={material} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms}/></mesh><MapBorders coast/></>;
}
function Route({index,overview,tip}){
  const {samples,pad,historical}=useMission();
  const trailMaterial=useRef(),headMaterial=useRef();
  useFrame(({camera})=>{
    const detail=THREE.MathUtils.smoothstep(camera.position.distanceTo(new THREE.Vector3(...xyz(tip))),.0005,.03);
    if(trailMaterial.current)trailMaterial.current.opacity=.08+.74*detail;
    if(headMaterial.current)headMaterial.current.opacity=.2+.7*detail;
  });
  // Pairs make gaps explicit, and avoid allocating a new trail every clock tick.
  const buffer=useMemo(()=>{
    const vertices=[],distances=[];let total=0;
    for(let i=0;i<samples.length;i++){
      const a=samples[i-1]||pad,b=samples[i];
      const from=xyz(b[0]-a[0]>90?b:a),to=xyz(b);vertices.push(...from,...to);distances.push(total);total+=new THREE.Vector3(...from).distanceTo(new THREE.Vector3(...to));distances.push(total);
    }
    return new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)).setAttribute('lineDistance',new THREE.Float32BufferAttribute(distances,1));
  },[]);
  useEffect(()=>()=>buffer.dispose(),[buffer]);
  const last=index;
  const first=0;
  buffer.setDrawRange(2*first,2*Math.max(0,last-first+1));
  const head=useMemo(()=>new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,0,0],3)),[]);
  useEffect(()=>()=>head.dispose(),[head]);
  head.attributes.position.setXYZ(0,...xyz(samples[index]||pad));head.attributes.position.setXYZ(1,...xyz(tip));head.attributes.position.needsUpdate=true;
  return <><lineSegments geometry={buffer}><lineDashedMaterial ref={trailMaterial} color="#ffbc7c" transparent opacity={.82} dashSize={historical?.001:100} gapSize={historical?.0005:0}/></lineSegments>{!overview&&<line geometry={head} frustumCulled={false}><lineBasicMaterial ref={headMaterial} color="#ffe6b9" transparent/></line>}</>
}
function BoosterTrail({time}){
  const {boosterFix,stageSeconds,boosterSeconds,stage}=useMission();
  const geometry=useMemo(()=>{
    const points=[];
    for(let t=stageSeconds;stage&&t<=boosterSeconds;t+=2)points.push(new THREE.Vector3(...xyz(boosterFix(t))));
    return new THREE.BufferGeometry().setFromPoints(points);
  },[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  geometry.setDrawRange(0,Math.max(0,Math.min(Math.ceil((boosterSeconds-stageSeconds)/2),Math.floor((time-stageSeconds)/2)+1)));
  return <line geometry={geometry}><lineBasicMaterial color="#9bb9c2" transparent opacity={.55}/></line>;
}
function Scene({time,overview,light,reset,onFollowChange,onLocate,followTarget,compact}){
  const mission=useMission();
  const {shipFix,fixIndex,returnCheck:activeReturnCheck,METRE}=mission;
  const tip=shipFix(time),controls=useRef(),free=useRef(false);
  const tracked=useRef(null);
  const transition=useRef(null);
  const {camera}=useThree();
  useEffect(()=>{
    free.current=false;
    const pose=cameraPose(time,followTarget,mission,overview);
    if(tracked.current){
      transition.current={elapsed:0,from:{position:camera.position.clone(),target:(controls.current?.target||pose.target).clone(),up:camera.up.clone()}};
    }else{
      tracked.current=pose;
      camera.position.copy(pose.position);camera.up.copy(pose.up);
      controls.current?.target.copy(pose.target);camera.lookAt(pose.target);
      controls.current?.update();
    }
    onFollowChange?.(true);
  },[reset,camera,followTarget,overview]);
  useFrame((_,dt)=>{
    if(!free.current){
      let pose=cameraPose(time,followTarget,mission,overview);
      if(transition.current){
        transition.current.elapsed+=Math.min(dt,.1);
        const progress=Math.min(1,transition.current.elapsed/1.8);
        pose=blendCameraPose(transition.current.from,pose,progress);
        tracked.current=pose;
        if(progress===1)transition.current=null;
      }
      const state=followCameraPose(tracked.current||pose,pose,dt);
      tracked.current=state;
      camera.position.copy(state.position);camera.up.copy(state.up);
      controls.current?.target.copy(state.target);
      camera.lookAt(state.target);camera.updateMatrixWorld();
    }
    // Preserve precision near the launch mount and depth range at orbit scale.
    const near=cameraNearPlane(camera.position,controls.current?.target||new THREE.Vector3());
    if(Math.abs(camera.near-near)>near*.1){camera.near=near;camera.updateProjectionMatrix();}
    if(camera.position.length()<1+2*METRE){camera.position.normalize().multiplyScalar(1+2*METRE);}
    if(camera.position.length()>22){camera.position.normalize().multiplyScalar(22);}
  });
  return <><CatalogStars time={time}/><Surface time={time} compact={compact}/><CelestialBodies time={time}/><SunLighting time={time}/><CoastalAtmosphere time={time} compact={compact}/><AstronomicalRenderer/><Route index={fixIndex(time)} overview={false} tip={tip}/><BoosterTrail time={time}/><GlobeVehicles time={time} overview={overview} compact={compact} onLocate={onLocate}/><Splashdown time={time}/><GlobeRegionMarkers time={time} onLocate={onLocate}/>
    <OrbitControls ref={controls} enablePan enableDamping dampingFactor={.09} minDistance={20*METRE} maxDistance={20} zoomSpeed={.65} onStart={()=>{free.current=true;onFollowChange?.(false);}}/>
  </>;
}
class MapBoundary extends Component{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?this.props.fallback:this.props.children;}
}
export default function AtlasEarth(props){
  const mission=useMission();
  const compact=window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const {shipFix,returnCheck:activeReturnCheck,stageSeconds,boosterAvailable}=mission;
  const [locators,setLocators]=useState({});
  const locate=React.useCallback(marker=>setLocators(previous=>({...previous,[marker.label]:marker})),[]);
  const fallback=<div className="map-fallback"><OrbitLocator fix={shipFix(props.time)}/><span>Position on Earth</span></div>;
  return <MapBoundary fallback={fallback}><Canvas shadows={!compact} fallback={fallback} camera={{position:[.4,1,2.9],fov:45,near:1e-9,far:30}} dpr={compact?1:[1,2]} gl={{alpha:true,antialias:!compact}}><Scene {...props} compact={compact} onLocate={locate}/></Canvas>
    <div className="globe-locators">{Object.values(locators).filter(m=>m.visible&&((m.kind==='return'&&activeReturnCheck(props.time)?.name===m.label)||m.label===(props.time<stageSeconds?'Starship / Super Heavy':'Starship')||(m.label==='Super Heavy'&&boosterAvailable(props.time)))).map(m=><div key={m.label} className={'vehicle-locator '+(m.kind==='vehicle'?'rocket-locator':'region-locator')} style={{position:'absolute',left:m.x+'%',top:m.y+'%'}}>{m.kind==='vehicle'?<b className="rocket-symbol" aria-label={m.label+' location symbol'}><svg viewBox="0 0 24 48"  aria-hidden="true">{m.label==='Super Heavy'?<path d="M8 5H16V42H8Z M8 9L4 13V17L8 15 M16 9L20 13V17L16 15"/>:<path d="M12 3Q7 8 8 15V35L4 40V44L9 41H15L20 44V40L16 35V15Q17 8 12 3Z"/>}</svg></b>:<i/>}<span><span className="locator-name">{m.label}</span><span className="locator-name-short">{m.label==='Starship / Super Heavy'?'Starship + Booster':m.label}</span>{m.detail&&<small>{m.detail}</small>}</span></div>)}</div>
  </MapBoundary>;
}
