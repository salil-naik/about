import React, {useEffect,useRef,useState} from 'react';
import {ArrowUpRight, Search, X} from 'lucide-react';
import {flights} from './flights';
export default function Archive({selectFlight,close}) {
  const dialog=useRef(null);
  const [query,setQuery]=useState('');
  useEffect(()=>{dialog.current.showModal();},[]);
  function closeOnBackdrop(event){
    if(event.target!==dialog.current)return;
    const bounds=dialog.current.getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)close();
  }
  const visible=[...flights].reverse().filter(f=>('Flight '+f.number+' '+f.date+' '+f.landmark+' '+f.booster+' '+f.ship).toLowerCase().includes(query.toLowerCase()));
  return <dialog className="atlas-dialog archive-dialog" ref={dialog} onCancel={event=>{event.preventDefault();close();}} onClose={close} onClick={closeOnBackdrop} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();close();}}}>
    <header><div><small>STARSHIP ATLAS</small><h2>Mission archive</h2></div><button aria-label="Close archive" onClick={close}><X/></button></header>
    <div className="archive-content"><label className="archive-search"><Search size={16}/><input autoFocus aria-label="Search flights" placeholder="Search flights, dates or outcomes" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <div className="archive-rows">{visible.map(f=><button key={f.number} onClick={()=>{close();selectFlight(f.number);}}><strong>Flight {f.number}<small>{f.date}</small></strong><span><small>SUPER HEAVY</small>{f.booster}</span><span><small>STARSHIP</small>{f.ship}</span><ArrowUpRight size={16}/></button>)}{!visible.length&&<p>No matching flights.</p>}</div></div>
  </dialog>
}
