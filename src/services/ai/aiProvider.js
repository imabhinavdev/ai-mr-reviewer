import { env } from '../../config/env.js'
import { generateContentStructured as geminiStructured } from '../gemini.service.js'
import { generateContentStructured as openaiStructured } from '../openai.service.js'

/**
 * Select AI provider from env: Gemini if GEMINI_API_KEY set, else OpenAI if OPENAI_API_KEY set.
 * @returns {'gemini'|'openai'}
 */
function getAIProvider() {
  if (env.GEMINI_API_KEY) return 'gemini'
  if (env.OPENAI_API_KEY) return 'openai'
  throw new Error('Set GEMINI_API_KEY or OPENAI_API_KEY in the environment')
}

/**
 * Generate structured review (JSON string) using the configured AI provider.
 * @param {string} prompt
 * @param {object} jsonSchema - JSON Schema for the response (provider-specific shape if needed)
 * @returns {Promise<string>} Raw JSON string
 */
export async function generateStructuredReview(prompt, jsonSchema) {
  const provider = getAIProvider()
  if (provider === 'gemini') {
    return geminiStructured(prompt, jsonSchema)
  }
  return openaiStructured(prompt, jsonSchema)
}
