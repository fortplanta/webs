import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_BASE_URL = 'http://127.0.0.1:11434';
const DEFAULT_MODEL = 'qwen3:8b';
const DEFAULT_ORIGIN = 'https://bulge.netlify.app';

function readDotEnv(path) {
  if (!existsSync(path)) return {};
  const env = {};
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function argValue(name) {
  const prefix = `${name}=`;
  const found = process.argv.slice(2).find(arg => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

function normalizeBaseUrl(value) {
  return (value || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

function pass(message) {
  console.log(`PASS ${message}`);
}

function fail(message) {
  console.error(`FAIL ${message}`);
}

function info(message) {
  console.log(`INFO ${message}`);
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { response, data };
}

const cwd = process.cwd();
const localEnv = readDotEnv(resolve(cwd, '.env.local'));
const exampleEnv = readDotEnv(resolve(cwd, '.env.example'));

const baseUrl = normalizeBaseUrl(
  argValue('--base-url') ||
  process.env.VITE_LLM_BASE_URL ||
  localEnv.VITE_LLM_BASE_URL ||
  exampleEnv.VITE_LLM_BASE_URL ||
  DEFAULT_BASE_URL,
);

const model =
  argValue('--model') ||
  process.env.VITE_LLM_MODEL ||
  localEnv.VITE_LLM_MODEL ||
  exampleEnv.VITE_LLM_MODEL ||
  DEFAULT_MODEL;

const origin = argValue('--origin') || process.env.OLLAMA_CHECK_ORIGIN || DEFAULT_ORIGIN;

info(`Checking Ollama at ${baseUrl}`);
info(`Expected model: ${model}`);
info(`Browser origin to test: ${origin}`);

let hasFailure = false;

try {
  const { response, data } = await requestJson(`${baseUrl}/api/tags`);
  if (!response.ok) {
    hasFailure = true;
    fail(`/api/tags returned HTTP ${response.status}`);
  } else {
    pass('Ollama HTTP API is reachable');
    const models = Array.isArray(data?.models) ? data.models : [];
    const installed = models.map(item => item.name || item.model).filter(Boolean);
    if (installed.includes(model)) {
      pass(`Model is installed: ${model}`);
    } else {
      hasFailure = true;
      fail(`Model is not installed: ${model}`);
      info(`Installed models: ${installed.length ? installed.join(', ') : '(none)'}`);
      info(`Install it with: ollama pull ${model}`);
    }
  }
} catch (err) {
  hasFailure = true;
  fail(`Could not reach Ollama at ${baseUrl}`);
  info('Start Ollama with the desktop app or run: ollama serve');
  info(`Details: ${err instanceof Error ? err.message : String(err)}`);
}

try {
  const { response } = await requestJson(`${baseUrl}/api/chat`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });

  const allowedOrigin = response.headers.get('access-control-allow-origin');
  if (response.status === 204 && allowedOrigin === origin) {
    pass(`CORS allows browser origin: ${origin}`);
  } else {
    hasFailure = true;
    fail(`CORS preflight failed for ${origin} with HTTP ${response.status}`);
    info(`Access-Control-Allow-Origin: ${allowedOrigin || '(missing)'}`);
    info(`Set OLLAMA_ORIGINS to include ${origin}, then fully restart Ollama.`);
  }
} catch (err) {
  hasFailure = true;
  fail(`Could not run CORS preflight for ${origin}`);
  info(`Details: ${err instanceof Error ? err.message : String(err)}`);
}

try {
  const { response, data } = await requestJson(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      stream: false,
      think: false,
      messages: [{ role: 'user', content: 'Reply with OK only.' }],
      options: { num_predict: 20 },
    }),
  });

  const content = data?.message?.content || data?.response || '';
  if (response.ok && content.trim() === 'OK') {
    pass('Model chat returned OK with think:false');
  } else {
    hasFailure = true;
    fail(`Model chat check failed with HTTP ${response.status}`);
    info(`Response: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
} catch (err) {
  hasFailure = true;
  fail('Model chat request failed');
  info(`Details: ${err instanceof Error ? err.message : String(err)}`);
}

if (hasFailure) {
  console.error('\nOllama check failed. See docs/local-llm-setup.md for setup steps.');
  process.exit(1);
}

console.log('\nOllama check passed.');
