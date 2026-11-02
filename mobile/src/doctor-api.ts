import { apiRequest, isApiMode, makeId } from './api';
import type { Doctor, DoctorBooking, DoctorSlot } from './doctor-types';
import catalog from './doctor-catalog.json';

// The offline concept remains usable; API failures never fall back to these data.
const localDoctors:Doctor[]=catalog as Doctor[];
let localBookings:DoctorBooking[]=[];
const keys=new Map<string,{fingerprint:string;id:string}>();
function failure(message:string,status:number):never{throw Object.assign(new Error(message),{status});}
export async function listDoctors():Promise<Doctor[]>{return isApiMode?apiRequest('/api/v1/doctors'):localDoctors;}
export async function listDoctorBookings():Promise<DoctorBooking[]>{return isApiMode?apiRequest('/api/v1/doctor-bookings'):[...localBookings];}
export async function listDoctorSlots(id:string):Promise<DoctorSlot[]>{
 if(isApiMode)return apiRequest(`/api/v1/doctors/${encodeURIComponent(id)}/slots`);
 if(!localDoctors.some(d=>d.id===id))return failure('Dokter tidak ditemukan.',404);
 return ['03','04','05'].flatMap(day=>['09:00','10:30','13:00','15:00'].map(time=>{
   const slotId=`${id}-202611${day}-${time.replace(':','')}`;
   const start=`2026-11-${day}T${time}:00+07:00`;
   return {id:slotId,doctorId:id,startsAt:start,endsAt:new Date(Date.parse(start)+1800000).toISOString(),timeZone:'Asia/Jakarta',available:!localBookings.some(b=>b.status==='confirmed_demo'&&b.doctorId===id&&b.startsAt===start)};
 }));
}
export async function bookDoctor(doctorId:string,slotId:string,reason:string,key:string):Promise<DoctorBooking>{
 if(isApiMode)return apiRequest('/api/v1/doctor-bookings','POST',{doctorId,slotId,reason},{'Idempotency-Key':key});
 const fingerprint=JSON.stringify({doctorId,slotId,reason:reason.trim()});const previous=keys.get(key);
 if(previous){if(previous.fingerprint!==fingerprint)return failure('Kunci booking sudah digunakan.',409);return localBookings.find(b=>b.id===previous.id)!;}
 if(!reason.trim()||reason.length>500)return failure('Isi keperluan konsultasi maksimal500karakter.',422);
 const doctor=localDoctors.find(d=>d.id===doctorId);const slot=(await listDoctorSlots(doctorId)).find(s=>s.id===slotId);
 if(!doctor||!slot)return failure('Jadwal tidak sesuai dokter.',422);
 const replay=keys.get(key);if(replay){if(replay.fingerprint!==fingerprint)return failure('Kunci booking sudah digunakan.',409);return localBookings.find(b=>b.id===replay.id)!;}
 // Recheck after the async lookup to avoid concurrent local reservations.
 if(localBookings.some(b=>b.doctorId===doctorId&&b.startsAt===slot.startsAt&&b.status==='confirmed_demo'))return failure('Jadwal sudah dipilih. Pilih waktu lain.',409);
 const booking:DoctorBooking={id:makeId(),doctorId,doctorName:doctor.name,specialty:doctor.specialty,branchId:doctor.branchId,branchName:doctor.branchName,startsAt:slot.startsAt,endsAt:slot.endsAt,timeZone:slot.timeZone,status:'confirmed_demo',reason:reason.trim(),createdAt:new Date().toISOString()};
 localBookings=[booking,...localBookings];keys.set(key,{fingerprint,id:booking.id});return booking;
}
export async function cancelDoctorBooking(id:string):Promise<DoctorBooking>{
 if(isApiMode)return apiRequest(`/api/v1/doctor-bookings/${encodeURIComponent(id)}/cancel`,'POST');
 const item=localBookings.find(b=>b.id===id);if(!item)return failure('Booking tidak ditemukan.',404);
 const cancelled:DoctorBooking={...item,status:'cancelled_demo'};localBookings=localBookings.map(b=>b.id===id?cancelled:b);return cancelled;
}
