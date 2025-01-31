import { playSound } from "./audio"
import { setActivityMode } from "./game"
import { clearLevel } from "./game-state"
import { loadFirstLevel } from "./level-select"

const playButton = document.querySelector<HTMLButtonElement>('#play-button')!
const levelSelectButton = document.querySelector<HTMLButtonElement>('#level-select-button')!
const levelEditorButton = document.querySelector<HTMLButtonElement>('#level-editor-button')!
const creditsButton = document.querySelector<HTMLButtonElement>('#credits-button')!
const backButtons = document.querySelectorAll<HTMLButtonElement>('.back-to-main-menu-button')!

const mainMenu = document.querySelector<HTMLDivElement>('#main-menu')!
const levelSelect = document.querySelector<HTMLDivElement>('#level-select')!
const credits = document.querySelector<HTMLDivElement>('#credits')!
const levelSplash = document.querySelector<HTMLDivElement>('#level-splash')!
const levelSplashTitle = document.querySelector<HTMLHeadingElement>('#level-splash-title')!

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

  // This is now handled in input.ts with general focus management
  // addEventListener("keydown", (event) => {
  //   if (mainMenu.classList.contains("active")) {
  //     if (event.key === "ArrowDown" || event.key === "ArrowUp") {
  //       event.preventDefault()
  //       const buttons = mainMenu.querySelectorAll("button")
  //       const index = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement)
  //       const delta = event.key === "ArrowDown" ? 1 : -1
  //       const nextIndex = index === -1 ? 0 : (index + delta + buttons.length) % buttons.length
  //       buttons[nextIndex].focus()
  //     }
  //   }
  // })

  showMainMenu()
}

export function hideScreens(options: { except?: string[] } = {}) {
  for (const screen of document.querySelectorAll('.screen.active')) {
    if (options.except?.includes(screen.id)) {
      continue
    }
    screen.classList.remove('active')
  }
}

export function showMainMenu() {
  if (!setActivityMode("menu")) return
  hideScreens()
  mainMenu.classList.add('active')
  playButton.focus()
}

export function showLevelSplash(levelInfo: { title: string }) {
  hideScreens()
  levelSplash.classList.add('active')
  levelSplashTitle.textContent = levelInfo.title
  playSound('gong')
  setTimeout(() => {
    levelSplash.style.transition = "opacity .5s"
    levelSplash.style.opacity = "0"
    setTimeout(() => {
      levelSplash.classList.remove('active')
      levelSplash.style.transition = ""
      levelSplash.style.opacity = ""
    }, 600)
  }, 2000)
}
