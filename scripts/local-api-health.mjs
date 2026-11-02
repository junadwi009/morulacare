import { get } from 'node:http';

// Short-lived Windows CLIs must not leave a fetch/Undici worker or pooled socket
// alive while synchronous Android commands run and the process shuts down.
export async function requireLocalApi({
  url = 'http://127.0.0.1:8080/actuator/health',
  timeoutMs = 10000,
} = {}) {
  try {
    await new Promise((resolve, reject) => {
      const request = get(url, { agent: false }, response => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', chunk => { body += chunk; });
        response.on('error', reject);
        response.on('end', () => {
          try {
            if (response.statusCode !== 200 || JSON.parse(body).status !== 'UP') {
              throw new Error(`health check returned HTTP ${response.statusCode}`);
            }
            resolve();
          } catch (error) { reject(error); }
        });
      });
      const deadline = setTimeout(() => request.destroy(new Error('health check timed out')), timeoutMs);
      request.on('error', reject);
      request.on('close', () => clearTimeout(deadline));
    });
  } catch (error) {
    throw new Error(`API is unavailable (${error.message}). Start Docker Desktop, then run: docker.exe compose -p morula-care-local up -d --wait api`, { cause: error });
  }
}
