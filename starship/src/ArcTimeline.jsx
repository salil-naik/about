import React from 'react';

export default function ArcTimeline({value,min,max,label,onChange,markers,toFraction,fromFraction}) {
  const fraction=toFraction?toFraction(value):Math.max(0,Math.min(1,(value-min)/(max-min)));
  return <div className="linear-timeline">
    <div className="linear-track">
      <span className="linear-progress" style={{width:fraction*100+'%'}}/>
      <span className="linear-cursor" style={{left:fraction*100+'%'}}/>
      <input aria-label={label} type="range" min={0} max={10000} step={1} aria-valuetext={label+': '+Math.round(value)+' mission seconds'}
        value={fraction*10000} onChange={e=>onChange(fromFraction?fromFraction(Number(e.target.value)/10000):min+(max-min)*Number(e.target.value)/10000)}/>
      {markers.map((marker,index)=><button key={marker.label} type="button" className="linear-marker"
        style={{left:(toFraction?toFraction(marker.time):(marker.time-min)/(max-min))*100+'%','--tip-shift':index===0?'0%':index===markers.length-1?'-100%':'-50%'}}
        aria-label={`${marker.label} begins at ${marker.missionTime}`}
        onClick={()=>onChange(marker.time)}>
        <span className="linear-marker-dot"/>
        <span className="linear-marker-tooltip"><strong>{marker.label}</strong><small>{marker.quality?marker.quality+' · ':'Begins · '}{marker.missionTime}</small></span>
      </button>)}
    </div>
  </div>;
}
