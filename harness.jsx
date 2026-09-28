import { createRoot } from 'react-dom/client'
import './src/index.css'
import { DataContext } from './src/DataContext'
import { ToastProvider } from './src/components/ToastContext'
import Datenbank from './src/screens/Datenbank'
import FoodForm from './src/screens/datenbank/FoodForm'
import BuildTag from './src/components/BuildTag'
const u=(l,g)=>({label:l,grams:g})
const foods=[{id:'1',name:'Almigurt Joghurt',category:'Milchprodukte',kcal_100:97,fat_100:3,units:[u('100 g',100)]},{id:'4',name:'Brezel oder Laugenstange',category:'Backwaren',kcal_100:238,fat_100:3.6,units:[u('100 g',100),u('Klein',70)]}]
const v=new URLSearchParams(location.search).get('v')
createRoot(document.getElementById('root')).render(<ToastProvider><DataContext.Provider value={{foods,sports:[],trackers:[]}}>{v==='new'?<FoodForm food={null} onClose={()=>{}}/>:<div className="relative mx-auto max-w-[480px] px-4 pt-6"><BuildTag className="absolute top-1.5 right-4"/><Datenbank/></div>}</DataContext.Provider></ToastProvider>)
