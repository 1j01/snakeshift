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
    setEditMode("edit") // before clearing because it switches to separate edit mode undo stacks
    // TODO: clear undos and redos; clearLevel() is undoable
    // or clear when exiting from a level to the main menu / level select
    clearLevel()
  })

  creditsButton.addEventListener('click', () => {
    hideScreens()
    credits.classList.add('active')
  })

  mainMenu.classList.add('active')

}

export function hideScreens() {
  for (const screen of document.querySelectorAll('.screen.active')) {
    screen.classList.remove('active')
  }
}
