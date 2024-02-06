import { setEditMode } from "./game"
import { clearLevel } from "./game-state"
import { loadFirstLevel } from "./level-select"

export function initMainMenu() {
  const playButton = document.querySelector('#play-button')!
  const levelSelectButton = document.querySelector('#level-select-button')!
  const levelEditorButton = document.querySelector('#level-editor-button')!
  const creditsButton = document.querySelector('#credits-button')!

  const mainMenu = document.querySelector('#main-menu')!
  const levelSelect = document.querySelector('#level-select')!
  const credits = document.querySelector('#credits')!

  const screens = [mainMenu, levelSelect, credits]

  playButton.addEventListener('click', () => {
    screens.forEach(screen => screen.classList.remove('active'))
    loadFirstLevel()
  })

  levelSelectButton.addEventListener('click', () => {
    screens.forEach(screen => screen.classList.remove('active'))
    levelSelect.classList.add('active')
  })

  levelEditorButton.addEventListener('click', () => {
    screens.forEach(screen => screen.classList.remove('active'))
    // TODO: clear undos and redos; clearLevel() is undoable
    // or clear when exiting from a level to the main menu / level select
    clearLevel()
    setEditMode(true)
  })

  creditsButton.addEventListener('click', () => {
    screens.forEach(screen => screen.classList.remove('active'))
    credits.classList.add('active')
  })

  mainMenu.classList.add('active')

}
