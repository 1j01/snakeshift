import { activityMode } from "./game"
import { loadLevel } from "./level-editor"
import { showLevelSplash } from "./menus"

let currentLevelButton: HTMLButtonElement | undefined = undefined

export function initLevelSelect() {
  const levelButtons = document.querySelectorAll<HTMLButtonElement>('.level-button')
  for (const button of levelButtons) {
    button.addEventListener('click', () => {
      const levelURL = button.getAttribute('data-level')!
      // Show splash before file is loaded to mask loading time
      showLevelSplash({ title: button.textContent ?? "Loading..." })
      // TODO: error handling; simplify with promises
      void loadLevelFile(levelURL, () => {
        currentLevelButton = button
        updatePageTitleAndLevelSpecificOverlays()
      })
    })
  }
}

export async function loadLevelFile(levelURL: string, loadedCallback?: () => void) {
  const request = await fetch(levelURL)
  if (!request.ok) {
    alert(`Failed to load level ${JSON.stringify(levelURL)}: ${request.statusText}`)
    return
  }
  const blob = await request.blob()
  loadLevel(blob, "play", loadedCallback)
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
  // Don't progress from real levels to the test set of levels, but do progress within either set
  // Could make this clearer by having a separate set for navigation tests, and/or overriding the main set of levels for the tests...
  if (levelButton && (!!currentLevelButton.closest('#test-cases-not-real-levels') || !levelButton.closest('#test-cases-not-real-levels'))) {
    levelButton.click()
  } else {
    const winScreen = document.querySelector<HTMLDivElement>('#game-win-screen')!
    winScreen.classList.add('active')
  }
}

// Would've called it unloadCurrentLevel, but it doesn't do much unloading...
export function unsetCurrentLevel() {
  currentLevelButton = undefined
}

export function setCurrentLevel(id?: string) {
  if (!id) {
    unsetCurrentLevel()
    return
  }
  currentLevelButton = document.querySelector<HTMLButtonElement>(`button[data-level="${id}"]`) ?? undefined
}

export function currentLevelID() {
  return currentLevelButton?.getAttribute('data-level') ?? ''
}

export function updatePageTitleAndLevelSpecificOverlays() {
  if (currentLevelButton) {
    document.title = `Snakeshift - ${currentLevelButton.textContent}`
  } else if (activityMode === "edit") {
    document.title = "Snakeshift - Level Editor"
  } else {
    document.title = "Snakeshift"
  }
  for (const overlayElement of document.querySelectorAll<HTMLDivElement>('.level-specific-overlay')) {
    overlayElement.hidden = overlayElement.dataset.forLevel !== currentLevelID()
  }
}
