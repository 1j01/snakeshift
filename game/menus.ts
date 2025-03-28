import { playSound } from "./audio"
import { activityMode, clearLevel, confirmLoseUnsavedChanges, setActivityMode } from "./game-state"
import { loadFirstLevel, standaloneLevelMode, updateLevelSelect } from "./level-select"

const playButton = document.querySelector<HTMLButtonElement>('#play-button')!
const levelSelectButton = document.querySelector<HTMLButtonElement>('#level-select-button')!
const levelEditorButton = document.querySelector<HTMLButtonElement>('#level-editor-button')!
const creditsButton = document.querySelector<HTMLButtonElement>('#credits-button')!
const backButton = document.querySelector<HTMLButtonElement>('#back-to-main-menu-button')!

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
    updateLevelSelect()
    document.body.dataset.screen = "level-select"
  })

  levelEditorButton.addEventListener('click', () => {
    hideScreens()
    setActivityMode("edit") // before clearing because it switches to separate edit mode undo stacks
    clearLevel(false, true)
    document.body.dataset.screen = "level-editor"
  })

  creditsButton.addEventListener('click', () => {
    hideScreens()
    credits.classList.add('active')
    document.body.dataset.screen = "credits"
  })

  backButton.addEventListener('click', () => {
    if (activityMode === "play" && standaloneLevelMode) {
      // Playtesting a custom level, return to editing
      setActivityMode("edit")
    } else {
      // From Level Editor, Level Select, Credits, or a campaign level, go to Main Menu
      showMainMenu()
    }
  })

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
  // Clear timers in case this helps avoid any weird timing issues
  if (!options.except?.includes(levelSplash.id)) {
    hideLevelSplash()
  }
}

export function showMainMenu() {
  if (!confirmLoseUnsavedChanges()) return false
  hideScreens()
  mainMenu.classList.add('active')
  document.body.dataset.screen = "main-menu"
  setActivityMode("menu")
  playButton.focus()
  return true
}

const splashScreenTimeouts = new Set<number>()
export function showLevelSplash(options: { title: string, duration?: number }) {
  // Note: splash screens may be dismissed early by pressing Enter/Space/Escape
  hideScreens()
  levelSplash.classList.add('active')
  // document.body.dataset.screen = "game" // not sure yet
  levelSplashTitle.textContent = options.title
  playSound('gong')
  // @ts-expect-error conflict with @types/node
  splashScreenTimeouts.add(setTimeout(() => {
    levelSplash.style.transition = "opacity .5s"
    levelSplash.style.opacity = "0"
    // @ts-expect-error conflict with @types/node
    splashScreenTimeouts.add(setTimeout(() => {
      hideLevelSplash()
    }, location.search.includes("fast-splash-screens") ? 0 : 600))
  }, location.search.includes("fast-splash-screens") ? 100 : (options.duration ?? 2000)))
}
export function hideLevelSplash() {
  for (const timeout of splashScreenTimeouts) {
    clearTimeout(timeout)
  }
  splashScreenTimeouts.clear()
  levelSplash.classList.remove('active')
  levelSplash.style.transition = ""
  levelSplash.style.opacity = ""
  levelSplashTitle.textContent = ""
}
