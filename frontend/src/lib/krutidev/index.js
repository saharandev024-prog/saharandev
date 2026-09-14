// Vendored Kruti Dev (legacy Devanagari) -> Unicode converter.
// Source: @anthro-ai/krutidev-unicode (MIT), external dep removed, ESM-ified.
import convert from './convert-core'

// Convert a legacy Kruti Dev encoded string to proper Unicode Devanagari.
export const krutiToUnicode = (text) => {
  if (!text) return text
  try {
    return convert(String(text))
  } catch (e) {
    return text
  }
}

export default krutiToUnicode
