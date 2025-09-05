
export function convertInputToJSON(input: string | Record<string, string>): Record<string, string> {
  if (typeof input === "string") {
    // Step 1: Clean up the string to make it valid JSON
    let cleaned = String(input)
      .replace(/\+\s*/g, '')   // remove all +
      .replace(/'/g, '"')      // replace single quotes with double quotes
      .replace(/\n/g, '')      // remove newlines

    // Step 2: Parse string as JSON
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      console.error('Failed to parse string as JSON:', err);
      return {};
    }
  
  } else {
    // Invalid input
    console.error('Input is neither a string nor a Record<string, string>');
    return {};
  }
}