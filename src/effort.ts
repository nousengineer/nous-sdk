export type EffortLevel = 'low' | 'medium' | 'high' | 'max'

export const ALL_EFFORT_LEVELS: EffortLevel[] = ['low', 'medium', 'high', 'max']

/**
 * Returns true when the model supports effort levels.
 * Covers claude opus-4.6/sonnet-4.6 and NVIDIA-family open models
 * (except mistral-small-4).
 */
export function modelSupportsEffort(modelId: string): boolean {
  if (!modelId) return false
  const m = modelId.toLowerCase()

  // Anthropic: only the -4-6 generation supports effort
  if (m.includes('opus-4-6') || m.includes('sonnet-4-6')) return true
  if (m.includes('haiku') || m.includes('sonnet') || m.includes('opus')) return false

  // NVIDIA / open-weight families (including OpenAI-routed ids like openai/gpt-oss-120b)
  if (
    m.includes('nvidia') ||
    m.includes('gpt-oss') ||
    m.includes('nemotron') ||
    m.includes('llama') ||
    m.includes('mistral') ||
    m.includes('qwen') ||
    m.includes('deepseek') ||
    m.includes('phi') ||
    m.includes('gemma')
  ) {
    if (/mistral[-.]?small[-.]?4/i.test(m)) return false
    return true
  }

  return false
}

/** Returns true when the model supports the "max" effort level (opus-4.6 only). */
export function modelSupportsMaxEffort(modelId: string): boolean {
  return modelId.toLowerCase().includes('opus-4-6')
}

/**
 * Returns the effort levels available for a given model.
 * Empty array means effort is not supported — hide the selector.
 */
export function availableEffortLevels(modelId: string): EffortLevel[] {
  if (!modelSupportsEffort(modelId)) return []
  return modelSupportsMaxEffort(modelId)
    ? ALL_EFFORT_LEVELS
    : ALL_EFFORT_LEVELS.filter((l) => l !== 'max')
}
