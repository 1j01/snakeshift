import { setActivityMode } from "./game"
import { clearLevel } from "./game-state"
import { loadFirstLevel } from "./level-select"

const playButton = document.querySelector('#play-button')!
const levelSelectButton = document.querySelector('#level-select-button')!
const levelEditorButton = document.querySelector('#level-editor-button')!
const creditsButton = document.querySelector('#credits-button')!
const backButtons = document.querySelectorAll('.back-to-main-menu-button')!

const mainMenu = document.querySelector<HTMLDivElement>('#main-menu')!
const levelSelect = document.querySelector<HTMLDivElement>('#level-select')!
const credits = document.querySelector<HTMLDivElement>('#credits')!

export function initMainMenu() {
  playButton.addEventListener('click', () => {
    hideScreens()
    loadFirstLevel()
  })

  levelSelectButton.addEventListener('click', () => {
    hideScreens()
    levelSelect.classList.add('active')
  })

  levelEditorButton.addEventListener('click', () => {
    hideScreens()
    setActivityMode("edit") // before clearing because it switches to separate edit mode undo stacks
    // TODO: clear undos and redos; clearLevel() is undoable
    // or clear when exiting from a level to the main menu / level select
    clearLevel()
  })

  creditsButton.addEventListener('click', () => {
    hideScreens()
    credits.classList.add('active')
  })

  for (const backButton of backButtons) {
    backButton.addEventListener('click', showMainMenu)
  }

  addEventListener("keydown", (event) => {
    if (mainMenu.classList.contains("active")) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault()
        const buttons = mainMenu.querySelectorAll("button")
        const index = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement)
        const delta = event.key === "ArrowDown" ? 1 : -1
        const nextIndex = index === -1 ? 0 : (index + delta + buttons.length) % buttons.length
        buttons[nextIndex].focus()
      }
    }
  })

  showMainMenu()
}

export function hideScreens() {
  for (const screen of document.querySelectorAll('.screen.active')) {
    screen.classList.remove('active')
  }
}

export function showMainMenu() {
  hideScreens()
  mainMenu.classList.add('active')
  setActivityMode("menu")
}
