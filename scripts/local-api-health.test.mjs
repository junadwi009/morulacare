import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { requireLocalApi } from './local-api-health.mjs';

async function endpoint(t, handler) {
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => {
    server.closeAllConnections();
    server.close(resolve);
  }));
  return `http://127.0.0.1:${server.address().port}/actuator/health`;
}

test('accepts healthy API and closes the HTTP connection', async t => {
  let connection;
  const url = await endpoint(t, (req, res) => {
    connection = req.headers.connection;
    res.end('{"status":"UP"}');
  });
  await requireLocalApi({ url });
  assert.equal(connection, 'close');
});

test('rejects unhealthy API with an actionable message', async t => {
  const url = await endpoint(t, (_, res) => {
    res.statusCode = 503;
    res.end('{"status":"DOWN"}');
  });
  await assert.rejects(requireLocalApi({ url }), /API is unavailable.*docker.exe compose/s);
});

test('rejects DOWN even with HTTP 200', async t => {
  const url = await endpoint(t, (_, res) => res.end('{"status":"DOWN"}'));
  await assert.rejects(requireLocalApi({ url }), /API is unavailable/);
});

test('rejects invalid health JSON', async t => {
  const url = await endpoint(t, (_, res) => res.end('not JSON'));
  await assert.rejects(requireLocalApi({ url }), /API is unavailable/);
});

test('bounds a stalled health request', async t => {
  const url = await endpoint(t, () => {});
  await assert.rejects(requireLocalApi({ url, timeoutMs: 50 }), /timed out/);
});

test('reports a stopped API without a native process crash', async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/actuator/health`;
  await new Promise(resolve => server.close(resolve));
  await assert.rejects(requireLocalApi({ url }), /API is unavailable.*ECONNREFUSED/s);
});
