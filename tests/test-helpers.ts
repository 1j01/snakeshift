import { Page, expect } from '@playwright/test'
import { readFile } from 'fs/promises'
import { basename } from 'path'
// import { Readable } from 'stream'
import { Tile } from '../game/types'

export const dragAndDropFile = async (
  page: Page,
  selector: string,
  filePath: string,
  fileName?: string,
  fileType = ''
) => {
  if (!fileName) {
    fileName = basename(filePath)
  }
  const buffer = (await readFile(filePath)).toString('base64')

  const dataTransfer = await page.evaluateHandle(
    async ({ bufferData, localFileName, localFileType }) => {
      const dt = new DataTransfer()

      const blobData = await fetch(bufferData).then((res) => res.blob())

      const file = new File([blobData], localFileName, { type: localFileType })
      dt.items.add(file)
      return dt
    },
    {
      bufferData: `data:application/octet-stream;base64,${buffer}`,
      localFileName: fileName,
      localFileType: fileType,
    }
  )

  await page.dispatchEvent(selector, 'drop', { dataTransfer })
}

export async function loadLevelToPlay(page: Page, filePath: string) {
  // If this function is called right at the start of a test, the event listeners might not be set up yet.
  await page.waitForLoadState('networkidle')
  await dragAndDropFile(page, 'body', filePath)
  await expect(page).toHaveTitle('Snakeshift - Level Editor')
  await page.getByRole('button', { name: 'Play/Edit' }).click()
  await expect(page.locator('#level-splash')).not.toBeVisible() // wait for level splash to disappear if applicable
  // await expect(page).toHaveTitle('Snakeshift - Custom Level')
}

// async function streamToString(stream: Readable): Promise<string> {
//   const chunks: Buffer[] = []
//   for await (const chunk of stream) {
//     // weird, I can say `as ArrayBuffer` or `as string`, but not `as ArrayBuffer | string`. whatever, dude.
//     chunks.push(Buffer.from(chunk as ArrayBuffer))
//   }
//   return Buffer.concat(chunks).toString("utf-8")
// }

export async function getCurrentLevelContent(page: Page) {
  // This was flaky.
  // const downloadPromise = page.waitForEvent('download')
  // await page.keyboard.press('Control+KeyS')
  // const download = await downloadPromise
  // const levelFileContent = await streamToString(await download.createReadStream())
  // return levelFileContent

  // This is more reliable, faster, and more efficient.
  // (Of course we need tests specifically for the level saving functionality now. TODO.)
  return page.evaluate(() => {
    return window._forTesting.serialize()
  })
}
export async function compareCurrentLevelContentToFile(page: Page, filePath: string) {
  function normalize(content: string) {
    return content.replace(/\r\n/g, '\n')
  }
  const expectedContent = normalize(await readFile(filePath, 'utf8'))
  const actualContent = normalize(await getCurrentLevelContent(page))
  expect(actualContent).toEqual(expectedContent)
}

export async function setLevelContent(page: Page, content: string) {
  await page.evaluate((content) => {
    window._forTesting.deserialize(content)
  }, content)
}

export async function clickTile(page: Page, x: number, y: number) {
  const tile = { x, y, width: 1, height: 1 }
  const rect = await page.evaluate<Tile, Tile>((tile) => {
    return window._forTesting.tileOnPage(tile)
  }, tile)
  const rectCenter = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
  await page.mouse.click(rectCenter.x, rectCenter.y)
}
