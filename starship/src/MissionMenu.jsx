import React,{useRef,useEffect} from 'react';
import {X} from 'lucide-react';
export function DropdownMenu({title,close,children,className=''}){
  const dialog=useRef(null);
  useEffect(()=>{dialog.current.showModal();},[]);
  return <dialog className={'atlas-dialog mission-sheet '+className} ref={dialog} onClose={close} onClick={e=>{if(e.target===dialog.current){const r=dialog.current.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}}}>
    <header><h2>{title}</h2><button aria-label="Close panel" onClick={close}><X size={20}/></button></header>{children}</dialog>
}
