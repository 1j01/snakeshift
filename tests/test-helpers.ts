import { Page, expect } from '@playwright/test';
import { readFile } from 'fs/promises';

export const dragAndDropFile = async (
  page: Page,
  selector: string,
  filePath: string,
  fileName: string,
  fileType = ''
) => {
  const buffer = (await readFile(filePath)).toString('base64');

  const dataTransfer = await page.evaluateHandle(
    async ({ bufferData, localFileName, localFileType }) => {
      const dt = new DataTransfer();

      const blobData = await fetch(bufferData).then((res) => res.blob());

      const file = new File([blobData], localFileName, { type: localFileType });
      dt.items.add(file);
      return dt;
    },
    {
      bufferData: `data:application/octet-stream;base64,${buffer}`,
      localFileName: fileName,
      localFileType: fileType,
    }
  );

  await page.dispatchEvent(selector, 'drop', { dataTransfer });
};

async function streamToString(stream: ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function saveLevelFileAndGetContent(page: Page) {
  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyS');
  await page.keyboard.up('Control');
  const download = await downloadPromise;
  // @ts-ignore
  const levelFileContent = await streamToString(await download.createReadStream());
  return levelFileContent;
}
export async function saveLevelFileAndCompareContent(page: Page, filePath: string) {
  const expectedContent = await readFile(filePath, 'utf8');
  const actualContent = await saveLevelFileAndGetContent(page);
  expect(actualContent).toEqual(expectedContent);
}
