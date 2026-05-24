// @chronokairo/sdk — embedded provider client and sandbox runtime
// This package replaces the @chronokairo/sdk stub with a real implementation.

// ─── Error classes ────────────────────────────────────────────────────────────
export {
  APIError,
  APIUserAbortError,
  APIConnectionError,
  APIConnectionTimeoutError,
  AuthenticationError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
  InternalServerError,
  BadRequestError,
  UnprocessableEntityError,
  OverloadedError,
  ContentFilterError,
  ContextWindowExceededError,
  ModelNotFoundError,
  InvalidRequestError,
  JsonSerializationError,
  LinkAuthenticationError,
} from './src/errors.js'

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  ClientOptions,
  Base64ImageSource,
  URLImageSource,
  ImageSource,
  TextBlockParam,
  ImageBlockParam,
  ToolUseBlockParam,
  ToolResultBlockParam,
  ThinkingBlockParam,
  RedactedThinkingBlockParam,
  ContentBlockParam,
  ContentBlock,
  ThinkingBlock,
  RedactedThinkingBlock,
  ToolUseBlock,
  TextBlock,
  MessageParam,
  StopReason,
  Usage,
  Message,
  Tool,
  ToolChoice,
  // Beta
  BetaContentBlock,
  BetaContentBlockParam,
  BetaImageBlockParam,
  BetaMessage,
  BetaMessageParam,
  BetaMessageDeltaUsage,
  BetaMessageStreamParams,
  BetaOutputConfig,
  BetaRawMessageStreamEvent,
  BetaRequestDocumentBlock,
  BetaStopReason,
  BetaToolChoiceAuto,
  BetaToolChoiceTool,
  BetaToolResultBlockParam,
  BetaTool,
  BetaToolUnion,
  BetaToolUseBlock,
  BetaUsage,
  BetaRedactedThinkingBlock,
  BetaThinkingBlock,
  BetaWebSearchTool20250305,
  // Stream
  Stream,
  // Sandbox
  FsReadRestrictionConfig,
  FsWriteRestrictionConfig,
  IgnoreViolationsConfig,
  NetworkHostPattern,
  NetworkRestrictionConfig,
  SandboxAskCallback,
  SandboxDependencyCheck,
  SandboxRuntimeConfig,
  SandboxViolationEvent,
  // MCPB
  McpbManifest,
  McpbUserConfigurationOption,
} from './src/types.js'

// ─── Sandbox runtime ──────────────────────────────────────────────────────────
export { SandboxManager, SandboxViolationStore, SandboxRuntimeConfigSchema } from './src/sandbox.js'

// ─── MCPB compat ─────────────────────────────────────────────────────────────
export { getMcpConfigForManifest } from './src/mcpb.js'

// ─── Default export: Chronokairo API client ───────────────────────────────────
export { ChronokairosClient as default, ChronokairosClient, ChronokairosAsyncClient } from './src/client.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────
export * from './src/helpers.js'

// ─── Credentials ──────────────────────────────────────────────────────────────
export * from './src/credentials.js'

// ─── Retry utilities ──────────────────────────────────────────────────────────
export * from './src/retry.js'

// ─── Hooks & Policies ─────────────────────────────────────────────────────────
export * from './src/hooks.js'

// ─── Tools ────────────────────────────────────────────────────────────────────
export * from './src/tools.js'

// ─── Triggers ─────────────────────────────────────────────────────────────────
export * from './src/triggers.js'

// ─── Multimodal ───────────────────────────────────────────────────────────────
export * from './src/multimodal.js'

// ─── Providers ────────────────────────────────────────────────────────────────
export * from './src/providers.js'

// ─── OpenAI-compat translation layer ─────────────────────────────────────────
export {
  OpenAICompatClient,
  OpenAICompatError,
  chronoMessagesToOpenAI,
  chronoToolsToOpenAI,
  chronoToolChoiceToOpenAI,
  openAIFinishReasonTochrono,
  buildChronoRequestBody,
  buildOpenAIRequestBody,
  passthroughChronoStream,
  translateStream,
  translateNonStreamingResponse,
} from './src/openaiCompat.js'
export type {
  OpenAICompatClientOptions,
  ChronoMessage,
  ChronoTool,
  ChronoToolChoice,
  ChronoCreateParams,
} from './src/openaiCompat.js'

// ─── Stream types ─────────────────────────────────────────────────────────────
export type { TokenStreamOptions } from './src/types.js'
export { TokenStream } from './src/types.js'

// ─── Model catalog (models.dev) ───────────────────────────────────────────────
export type {
  ModelInfo,
  ModelModalities,
  ModelLimit,
  ModelCost,
  ProviderInfo,
  ModelCatalog,
  CostBreakdown,
} from './src/modelCatalog.js'
export {
  fetchModelCatalog,
  getCachedModelCatalog,
  lookupModel,
  findModel,
  getProvider,
  modelHasReasoning,
  modelHasToolCall,
  modelHasVision,
  getContextWindow,
  estimateCost,
  getProviderEnvVars,
  isProviderConfigured,
  listModels,
  findProvidersByCapability,
} from './src/modelCatalog.js'

// ─── Effort level utilities ───────────────────────────────────────────────────
export type { EffortLevel } from './src/effort.js'
export { ALL_EFFORT_LEVELS, modelSupportsEffort, modelSupportsMaxEffort, availableEffortLevels } from './src/effort.js'

// ─── GitHub Copilot OAuth ─────────────────────────────────────────────────────
export type { DeviceFlowStart, PollResult } from './src/copilotAuth.js'
export {
  COPILOT_CLIENT_ID,
  COPILOT_IDE_HEADERS,
  DEFAULT_COPILOT_API_BASE_URL,
  deriveCopilotApiBaseUrlFromToken,
  startDeviceFlow,
  pollDeviceFlow,
  getCopilotSessionToken,
  clearCopilotSessionCache,
  getCopilotBearer,
  copilotApiBaseFromSessionToken,
} from './src/copilotAuth.js'
