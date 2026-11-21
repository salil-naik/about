import json,hashlib,re,argparse
from pathlib import Path
parser=argparse.ArgumentParser(description='Import numerical webcast observations from downloaded public source JSON files.');parser.add_argument('cache',type=Path);args=parser.parse_args()
urls=['F01.88a7dfb6','F02.447615b7','F03.3d4f1110','F04.bef7df27','F05.0597c984','F06.73064066','F07.c9fa4683','F08.fa3f9f38','F09.90e6a59d','F10.4cbc5c91','F11.ac3de564','F12.cdc0ddc4']
for n in range(1,13):
 raw=(args.cache/f'atlas-F{n:02d}.json').read_bytes();f=json.loads(raw)
 def decode(d):
  time=value=0;rows=[]
  for dt,dur,dv in zip(d['t'],d['d'],d['v']):
   time+=dt;value+=dv
   if dur>=0:rows.append([round(time/100,3),round((time+dur)/100,3),value/d['s']])
  return sorted(rows)
 records={v:{k:decode(f[v][k]) for k in ['alt','speed','eng'] if k in f[v]} for v in ['ship','booster']}
 # Official schedules are source-verified plans, never confirmed occurrence times.
 official=(args.cache/f'atlas-official-{n}.json')
 schedule=[]
 if official.exists():
  o=json.loads(official.read_text());tl=o.get('postLaunchTimeline') or {}
  for e in tl.get('timelineEntries',[]):
   h,m,s=map(int,e['time'].split(':'));schedule.append({'time':3600*h+60*m+s,'name':e['description']})
 output={'number':n,'source':f'https://telemetry.starshipspaceprogram.com/data/{urls[n-1]}.js','credit':'Webcast extraction by Rafael Adamy / Starship Telemetry; numerical observations only. No simulator code or generated 3D tracks reused.','sha256':hashlib.sha256(raw).hexdigest(),'retrieved':'2026-11-21','units':{'time':'mission seconds as indexed by the webcast archive','alt':'km; quantized webcast readout','speed':'km/h; webcast readout','eng':'engine count'},'limitations':['OCR/template extraction can contain misreads and clock offsets.','End of archive data is not a verified contact or loss time.','Latitude, longitude and attitude are not measured by these observations.'],'stagingCandidate':f['stagingT'],'observations':records,'detectedEvents':[{'time':e['T'],'name':e['event'],'quality':'telemetry-derived'} for e in f['events']],'officialSchedule':schedule,'officialSource':f'https://content.spacex.com/api/spacex-website/missions/starship-flight-{n}' if n>1 else 'https://www.spacex.com/updates/#upgrades-ahead-of-starships-second-flight-test'}

 for vehicle in output['observations'].values():
  sparse=[];last=-1
  for row in vehicle['speed']:
   bucket=int(row[0])
   if bucket!=last:sparse.append(row);last=bucket
  vehicle['speed']=sparse
 output['speedSampling']='First original source interval per mission-second bucket. Values and source timestamps unchanged; not an interpolated measurement.'
 Path(f'src/data/historical/flight{n}.json').write_text(json.dumps(output,separators=(',',':'))+'\n')
 print(n,len(raw),sum(len(r) for v in records.values() for r in v.values()),len(schedule))
