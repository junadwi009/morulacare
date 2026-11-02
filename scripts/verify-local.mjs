import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const base = process.env.MORULA_API_URL || 'http://localhost:8080';
const root = fileURLToPath(new URL('../', import.meta.url));
const evidenceDirectory = new URL('../docs/evidence/', import.meta.url);
const checks = [];
const auth = { Authorization: 'Bearer demo-patient-token' };
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); };
async function request(path, { status = 200, anonymous = false, ...options } = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { ...(anonymous ? {} : auth), 'Content-Type': 'application/json', Connection: 'close', ...options.headers },
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, status, `${options.method || 'GET'} ${path}`);
  return response.json();
}
const patch = (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) });
const post = (path, body, headers = {}, status = 200) => request(path, { method: 'POST', body: JSON.stringify(body), headers, status });

// A freshly started JVM may need time on a shared development machine.
for (let attempt = 0; ; attempt++) {
  try {
    if ((await request('/actuator/health', { anonymous: true })).status === 'UP') break;
  } catch (error) {
    if (attempt >= 59) throw error;
  }
  if (attempt >= 59) throw new Error('API did not become healthy within the startup window');
  await new Promise(resolve => setTimeout(resolve, 2000));
}
check('public health UP', (await request('/actuator/health', { anonymous: true })).status === 'UP');
await request('/api/v1/overview', { anonymous: true, status: 401 });
checks.push('patient endpoint rejects anonymous access');
const before = await request('/api/v1/overview');
check('server-scoped synthetic overview', before.dataMode === 'DEMO' && before.patient.id === 'patient-demo');
const response = await fetch(`${base}/api/v1/overview`, { headers: auth });
check('patient response prevents caching', response.headers.get('cache-control')?.includes('no-store'));
for (const path of ['embryos', 'activities', 'appointments']) {
  const values = await request(`/api/v1/${path}`);
  check(`${path} returns source list`, Array.isArray(values));
  if (path === 'embryos') check('only released embryos', values.every(row => row.releasedAt && !row.id.includes('private')));
}
const appointment = before.appointments.find(row => row.status === 'confirmed');
assert.ok(appointment);
const payload = { type: 'APPOINTMENT_CHANGE', appointmentId: appointment.id, note: `Synthetic persistence verification ${randomUUID()}` };
const headers = { 'Idempotency-Key': randomUUID() };
// Controller returns HTTP 200 for both first submission and retry.
const receipt = await post('/api/v1/care-requests', payload, headers);
check('receipt explicitly remains demo and unsent', receipt.status === 'received_demo' && receipt.message.includes('Belum dikirim'));
assert.deepEqual(await post('/api/v1/care-requests', payload, headers), receipt);
checks.push('equal retry returns identical receipt');
await post('/api/v1/care-requests', { ...payload, note: 'Different synthetic payload' }, headers, 409);
checks.push('conflicting retry returns 409');
const concurrentHeaders = { 'Idempotency-Key': randomUUID() };
const concurrent = await Promise.all(Array.from({ length: 8 }, () => post('/api/v1/care-requests', payload, concurrentHeaders)));
check('8 concurrent equal requests return one receipt', concurrent.every(row => row.id === concurrent[0].id));
const prefs = { serviceNotifications: !before.preferences.serviceNotifications, discreetNotifications: !before.preferences.discreetNotifications, partnerSharing: false };
assert.deepEqual(await patch('/api/v1/preferences', prefs), prefs);
checks.push('preferences updated');
const reminder = before.reminders[0];
const completed = !reminder.completed;
check('checklist acknowledgement updated', (await patch(`/api/v1/reminders/${reminder.id}`, { completed })).completed === completed);
await request('/api/v1/preferences', { method: 'PATCH', body: JSON.stringify({ ...prefs, partnerSharing: true }), status: 422 });
checks.push('partner sharing remains blocked');
const chat = await post('/api/v1/chat', { message: 'Kapan janji saya?' });
check('chat returns demo response', !!chat.text && !!chat.sourceLabel);
check('medical dosage question requires staff', (await post('/api/v1/chat', { message: 'Berapa dosis obat saya?' })).requiresStaff);
const automation = await request('/api/v1/automation-preview');
check('automation delivery disabled', automation.deliveryEnabled === false);
assert.deepEqual((await request('/api/v1/overview')).appointments, before.appointments);
checks.push('request does not mutate official appointments');

if (process.argv.includes('--restart')) {
  const docker = process.env.MORULA_DOCKER || 'docker.exe';
  const compose = args => {
    const result = spawnSync(docker, ['compose', '-p', 'morula-care-local', ...args], { cwd: root, stdio: 'inherit', timeout: 180000 });
    assert.equal(result.status, 0, `compose ${args.join(' ')}`);
  };
  compose(['stop', 'db']);
  try {
    const outage = await request('/api/v1/overview', { status: 503 });
    check('database outage returns explicit storage error without fallback', outage.code === 'DEMO_STORAGE_UNAVAILABLE');
    const unavailableHealth = await request('/actuator/health', { anonymous: true, status: 503 });
    check('database outage is reflected in public health status', unavailableHealth.status === 'DOWN');
  } finally {
    compose(['stop', 'api']);
    compose(['up', '-d', '--wait', 'api']);
  }
  const after = await request('/api/v1/overview');
  assert.deepEqual(after.preferences, prefs);
  check('checklist survives API and database restart', after.reminders.find(row => row.id === reminder.id).completed === completed);
  assert.deepEqual(await post('/api/v1/care-requests', payload, headers), receipt);
  await post('/api/v1/care-requests', { ...payload, note: 'Different after restart' }, headers, 409);
  assert.deepEqual(after.appointments, before.appointments);
  checks.push('preferences survive restart and seed', 'same receipt survives restart', 'conflict survives restart', 'appointments unchanged after restart');
}
mkdirSync(evidenceDirectory, { recursive: true });
const evidence = { date: new Date().toISOString(), base, restartTested: process.argv.includes('--restart'), checks, receiptId: receipt.id };
writeFileSync(new URL(`current-${evidence.restartTested ? 'persistence' : 'http'}.json`, evidenceDirectory), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence, null, 2));
