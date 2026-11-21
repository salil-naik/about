export const returnChecks=[
  {time:5266,key:'hawaii',name:'Hawaiʻi',country:'United States',lat:20.8,lon:-157.4,description:'Return decision for Hawaiʻi. Starship is elsewhere on its recorded orbit.'},
  {time:26135,key:'chile',name:'Chile',country:'Chile',lat:-33,lon:-71,description:'Return decision for Chile. Starship is elsewhere on its recorded orbit.'},
  {time:74515,key:'hawaii',name:'Hawaiʻi',country:'United States',lat:20.8,lon:-157.4,description:'Final scheduled Pacific return option; not the ship’s current position.'},
];
export function activeReturnCheck(time){return returnChecks.find(r=>time>=r.time-90&&time<=r.time+210)||null;}
