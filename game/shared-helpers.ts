// Helpers that are shared between the game and tests can go in here.
// This file must not import any file that depends on `window` or `document`,
// nor Node.js-only modules.

export function isPlaythrough(fileContent: string) {
  const testString = fileContent.slice(0, 1000)
  // Old playthrough format: a JSON array of JSON strings containing snakeshift level file data
  // Only format identifier is inside the level data strings
  if (testString.match(/^\s*\[.*snakeshift/s)) {
    return true
  }
  // New playthrough format, with a proper format identifier
  if (testString.match(/^\s*\{.*"snakeshift-playthrough"/s)) {
    return true
  }
  return false
}
