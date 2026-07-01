# Local LLM Setup

Webs uses Ollama by default so exploration generation can run locally without hosted model costs.

## Install And Pull The Model

```bash
ollama pull qwen3:8b
```

Start Ollama with the desktop app or:

```bash
ollama serve
```

## Environment

Copy `.env.example` to `.env.local` and keep these defaults unless you are intentionally changing providers:

```bash
VITE_LLM_PROVIDER=ollama
VITE_LLM_BASE_URL=http://127.0.0.1:11434
VITE_LLM_MODEL=qwen3:8b
```

Use `127.0.0.1` rather than `localhost` when debugging browser-origin behavior so the URL matches the CORS checks exactly.

## Live Site Browser Access

The live Netlify app runs at `https://bulge.netlify.app`, but the model runs on your Mac at `http://127.0.0.1:11434`. Ollama must explicitly allow that browser origin.

Set allowed origins:

```bash
launchctl setenv OLLAMA_ORIGINS 'https://bulge.netlify.app,http://127.0.0.1:5175,http://localhost:5175'
```

Then fully quit and reopen Ollama. If the hidden app parent keeps running, stop both Ollama processes and reopen the app:

```bash
pkill -f '/Applications/Ollama.app/Contents/MacOS/Ollama'
pkill -f '/Applications/Ollama.app/Contents/Resources/ollama serve'
open -a Ollama
```

This setting may need to be applied again after logout or reboot.

## Verify

Run:

```bash
npm run check:ollama
```

Optional flags:

```bash
npm run check:ollama -- --origin=https://bulge.netlify.app
npm run check:ollama -- --base-url=http://127.0.0.1:11434 --model=qwen3:8b
```

The check verifies:

- Ollama HTTP API is reachable.
- The configured model is installed.
- The live browser origin passes CORS preflight.
- Qwen returns normal message content with `think:false`.

## Troubleshooting

`CORS preflight failed`

Ollama did not inherit `OLLAMA_ORIGINS`, or the live origin is missing. Set the launch environment, fully restart the hidden Ollama app and server, then rerun `npm run check:ollama`.

`Model is not installed`

Run:

```bash
ollama pull qwen3:8b
```

`Local model returned an empty response`

Qwen3 may be responding in its thinking channel. Webs sends `think:false`; rerun the check and confirm the installed model is `qwen3:8b`.

`Local model response was not valid Webs JSON`

The app will attempt one repair pass. If it still fails repeatedly, retry the prompt or switch to a stronger instruct model through `VITE_LLM_MODEL`.
