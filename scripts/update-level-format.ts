// Level file format upgrades are defined in game-state.ts
// This script updates all the levels in the levels directory to the latest format.
// It's optional, since the game will automatically upgrade levels when they are loaded.
// However, it's nice to have the levels all in the same format,
// and especially nice when cleaning up unnecessary data that was accidentally serialized.

import { glob } from 'glob'
import { exec } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { isPlaythrough } from '../game/shared-helpers.ts'
import { getCurrentLevelContent, getPlaythroughContent, setLevelContent } from '../tests/test-helpers.ts'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = dirname(__dirname)

void (async () => {
  // Launch the browser
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  // Start the server
  const serverProcess = exec('npm run dev', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting server: ${error.message}`)
      return
    }
    if (stderr) {
      console.error(`Server stderr: ${stderr}`)
      return
    }
    console.log(`Server stdout: ${stdout}`)
  })

  // Load the game
  await page.goto('http://localhost:5569')

  // Open the level editor
  await page.click('#level-editor-button')

  // Find the level files
  const filePaths = await glob([
    'game/public/levels/**/*.json',
    'tests/*-snapshots/*.txt', // currently saved as .txt
    'tests/*-snapshots/*.json', // might be saved as .json in the future
  ], { cwd: repoRoot })

  console.log("Files found:", filePaths)

  for (const filePath of filePaths) {
    if (filePath.includes("format-version")) {
      console.error("Skipping file because it's related to version numbering:", filePath)
      continue
    }
    const originalContent = await readFile(filePath, 'utf8')
    const handlingPlaythrough = isPlaythrough(originalContent)
    if (!handlingPlaythrough && !originalContent.startsWith('{')) {
      console.error("Skipping file which does not look like a JSON object:", filePath)
      continue
    }
    console.log("Processing", filePath)

    await setLevelContent(page, originalContent, handlingPlaythrough ? "replay" : "edit")

    const newContent = handlingPlaythrough ? await getPlaythroughContent(page) : await getCurrentLevelContent(page)
    await writeFile(filePath, newContent, 'utf8')
  }

  console.log("Done updating levels")

  await browser.close()
  serverProcess.kill()
})()
