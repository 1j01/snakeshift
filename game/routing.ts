
// Routing plan:
//
// #/ (or anything not matched)
//   ╚══> redirect to title screen
// #/main-menu
//   ╚══> title screen
// #/levels
//   ╚══> redirect to level select's first section
// #/levels/easy
//   ╚══> level select, specific section
// #/levels/easy/001-movement
//   ╚══> first level
// #/levels/easy/001-movement/edit
//   ╚══> level editor for first level, redirects to local version when you make a change
// #/level-editor
//   ╚══> new file
// #/local/foo-bar/edit
//   ╚══> existing file
// #/data/a99897sdf987a9879a9as70gah0986h96gjs6797659.../edit
//   ╚══> existing level (easy sharing)
//
// Notes:
// - I automatically canonicalize URLs (letter case, etc.) with replaceState
//   - I support some synonyms: "edit"/"editor"/"editing"/"edit-mode"/"ed"/"e"
//   - #edit/<level> is synonymous with #<level>/edit
//   - I could synonymize "_"/"-"/""
//   - I could allow the level set to be omitted, so you can type just the name of a level, e.g. "#001-movement" instead of "#levels/easy/001-movement"
//     and maybe treat the number/title specially, so you can just type "#1" or "#movement"
// - Some unmatched routes show an error
// - Should I include the slash at the start? "#/foo/bar" vs "#foo/bar"
// - I might get rid of locally stored levels, in favor of data in the URL (like beepbox.co and some other web apps).


const SCREEN_TITLE = "SCREEN_TITLE"
const SCREEN_LEVEL_SELECT = "SCREEN_LEVEL_SELECT"
const SCREEN_LEVEL = "SCREEN_LEVEL"

const GAME_JUNKBOT = "GAME_JUNKBOT"
const GAME_JUNKBOT_UNDERCOVER = "GAME_JUNKBOT_UNDERCOVER"
const GAME_JANITORIAL_ANDROID = "GAME_JANITORIAL_ANDROID"
const GAME_TEST_CASES = "GAME_TEST_CASES"
const GAME_USER_CREATED = "GAME_USER_CREATED"


const levelNameToSlug = (levelName: string) => levelName
  .replace(/'/g, "") // remove apostrophes (because "don-t" and "it-s" look stupid)
  .replace(/[^a-z0-9]/gi, "-") // replace non-alphanumeric characters with dashes
  .replace(/-{2,}/g, "-") // replace multiple dashes with a single dash
  .replace(/^-+|-+$/g, "") // remove leading and trailing dashes (effectively trimming whitespace etc.)
  .toLowerCase()

const gameNameToSlug = (gameName: string) => levelNameToSlug(gameName)
  .replace(/^game-/, "") // for converting enum names (GAME_*) to slugs, especially for loose comparison
  .replace(/(uc|undercover)/, "2")
  .replace(/1/g, "")
  .replace(/janitorial-android/, "junkbot3")
  .replace(/test-cases|run-tests|test-runner/, "tests")
  .replace(/user-created|my-computer|local/, "local")
  .replace(/-/g, "")

const canonicalSlugToGame = {
  "junkbot": GAME_JUNKBOT,
  "junkbot2": GAME_JUNKBOT_UNDERCOVER,
  "junkbot3": GAME_JANITORIAL_ANDROID,
  "tests": GAME_TEST_CASES,
  "local": GAME_USER_CREATED,
}

const parseGameID = (gameName: string) => canonicalSlugToGame[gameNameToSlug(gameName)]

const levelGroupToSlug = (groupName: string, gameName: string) => {
  const game = parseGameID(gameName)
  const levelGroupNumber = parseInt(groupName.replace(/\D/g, ""), 10)
  if (isFinite(levelGroupNumber)) {
    if (game === GAME_JUNKBOT_UNDERCOVER) {
      return `basement-${levelGroupNumber}`
    } else if (game === GAME_JUNKBOT) {
      return `building-${levelGroupNumber}`
    } else {
      return `page-${levelGroupNumber}`
    }
  } else {
    return undefined
  }
}

const storageKeys = {
  // best score (fewest moves)
  score: (levelName: string) => `snakeshift:score:${levelNameToSlug(levelName)}`,
  // a recording that can be played back (corresponding to the best score)
  solutionRecording: (levelName: string) => `snakeshift:solution-recording:${levelNameToSlug(levelName)}`,

  // level editor auto-save
  level: (levelName: string) => `snakeshift:level:${levelNameToSlug(levelName)}`,
  levelPrefix: "snakeshift:level:", // for enumeration

  // settings
  muteSoundEffects: "snakeshift:mute-sound-effects",
  muteMusic: "snakeshift:mute-music",
  volume: "snakeshift:volume",

  // dev helpers
  showDebug: "snakeshift:debug",
  comparisonVideoTime: "snakeshift:comparison-video-time",
}


const parseRoute = (hash: string) => {
  hash = hash.replace(/^#?\/?/, "").replace(/\/$/, "")
  const hashParts = hash.split("/").map(decodeURIComponent)
  hash = decodeURIComponent(hash)
  const editSynonyms = ["edit", "editor", "level-editor", "editing", "editable", "edit-mode", "ed", "e", "design", "designer"]
  const levelSelectSynonyms = ["levels", "level-select", "level-selector", "select", "select-level", "choose-level"]
  const levelGroupRegexp = /^(section|page|tab|group|area|zone)-/i
  let wantsEdit = false
  let maybeLevelSelect = hashParts.some((hashPart) => levelSelectSynonyms.includes(hashPart))
  let game
  let levelGroup
  let levelName
  for (let i = 0; i < hashParts.length; i++) {
    if (editSynonyms.includes(hashParts[i].toLowerCase()) && !wantsEdit) {
      wantsEdit = true
    } else if (hashParts[i].match(/^(levels|tests)$/i)) {
      if (hashParts[i].match(/tests/i) && hashParts[i + 1]?.match(/levels/)) {
        i += 1
      }
      if (hashParts[i + 1]?.match(levelGroupRegexp)) {
        levelGroup = hashParts[i + 1] // (we should get it on the next loop iteration anyways...)
        levelName = hashParts[i + 2]
        i += 2
      } else {
        levelName = hashParts[i + 1]
        i += 1
      }
    } else if (hashParts[i].match(levelGroupRegexp)) {
      levelGroup = hashParts[i]
      levelName = hashParts[i + 1]
      maybeLevelSelect = true
    }
  }

  for (const hashPart of hashParts) {
    if (parseGameID(hashPart)) {
      game = parseGameID(hashPart)
    }
  }
  if (hashParts[0].match(/level=Test Cases/)) {
    game = GAME_TEST_CASES
  }
  game ??= GAME_JUNKBOT

  let canonicalHash = `#${gameNameToSlug(game)}`
  let screen = SCREEN_TITLE
  const paginated = game !== GAME_USER_CREATED && game !== GAME_TEST_CASES
  if (!paginated) {
    levelGroup = undefined
  }
  let levelGroupSlug = levelGroup ? levelGroupToSlug(levelGroup, game) : undefined

  if (levelName) {
    screen = SCREEN_LEVEL
    if (game === GAME_TEST_CASES) {
      canonicalHash = `#tests/${levelNameToSlug(levelName)}`
    } else if (levelGroupSlug) {
      canonicalHash = `#${gameNameToSlug(game)}/levels/${levelGroupSlug}/${levelNameToSlug(levelName)}`
    } else {
      canonicalHash = `#${gameNameToSlug(game)}/levels/${levelNameToSlug(levelName)}`
    }
    if (wantsEdit) {
      canonicalHash += "/edit"
    }
  } else if (game === GAME_TEST_CASES) {
    screen = SCREEN_LEVEL
    canonicalHash = "#tests"
  } else if (wantsEdit) {
    screen = SCREEN_LEVEL
    canonicalHash = "#level-editor"
    game = GAME_USER_CREATED
  } else if (maybeLevelSelect) {
    screen = SCREEN_LEVEL_SELECT
    if (levelGroupSlug) {
      canonicalHash = `#${gameNameToSlug(game)}/levels/${levelGroupSlug}`
    } else if (paginated) {
      levelGroup = "1"
      levelGroupSlug = levelGroupToSlug(levelGroup, game)
      canonicalHash = `#${gameNameToSlug(game)}/levels/${levelGroupSlug}`
    } else {
      canonicalHash = `#${gameNameToSlug(game)}/levels`
    }
  }

  return {
    game,
    // levelName,
    levelSlug: levelName ? levelNameToSlug(levelName) : undefined,
    levelGroup: levelGroupSlug,
    screen,
    canonicalHash,
    wantsEdit,
  }
}

const loadFromHash = async () => {

  // Keep track of the location hash we're loading from, so that if the user navigates away, we can abort the load.
  // This is important to avoid race conditions, for robust routing.
  // To test the routing, it helps a lot to enable network throttling in the devtools. Then load screens and navigate while loading.

  // This fixes a race condition where it could hide the title screen UI,
  // and leave you with just the title screen level, navigating back to the title screen.

  // To test: Open the title screen, click Start, go back (Alt+Left),
  // then hold Alt and press Right and then Left quickly together,
  // almost as if they're one key, but in that order specifically.
  // Press Alt+Right/Left several times to make sure the title screen is always shown properly.

  // You can also try simply spamming Alt+Left/Right; note that in Chrome it aborts fetches, so it can show an error message to the user currently.
  let loadingFrom = location.hash

  const { screen, levelSlug, levelGroup, game, wantsEdit, canonicalHash } = parseRoute(location.hash)

  // console.log(`${location.hash}\nvs\n${canonicalHash}`, parseRoute(location.hash));
  if (location.hash !== canonicalHash) {
    // replaceState does not trigger hashchange.
    // but triggering hashchange would cause infinite recursion without special care.
    // and we have promises to keep! so we actually want to load this time, not in a recursion (waiting for a recursive call would be ugly, if going through the event).
    history.replaceState(null, null, canonicalHash)
    loadingFrom = canonicalHash
  }

  const toShowTestRunner = game === GAME_TEST_CASES && !levelSlug
  if (!toShowTestRunner) {
    stopTests()
  }

  if (!infoBox.hidden) {
    // don't need to show it initially or at any routes right now so this is fine
    // this prevents it from showing on the title screen, colliding
    toggleInfoBox()
  }

  if (screen === SCREEN_LEVEL || screen === SCREEN_LEVEL_SELECT) {
    // These are routes that require all resources to be loaded (i.e. anything but the title screen)

    // Only load (and derive) resources once
    allResourcesLoadedPromise ??= loadResources(allResourcePaths).then(deriveHotResources)
    hotResourcesLoadedPromise ??= allResourcesLoadedPromise
    resources = await allResourcesLoadedPromise

    if (location.hash !== loadingFrom) {
      // prevents e.g. running tests if you load #run-tests part way and navigate elsewhere
      // (test this with network throttling in the devtools)
      return
    }

    if (screen === SCREEN_LEVEL_SELECT) {
      hideTitleScreen()
      await closeNonErrorDialogs()
      showLevelSelectScreen(game, levelGroup)
      return // don't want to hide the level select screen below
    }

    // These are routes that show a level screen
    if (toShowTestRunner) {
      runTests()
      closeNonErrorDialogs()
      hideTitleScreen()
      hideLevelSelectScreen()
    } else {
      if (levelSlug && game === GAME_USER_CREATED) {
        try {
          const json = localStorage[storageKeys.level(levelSlug)]
          if (!json) {
            throw new Error("Level does not exist.")
          }
          deserializeJSON(json)
          initLevel(currentLevel)
          dragging = entities.filter((entity) => entity.grabbed)
          editorLevelState = serializeToJSON(currentLevel)
        } catch (error) {
          showErrorMessage(`Failed to load local level for editing ("${levelSlug}")`, error)
          location.hash = "#junkbot/levels"
          return
        }
      } else if (levelSlug) {
        try {
          try {
            const level = await loadLevelByName({ levelName: levelSlug, game })
            if (location.hash !== loadingFrom) {
              return
            }
            initLevel(level)
            editorLevelState = serializeToJSON(currentLevel)
          } catch (error) {
            showErrorMessage(`Failed to load level "${levelSlug}"`, error)
            location.hash = "#junkbot/levels"
            return
          }

          // For editor
          if (initializedEditorUI) {
            levelDropdown.selectedIndex = 0
            levelDropdown.value = levelSlug // names should be unique across games
            if (levelDropdown.selectedIndex <= 0) { // 0 = "Custom World", -1 = no items
              showErrorMessage(`Level "${levelSlug}" not found in dropdown.`)
            }
          }
        } catch (error) {
          showErrorMessage(`Failed to load level "${levelSlug}"`, error)
          location.hash = "#junkbot/levels"
          return
        }
      } else {
        if (!wantsEdit || game !== GAME_USER_CREATED) {
          showErrorMessage("No level specified.")
          location.hash = "#junkbot/levels"
          return
        }
        // Level editor with default level (#level-editor route)
        initLevel(resources.levelEditorDefaultLevel)
        editorLevelState = serializeToJSON(currentLevel)
      }

      // Hide other screen after loading the level so that there's not a flash of the title screen level without the title screen frame.
      paused = true
      hideTitleScreen()
      hideLevelSelectScreen()
      await closeNonErrorDialogs()

      if (wantsEdit !== editing) {
        toggleEditing()
      }

      if (editing) {
        paused = true
      } else {
        const levelLocation = whereLevelIsInTheGame(currentLevel, game)
        if (levelLocation) {
          // Show level name as a sort of toast
          const levelInfoContent = document.createElement("div")
          levelInfoContent.innerHTML = `
						<h1 class="level-info-header"><img class="level-info-building-image"><img class="level-info-building-text-image"></h1>
						<h2 class="level-info-title"></h2>
					`
          const { pageNumber, levelNumber } = levelLocation
          if (game === GAME_JUNKBOT) {
            levelInfoContent.querySelector(".level-info-building-image").src = `images/menus/building_icon_${pageNumber}.png`
            levelInfoContent.querySelector(".level-info-building-text-image").src = `images/menus/building_text_${pageNumber}.png`
          } else if (game === GAME_JUNKBOT_UNDERCOVER) {
            levelInfoContent.querySelector(".level-info-header").textContent = `Basement ${pageNumber}`
          } else if (game === GAME_TEST_CASES) {
            levelInfoContent.querySelector(".level-info-header").textContent = "Test Cases"
          } else {
            levelInfoContent.querySelector(".level-info-header").remove()
          }
          levelInfoContent.querySelector(".level-info-title").textContent = `Level ${levelNumber}: ${currentLevel.title.toLocaleUpperCase()}`

          const toast = showMessageBox([levelInfoContent], { buttons: [], className: "level-info-toast" })
          nonErrorDialogs.push(toast)
          // Don't await this delay, because we want the animation loop to start so the level gets rendered.
          setTimeout(async () => {
            await toast.close(true)
            // Unpause, unless user switched into edit mode by now
            paused = editing
          }, 2500)
        } else {
          paused = false
        }
      }
    }
  } else {
    hotResourcesLoadedPromise ??= loadResources(hotResourcePaths).then(deriveHotResources)
    resources = await hotResourcesLoadedPromise
    if (location.hash !== loadingFrom) {
      return
    }
    await closeNonErrorDialogs()
    showTitleScreen()
    hideLevelSelectScreen();

    // We loaded the title screen!
    // There's more to load, but we don't want to block showing the title screen level,
    // so kick off an asynchronous function without awaiting it.
    (async () => {
      allResourcesLoadedPromise ??= loadResources(otherResourcePaths).then((restOfResources) => {
        Object.assign(resources, restOfResources)
        return resources // needs to return all resources so that it doesn't unload them when starting the game
      })
      resources = await allResourcesLoadedPromise

      // Wait for "READY TO PLAY" text image to load before showing it to prevent flash of missing text.
      // I'm also delaying enabling the start game button because it feels weird to do those at different times.
      // I actually handle loading resources if you were to navigate to a different level while stuff is loading,
      // but I don't want to show the play button while the title screen is still loading,
      // because I want you to see the title screen level, and maybe interact with it, before starting the game.

      // Note that this strategy only works if cache is enabled; make sure "Disable cache" is unchecked in devtools.
      // Also if just this one image fails to load, I don't care, so using finally.
      loadImage("images/menus/ready_to_play.png").finally(() => {
        loadStatusLoaded.hidden = false
        loadStatusLoading.hidden = true

        startGameButton.hidden = false
        showCreditsButton.hidden = false
      })
    })()
  }
}

window.addEventListener("hashchange", loadFromHash)
