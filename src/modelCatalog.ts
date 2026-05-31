/**
 * Model catalog powered by https://models.dev/api.json
 *
 * Provides structured data for 4800+ models across 130+ providers:
 * capabilities (reasoning, tool_call, modalities), context/output limits,
 * cost per token, and provider config (env vars, base URL, npm package).
 *
 * Usage:
 *   const catalog = await fetchModelCatalog()
 *   const info = lookupModel(catalog, 'anthropic', 'claude-opus-4')
 *   const { context } = getContextWindow(catalog, 'nvidia', 'meta/llama-3.3-70b-instruct')
 *   const cost = estimateCost(catalog, 'groq', 'llama-3.3-70b-versatile', 1000, 500)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ModelModalities = {
  input: Array<'text' | 'image' | 'audio' | 'video' | string>
  output: Array<'text' | 'image' | 'audio' | string>
}

export type ModelLimit = {
  context: number
  output: number
}

export type ModelCost = {
  /** Cost in USD per million input tokens */
  input: number
  /** Cost in USD per million output tokens */
  output: number
  /** Cost in USD per million cache-read tokens */
  cache_read?: number
  /** Cost in USD per million cache-write tokens */
  cache_write?: number
}

export type ModelInfo = {
  id: string
  name: string
  family: string
  /** Supports file/image attachments */
  attachment: boolean
  /** Has extended reasoning / thinking mode */
  reasoning: boolean
  /** Supports tool/function calling */
  tool_call: boolean
  /** Supports temperature parameter */
  temperature: boolean
  /** Training data knowledge cutoff (YYYY-MM) */
  knowledge: string
  release_date: string
  last_updated: string
  modalities: ModelModalities
  /** Model weights are publicly available */
  open_weights: boolean
  limit: ModelLimit
  cost: ModelCost
}

export type ProviderInfo = {
  id: string
  name: string
  /** Required environment variable names */
  env: string[]
  /** npm package for AI SDK integration */
  npm?: string
  /** API base URL (undefined for providers with dynamic URLs) */
  api?: string
  /** Documentation URL */
  doc?: string
  models: Record<string, ModelInfo>
}

export type ModelCatalog = Record<string, ProviderInfo>

// ─── Fetch ────────────────────────────────────────────────────────────────────

const MODELS_DEV_API = 'https://models.dev/api.json'

let _catalogCache: ModelCatalog | null = null
let _catalogFetchedAt = 0
const CATALOG_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

/**
 * Fetch the full model catalog from models.dev.
 * Results are cached in memory for 6 hours.
 * Pass `forceRefresh: true` to bypass the cache.
 */
export async function fetchModelCatalog(options?: {
  forceRefresh?: boolean
}): Promise<ModelCatalog> {
  const now = Date.now()
  if (
    !options?.forceRefresh &&
    _catalogCache &&
    now - _catalogFetchedAt < CATALOG_TTL_MS
  ) {
    return _catalogCache
  }

  const res = await fetch(MODELS_DEV_API, {
    headers: { accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`models.dev API returned ${res.status}`)
  const data = (await res.json()) as ModelCatalog
  _catalogCache = data
  _catalogFetchedAt = now
  return data
}

/** Return the cached catalog without fetching. Null if not yet loaded. */
export function getCachedModelCatalog(): ModelCatalog | null {
  return _catalogCache
}

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Look up a model by provider and model ID.
 * Tries exact match first, then case-insensitive substring match.
 */
export function lookupModel(
  catalog: ModelCatalog,
  providerId: string,
  modelId: string,
): ModelInfo | undefined {
  const provider = catalog[providerId]
  if (!provider) return undefined
  const exact = provider.models[modelId]
  if (exact) return exact
  const lower = modelId.toLowerCase()
  return Object.values(provider.models).find(
    m => m.id.toLowerCase() === lower || lower.includes(m.id.toLowerCase()),
  )
}

/**
 * Search for a model across ALL providers by model ID.
 * Returns the first match with its provider ID.
 */
export function findModel(
  catalog: ModelCatalog,
  modelId: string,
): { provider: ProviderInfo; model: ModelInfo } | undefined {
  const lower = modelId.toLowerCase()
  for (const provider of Object.values(catalog)) {
    const exact = provider.models[modelId]
    if (exact) return { provider, model: exact }
    const fuzzy = Object.values(provider.models).find(
      m => m.id.toLowerCase() === lower || lower.includes(m.id.toLowerCase()),
    )
    if (fuzzy) return { provider, model: fuzzy }
  }
  return undefined
}

/** Get a provider's config (env vars, base URL, npm package). */
export function getProvider(catalog: ModelCatalog, providerId: string): ProviderInfo | undefined {
  return catalog[providerId]
}

// ─── Capability helpers ───────────────────────────────────────────────────────

/**
 * Returns true if the model has extended reasoning/thinking mode.
 * Uses models.dev `reasoning` field — no string matching.
 */
export function modelHasReasoning(
  catalog: ModelCatalog,
  providerId: string,
  modelId: string,
): boolean {
  return lookupModel(catalog, providerId, modelId)?.reasoning ?? false
}

/**
 * Returns true if the model supports tool/function calling.
 */
export function modelHasToolCall(
  catalog: ModelCatalog,
  providerId: string,
  modelId: string,
): boolean {
  return lookupModel(catalog, providerId, modelId)?.tool_call ?? false
}

/**
 * Returns true if the model supports image inputs.
 */
export function modelHasVision(
  catalog: ModelCatalog,
  providerId: string,
  modelId: string,
): boolean {
  const m = lookupModel(catalog, providerId, modelId)
  return m?.modalities.input.includes('image') ?? false
}

// ─── Context window ────────────────────────────────────────────────────────────

/**
 * Returns the context and output token limits for a model.
 * Falls back to sensible defaults when the model is not in the catalog.
 */
export function getContextWindow(
  catalog: ModelCatalog,
  providerId: string,
  modelId: string,
): { context: number; output: number } {
  const m = lookupModel(catalog, providerId, modelId)
  return m?.limit ?? { context: 8192, output: 4096 }
}

// ─── Cost estimation ──────────────────────────────────────────────────────────

export type CostBreakdown = {
  inputCost: number
  outputCost: number
  totalCost: number
  currency: 'USD'
  /** Cost is per million tokens in models.dev — this is the actual dollar amount */
  note: string
}

/**
 * Estimate the cost of a request in USD.
 * Prices from models.dev are in USD per million tokens.
 *
 * @param inputTokens  Number of input tokens
 * @param outputTokens Number of output tokens
 * @param cacheReadTokens  Number of cache-read tokens (optional)
 */
export function estimateCost(
  catalog: ModelCatalog,
  providerId: string,
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens = 0,
): CostBreakdown | null {
  const m = lookupModel(catalog, providerId, modelId)
  if (!m?.cost) return null

  const { cost } = m
  const inputCost = (inputTokens / 1_000_000) * cost.input
  const outputCost = (outputTokens / 1_000_000) * cost.output
  const cacheReadCost = cost.cache_read
    ? (cacheReadTokens / 1_000_000) * cost.cache_read
    : 0
  const totalCost = inputCost + outputCost + cacheReadCost

  return {
    inputCost,
    outputCost,
    totalCost,
    currency: 'USD',
    note: `Rates: $${cost.input}/$${cost.output} per million input/output tokens`,
  }
}

// ─── Provider helpers ─────────────────────────────────────────────────────────

/**
 * Returns the env vars required to use a provider.
 * Useful for checking if a provider is configured.
 */
export function getProviderEnvVars(
  catalog: ModelCatalog,
  providerId: string,
): string[] {
  return catalog[providerId]?.env ?? []
}

/**
 * Returns true if all required env vars for a provider are set in process.env.
 */
export function isProviderConfigured(
  catalog: ModelCatalog,
  providerId: string,
): boolean {
  const envVars = getProviderEnvVars(catalog, providerId)
  if (envVars.length === 0) return true // local providers (ollama) need no key
  return envVars.some(v => !!process.env[v])
}

/**
 * List all models for a provider.
 */
export function listModels(
  catalog: ModelCatalog,
  providerId: string,
): ModelInfo[] {
  const provider = catalog[providerId]
  if (!provider) return []
  return Object.values(provider.models)
}

/**
 * List all providers that support a given capability.
 */
export function findProvidersByCapability(
  catalog: ModelCatalog,
  capability: 'reasoning' | 'tool_call' | 'attachment',
): ProviderInfo[] {
  return Object.values(catalog).filter(provider =>
    Object.values(provider.models).some(m => m[capability]),
  )
}
