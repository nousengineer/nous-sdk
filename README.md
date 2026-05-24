# @chronokairo/sdk

TypeScript SDK for the Chronokairo AI platform — provides a unified client for the Chronokairo API and an OpenAI-compatible transport layer for local and third-party providers (Ollama, LM Studio, NVIDIA NIM, Groq, and more).

## Installation

```bash
npm install @chronokairo/sdk
# or
bun add @chronokairo/sdk
```

## Quick Start

### Chronokairo API (native)

```ts
import { ChronokairosClient } from '@chronokairo/sdk'

const client = new ChronokairosClient({
  apiKey: process.env.KAIROS_API_KEY,
})

const stream = await client.beta.messages.create({
  stream: true,
  model: 'default',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello!' }],
})

for await (const event of stream) {
  if (event.type === 'content_block_delta') {
    process.stdout.write((event.delta as { text?: string }).text ?? '')
  }
}
```

### OpenAI-compatible providers

Use `OpenAICompatClient` to talk to any provider that speaks OpenAI Chat Completions — the client transparently translates the Anthropic Messages API shape in both directions.

```ts
import { OpenAICompatClient } from '@chronokairo/sdk'

// Ollama (local)
const client = new OpenAICompatClient({
  baseURL: 'http://localhost:11434/v1',
  providerId: 'ollama',
})

// NVIDIA NIM
const nvidia = new OpenAICompatClient({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  providerId: 'nvidia',
  apiKey: process.env.NVIDIA_API_KEY,
  authHeader: 'bearer',
})

// Groq
const groq = new OpenAICompatClient({
  baseURL: 'https://api.groq.com/openai/v1',
  providerId: 'groq',
  apiKey: process.env.GROQ_API_KEY,
  authHeader: 'bearer',
})

// All clients share the same interface
const stream = await client.beta.messages.create({
  stream: true,
  model: 'llama3.2',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Explain async/await in TypeScript.' }],
})

for await (const event of stream) {
  if (event.type === 'content_block_delta') {
    process.stdout.write((event.delta as { text?: string }).text ?? '')
  }
}
```

### Tool use

```ts
import { OpenAICompatClient } from '@chronokairo/sdk'

const client = new OpenAICompatClient({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY,
  authHeader: 'bearer',
})

const result = await client.beta.messages.create({
  stream: false,
  model: 'meta/llama-3.3-70b-instruct',
  max_tokens: 512,
  messages: [{ role: 'user', content: 'What is the weather in São Paulo?' }],
  tools: [
    {
      name: 'get_weather',
      description: 'Get current weather for a city',
      input_schema: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name' },
        },
        required: ['city'],
      },
    },
  ],
})
```

### Token counting (estimate)

```ts
const { input_tokens } = await client.beta.messages.countTokens({
  stream: false,
  model: 'llama3.2',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'How long is this?' }],
})

console.log(`~${input_tokens} tokens`)
```

## API Reference

### `ChronokairosClient`

Native client for the Chronokairo API (`https://api.chronokairo.com.br/v1`).

```ts
new ChronokairosClient({
  apiKey?: string        // KAIROS_API_KEY or ANTHROPIC_API_KEY
  baseURL?: string       // default: https://api.chronokairo.com.br/v1
  maxRetries?: number    // default: 2
  timeout?: number       // ms, default: 60000
  defaultHeaders?: Record<string, string>
  fetch?: typeof globalThis.fetch
})
```

### `OpenAICompatClient`

Drop-in client for any OpenAI Chat Completions endpoint. Translates the Anthropic Messages API shape transparently.

```ts
new OpenAICompatClient({
  baseURL: string                          // required
  providerId?: string                      // e.g. 'ollama', 'nvidia', 'groq'
  apiKey?: string
  authHeader?: 'bearer' | 'x-api-key'
  defaultHeaders?: Record<string, string>
  chatPath?: string                        // default: /chat/completions
  useNativeTransport?: boolean | ((model: string) => boolean)
})
```

Both clients expose `client.beta.messages.create(params)` and `client.beta.messages.countTokens(params)`.

### Providers

```ts
import { PROVIDERS, getProvider, resolveProvider } from '@chronokairo/sdk'

// Pre-configured: 'chronokairo' | 'anthropic' | 'ollama' | 'groq' | 'bedrock' | 'vertex' | 'azure' | 'openai'
const ollama = getProvider('ollama')
// { id: 'ollama', name: 'Ollama (Local)', baseURL: 'http://localhost:11434', ... }

const resolved = resolveProvider('groq', { apiKey: process.env.GROQ_API_KEY })
// { id: 'groq', baseURL: 'https://api.groq.com/openai/v1', apiKey: '...', ... }
```

### Low-level translation utilities

```ts
import {
  chronoMessagesToOpenAI,   // Anthropic messages → OpenAI messages
  chronoToolsToOpenAI,      // Anthropic tools → OpenAI functions
  buildOpenAIRequestBody,   // Build full OpenAI request body
  buildChronoRequestBody,   // Build full Anthropic request body
  translateStream,          // OpenAI SSE → Anthropic event stream
  passthroughChronoStream,  // Pass-through for native Anthropic SSE
  translateNonStreamingResponse,
} from '@chronokairo/sdk'
```

### Error types

```ts
import {
  APIError,
  APIUserAbortError,
  APIConnectionError,
  APIConnectionTimeoutError,
  AuthenticationError,
  RateLimitError,
  InternalServerError,
  NotFoundError,
  OpenAICompatError,
} from '@chronokairo/sdk'

try {
  await client.beta.messages.create({ ... })
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log('Rate limited — retry after a moment')
  } else if (err instanceof AuthenticationError) {
    console.log('Invalid API key')
  }
}
```

## Supported Providers

| Provider | `baseURL` | Auth |
|---|---|---|
| Chronokairo | `https://api.chronokairo.com.br/v1` | `KAIROS_API_KEY` |
| Anthropic | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| Ollama (local) | `http://localhost:11434/v1` | none |
| LM Studio (local) | `http://localhost:1234/v1` | none |
| NVIDIA NIM | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| Groq | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| OpenAI | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| Azure OpenAI | `https://{resource}.openai.azure.com` | key or AD |
| AWS Bedrock | `https://bedrock-runtime.{region}.amazonaws.com` | AWS creds |
| Google Vertex | `https://{region}-aiplatform.googleapis.com/v1` | GCP creds |

## License

MIT © [Chronokairo](https://chronokairo.com.br)
