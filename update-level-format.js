// Level file format upgrades are defined in game-state.ts
// This script updates all the levels in the levels directory to the latest format.
// It's optional, since the game will automatically upgrade levels when they are loaded.
// However, it's nice to have the levels all in the same format,
// and especially nice when cleaning up unnecessary data that was accidentally serialized.

import { readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { exec } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
  const filePaths = (await readdir(join(__dirname, 'game/public/levels'), { recursive: true, withFileTypes: true }))
    .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.json'))
    .map((dirent) => join(dirent.parentPath, dirent.name))

  console.log("Files found:", filePaths)

  for (const filePath of filePaths) {
    if (filePath.includes("format-version")) {
      console.error("Skipping file because it's related to version numbering:", filePath)
      continue
    }
    const fileContents = readFileSync(filePath, 'utf8')
    if (fileContents[0] === '[') {
      console.error("Skipping file which may be a playthrough:", filePath)
      continue
    }
    if (fileContents[0] !== '{') {
      console.error("Skipping file which does not look like a JSON object:", filePath)
      continue
    }
    console.log("Processing", filePath)

    // Load the level in the editor
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.keyboard.press('Control+KeyO')
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(filePath)

    await page.waitForTimeout(500)

    // Save the level
    const downloadPromise = page.waitForEvent('download')
    await page.keyboard.press('Control+KeyS')
    const download = await downloadPromise
    await download.saveAs(filePath)

    await page.waitForTimeout(200)
  }

  console.log("Done updating levels")

  await browser.close()
  serverProcess.kill()
})()
