import {useMission} from './MissionContext';
import React, {useEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowUpRight,ChevronRight,Link2,Pause,Play,RotateCcw,X} from 'lucide-react';
import AtlasEarth from './AtlasEarth';
import ArcTimeline from './ArcTimeline';
import {DropdownMenu} from './MissionMenu';
import Archive from './Archive';
import {clock} from './fifteenTiming';
import './replay.css';

function StarshipLogo(){return <svg className="atlas-mark" viewBox="0 0 40 48" fill="none" aria-hidden="true"><path d="M20 2c-4 4.5-6.5 10.2-6.5 18v13.5L9 40v4l7-3h8l7 3v-4l-4.5-6.5V20C26.5 12.2 24 6.5 20 2Z" fill="currentColor"/><path d="M13.5 26 8 29v5l5.5-2.5M26.5 26 32 29v5l-5.5-2.5" fill="currentColor"/><path d="M17 41v4m3-4v5m3-5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M20 14v19" stroke="#091522" strokeWidth="1.5" strokeLinecap="round"/></svg>;}
function VehicleGlyph({booster=false}){return <svg className="follow-vehicle-icon" viewBox="0 0 24 48" aria-hidden="true"><path d={booster?'M8 5H16V42H8Z M8 10L4 13V17L8 15 M16 10L20 13V17L16 15':'M12 3Q7 8 8 15V35L4 40V44L9 41H15L20 44V40L16 35V15Q17 8 12 3Z'}/></svg>;}
const elapsedLabel=t=>'T'+(t<0?'−':'+')+' '+clock(t);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function coordinates([,lat,lon],precision=3) {
  return Math.abs(lat).toFixed(precision)+'° '+(lat<0?'S':'N')+', '+Math.abs(lon).toFixed(precision)+'° '+(lon<0?'W':'E');
}
function getMoment(mission){
  const p=new URLSearchParams(location.hash.slice(1));
  const t=Number(p.get('t'));
  if(Number(p.get('flight'))!==mission.number||!p.has('t')||!Number.isFinite(t))return null;
  return {time:clamp(t,mission.start,mission.end)};
}
export default function MissionReplay({selectFlight}) {
  const mission=useMission();
  const {flight,samples,source,shipFix,boosterFix,date:missionDate,returnCheck:activeReturnCheck,advance:advanceMission,rate:cinematicRate,markers:storyMarkers,fraction:missionFraction,timeAt:missionTime,events:events15,start,end}=mission;
  const highestFix=samples.reduce((a,b)=>a[3]>b[3]?a:b);
  const [approaching,setApproaching]=useState(false);

  const [initial]=useState(()=>getMoment(mission));
  const [position,setPosition]=useState(initial?.time??start);
  const cursor=useRef(position);
  const [playing,setPlaying]=useState(false),[rate,setRate]=useState('auto');
  const [following,setFollowing]=useState(true),[followTarget,setFollowTarget]=useState('ship');
  const [cover,setCover]=useState(!initial),[archive,setArchive]=useState(false);
  const [drawer,setDrawer]=useState(''),[resetMap,setResetMap]=useState(0);
  const [share,setShare]=useState(''),[copied,setCopied]=useState(false);
  const shareDialog=useRef(null);
  const time=position,duration=end;
  const eventIndex=events15.findLastIndex(e=>e.time<=time),event=events15[eventIndex];
  function move(value){cursor.current=value;setPosition(value);}
  function seekMission(value){setApproaching(false);setPlaying(false);setCover(false);move(value);}
  function togglePlay(){
    if(approaching){setApproaching(false);return;}
    if(cover){setCover(false);setApproaching(true);return;}
    if(position>=duration){move(start);setResetMap(n=>n+1);}
    setPlaying(v=>!v);
  }
  useEffect(()=>{if(!approaching)return;const timer=setTimeout(()=>{setApproaching(false);setPlaying(true);},2100);return()=>clearTimeout(timer);},[approaching]);
  function restart(){setApproaching(false);setFollowTarget('ship');setRate('auto');move(start);setCover(true);setPlaying(false);setFollowing(true);setResetMap(n=>n+1);}
  useEffect(()=>{
    if(!playing)return;
    let last=performance.now(),id;
    function frame(now){
      const next=advanceMission(cursor.current,Math.min(.1,(now-last)/1000),rate==='auto'?null:Number(rate),followTarget);
      last=now;move(next);
      if(next>=duration)setPlaying(false);else id=requestAnimationFrame(frame);
    }
    id=requestAnimationFrame(frame);
    return()=>cancelAnimationFrame(id);
  },[playing,duration,rate,followTarget]);
  useEffect(()=>{if(share)shareDialog.current?.showModal();},[share]);
  useEffect(()=>{
    function restoreMoment(){
      const moment=getMoment(mission);
      if(!moment)return;
      setApproaching(false);setPlaying(false);setCover(false);move(moment.time);
    }
    window.addEventListener('hashchange',restoreMoment);
    return()=>window.removeEventListener('hashchange',restoreMoment);
  },[]);
  function shareMoment(){
    setApproaching(false);setPlaying(false);const url=new URL(location.href);
    url.hash=new URLSearchParams({flight:String(mission.number),t:String(Math.floor(time)),camera:'globe'});
    setCopied(false);setShare(url.href);
  }
  const pos=shipFix(time);
  const trackedPos=followTarget==='booster'?boosterFix(time):pos;
  const altitude=trackedPos[3];
  const webcastVehicle=followTarget==='booster'?'booster':time<mission.stageSeconds?'booster':'ship';
  const webcast=mission.historical?.observationAt(webcastVehicle,time);
  const webcastText=webcast?.ended?'WEBCAST · recording ended':webcast?'WEBCAST · '+(webcast.alt?webcast.alt.value.toFixed(1)+' km':'altitude unavailable')+' · '+(webcast.speed?Math.round(webcast.speed.value).toLocaleString()+' km/h':'speed unavailable')+(webcast.eng?' · '+webcast.eng.value+' engines':webcast.engineNote?' · engine count unavailable':''):'';
  const qualityLabel=q=>({'catalog-reported':'Catalog reported',reported:'SpaceX reported','reported-approximate':'SpaceX reported · approximate','telemetry-derived':'Webcast-derived · approximate',estimated:'Estimated'})[q]||'';
  const region=activeReturnCheck(time);
  const boosterAvailable=mission.boosterAvailable(time);
  useEffect(()=>{
    if((followTarget==='booster'&&!boosterAvailable)||(followTarget==='return'&&!region)){setFollowTarget('ship');setFollowing(true);setResetMap(n=>n+1);}
  },[time,followTarget,boosterAvailable,region?.key]);
  const caption=cover?flight.landmark+'. '+(mission.measured?'Recorded ship track.':mission.historical?'Webcast measurements · estimated ground track.':'Illustrative mission reconstruction.'):region&&followTarget==='return'?'Viewing the scheduled return region. Starship continues along its recorded orbit.':event.detail;
  function openPanel(name){setApproaching(false);setPlaying(false);setDrawer(drawer===name?'':name);}
  function resumeFollow(target='ship'){setFollowTarget(target);setFollowing(true);setResetMap(n=>n+1);}
  const scrub=(v)=>{setApproaching(false);setCover(false);setPlaying(false);move(v);};
  return <div className={'observatory light-mission-sun'+(cover?' is-cover':' is-replay')}>
    <header className="orb-header"><div className="orb-identity"><a className="orb-brand" href="/" aria-label="Salil Naik homepage"><StarshipLogo/><span className="orb-brand-copy"><strong>Starship</strong><small>Flight Atlas</small><small className="mobile-byline">by Salil Naik</small></span></a><span className="orb-byline">by <a href="/">Salil Naik</a></span></div>
      <button className="mission-picker" onClick={()=>{setArchive(true);setApproaching(false);setPlaying(false);}}><span className="picker-label">Explore mission</span><span className="picker-value">Flight {mission.number}</span><ChevronRight size={16}/></button>
      <div className="orb-nav"><button onClick={()=>openPanel('log')}>Flight log</button><button aria-label="Mission details" onClick={()=>openPanel('details')}><span className="nav-label-desktop">Mission details</span><span className="nav-label-mobile">Details</span></button><button aria-label="Share moment" onClick={shareMoment}><Link2 size={16}/></button></div>
    </header>
    <main className="observing">
      <div className="visual-column">
        <div className="orb-map earth-scene">
          <AtlasEarth time={time} overview={cover} reset={resetMap} followTarget={followTarget} onFollowChange={setFollowing}/>
        </div>
        <div className="follow-controls">
          <button aria-pressed={following&&followTarget==='ship'} onClick={()=>resumeFollow('ship')}><VehicleGlyph/>Follow Starship</button>
          <button aria-pressed={following&&followTarget==='booster'} disabled={!boosterAvailable} title={boosterAvailable?(mission.historical?'Webcast altitude and speed; estimated horizontal route':'Illustrative route; no booster telemetry available'):'Available between staging and the end of the illustrated return'} onClick={()=>resumeFollow('booster')}><VehicleGlyph booster/>Follow Super Heavy</button>
        </div>
        {region&&<div className="return-region-note"><small>RETURN CHECK</small><strong>{region.name} <span>{region.country==='United States'?'· United States':''}</span></strong><p>{region.description}</p><button onClick={()=>resumeFollow('return')}>View {region.name} ↗</button></div>}
      </div>
      <div className="orb-hud">
        <div className="hud-location">
          <div className="map-foot"><span className="hud-position-name">{mission.historical?'Estimated ':''}{followTarget==='booster'?'Super Heavy':'Starship'} position</span><strong className="hud-coordinates">{coordinates(trackedPos,mission.historical?1:3)}</strong><span className="hud-altitude">{altitude.toFixed(1)} km altitude</span>{mission.historical&&<><span className="webcast-readout">{webcastText}</span><button className="data-quality" onClick={()=>openPanel('details')}>{mission.historical.coverageAt(time,webcastVehicle)} ↗</button></>}{!mission.historical&&mission.positionEstimatedAt(time)&&<button className="data-quality" onClick={()=>openPanel('details')}>Estimated recovery after GPS record ↗</button>}</div>
          {altitude<35&&Math.abs(pos[1]-mission.pad[1])<.1&&Math.abs(pos[2]-mission.pad[2])<.2&&<a className="site-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">Map data © OpenStreetMap contributors</a>}
        </div>
      </div>
      <aside className="orb-story"><div className="story-index"><i/>{cover?'MISSION ARCHIVE':event.source.toUpperCase()} <span>{cover?'/ F'+mission.number:'≈ '+elapsedLabel(event.time)}</span></div>
        <div key={cover?'intro':event.source==='StarDash estimate'?'deployment':eventIndex} className="event-reveal"><h1>{cover?<><span className="story-title-prefix">Starship</span><span className="story-title-main">Flight <em>{mission.number}.</em></span></>:(event.source==='StarDash estimate'?'Payload deployment':event.name).split(' ').map((w,i)=><React.Fragment key={i}>{i>0?' ':''}<span className="reveal-word" style={{'--delay':i*40+'ms'}}>{w}</span></React.Fragment>)}</h1>{cover?<><p className="story-lede">{flight.landmark}</p><p className="story-detail">{mission.measured?'Recorded ship track':mission.historical?'Webcast measurements · estimated ground track':'Illustrative mission reconstruction'}</p></>:<p>{caption}</p>}</div>
      </aside>
    </main>
    <section className="orb-dock slim-dock" aria-label="Mission playback">
      <button className="orbit-play" aria-label={playing||approaching?'Pause':'Play replay'} onClick={togglePlay}>{playing||approaching?<Pause size={17}/>:<Play size={16} fill="currentColor"/>}</button>
      <div className="dock-clock"><output>{elapsedLabel(time)}</output></div>
      <ArcTimeline value={time} min={start} max={end} label="Mission chapters (event-spaced)" onChange={scrub} toFraction={missionFraction} fromFraction={missionTime} markers={storyMarkers.map(([time,label,quality])=>({time,label,quality:qualityLabel(quality),missionTime:elapsedLabel(time)}))}/>
      <span className="mission-mode-label" title="Events are spaced for readability; the clock shows mission time">Chapter timeline</span>
      <div className="dock-tools"><button aria-label="Replay from start" onClick={restart}><RotateCcw size={14}/><span>Replay</span></button><select aria-label="Playback speed" value={rate} onChange={e=>setRate(e.target.value)}><option value="auto">Auto · {cinematicRate(time,followTarget)}×</option>{[1,5,10,50,100,600,3600].map(v=><option value={v} key={v}>{v}×</option>)}</select></div>
    </section>
    {drawer&&<DropdownMenu title={{details:'Mission details',log:'Flight log'}[drawer]} className={drawer==='details'?'details-dialog':''} close={()=>setDrawer('')}>
      {drawer==='log'&&<><p>Source and timing confidence are shown for each milestone. A webcast-derived time is approximate; a published plan does not prove that an event occurred.</p><p>{event.verificationNote||event.detail}</p>{event.url&&<a href={event.url} target="_blank" rel="noreferrer">Source for this milestone ↗</a>}<div className="event-ledger">{events15.map((e,i)=><button key={e.time} aria-current={i===eventIndex?'step':undefined} onClick={()=>{seekMission(e.time);setDrawer('');}}><time>{elapsedLabel(e.time)}</time><span>{e.name}{e.quality&&<small className="event-quality">{qualityLabel(e.quality)}</small>}</span><ArrowUpRight size={14}/></button>)}</div></>}
      {drawer==='details'&&<div className="details-content">
        <section className="details-hero">
          <span className="details-eyebrow">Mission profile · Flight {mission.number}</span>
          <h3>Starship Flight {mission.number}</h3>
          <p><strong>{flight.landmark}.</strong> {flight.note}</p>
        </section>
        <dl className="details-facts">
          <div><dt>Launch · UTC</dt><dd>{missionDate(0).toISOString().replace('T',' ').slice(0,19)}</dd></div>
          <div><dt>Super Heavy</dt><dd>{flight.booster}</dd></div>
          <div><dt>Starship</dt><dd>{flight.ship}</dd></div>
          <div><dt>Route data</dt><dd>{mission.measured?'Recorded ship positions':mission.historical?'Webcast observations · estimated geography':'Illustrative reconstruction'}</dd></div>
        </dl>
        <div className="details-columns">
          <section className="details-notes">
            <h4>How to read this replay</h4>
            {mission.historical?<>
              <p>Altitude, speed, and engine counts come from Rafael Adamy’s extraction of SpaceX webcast readouts. Readouts are quantized; missing measurements remain unavailable. The smooth height curve is an estimate between observations.</p>
              <p>Latitude, longitude, attitude, and the booster return are reconstructed. Recovery geography is constrained to published regions, not a measured GPS landing fix. The dashed path is not a GPS track. A recording ending does not prove a landing or an explosion.</p>
              <p>SpaceX postflight reports verify outcomes and selected times. Archive events and any water contact or settling animation remain labeled as approximate or illustrative.</p>
              {mission.historical.data.officialSchedule.length>0&&<details className="schedule-details"><summary>Published schedule · approximate</summary><p>Planned events are included for comparison; they do not prove an event occurred.</p>{mission.historical.data.officialSchedule.map(e=><div key={e.time}><time>{elapsedLabel(e.time)}</time> {e.name}</div>)}</details>}
            </>:<p>{mission.measured?'Ship positions use the StarDash archive of public telemetry. Source fixes are preserved, and gaps over 90 seconds remain gaps. Ocean contact after the final cached fix is an explicitly estimated animation.':'This route illustrates the published mission profile and outcome; it is not measured telemetry.'} Vehicle attitude and recovery animation are reconstructed.</p>}
            <p>The Starbase scenery is representative for historical flights. Vehicles, tower, Earth, Sun, and Moon share a physical distance scale; map locator symbols are enlarged for readability.</p>
            <p>Ship {mission.dimensions.ship} m · Booster {mission.dimensions.booster} m · Diameter 9 m. The highest {mission.measured?'archived':'illustrated'} point is {highestFix[3].toFixed(1)} km.</p>
          </section>
          <aside className="details-sources">
            <h4>Sources &amp; credits</h4>
            <a href={flight.source} target="_blank" rel="noreferrer">SpaceX mission report <ArrowUpRight size={14}/></a>
            {mission.measured&&<a href={source} target="_blank" rel="noreferrer">Recorded ship positions <ArrowUpRight size={14}/></a>}
            {mission.historical&&<><a href={mission.historical.data.source} target="_blank" rel="noreferrer">Webcast observation archive <ArrowUpRight size={14}/></a><a href={mission.historical.oceanRegion.source} target="_blank" rel="noreferrer">Recovery region reference <ArrowUpRight size={14}/></a><a href={mission.historical.data.officialSource} target="_blank" rel="noreferrer">SpaceX source schedule <ArrowUpRight size={14}/></a></>}
            <a href="https://thespacedevs.com/llapi" target="_blank" rel="noreferrer">Launch epoch catalog <ArrowUpRight size={14}/></a>
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors <ArrowUpRight size={14}/></a>
            <a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noreferrer">Astronomy Engine <ArrowUpRight size={14}/></a>
            <a href="https://github.com/astronexus/HYG-Database" target="_blank" rel="noreferrer">HYG star catalog <ArrowUpRight size={14}/></a>
          </aside>
        </div>
      </div>}

    </DropdownMenu>}
    {archive&&<Archive close={()=>setArchive(false)} selectFlight={selectFlight}/>}
    {share&&<dialog className="atlas-dialog moment-dialog" ref={shareDialog} onClose={()=>setShare('')}><header><h2>Share this moment</h2><button aria-label="Close share" onClick={()=>setShare('')}><X/></button></header><p>Flight {mission.number} · {elapsedLabel(time)} · Globe</p>
      {location.protocol==='file:'&&<p>This link opens this copy on your device.</p>}<input aria-label="Moment link" readOnly value={share} onFocus={e=>e.target.select()}/><button className="copy-link" onClick={async e=>{const field=e.currentTarget.previousElementSibling;try{await navigator.clipboard.writeText(share);setCopied(true);}catch{field.focus();field.select();setCopied(document.execCommand('copy'));}}}>{copied?'Copied':'Copy link'} <ArrowRight size={14}/></button></dialog>}
  </div>
}
