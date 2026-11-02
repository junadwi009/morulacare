import React,{createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {bookDoctor,cancelDoctorBooking,listDoctorBookings,listDoctorSlots,listDoctors} from './doctor-api';
import type {Doctor,DoctorBooking} from './doctor-types';
function useBookingState(){
 const [doctors,setDoctors]=useState<Doctor[]>([]);const [bookings,setBookings]=useState<DoctorBooking[]>([]);
 const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [favoriteIds,setFavoriteIds]=useState<string[]>([]);
 const generation=useRef(0);const alive=useRef(true);const refreshBusy=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;};},[]);
 const refresh=useCallback(async()=>{if(refreshBusy.current)return;refreshBusy.current=true;const id=++generation.current;setError('');setLoading(true);
   try{const [catalog,reservations]=await Promise.all([listDoctors(),listDoctorBookings()]);if(alive.current&&id===generation.current){setDoctors(catalog);setBookings(reservations);}}
   catch(e){if(alive.current&&id===generation.current)setError(e instanceof Error?e.message:'Dokter belum dapat dimuat.');}
   finally{refreshBusy.current=false;if(alive.current)setLoading(false);}
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 const merge=useCallback((item:DoctorBooking)=>{generation.current++;setBookings(previous=>{
   const existing=previous.find(b=>b.id===item.id);
   // Cancellation is terminal for this booking ID. A delayed POST response from
   // before cancellation must never make the reservation look active again.
   const current=existing?.status==='cancelled_demo'&&item.status==='confirmed_demo'?existing:item;
   return [current,...previous.filter(b=>b.id!==item.id)];
 });},[]);
 const book=useCallback(async(doctorId:string,slotId:string,reason:string,key:string)=>{const item=await bookDoctor(doctorId,slotId,reason,key);if(alive.current)merge(item);return item;},[merge]);
 const cancel=useCallback(async(id:string)=>{const item=await cancelDoctorBooking(id);if(alive.current)merge(item);return item;},[merge]);
 const toggleFavorite=useCallback((id:string)=>setFavoriteIds(previous=>previous.includes(id)?previous.filter(v=>v!==id):[...previous,id]),[]);
 return {doctors,bookings,loading,error,refresh,favoriteIds,toggleFavorite,getSlots:listDoctorSlots,book,cancel};
}
type BookingState=ReturnType<typeof useBookingState>;const Context=createContext<BookingState|null>(null);
export function DoctorBookingProvider({children}:{children:ReactNode}){const value=useBookingState();return <Context.Provider value={value}>{children}</Context.Provider>;}
export function useDoctorBooking(){const state=useContext(Context);if(!state)throw Error('DoctorBookingProvider is required');return state;}
