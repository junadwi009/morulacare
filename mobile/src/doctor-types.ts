export type Doctor={id:string;name:string;specialty:string;gender:'female'|'male';experienceYears:number;languages:string[];branchId:string;branchName:string;bio:string;imageKey:string};
export type DoctorSlot={id:string;doctorId:string;startsAt:string;endsAt:string;timeZone:string;available:boolean};
export type DoctorBooking={id:string;doctorId:string;doctorName:string;specialty:string;branchId:string;branchName:string;startsAt:string;endsAt:string;timeZone:string;status:'confirmed_demo'|'cancelled_demo';reason:string;createdAt:string};
