import { loadLevel } from "./level-editor"

const levelSelect = document.querySelector('#level-select')!

export function initLevelSelect() {
  const levelButtons = document.querySelectorAll('.level-button')
  for (const button of levelButtons) {
    button.addEventListener('click', () => {
      const levelURL = button.getAttribute('data-level')!
      void loadLevelFile(levelURL)
    })
  }
}

export async function loadLevelFile(levelURL: string) {
  const request = await fetch(levelURL)
  const blob = await request.blob()
  loadLevel(blob)
  levelSelect.classList.remove('active')
}

export function loadFirstLevel() {
  const levelButton = document.querySelector<HTMLButtonElement>('.level-button')!
  levelButton.click()
}
