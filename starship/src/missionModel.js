import {flights,recordedShip,getStart} from './flights';
import {pad as pad15,dimensions as dims15} from './flight15Geometry';
import {events15} from './fifteenTiming';
import {createFlightDynamics} from './flightDynamics';
import {astronomyAt as ephemeris,subsolarLocation} from './missionAstronomy';
import epochs from './data/launch-epochs.json';
import {historicalProfile} from './historicalTelemetry';
export function createMission(number){
 const flight=flights.find(f=>f.number===number)||flights.at(-1),n=flight.number,recording=recordedShip[n];
 const dimensions=n>=12?{...dims15}:{ship:n>=7?52:50,booster:n>=7?71:70,diameter:9,tower:143};
 const epoch=Date.parse(epochs.launches[n].utc),start=-3;

 const origin=getStart(flight),pad=n===15?pad15:[-3,origin.lat,origin.lon,(8.5+dimensions.booster+12)/1000];
 const historical=n<=12?historicalProfile(n,flight,pad,dimensions):null;
 const sourceEnd=recording?.samples.at(-1)[0]??null;
 const recordedContact=n===13?sourceEnd+30:n===14?sourceEnd:null;
 const end=historical?.end??(n===15?81154:recordedContact!=null?recordedContact+12:sourceEnd||flight.duration*60);
 const stageSeconds=historical?.stageSeconds??(flight.stage?flight.stageSeconds:Infinity),boosterSeconds=historical?.boosterSeconds??flight.boosterSeconds;
 const shipCatch=n===15,boosterCatch=flight.booster.includes('Caught');
 const returning=!['early','ascent'].includes(flight.route),entry=historical?.entry??(n===15?79846:returning?end*.82:Infinity);
 const landing=historical?.landing??(n===15?81136:recordedContact!=null?recordedContact-25:returning?end-25:Infinity),cutoff=historical?.cutoff??Math.min(489,end*.5);
 const samples=historical?.points??recording.samples;
 const config={...flight,flight,number:n,epoch,start,end,pad,samples,dimensions,stageSeconds,boosterSeconds,shipCatch,boosterCatch,entry,landing,cutoff,source:recording?.source||flight.source,measured:!!recording,historical,boosterSamples:historical?.boostPoints?.length?historical.boostPoints:null,sourceEnd,recordedContact,shipContactTime:historical?.shipContact??recordedContact,boosterContactTime:historical?.boosterContact??null,flightEnd:historical?.flightEnd??recordedContact??end,shipOutcomeType:flight.ship.includes('Controlled')?'splashdown':shipCatch?'catch':'lost',boosterOutcomeType:boosterCatch?'catch':flight.booster.includes('Controlled')?'splashdown':flight.booster.includes('Hard')?'impact':'lost'};
 const dynamics=createFlightDynamics(config);
 const events=historical?historical.events:n===15?events15:[
  {time:-3,name:'Engine ignition',detail:`Starbase · ${flight.pad}. ${recording?'Recorded ship route.':'Illustrative reconstruction.'}`,source:'Mission reconstruction'},
  {time:0,name:'Liftoff',detail:flight.landmark,source:'Mission archive'},
  ...(flight.stage?[{time:stageSeconds,name:'Hot staging',detail:'Starship and Super Heavy separate. Vehicle attitude is reconstructed.',source:'Approximate milestone'},{time:Math.min(boosterSeconds,end),name:'Super Heavy outcome',detail:flight.booster,source:'Mission archive'}]:[]),
  ...(returning?[{time:Math.min(cutoff,end*.6),name:flight.phase==='Orbital flight'?'Orbital coast':'Ship coast',detail:flight.phase,source:'Mission reconstruction'},{time:entry,name:'Atmospheric entry',detail:'The ship returns toward Earth along the archived or illustrative route.',source:'Approximate milestone'}]:[]),
  {time:recordedContact??end,name:shipCatch?'Tower catch':recordedContact!=null?'Ship splashdown':'Flight outcome',detail:recordedContact!=null?'The ship reaches the ocean after a powered descent. Final water contact and settling are an estimated animation following the cached GPS record.':flight.ship,source:recordedContact!=null?'Estimated recovery timing':'Mission archive',quality:recordedContact!=null?'estimated':undefined,url:flight.source},
 ].sort((a,b)=>a.time-b.time);
 const majorTimes=new Set([0,58,141,370,489,1570,2101,5266,26135,74515,77757,79846,81136,end]);
 const markers=events.filter(e=>e.time>=0&&(n!==15||majorTimes.has(e.time))).map(e=>[e.time,e.name,e.quality]);
 // No chapter-specific speed changes during cruise. Slow shots are confined to
 // launch/separation and the final atmospheric return.
 const cruiseRate=t=>t<Math.min(stageSeconds-9,132)?10:flight.stage&&t<stageSeconds+12?1:flight.stage&&t<stageSeconds+34?5:t<stageSeconds+99?25:t>=landing-8?shipCatch||historical?.shipContact||recordedContact!=null?1:10:t>=entry?100:600;
 const rate=(t,target='ship')=>target==='booster'&&historical&&t>=boosterSeconds-30&&t<boosterSeconds+12?(t<boosterSeconds-8?10:1):cruiseRate(t);
 function advance(t,seconds,manual=null,target='ship'){
  if(manual)return Math.min(end,t+seconds*manual);
  const boundaries=[start,Math.min(stageSeconds-9,132),stageSeconds+12,stageSeconds+34,stageSeconds+99,entry,landing-8,boosterSeconds-30,boosterSeconds-8,boosterSeconds+12,end].filter(Number.isFinite).sort((a,b)=>a-b);
  let left=seconds;
  while(left>1e-9&&t<end){const speed=rate(t,target),b=boundaries.find(b=>b>t)??end,d=(b-t)/speed;if(left>=d){t=b;left-=d;}else{t+=left*speed;left=0;}}
  return Math.min(end,t);
 }
 const anchors=[[start,0],[Math.min(flight.stage?stageSeconds+34:end*.5,end*.6),.24],[Math.min(510,end*.7),.38],[returning?entry:end*.9,.78],...(returning?[[landing-8,.9]]:[]),[end,1]].filter(a=>Number.isFinite(a[0])).filter((a,i,a0)=>!i||a[0]>a0[i-1][0]);
 const remap=(v,input,output)=>{const found=anchors.findIndex((a,i)=>i<anchors.length-1&&v<=anchors[i+1][input]);const i=found<0?anchors.length-2:found;const a=anchors[i],b=anchors[i+1]||anchors.at(-1),u=Math.max(0,Math.min(1,(v-a[input])/(b[input]-a[input])));return a[output]+u*(b[output]-a[output]);};
 const fixIndex=t=>{let lo=0,hi=samples.length;while(lo<hi){const m=(lo+hi)>>>1;if(samples[m][0]<=t)lo=m+1;else hi=m;}return lo-1;};
 return {...config,...dynamics,events,markers,rate,advance,fixIndex,fraction:t=>remap(t,0,1),timeAt:f=>remap(f,1,0),date:t=>new Date(epoch+t*1000),astronomyAt:t=>ephemeris(t,epoch),subsolarPoint:t=>subsolarLocation(t,epoch),positionEstimatedAt:t=>!!historical||(recordedContact!=null&&t>sourceEnd),returnCheck:t=>n===15?returnChecks.find(r=>t>=r.time-90&&t<=r.time+210)||null:null,boosterAvailable:t=>flight.stage&&t>=stageSeconds&&t<Math.min(end,boosterSeconds+12)};
}
import {returnChecks} from './returnRegions';
