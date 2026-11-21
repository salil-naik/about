import React,{createContext,useContext,useMemo} from 'react';
import {createMission} from './missionModel';
import {createSite} from './starbaseScene';
const Context=createContext(null);
export function MissionProvider({number,children}){const mission=useMemo(()=>{const m=createMission(number);m.site=createSite(m);return m;},[number]);return <Context.Provider value={mission}>{children}</Context.Provider>;}
export const useMission=()=>useContext(Context);
