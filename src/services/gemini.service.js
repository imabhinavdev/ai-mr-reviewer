import { GoogleGenAI } from '@google/genai'
import { env } from '../config/env.js'

let ai = null
function getClient() {
  if (!ai) {
    if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set')
    ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
  }
  return ai
}

export const generateContent = async (contents) => {
  const response = await getClient().models.generateContent({
    model: env.GEMINI_MODEL || 'gemini-2.0-flash',
    contents,
  })
  return response.text
}

/**
 * Generate content with structured JSON output. Use responseJsonSchema for schema.
 * @param {import('@google/genai').Content[]} contents
 * @param {object} responseJsonSchema - JSON Schema for the response (subset supported by Gemini)
 * @returns {Promise<string>} Raw JSON string; caller should parse and validate
 */
export const generateContentStructured = async (
  contents,
  responseJsonSchema,
) => {
  const response = await getClient().models.generateContent({
    model: env.GEMINI_MODEL || 'gemini-2.0-flash',
    contents,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema,
    },
  })
  return response.text ?? '{}'
}
