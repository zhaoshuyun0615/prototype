import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(process.cwd());
const port = Number(process.env.PORT || process.argv[2] || 8790);
const host = process.env.HOST || '127.0.0.1';

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon']
]);

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function resolveInsideRoot(relativePath) {
  const safePath = normalize(String(relativePath || '')).replace(/^\.\.(\/|\\|$)+/, '');
  const absolutePath = resolve(root, safePath);
  if (!absolutePath.startsWith(`${root}/`) && absolutePath !== root) return null;
  return absolutePath;
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function handleSave(request, response) {
  try {
    const body = JSON.parse(await readBody(request));
    const target = resolveInsideRoot(body.path);
    if (!target) {
      sendJson(response, 400, { ok: false, error: 'Invalid path' });
      return;
    }
    if (extname(target) !== '.json') {
      sendJson(response, 400, { ok: false, error: 'Only JSON files can be written' });
      return;
    }
    JSON.parse(String(body.content || ''));
    await writeFile(target, String(body.content), 'utf8');
    sendJson(response, 200, { ok: true, path: target });
  } catch (error) {
    sendJson(response, 500, { ok: false, error: error.message });
  }
}

async function handleStatic(request, response) {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || `${host}:${port}`}`);
  const pathname = decodeURIComponent(requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname);
  const target = resolveInsideRoot(pathname.slice(1));
  if (!target) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }
  try {
    await readFile(target);
    response.writeHead(200, { 'Content-Type': mimeTypes.get(extname(target)) || 'application/octet-stream' });
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}

const server = createServer(async (request, response) => {
  if (request.method === 'POST' && request.url === '/__requirements/save') {
    await handleSave(request, response);
    return;
  }
  if (request.method === 'GET' || request.method === 'HEAD') {
    await handleStatic(request, response);
    return;
  }
  response.writeHead(405);
  response.end('Method not allowed');
});

server.listen(port, host, () => {
  const entry = '/03_prototype/mockups/c_account_switch/index.html';
  console.log(`Prototype requirement dev server: http://${host}:${port}${entry}`);
  console.log(`Root: ${root}`);
});

if (import.meta.url === `file://${fileURLToPath(import.meta.url)}`) {
  // keep process alive
}
