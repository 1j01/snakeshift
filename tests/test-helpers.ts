import { Page, expect } from '@playwright/test'
import { readFile } from 'fs/promises'
import { basename } from 'path'
import { Readable } from 'stream'

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
  // TODO: fix flakiness (maybe wait for network idle?)
  await dragAndDropFile(page, 'body', filePath)
  await expect(page).toHaveTitle('Snakeshift - Level Editor')
  await page.getByRole('button', { name: 'Play/Edit' }).click()
  await expect(page.locator('#level-splash')).not.toBeVisible() // wait for level splash to disappear if applicable
  // await expect(page).toHaveTitle('Snakeshift - Custom Level')
}

async function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    // weird, I can say `as ArrayBuffer` or `as string`, but not `as ArrayBuffer | string`. whatever, dude.
    chunks.push(Buffer.from(chunk as ArrayBuffer))
  }
  return Buffer.concat(chunks).toString("utf-8")
}

export async function saveLevelFileAndGetContent(page: Page) {
  const downloadPromise = page.waitForEvent('download')
  await page.keyboard.press('Control+KeyS')
  const download = await downloadPromise
  const levelFileContent = await streamToString(await download.createReadStream())
  return levelFileContent
}
export async function saveLevelFileAndCompareContent(page: Page, filePath: string) {
  const expectedContent = await readFile(filePath, 'utf8')
  const actualContent = await saveLevelFileAndGetContent(page)
  expect(actualContent).toEqual(expectedContent)
}
