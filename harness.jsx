import { createRoot } from 'react-dom/client'
import './src/index.css'
import { DataContext } from './src/DataContext'
import { ToastProvider } from './src/components/ToastContext'
import Datenbank from './src/screens/Datenbank'
import FoodPicker from './src/screens/hinzufuegen/FoodPicker'
const u=[{label:'100 g',grams:100}]
const foods=[['Brezel','Backwaren'],['Semmel','Backwaren'],['Äpfel','Obst'],['Cola','Getränke'],['Joghurt','Milchprodukte']].map(([n,c],i)=>({id:String(i),name:n,category:c,kcal_100:200,fat_100:5,units:u}))
const v=new URLSearchParams(location.search).get('v')
createRoot(document.getElementById('root')).render(<ToastProvider><DataContext.Provider value={{foods,sports:[],trackers:[]}}><div className="mx-auto max-w-[480px] px-4 pt-6">{v==='h'?<FoodPicker query="" onQuery={()=>{}} onPick={()=>{}} onCreate={()=>{}}/>:<Datenbank/>}</div></DataContext.Provider></ToastProvider>)
