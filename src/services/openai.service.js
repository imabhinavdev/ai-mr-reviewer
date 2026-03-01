import OpenAI from 'openai'
import { env } from '../config/env.js'

let client = null
function getClient() {
  if (!client) {
    if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set')
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  }
  return client
}

const MODEL = () => env.OPENAI_MODEL || 'gpt-4o-mini'

/**
 * Generate structured JSON from a text prompt using OpenAI chat completions.
 * @param {string} prompt - User prompt
 * @param {object} jsonSchema - JSON Schema for the response (OpenAI structured output format)
 * @returns {Promise<string>} Raw JSON string
 */
export async function generateContentStructured(prompt, jsonSchema) {
  const response = await getClient().chat.completions.create({
    model: MODEL(),
    messages: [{ role: 'user', content: prompt }],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'review_chunk',
        strict: true,
        schema: jsonSchema,
      },
    },
  })

  const content = response.choices?.[0]?.message?.content
  return typeof content === 'string' ? content : '{}'
}
