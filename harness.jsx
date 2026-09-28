import { createRoot } from 'react-dom/client'
import './src/index.css'
import { DataContext } from './src/DataContext'
import { ToastProvider } from './src/components/ToastContext'
import FoodForm from './src/screens/datenbank/FoodForm'
const u=(l,g)=>({label:l,grams:g})
const f={id:'4',name:'Brezel oder Laugenstange',category:'Backwaren',kcal_100:238,fat_100:3.6,units:[u('100 g',100),u('Klein',70),u('Mittel',90),u('Groß',120)]}
createRoot(document.getElementById('root')).render(<ToastProvider><DataContext.Provider value={{foods:[f],sports:[],trackers:[]}}><FoodForm food={f} onClose={()=>{}}/></DataContext.Provider></ToastProvider>)
