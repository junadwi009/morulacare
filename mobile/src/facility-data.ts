export type Point = { latitude: number; longitude: number };
export type Facility = Point & { id: string; name: string; city: string; address: string; sourceUrl: string };
export type RankedFacility = Facility & { distanceKm: number | null };
export const directoryVerifiedAt = '1 November 2026';
const source = 'https://www.morulaivf.co.id/lokasi-klinik/';
// Coordinates come from each official page's "Arahkan ke Lokasi" map link.
// Public directory snapshot; independent from synthetic patient/appointment data.
export const facilities: readonly Facility[] = [
  {id:'jakarta',name:'Morula IVF Jakarta',city:'Jakarta',address:'THE BIC – BIC 2, Jl. Teuku Cik Ditiro No.11–12, Gondangdia, Menteng, Jakarta Pusat 10350',latitude:-6.195055,longitude:106.8338607,sourceUrl:source+'morula-ivf-jakarta/'},
  {id:'international-bsd',name:'Morula IVF International Fertility Clinic',city:'Tangerang · BSD',address:'Scientific Tower D-Hub, Biomedical Campus BSD City, Level 3, Sampora, Cisauk, Kabupaten Tangerang, Banten',latitude:-6.306958401256231,longitude:106.65518849576422,sourceUrl:source+'morula-ivf-international-fertility-clinic/'},
  {id:'ciputat',name:'Morula IVF Ciputat',city:'Tangerang Selatan',address:'Jl. R.E. Martadinata No.30, Ciputat, Tangerang Selatan, Banten 15411',latitude:-6.3276236,longitude:106.7444562,sourceUrl:source+'morula-ivf-ciputat/'},
  {id:'margonda',name:'Morula IVF Margonda',city:'Depok',address:'RSU Bunda Margonda lantai 1 & 2, Jl. Margonda Raya No.28, Pondok Cina, Depok 16424',latitude:-6.3652337,longitude:106.8316451,sourceUrl:source+'morula-ivf-margonda/'},
  {id:'bandung',name:'Morula IVF Melinda Bandung',city:'Bandung',address:'RS Melinda 2 Lt.6, Jl. dr. Cipto No.1, Bandung',latitude:-6.906233,longitude:107.5957471,sourceUrl:source+'morula-ivf-melinda-bandung/'},
  {id:'yogyakarta',name:'Morula IVF Yogyakarta',city:'Yogyakarta',address:'Jl. Ringroad Utara No.160, Condong Catur, Sleman, Yogyakarta 55283',latitude:-7.7577968,longitude:110.4044668,sourceUrl:source+'morula-ivf-yogyakarta/'},
  {id:'surabaya',name:'Morula IVF Surabaya',city:'Surabaya',address:'National Hospital Annex Building Lt.5, Jl. Boulevard Family Selatan Kav.1, Surabaya',latitude:-7.2994181,longitude:112.6738125,sourceUrl:source+'morula-ivf-surabaya/'},
  {id:'denpasar',name:'Morula IVF Denpasar',city:'Denpasar · Bali',address:'Jl. Gatot Subroto Barat No.455x, Padangsambian Kaja, Denpasar Barat, Bali 80117',latitude:-8.6369627,longitude:115.1816639,sourceUrl:source+'morula-ivf-denpasar/'},
  {id:'makassar',name:'Morula IVF Makassar',city:'Makassar',address:'RSIA Sentosa Makassar Lt.5, Jl. Jend. Sudirman No.52, Sawerigading, Ujung Pandang, Makassar 90114',latitude:-5.1445829,longitude:119.4121325,sourceUrl:source+'morula-ivf-makassar/'},
  {id:'pontianak',name:'Morula IVF Pontianak',city:'Pontianak',address:'RSIA Anugerah Bunda Khatulistiwa, Jl. Ahmad Yani, Pontianak, Kalimantan Barat',latitude:-0.0614423,longitude:109.3503277,sourceUrl:source+'morula-ivf-pontianak/'},
  {id:'padang',name:'Morula IVF Padang',city:'Padang',address:'RSU Citra BMC Padang, Jl. Proklamasi No.37, Padang, Sumatera Barat',latitude:-0.950852,longitude:100.365028,sourceUrl:source+'morula-ivf-padang/'},
];
export function validPoint(point: Point | null | undefined): point is Point {
  return !!point && Number.isFinite(point.latitude) && Math.abs(point.latitude)<=90 && Number.isFinite(point.longitude) && Math.abs(point.longitude)<=180;
}
export function distanceKm(a: Point,b: Point): number {
  const rad=(n:number)=>n*Math.PI/180;
  const h=Math.sin(rad(b.latitude-a.latitude)/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(rad(b.longitude-a.longitude)/2)**2;
  return 6371*2*Math.asin(Math.sqrt(Math.max(0,Math.min(1,h))));
}
export function rankFacilities(query: string,origin: Point|null): RankedFacility[] {
  const q=query.trim().toLocaleLowerCase('id-ID');
  return facilities.filter(item=>`${item.name} ${item.city} ${item.address}`.toLocaleLowerCase('id-ID').includes(q))
    .map(item=>({...item,distanceKm:validPoint(origin)?distanceKm(origin,item):null}))
    .sort((a,b)=>a.distanceKm!==null&&b.distanceKm!==null?a.distanceKm-b.distanceKm:a.name.localeCompare(b.name,'id'));
}
