import f1 from './data/historical/flight1.json';
import f2 from './data/historical/flight2.json';
import f3 from './data/historical/flight3.json';
import f4 from './data/historical/flight4.json';
import f5 from './data/historical/flight5.json';
import f6 from './data/historical/flight6.json';
import f7 from './data/historical/flight7.json';
import f8 from './data/historical/flight8.json';
import f9 from './data/historical/flight9.json';
import f10 from './data/historical/flight10.json';
import f11 from './data/historical/flight11.json';
import f12 from './data/historical/flight12.json';
export const historicalData=[null,f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const blend=(t,a,b)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u);};
const radians=Math.PI/180,R=6371;
// Numerical facts checked against SpaceX's postflight reports. A reported
// approximate time stays approximate. HUD record endings are never contact.
export const reportedMilestones={
  1:{ship:{time:240,name:'Flight termination',quality:'reported-approximate',detail:'SpaceX reports loss of control and flight termination. The published 237.474 s figure is measured from engine ignition, not liftoff.',url:'https://www.spacex.com/updates/#upgrades-ahead-of-starships-second-flight-test'}},
  2:{ship:{time:480,name:'Ship lost during ascent',quality:'reported-approximate',detail:'SpaceX reports loss after more than eight minutes; this is an approximate chapter time, not an exact failure timestamp.'},booster:{time:210,name:'Booster lost during boostback',quality:'reported-approximate',detail:'SpaceX reports breakup after more than three and a half minutes, around 90 km altitude. The webcast archive ends earlier.'}},
  3:{ship:{time:2940,name:'Ship signal lost during entry',quality:'reported-approximate',detail:'SpaceX reports last signals at approximately 49 minutes. Position is held after the last available webcast measurement.'},booster:{time:420,name:'Booster signal lost',quality:'reported-approximate',detail:'SpaceX reports the booster flight ended just under seven minutes, around 462 m altitude. This is not a controlled splashdown.'}},
  4:{ship:{time:3960,name:'Ship splashdown',quality:'reported-approximate',detail:'SpaceX confirms a soft Indian Ocean splashdown about 66 minutes after launch.'},booster:{time:444,name:'Booster splashdown',quality:'reported',detail:'SpaceX reports a soft Gulf splashdown at T+7:24.'}},
  5:{ship:{time:3940,name:'Ship splashdown',quality:'reported',detail:'SpaceX reports Indian Ocean splashdown at T+1:05:40.'}},
  7:{ship:{time:500,name:'Ship signal lost',quality:'reported-approximate',detail:'SpaceX reports final telemetry just over 8:20. The end of this webcast extraction is earlier.',url:'https://www.spacex.com/updates/#flight-7-report'}},
  8:{ship:{time:570,name:'Ship signal lost',quality:'reported-approximate',detail:'SpaceX reports final telemetry at approximately 9.5 minutes.'}},
  9:{ship:{time:2760,name:'Ship signal lost during entry',quality:'reported-approximate',detail:'SpaceX reports contact lost at approximately 46 minutes, about 59 km above the Indian Ocean.'}},
};
reportedMilestones[10]={ship:{time:3998,name:'Ship splashdown',quality:'catalog-reported',source:'McDowell launch catalog',url:'https://planet4589.com/space/papers/space25.pdf',detail:'Cataloged touchdown at 00:36:38 UTC, approximately 19.16° S, 106.93° E. Intermediate ground positions remain estimated.'}};
reportedMilestones[11]={ship:{time:3976,name:'Ship splashdown',quality:'catalog-reported',source:'McDowell launch catalog',url:'https://planet4589.com/space/papers/space25.pdf',detail:'Cataloged touchdown at 00:29:57 UTC, approximately 19.16° S, 106.92° E. Intermediate ground positions remain estimated.'}};
const contacts={ship:{4:3960,5:3940,6:3930,10:3998,11:3976,12:3982},booster:{4:444,5:418.3,6:415,7:401,8:407,10:400,11:400,12:379.1}};
// Broad recovery regions, not surveyed touchdown coordinates. The whole
// horizontal route remains estimated; do not relabel these as GPS fixes.
const recoveryRegions={4:{lat:-19,lon:105,radiusKm:300,source:'https://planet4589.com/space/papers/space24.pdf'},5:{lat:-19,lon:105,radiusKm:300,source:'https://planet4589.com/space/papers/space24.pdf'},6:{lat:-19,lon:105,radiusKm:300,source:'https://planet4589.com/space/papers/space24.pdf'},10:{lat:-19.16,lon:106.93,radiusKm:50,source:'https://planet4589.com/space/papers/space25.pdf'},11:{lat:-19.16,lon:106.92,radiusKm:50,source:'https://planet4589.com/space/papers/space25.pdf'}};
export function observationAt(rows,time,tolerance=0){
 let lo=0,hi=rows.length;while(lo<hi){const m=(lo+hi)>>>1;if(rows[m][0]<=time)lo=m+1;else hi=m;}
 const r=rows[lo-1];return r&&time<=r[1]+tolerance?{value:r[2],from:r[0],to:r[1],age:Math.max(0,time-r[1])}:null;
}
function valueBetween(rows,t){
 let lo=0,hi=rows.length;while(lo<hi){const m=(lo+hi)>>>1;if(rows[m][0]<=t)lo=m+1;else hi=m;}
 const a=rows[Math.max(0,lo-1)],b=rows[lo];
 if(!a)return 0;if(!b||t<=a[1])return a[2];
 return a[2]+(b[2]-a[2])*clamp((t-a[1])/(b[0]-a[1]));
}
function fitHeight(rows,terminal,contact,initial=0,impactSpeed=0){
 const knots=[[0,initial]];let previous=rows[0];
 for(const row of rows){
  if(row[0]>terminal||row[2]<0||row[2]>350)continue;
  if(previous&&row[2]!==previous[2]&&row[0]>knots.at(-1)[0]){
   const height=(previous[2]+row[2])/2,last=knots.at(-1);
   // Reject isolated display/OCR jumps beyond plausible vertical motion.
   if(Math.abs(height-last[1])<=Math.max(2,(row[0]-last[0])*.4))knots.push([row[0],height]);
  }
  previous=row;
 }
 if(contact){while(knots.length>1&&knots.at(-1)[0]>=terminal-2)knots.pop();knots.push([terminal,0]);}
 else if(previous&&terminal>knots.at(-1)[0])knots.push([terminal,previous[2]]);
 const slopes=knots.map((k,i)=>{
  if(!i)return 0;
  if(i===knots.length-1)return contact&&impactSpeed?-Math.min(impactSpeed,3*Math.abs((k[1]-knots[i-1][1])/(k[0]-knots[i-1][0]))):0;
  const a=(k[1]-knots[i-1][1])/(k[0]-knots[i-1][0]),b=(knots[i+1][1]-k[1])/(knots[i+1][0]-k[0]);
  return a*b<=0?0:2*a*b/(a+b);
 });
 return t=>{
  if(t<=0)return initial;let i=0,hi=knots.length;
  while(i<hi){const m=(i+hi)>>>1;if(knots[m][0]<=t)i=m+1;else hi=m;}
  const j=Math.max(0,i-1),a=knots[j],b=knots[j+1];if(!b)return a[1];
  const dt=b[0]-a[0],u=clamp((t-a[0])/dt);
  return Math.max(0,(2*u**3-3*u*u+1)*a[1]+(u**3-2*u*u+u)*dt*slopes[j]+(-2*u**3+3*u*u)*b[1]+(u**3-u*u)*dt*slopes[j+1]);
 };
}
function pointAlong(origin,bearing,angle,height,t){
 const lat=origin[1]*radians,lon=origin[2]*radians,az=bearing*radians;
 const p=Math.asin(Math.sin(lat)*Math.cos(angle)+Math.cos(lat)*Math.sin(angle)*Math.cos(az));
 const l=lon+Math.atan2(Math.sin(az)*Math.sin(angle)*Math.cos(lat),Math.cos(angle)-Math.sin(lat)*Math.sin(p));
 return [t,p/radians,((l/radians+540)%360)-180,height];
}
const rawEnd=o=>Math.max(...o.alt.map(r=>r[1]));
const eventTime=(data,name,fallback)=>data.detectedEvents.find(e=>e.name===name)?.time??fallback;
export function historicalProfile(number,flight,pad,dimensions){
 const data=historicalData[number],observations=data.observations,report=reportedMilestones[number]||{};
 const oceanRegion={label:'Indian Ocean · estimated recovery region',lat:-19,lon:107,radiusKm:800,source:'https://www.faa.gov/media/76836',...recoveryRegions[number]};
 const stage=number===1?Infinity:data.stagingCandidate;
 const shipContact=contacts.ship[number]??null,boosterContact=contacts.booster[number]??null;
 const shipLast=rawEnd(observations.ship),boosterLast=rawEnd(observations.booster);
 const flightEnd=shipContact??Math.max(shipLast,report.ship?.time||0);
 const boosterEnd=boosterContact??Math.max(boosterLast,report.booster?.time||0,number===9?390:0);
 const end=flightEnd+12,boosterCatch=flight.booster.includes('Caught');
 const shipTerminal=shipContact??shipLast,shipH=fitHeight(observations.ship.alt,shipTerminal,!!shipContact);
 const boostH=fitHeight(observations.booster.alt,boosterContact??boosterLast,!!boosterContact,0,flight.booster.includes('Hard')?.4:0);
 const cutoff=eventTime(data,'SECO',Math.min(flightEnd,stage+340));
 const entry=eventTime(data,'Entry interface (120 km)',Infinity);
 const landing=shipContact?eventTime(data,'Ship landing burn',shipContact-24):Infinity;
 const height=(t)=>shipH(t)+pad[3]*(1-blend(t,0,30))+.012*blend(t,0,30);
 const points=[],angles=[];let angle=0;
 for(let t=0;t<=Math.ceil(flightEnd);t++){
  const q=Math.min(t,flightEnd),h=height(q),vh=(shipH(q+.5)-shipH(Math.max(0,q-.5)));
  const speed=valueBetween(observations[q<stage?'booster':'ship'].speed,q)/3600;
  if(q<=shipTerminal&&t)angle+=Math.sqrt(Math.max(0,speed*speed-vh*vh))/(R+h);
  points.push(pointAlong(pad,98.5,angle,h,q));angles.push(angle);
 }
 // Blend only the final recovery corridor toward a broad known ocean region.
 // This correction is explicitly an estimate, not a positional measurement.
 if(shipContact){
  const last=points.at(-1),lonDiff=((oceanRegion.lon-last[2]+540)%360)-180;
  for(const p of points){const u=blend(p[0],Math.min(entry,shipContact-300),shipContact);p[1]+=(oceanRegion.lat-last[1])*u;p[2]=((p[2]+lonDiff*u+540)%360)-180;}
  points.at(-1)[3]=.012;
 }
 const sharedAngle=angles[Math.min(angles.length-1,Math.floor(stage))]||0;
 const boostPoints=[];
 if(Number.isFinite(stage)&&number!==9){
  const turn=eventTime(data,'Boostback end',stage+50);let distance=sharedAngle;
  const raw=[];
  for(let t=Math.floor(stage);t<=Math.ceil(boosterEnd);t++){
   const q=Math.min(t,boosterEnd),h=boostH(q),vertical=boostH(q+.5)-boostH(Math.max(0,q-.5)),speed=valueBetween(observations.booster.speed,q)/3600;
   if(q<=boosterLast&&t>stage)distance+=Math.sqrt(Math.max(0,speed*speed-vertical*vertical))/(R+h)*(1-2*blend(q,turn-12,turn+12));
   raw.push([q,distance,h]);
  }
  const target=boosterCatch?0:.004,correction=target-raw.at(-1)[1];
  for(const [t,a,h] of raw){const terminalOffset=boosterContact?(dimensions.booster/2000+(boosterCatch?.06:0)):0;boostPoints.push(pointAlong(pad,98.5,a+correction*blend(t,turn,boosterEnd),h+terminalOffset,t));}
 }
 const events=[{time:-3,name:'Engine ignition',quality:'estimated',source:'Estimated animation',url:flight.source,detail:'Opening ignition animation; engine command timing is approximate.'},{time:0,name:'Liftoff',quality:'reported',source:'SpaceX flight report',url:flight.source,detail:'Launch and mission outcome checked against the SpaceX postflight report.'}];
 const names={'Max Q':'Estimated max Q','MECO':'Booster engine cutoff','Staging':'Hot staging','Boostback start':'Boostback ignition','Boostback end':'Boostback cutoff','Booster landing burn':'Booster landing burn','SECO':'Ship engine cutoff','Ship relight':'In-space relight','Entry interface (120 km)':'Entry · 120 km','Ship landing burn':'Ship landing burn'};
 for(const event of data.detectedEvents){
  if(!names[event.name]||event.time>flightEnd||event.name==='Booster landing burn'&&event.time>=boosterEnd)continue;
  events.push({time:event.name==='Staging'?stage:event.time,name:names[event.name],quality:'telemetry-derived',source:'Webcast-derived timing',url:data.source,detail:event.name==='Max Q'?'Calculated from webcast speed and altitude using an atmosphere model; not a verified webcast callout.':'Detected from webcast measurements. Approximate; extraction and display latency can affect this timestamp.'});
 }
 for(const vehicle of ['booster','ship']){
  if(number===1&&vehicle==='booster')continue;
  const terminal=vehicle==='ship'?flightEnd:boosterEnd,contact=vehicle==='ship'?shipContact:boosterContact,primary=report[vehicle];
  const caught=vehicle==='booster'&&boosterCatch;
  events.push({time:Math.min(terminal,flightEnd),name:primary?.name||(caught?'Booster catch':contact?(vehicle==='ship'?'Ship splashdown':number===12?'Booster impact':'Booster splashdown'):(vehicle==='ship'?'Ship record ends':'Booster record ends')),
   quality:primary?.quality||'estimated',source:primary?(primary.source||'SpaceX flight report'):'Estimated recovery timing',url:primary?.url||flight.source,
   detail:primary?.detail||(contact?'Outcome confirmed by SpaceX. Contact timing and recovery position are estimated from the webcast and published mission profile.':'Available telemetry does not establish the exact loss time or location. The scene stops at the last known altitude; no water contact is invented.')});
 }
 if(shipContact&&!events.some(e=>e.name==='Ship landing burn'))events.push({time:landing,name:'Ship landing burn',quality:'estimated',source:'Estimated burn timing',url:flight.source,detail:'SpaceX confirms a powered landing. Its exact ignition time is not resolved by this extraction; this animation uses an estimated final burn.'});
 const story={
  'Booster engine cutoff':'Most booster engines shut down as Starship prepares to separate.',
  'Hot staging':'Starship lights its engines and leaves Super Heavy behind.',
  'Boostback ignition':'Super Heavy turns back toward its recovery area.',
  'Boostback cutoff':'The booster finishes its return burn and begins its descent.',
  'Booster landing burn':'Super Heavy relights its engines for the final descent.',
  'Ship engine cutoff':'Starship shuts down its ascent engines and coasts above Earth.',
  'In-space relight':'A Raptor relights briefly during the coast through space.',
  'Entry · 120 km':'Starship descends through 120 kilometres toward the atmosphere.',
  'Ship landing burn':'The engines relight to slow Starship over the ocean.',
  'Ship splashdown':'Starship touches down in the Indian Ocean. The engines shut down and the hull settles onto the water.',
  'Booster splashdown':'Super Heavy completes a powered descent into the Gulf.',
  'Booster impact':'Super Heavy reaches the water at high speed. This is an impact, not a controlled landing.',
  'Booster catch':'The tower catches Super Heavy and supports it above the launch pad.',
 };
 for(const event of events)if(story[event.name]){event.verificationNote=event.detail;event.detail=story[event.name];}
 // Detect contradictory engine-display timing instead of silently presenting
 // a cutoff after separation as a verified occurrence. Keep its source time.
 const meco=events.find(e=>e.name==='Booster engine cutoff');
 if(meco&&meco.time>=stage){
  const lift=data.officialSchedule.find(e=>e.name==='Liftoff')?.time||0;
  const planned=data.officialSchedule.find(e=>e.name.includes('MECO'));
  meco.verificationNote='The archive detects the cutoff indication at '+meco.time+' s, after its staging candidate at '+stage.toFixed(2)+' s. This conflicts with the flight sequence. The displayed cutoff is reconciled with the published approximate plan, not a verified actual timestamp.';
  meco.time=planned&&planned.time-lift<stage?planned.time-lift:stage-2;
  meco.quality='estimated';meco.source='Reconciled approximate timing';meco.url=flight.source;
 }
 // Preserve source-verified scheduled events separately in the details panel.
 return {data,points,boostPoints,stageSeconds:stage,boosterSeconds:boosterEnd,flightEnd,end,entry,landing,cutoff,shipContact,boosterContact,events:events.sort((a,b)=>a.time-b.time),oceanRegion,
  observationAt:(vehicle,t)=>{const contact=vehicle==='ship'?shipContact:boosterContact;if(contact!=null&&t>contact)return {alt:null,speed:null,eng:null,ended:true};const o=observations[vehicle];const rejectEngine=vehicle==='ship'&&[4,5,10].includes(number)&&t>=landing;return {alt:observationAt(o.alt,t),speed:observationAt(o.speed,t,1),eng:rejectEngine?null:observationAt(o.eng,t,1),engineNote:rejectEngine?'Archive engine count conflicts with the confirmed powered landing':null};},
  coverageAt:(t,vehicle=t<stage?'booster':'ship')=>{const contact=vehicle==='ship'?shipContact:boosterContact;if(contact!=null&&t>contact)return 'Recovery animation · estimated motion';const o=observations[vehicle];return observationAt(o.alt,t)?'Webcast altitude · route estimated':'Telemetry gap · estimated profile';}};
}
