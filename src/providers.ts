// ─── Multi-Provider Support ───────────────────────────────────────────────────

export type ProviderId = 'chronokairo' | 'anthropic' | 'ollama' | 'groq' | 'bedrock' | 'vertex' | 'azure' | 'openai'

export type ProviderConfig = {
  id: ProviderId
  name: string
  baseURL: string
  requiresApiKey: boolean
  requiresAuthToken?: boolean
  defaultModel?: string
  headers?: Record<string, string>
  transformRequest?: (request: unknown) => unknown
  transformResponse?: (response: unknown) => unknown
}

// ─── Pre-configured Providers ─────────────────────────────────────────────────

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  chronokairo: {
    id: 'chronokairo',
    name: 'Chronokairo API',
    baseURL: 'https://api.chronokairo.com.br/v1',
    requiresApiKey: true,
    defaultModel: 'default',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic API',
    baseURL: 'https://api.anthropic.com/v1',
    requiresApiKey: true,
    requiresAuthToken: true,
    defaultModel: 'claude-sonnet-4-20250514',
    headers: {
      'anthropic-version': '2023-06-01',
    },
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseURL: 'http://localhost:11434',
    requiresApiKey: false,
    defaultModel: 'llama3.2',
  },
  groq: {
    id: 'groq',
    name: 'Groq Cloud',
    baseURL: 'https://api.groq.com/openai/v1',
    requiresApiKey: true,
    defaultModel: 'llama-3.2-90b-vision-preview',
  },
  bedrock: {
    id: 'bedrock',
    name: 'AWS Bedrock',
    baseURL: 'https://bedrock-runtime.{region}.amazonaws.com',
    requiresApiKey: true,
    requiresAuthToken: true,
    defaultModel: 'anthropic.claude-v2',
  },
  vertex: {
    id: 'vertex',
    name: 'Google Vertex AI',
    baseURL: 'https://{region}-aiplatform.googleapis.com/v1',
    requiresApiKey: true,
    requiresAuthToken: true,
    defaultModel: 'claude-sonnet-v4@20250514',
  },
  azure: {
    id: 'azure',
    name: 'Azure OpenAI',
    baseURL: 'https://{resource}.openai.azure.com',
    requiresApiKey: true,
    requiresAuthToken: true,
    defaultModel: 'gpt-4',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI API',
    baseURL: 'https://api.openai.com/v1',
    requiresApiKey: true,
    defaultModel: 'gpt-4o',
  },
}

// ─── Provider Utilities ───────────────────────────────────────────────────────

/**
 * Get provider configuration by ID
 */
export function getProvider(id: ProviderId | string): ProviderConfig | undefined {
  return PROVIDERS[id as ProviderId]
}

/**
 * List all available providers
 */
export function listProviders(): ProviderConfig[] {
  return Object.values(PROVIDERS)
}

/**
 * Check if a provider requires API key
 */
export function providerRequiresApiKey(id: ProviderId | string): boolean {
  const provider = PROVIDERS[id]
  return provider?.requiresApiKey ?? true
}

/**
 * Get default model for a provider
 */
export function getDefaultModel(id: ProviderId | string): string | undefined {
  return PROVIDERS[id]?.defaultModel
}

/**
 * Get base URL for a provider
 */
export function getProviderBaseURL(id: ProviderId | string, options?: { region?: string; resource?: string }): string {
  const provider = PROVIDERS[id]
  if (!provider) {
    throw new Error(`Unknown provider: ${id}`)
  }

  let baseURL = provider.baseURL

  // Replace template variables
  if (options?.region) {
    baseURL = baseURL.replace('{region}', options.region)
  }
  if (options?.resource) {
    baseURL = baseURL.replace('{resource}', options.resource)
  }

  return baseURL
}

/**
 * Create custom provider configuration
 */
export function createProvider(
  id: ProviderId | string,
  config: Omit<ProviderConfig, 'id'>,
): ProviderConfig {
  return {
    ...config,
    id: id as ProviderId,
  }
}

// ─── Provider Resolution ──────────────────────────────────────────────────────

export type ResolvedProvider = {
  id: ProviderId
  baseURL: string
  apiKey?: string
  authToken?: string
  model?: string
  extraHeaders?: Record<string, string>
}

/**
 * Resolve provider configuration from environment and options
 */
export function resolveProvider(
  providerId: ProviderId | string,
  options?: {
    apiKey?: string
    authToken?: string
    baseURL?: string
    model?: string
    region?: string
    resource?: string
  },
): ResolvedProvider {
  const provider = getProvider(providerId as ProviderId)

  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`)
  }

  // Resolve API key from options or environment
  const apiKey =
    options?.apiKey ??
    getProviderEnvVar(providerId, 'API_KEY') ??
    getProviderEnvVar(providerId, 'APIKEY') ??
    process.env[`${providerId.toUpperCase()}_API_KEY`]

  // Resolve auth token from options or environment
  const authToken =
    options?.authToken ??
    getProviderEnvVar(providerId, 'AUTH_TOKEN') ??
    process.env[`${providerId.toUpperCase()}_AUTH_TOKEN`]

  // Resolve base URL
  const baseURL =
    options?.baseURL ?? getProviderBaseURL(providerId, { region: options?.region, resource: options?.resource })

  // Resolve model
  const model = options?.model ?? provider.defaultModel

  return {
    id: providerId as ProviderId,
    baseURL,
    apiKey,
    authToken,
    model,
    extraHeaders: provider.headers,
  }
}

function getProviderEnvVar(providerId: string, suffix: string): string | undefined {
  const variants = [
    `${providerId.toUpperCase()}_${suffix}`,
    `${providerId.toUpperCase()}${suffix}`,
    suffix === 'API_KEY' ? 'CHRONOKAIRO_API_KEY' : undefined,
  ].filter(Boolean)

  for (const variant of variants) {
    if (variant && process.env[variant]) {
      return process.env[variant]
    }
  }

  return undefined
}
