import { playSound } from "./audio"
import { activityMode, deserialize, entities, levelInfo, loadLevel, loadLevelFromText, restartLevel, serialize, undo } from "./game-state"
import { hintsByLevelName } from "./hints"
import { showLevelSplash } from "./menus"
import { drawEntities } from "./rendering"
import { safeStorage } from "./safe-storage"
import { storageKeys } from "./shared-helpers"

/**
 * This stores the current level in the progression. Yes, it's a bit awkward to use the DOM elements like this. 
 * 
 * This should be unset when a level is edited, making it a "custom" or "standalone" level.
*/
let currentLevelButton: HTMLButtonElement | undefined = undefined
/**
 * If true, prevents setting the current level state when deserializing.
 * 
 * In order to support undoing/redoing across levels, the level ID is stored in the undo stack.
 * It has to switch levels when deserializing an undo state.
 * However, it must not do this when undoing/redoing while playtesting a level from the level editor,
 * or instead of a "Level Complete" screen, it would move onto a different level, losing your editor state.
 * Bloody complicated, innit? Well MAY become much clearer/simpler by using the URL as the main source of truth.
 * Or at least consolidating state management; right now it's so spread out...
 */
export let standaloneLevelMode = true

const cache = new Map<string, Promise<Response>>()
async function fetchCached(url: string) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url))
  }
  return (await cache.get(url)!).clone()
}

export function initLevelSelect() {
  const levelButtons = document.querySelectorAll<HTMLButtonElement>('.level-button')
  for (const button of levelButtons) {
    // Creating a button inside a button is not valid, so wrap the button in a div.
    // (Doing this in the HTML would be too repetitive.)
    const wrapper = document.createElement('div')
    wrapper.className = 'level-button-wrapper'
    button.replaceWith(wrapper)
    wrapper.append(button)

    const levelURL = button.getAttribute('data-level')!
    button.addEventListener('click', () => {
      // Show splash before file is loaded to mask loading time
      showLevelSplash({ title: button.querySelector(".button-text")?.textContent ?? "Loading..." })
      // TODO: error handling; simplify with promises
      void loadLevelFile(levelURL, () => {
        currentLevelButton = button
        standaloneLevelMode = false
        updatePageTitleAndLevelSpecificOverlaysAndHints()
      })
    })

    // TODO: its awkward to have the error text inside the button.
    // It complicates some code, which now has to look for .button-text specifically,
    // not to mention having to wrap the text in .button-text here,
    // and it may be an accessibility issue.
    const buttonTextSpan = document.createElement('span')
    buttonTextSpan.className = 'button-text'
    buttonTextSpan.textContent = button.textContent!.trim()
    button.textContent = ''
    button.append(buttonTextSpan)
    const levelPreview = document.createElement('div')
    levelPreview.className = 'level-preview'
    const levelPreviewError = document.createElement('div')
    levelPreviewError.className = 'level-preview-error'
    levelPreviewError.hidden = true
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    button.prepend(levelPreview)
    levelPreview.append(canvas, levelPreviewError)
    const styleWidth = 200
    const styleHeight = 200
    const renderLevelPreview = async () => {
      if (location.search.includes("no-level-previews")) {
        // Disable level previews for tests, so that snapshot tests don't fail meaninglessly
        // with entity IDs changing due to the mocked randomUUID function's counter incrementing for each entity in the level previews.
        // Level content changes (new levels, etc.) shouldn't cause unrelated tests to fail.
        // Also avoid any flakiness due to the timing of the level previews loading.
        return
      }
      canvas.style.width = `${styleWidth}px`
      canvas.style.height = `${styleHeight}px`
      // Needs rounding (or else the condition below may be true at rest, since canvas.height is an integer)
      const resolutionWidth = Math.floor(styleWidth * devicePixelRatio)
      const resolutionHeight = Math.floor(styleHeight * devicePixelRatio)
      const resized = canvas.width !== resolutionWidth || canvas.height !== resolutionHeight
      if (resized) {
        canvas.width = resolutionWidth
        canvas.height = resolutionHeight
      }

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const request = await fetchCached(levelURL)
      if (!request.ok) {
        levelPreviewError.textContent = `Failed to load level preview.\nStatus: ${request.statusText}`
        levelPreviewError.hidden = false
        return
      }
      const blob = await request.blob()
      const stateToPreview = await blob.text()
      // TODO: segregate the game state so as not to need to reset it or include a flag to avoid triggering side effects
      // Could use OOP, i.e. a Game class, for instance (of Game class) (haha so funny)
      const oldState = serialize()
      try {
        deserialize(stateToPreview, levelURL, true)

        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        const borderSize = 0.2
        const viewWidth = levelInfo.width + borderSize * 2
        const viewHeight = levelInfo.height + borderSize * 2
        const viewCenterX = levelInfo.width / 2
        const viewCenterY = levelInfo.height / 2
        const scale = Math.min(canvas.width / viewWidth, canvas.height / viewHeight)
        ctx.scale(scale, scale)
        ctx.translate(-viewCenterX, -viewCenterY)

        drawEntities(ctx, entities)
        ctx.restore()
      } catch (error) {
        levelPreviewError.textContent = `Failed to load level preview.\n${String(error)}`
        levelPreviewError.hidden = false
      } finally {
        deserialize(oldState)
      }
    }
    void renderLevelPreview()
    // TODO: handle zooming (DPI changes)
    // addEventListener('resize', renderIcon)
  }
}

/**
 * Update level solution status in the level select screen.
 */
export function updateLevelSelect() {
  for (const button of document.querySelectorAll<HTMLButtonElement>('.level-button')) {
    const levelId = button.getAttribute('data-level')!
    const moveCount = Number(safeStorage.getItem(storageKeys.bestMoveCount(levelId)) ?? Infinity)
    const solution = safeStorage.getItem(storageKeys.bestSolution(levelId))
    const completed = moveCount < Infinity
    button.dataset.moveCount = String(moveCount)
    button.dataset.completed = String(completed)
    let replayButton = button.parentElement!.querySelector('.replay-button')
    if (solution && !replayButton) {
      replayButton = document.createElement('button')
      replayButton.className = 'bw-button replay-button'
      button.parentElement!.append(replayButton)
      replayButton.addEventListener('click', () => {
        loadLevelFromText(solution, "replay")
      })
      // replayButton.textContent = "View Replay"
      const img = document.createElement('img')
      img.src = "graphics/view-replay-3.svg"
      img.alt = "View Replay"
      img.width = 32
      img.height = 32
      replayButton.append(img)
    }
  }
}

export async function loadLevelFile(levelURL: string, loadedCallback?: () => void) {
  const request = await fetchCached(levelURL)
  if (!request.ok) {
    alert(`Failed to load level ${JSON.stringify(levelURL)}: ${request.statusText}`)
    return
  }
  const blob = await request.blob()
  loadLevel(blob, "play", loadedCallback, levelURL)
}

export function loadFirstLevel() {
  const levelButton = document.querySelector<HTMLButtonElement>('.level-button')!
  levelButton.click()
}

export function loadNextLevel() {
  if (!currentLevelButton) {
    // Custom level editor level
    // Undo the action that won the level so that you can undo restarting the level
    // without immediately winning, blocking you from undoing further back.
    undo()
    restartLevel()
    showLevelSplash({ title: "Level Complete", duration: 800 })
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
    playSound('gongBrilliant')
  }
}

export function setStandaloneLevelMode(value = true) {
  standaloneLevelMode = value
  if (value) {
    currentLevelButton = undefined
    document.body.dataset.standaloneLevel = ""
  } else {
    delete document.body.dataset.standaloneLevel
  }
}

export function setCurrentLevel(id?: string) {
  if (!id) {
    setStandaloneLevelMode()
    return
  }
  currentLevelButton = document.querySelector<HTMLButtonElement>(`button[data-level="${id}"]`) ?? undefined
  standaloneLevelMode = false  // ?
}

export function currentLevelID() {
  return currentLevelButton?.getAttribute('data-level') ?? ''
}

// TODO: treat this more as an event, instead of progressively making the function name longer or less descriptive
// ("on screen change"? "on navigate"? when all should this be called? could be multiple distinct events too)
export function updatePageTitleAndLevelSpecificOverlaysAndHints() {
  if (activityMode === "edit") {
    document.title = "Snakeshift - Level Editor"
  } else if (activityMode === "replay") {
    document.title = "Snakeshift - Replay"
  } else if (currentLevelButton) {
    document.title = `Snakeshift - ${currentLevelButton.querySelector(".button-text")?.textContent}`
  } else if (activityMode === "play") {
    document.title = "Snakeshift - Custom Level"
  } else {
    document.title = "Snakeshift"
  }
  for (const overlayElement of document.querySelectorAll<HTMLDivElement>('.level-specific-overlay, #level-stuck-hint')) {
    overlayElement.hidden = overlayElement.dataset.forLevel !== currentLevelID()
  }

  const hintButton = document.querySelector<HTMLButtonElement>('#hint-button')!
  const hintsList = document.querySelector<HTMLButtonElement>('#hints-list')!
  const nextHintButton = document.querySelector<HTMLDialogElement>('#hints-dialog-next-hint-button')!
  const hintsDialog = document.querySelector<HTMLDialogElement>('#hints-dialog')!

  hintsList.innerHTML = ""
  hintButton.hidden = true
  if (currentLevelButton) {
    const levelName = currentLevelButton.querySelector(".button-text")?.textContent ?? ""
    const levelHints = hintsByLevelName[levelName]
    if (levelHints) {
      for (const hint of levelHints) {
        const li = document.createElement('li')
        li.textContent = hint
        hintsList.append(li)
        li.classList.add('hint')
        li.hidden = true
      }
      hintButton.hidden = false
      hintsDialog.querySelector('.hint[hidden]')?.removeAttribute('hidden')
      nextHintButton.hidden = !hintsDialog.querySelector('.hint[hidden]')
    } else {
      hintsList.innerHTML = "<li>No hints available for this level.</li>"
      nextHintButton.hidden = true
    }
  }
}

// Hacky little way to load a level from the URL
// TODO: proper routing, handle hash changes, avoid race condition, prefer exact level name match (so that "level-1" doesn't match "level-10", or "Foo" doesn't match "Foo: The Sequel")
const levelMatch = location.hash.match(/^#\/?levels\/(.+)$/)
if (levelMatch) {
  setTimeout(() => {
    const levelButton = document.querySelector<HTMLButtonElement>(`button[data-level*="${levelMatch[1]}"]`)
    if (levelButton) {
      levelButton.click()
    }
  }, 100)
}

if (location.search.includes("show-test-levels")) {
  document.querySelector<HTMLDivElement>('#test-cases-not-real-levels')!.hidden = false
}
