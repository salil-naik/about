import React,{useMemo} from 'react';
import {geoOrthographic,geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import land from 'world-atlas/land-50m.json';
const surface=feature(land,land.objects.land);
export default function OrbitLocator({fix}){
  const shape=useMemo(()=>{
    if(!fix)return '';
    return geoPath(geoOrthographic().translate([38,38]).scale(34).rotate([-fix[2],-fix[1]]))(surface);
  },[fix]);
  if(!fix)return null;
  return <svg className="orbit-locator" viewBox="0 0 76 76" role="img" aria-label="Globe centered on last recorded ship position"><circle cx="38" cy="38" r="35" fill="#102738" stroke="#6f8c91"/><path d={shape} fill="#648b89"/><circle cx="38" cy="38" r="4" fill="#ffa565" stroke="#192c30"/></svg>
}
