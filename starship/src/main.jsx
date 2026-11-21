import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Analytics} from '@vercel/analytics/react';
import MissionReplay from './MissionReplay';
import {MissionProvider} from './MissionContext';
import './style.css';
function requested(){const n=Number(new URLSearchParams(location.hash.slice(1)).get('flight'));return n>=1&&n<=15?Math.floor(n):15;}
function App(){
 const [number,setNumber]=useState(requested);
 useEffect(()=>{const change=()=>setNumber(requested());window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
 const selectFlight=n=>{location.hash=new URLSearchParams({flight:String(n)});setNumber(n);};
 return <MissionProvider key={number} number={number}><MissionReplay selectFlight={selectFlight}/></MissionProvider>;
}
createRoot(document.getElementById('root')).render(<><App/><Analytics/></>);
