import * as Crypto from 'expo-crypto';
import { freshDemo } from './demo';
import type { CareReceipt, CareRequest, ChatReply, Overview, Preferences, Reminder } from './types';

const apiBase = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/$/, '');
const useDemoAuth = process.env.EXPO_PUBLIC_DEMO_AUTH === 'true';
export const isApiMode = Boolean(apiBase);
export const connectionLabel = isApiMode ? 'API demo' : 'Demo lokal';
export const makeId = () => Crypto.randomUUID();
let state = freshDemo();
const receipts = new Map<string, { fingerprint: string; receipt: CareReceipt }>();

async function request<T>(path: string, method = 'GET', body?: unknown, extraHeaders?: Record<string, string>): Promise<T> {
  if (!apiBase) throw new Error('Alamat API belum dikonfigurasi.');
  if (!useDemoAuth) throw new Error('Mode API ini memerlukan konfigurasi autentikasi demo yang eksplisit. Login pasien produksi belum tersedia.');
  if (!/^https?:\/\//i.test(apiBase)) throw new Error('Alamat API harus dimulai dengan https:// atau http:// untuk demo lokal.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${apiBase}${path}`, {
      method,
      headers: { Authorization: 'Bearer demo-patient-token', 'Content-Type': 'application/json', ...extraHeaders },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      let message = `Permintaan tidak berhasil (${response.status}).`;
      try { const failure = await response.json(); if (typeof failure.message === 'string') message = failure.message; } catch { /* use status-only message */ }
      const failure = new Error(message) as Error & {status:number};
      failure.status = response.status;
      throw failure;
    }
    return await response.json() as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Koneksi terlalu lama. Coba lagi; data demo tidak menggantikan data API.');
    throw error;
  } finally { clearTimeout(timeout); }
}

export { request as apiRequest };

export async function getOverview(): Promise<Overview> {
  if (!isApiMode) return JSON.parse(JSON.stringify(state)) as Overview;
  const data = await request<Overview>('/api/v1/overview');
  if (data.dataMode !== 'DEMO' || !data.patient || !Array.isArray(data.embryos) || !Array.isArray(data.appointments)) {
    throw new Error('Respons API tidak sesuai kontrak demo. Data tidak ditampilkan.');
  }
  return data;
}

export async function updateReminder(id: string, completed: boolean): Promise<Reminder> {
  if (isApiMode) return request(`/api/v1/reminders/${encodeURIComponent(id)}`, 'PATCH', { completed });
  const reminder = state.reminders.find(item => item.id === id);
  if (!reminder) throw new Error('Pengingat tidak ditemukan.');
  reminder.completed = completed;
  return { ...reminder };
}

export async function updatePreferences(preferences: Preferences): Promise<Preferences> {
  if (preferences.partnerSharing) throw new Error('Akses pasangan memerlukan verifikasi dan persetujuan terpisah; belum tersedia pada demo.');
  if (isApiMode) return request('/api/v1/preferences', 'PATCH', preferences);
  state.preferences = { ...preferences };
  return { ...state.preferences };
}

export async function createCareRequest(input: CareRequest, idempotencyKey: string): Promise<CareReceipt> {
  if (!input.note.trim() || input.note.length > 2000) throw new Error('Isi catatan antara 1–2.000 karakter.');
  if (isApiMode) return request('/api/v1/care-requests', 'POST', input, { 'Idempotency-Key': idempotencyKey });
  if (input.appointmentId && !state.appointments.some(item => item.id === input.appointmentId)) throw new Error('Janji tidak ditemukan.');
  const fingerprint = JSON.stringify(input);
  const existing = receipts.get(idempotencyKey);
  if (existing) {
    if (existing.fingerprint !== fingerprint) throw new Error('Permintaan berubah. Tutup formulir dan mulai permintaan baru.');
    return existing.receipt;
  }
  const receipt: CareReceipt = { id: makeId(), status: 'received_demo', message: 'Simulasi tersimpan selama sesi demo. Permintaan belum dikirim ke rumah sakit dan jadwal tidak berubah.', createdAt: new Date().toISOString() };
  receipts.set(idempotencyKey, { fingerprint, receipt });
  return receipt;
}

export async function sendChat(message: string, overview: Overview): Promise<ChatReply> {
  if (!message.trim() || message.length > 2000) throw new Error('Tulis pesan antara 1–2.000 karakter.');
  if (isApiMode) return request('/api/v1/chat', 'POST', { message });
  const query = message.toLocaleLowerCase('id-ID');
  let intent = 'GENERAL';
  let text = 'Saya dapat membantu membaca jadwal yang tercatat, pembaruan embrio yang dirilis, dan riwayat perawatan. Untuk pertanyaan medis pribadi, pilih “Bantuan tim klinik”. Demo ini belum menghubungi rumah sakit.';
  let sourceLabel = 'Panduan asisten demo';
  let requiresStaff = false;
  if (/sesak|perdarahan|pendarahan|pingsan|nyeri hebat|nyeri dada|darurat|severe pain|chest pain|shortness of breath/i.test(query)) {
    intent = 'URGENT_HELP'; requiresStaff = true;
    text = 'Jika Anda sedang mengalami gejala berat atau keadaan darurat, segera hubungi layanan darurat setempat atau pergi ke IGD terdekat. Jangan menunggu balasan chatbot. Demo ini tidak memantau gejala dan belum menghubungi tenaga kesehatan.';
    sourceLabel = 'Arahan keselamatan umum · bukan diagnosis';
  } else if (/dosis|obat|suntik|hormon|diagnos|peluang|grade|grading|hamil|nyeri|sakit|mual|demam|gejala|boleh|aman|hasil.*arti|artinya/i.test(query)) {
    intent = 'CLINICAL_HANDOFF'; requiresStaff = true;
    text = 'Pertanyaan ini perlu ditinjau tim klinis yang memahami kondisi dan rencana perawatan Anda. Saya tidak menilai hasil, peluang kehamilan, atau mengubah dosis obat. Anda dapat menyiapkan permintaan bantuan melalui tombol di bawah; pada demo, permintaan belum dikirim ke klinik.';
    sourceLabel = 'Batas kemampuan asisten demo';
  } else if (/embrio|embryo|laboratorium/i.test(query)) {
    intent = 'EMBRYO_STATUS';
    text = overview.embryos.length ? `Ada ${overview.embryos.length} pembaruan embrio yang sudah dirilis pada snapshot demo. ${overview.embryos.map(item => `${item.label}: ${item.stage}, ${item.status.toLowerCase()}`).join('. ')}. Buka Perjalanan → Embrio untuk waktu rilis dan penjelasan tim. Status ini tidak memperkirakan peluang kehamilan.` : 'Belum ada pembaruan embrio yang dirilis. Tidak adanya pembaruan bukan berarti hasilnya buruk; hubungi tim klinik untuk informasi.';
    sourceLabel = 'Pembaruan laboratorium yang dirilis · data demo';
  } else if (/jadwal|janji|appointment|kunjungan/i.test(query)) {
    intent = 'APPOINTMENT';
    const next = overview.appointments.filter(item => item.status === 'confirmed').sort((a,b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
    text = next ? `Jadwal pada snapshot demo: ${next.title}, ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: next.timeZone }).format(new Date(next.startsAt))} (${next.timeZone}), di ${next.branch}. Buka tab Janji untuk persiapan dan detail. Permintaan perubahan harus dikonfirmasi klinik.` : 'Belum ada janji terkonfirmasi pada data ini. Hubungi klinik untuk konfirmasi jadwal.';
    sourceLabel = 'Jadwal rumah sakit · data demo';
  } else if (/riwayat|terakhir|perawatan|aktivitas/i.test(query)) {
    intent = 'CARE_HISTORY';
    const latest = [...overview.activities].sort((a,b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))[0];
    text = latest ? `Aktivitas terakhir pada snapshot: ${latest.title}. ${latest.summary} Buka Perjalanan → Riwayat untuk catatan lengkap dan sumbernya.` : 'Belum ada catatan perawatan yang tersedia.';
    sourceLabel = 'Catatan perawatan yang dirilis · data demo';
  } else if (/perawat|dokter|manusia|petugas|bantuan/i.test(query)) {
    intent = 'STAFF_HANDOFF'; requiresStaff = true;
    text = 'Anda dapat menyiapkan permintaan bantuan untuk tim klinik. Pilih “Bantuan tim klinik”, tulis kebutuhan Anda, lalu tinjau konfirmasi. Pada demo, ini hanya simulasi dan tidak dikirim ke rumah sakit.';
  }
  return { id: makeId(), text, intent, sourceLabel, requiresStaff, createdAt: new Date().toISOString() };
}
