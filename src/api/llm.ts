type LlmProvider = 'ollama' | 'openai-compatible' | 'mock';

interface LlmOptions {
  system: string;
  user: string;
  maxTokens?: number;
  json?: boolean;
  temperature?: number;
}

interface OllamaChatResponse {
  message?: { content?: string };
  response?: string;
}

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string }; text?: string }>;
}

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'qwen3:8b';

function provider(): LlmProvider {
  const raw = (import.meta.env.VITE_LLM_PROVIDER as string | undefined)?.trim().toLowerCase();
  if (raw === 'openai-compatible' || raw === 'mock') return raw;
  return 'ollama';
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function isLlmEnabled(): boolean {
  return provider() !== 'mock';
}

export function llmModelName(): string {
  return (import.meta.env.VITE_LLM_MODEL as string | undefined)?.trim() || DEFAULT_MODEL;
}

export async function callLlm({
  system,
  user,
  maxTokens = 1000,
  json = false,
  temperature = 0.7,
}: LlmOptions): Promise<string> {
  const activeProvider = provider();
  if (activeProvider === 'mock') throw new Error('llm-disabled');

  return activeProvider === 'openai-compatible'
    ? callOpenAICompatible({ system, user, maxTokens, json, temperature })
    : callOllama({ system, user, maxTokens, json, temperature });
}

async function callOllama({
  system,
  user,
  maxTokens,
  json,
  temperature,
}: Required<LlmOptions>): Promise<string> {
  const baseUrl = trimTrailingSlash(
    (import.meta.env.VITE_LLM_BASE_URL as string | undefined)?.trim() || DEFAULT_OLLAMA_BASE_URL,
  );

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: llmModelName(),
      stream: false,
      format: json ? 'json' : undefined,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      options: {
        num_predict: maxTokens,
        temperature,
      },
    }),
  });

  if (!response.ok) throw new Error(`ollama-error-${response.status}`);
  const data = await response.json() as OllamaChatResponse;
  return data.message?.content ?? data.response ?? '';
}

async function callOpenAICompatible({
  system,
  user,
  maxTokens,
  json,
  temperature,
}: Required<LlmOptions>): Promise<string> {
  const baseUrl = trimTrailingSlash(
    (import.meta.env.VITE_LLM_BASE_URL as string | undefined)?.trim() || 'http://localhost:11434/v1',
  );
  const apiKey = (import.meta.env.VITE_LLM_API_KEY as string | undefined)?.trim();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: llmModelName(),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
      temperature,
      response_format: json ? { type: 'json_object' } : undefined,
    }),
  });

  if (!response.ok) throw new Error(`llm-error-${response.status}`);
  const data = await response.json() as OpenAIChatResponse;
  return data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? '';
}
