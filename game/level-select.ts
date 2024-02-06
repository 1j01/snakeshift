import { setEditMode } from "./game"
import { loadLevel } from "./level-editor"

const levelSelect = document.querySelector('#level-select')!

let currentLevelButton: HTMLButtonElement | undefined = undefined

export function initLevelSelect() {
  const levelButtons = document.querySelectorAll<HTMLButtonElement>('.level-button')
  for (const button of levelButtons) {
    button.addEventListener('click', () => {
      const levelURL = button.getAttribute('data-level')!
      // TODO: error handling; simplify with promises
      void loadLevelFile(levelURL, () => {
        currentLevelButton = button
      })
    })
  }
}

export async function loadLevelFile(levelURL: string, loadedCallback?: () => void) {
  const request = await fetch(levelURL)
  const blob = await request.blob()
  loadLevel(blob, () => {
    levelSelect.classList.remove('active')
    setEditMode(false)
    loadedCallback?.()
  })
}

export function loadFirstLevel() {
  const levelButton = document.querySelector<HTMLButtonElement>('.level-button')!
  levelButton.click()
}

export function loadNextLevel() {
  if (!currentLevelButton) {
    // Likely a custom level; TODO: handle winning custom levels, even after currentLevelButton is set
    return
  }
  const levelButtons = [...document.querySelectorAll<HTMLButtonElement>('.level-button')]
  const index = levelButtons.indexOf(currentLevelButton)
  const levelButton = levelButtons[index + 1]
  if (levelButton) {
    levelButton.click()
  } else {
    // TODO: fancy win screen
    alert("You win!")
  }
}

export function currentLevelID() {
  return currentLevelButton?.getAttribute('data-level') ?? ''
}
