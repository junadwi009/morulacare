export function dateLabel(value: string, timeZone = 'Asia/Jakarta'): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone }).format(new Date(value));
}
export function timeLabel(value: string, timeZone = 'Asia/Jakarta'): string {
  const clock = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(new Date(value));
  return `${clock} ${timeZone === 'Asia/Jakarta' ? 'WIB' : timeZone === 'Asia/Makassar' ? 'WITA' : timeZone === 'Asia/Jayapura' ? 'WIT' : timeZone}`;
}
export function dayParts(value: string, timeZone = 'Asia/Jakarta') {
  const date = new Date(value);
  return {
    day: new Intl.DateTimeFormat('id-ID', { day: '2-digit', timeZone }).format(date),
    month: new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone }).format(date).toUpperCase(),
    weekday: new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone }).format(date),
  };
}
export const statusLabel = { confirmed: 'Terkonfirmasi', completed: 'Selesai', cancelled: 'Dibatalkan', rescheduled: 'Dijadwalkan ulang', no_show: 'Tidak hadir' } as const;
