import React,{useMemo,useEffect} from 'react';
import * as THREE from 'three';
import site from './data/starbase-osm.json';
const EXTENT=8000;
function terrainTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=4096;
  const ctx=canvas.getContext('2d'),s=canvas.width/(EXTENT*2);
  ctx.fillStyle='#717861';ctx.fillRect(0,0,canvas.width,canvas.height);
  const coord=([east,north])=>[(east+EXTENT)*s,(EXTENT-north)*s];
  const path=points=>{ctx.beginPath();points.forEach((p,i)=>{const [x,y]=coord(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});};
  // The bundled OSM coastline anchors the beach. Its end tangents extend the
  // scenery outside the mapped extract; that extension is illustrative.
  const coast=site.features.find(f=>f.tags.natural==='coastline').points;
  const sorted=[...coast].sort((a,b)=>a[1]-b[1]);
  function extend(a,b,north){return [a[0]+(north-a[1])*(b[0]-a[0])/(b[1]-a[1]),north];}
  const shoreline=[extend(sorted[0],sorted[1],-EXTENT),...sorted,extend(sorted.at(-1),sorted.at(-2),EXTENT)];
  path([...shoreline,[EXTENT,EXTENT],[EXTENT,-EXTENT]]);ctx.closePath();ctx.fillStyle='#527683';ctx.fill();
  path(shoreline);ctx.lineWidth=45*s;ctx.strokeStyle='#aaa58c';ctx.stroke();
  path(shoreline.map(([x,y])=>[x+16,y]));ctx.lineWidth=8*s;ctx.strokeStyle='#b8c7c2';ctx.stroke();
  for(const f of site.features){
    const t=f.tags;
    if(!f.closed||t.building||t.natural==='coastline'||t.man_made)continue;
    path(f.points);ctx.closePath();
    ctx.fillStyle=t.natural==='water'?'#547581':t.natural==='wetland'?'#596f65':t.natural==='scrub'?'#657258':t.landuse==='industrial'||t['area:highway']?'#a3a595':'#7c816b';ctx.fill();
  }
  for(const f of site.features.filter(f=>f.tags.highway)){
    path(f.points);ctx.strokeStyle=f.tags.surface==='concrete'?'#a9aa9b':'#9b9f8f';ctx.lineWidth=(f.tags.highway==='service'?5:7)*s;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
  }
  // Very low contrast, deterministic soil grain. This is material texture,
  // not invented terrain elevation or satellite imagery.
  let seed=71;for(let i=0;i<70000;i++){seed=(1664525*seed+1013904223)>>>0;const x=seed%4096;seed=(1664525*seed+1013904223)>>>0;const y=seed%4096;ctx.fillStyle=i%2?'#ffffff05':'#00000006';ctx.fillRect(x,y,2,2);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;return texture;
}
export default function LocalTerrain(){
  const texture=useMemo(terrainTexture,[]);
  const geometry=useMemo(()=>{
    const g=new THREE.PlaneGeometry(EXTENT*2,EXTENT*2,192,192);g.rotateX(-Math.PI/2);
    const p=g.attributes.position,r=6371000,colors=[];
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),z=p.getZ(i);p.setY(i,Math.sqrt(r*r-x*x-z*z)-r+.03);
      colors.push(1,1,1,1-THREE.MathUtils.smoothstep(Math.hypot(x,z),4500,7900));
    }
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));g.computeVertexNormals();return g;
  },[]);
  useEffect(()=>()=>{texture.dispose();geometry.dispose();},[texture,geometry]);
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial map={texture} vertexColors transparent alphaTest={.02} roughness={.88} metalness={.02}/></mesh>;
}
