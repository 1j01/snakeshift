
const routingTests = [
  {
    hash: "#junkbot2/levels/basement-1/descent",
    expected: {
      game: GAME_JUNKBOT_UNDERCOVER,
      levelSlug: "descent",
      levelGroup: "basement-1",
      screen: SCREEN_LEVEL,
      canonicalHash: "#junkbot2/levels/basement-1/descent",
      wantsEdit: false,
    },
  },
  {
    hash: "#junkbot2/levels/basement-1/descent/edit-mode",
    expected: {
      game: GAME_JUNKBOT_UNDERCOVER,
      levelSlug: "descent",
      levelGroup: "basement-1",
      screen: SCREEN_LEVEL,
      canonicalHash: "#junkbot2/levels/basement-1/descent/edit",
      wantsEdit: true,
    },
  },
  {
    hash: "#junkbot/levels",
    expected: {
      game: GAME_JUNKBOT,
      levelSlug: undefined,
      // levelGroup: "building-1", // @TODO
      screen: SCREEN_LEVEL_SELECT,
      // canonicalHash: "#junkbot/levels/building-1", // @TODO
      wantsEdit: false,
    },
  },
  {
    hash: "#junkbot/building-1",
    expected: {
      game: GAME_JUNKBOT,
      levelSlug: undefined,
      levelGroup: "building-1",
      screen: SCREEN_LEVEL_SELECT,
      canonicalHash: "#junkbot/levels/building-1",
      wantsEdit: false,
    },
  },
  {
    hash: "#junkbot2/levels/basement-2",
    expected: {
      game: GAME_JUNKBOT_UNDERCOVER,
      levelSlug: undefined,
      levelGroup: "basement-2",
      screen: SCREEN_LEVEL_SELECT,
      canonicalHash: "#junkbot2/levels/basement-2",
      wantsEdit: false,
    },
  },
  {
    hash: "#junkbot2/levels",
    expected: {
      game: GAME_JUNKBOT_UNDERCOVER,
      levelSlug: undefined,
      levelGroup: "basement-1",
      screen: SCREEN_LEVEL_SELECT,
      canonicalHash: "#junkbot2/levels/basement-1",
      wantsEdit: false,
    },
  },
  {
    hash: "#level-editor",
    expected: {
      game: GAME_USER_CREATED,
      levelSlug: undefined,
      levelGroup: undefined,
      screen: SCREEN_LEVEL,
      canonicalHash: "#level-editor",
      wantsEdit: true,
    },
  },
  {
    hash: "#",
    expected: {
      game: GAME_JUNKBOT,
      levelSlug: undefined,
      levelGroup: undefined,
      screen: SCREEN_TITLE,
      canonicalHash: "#junkbot",
      wantsEdit: false,
    },
  },
  {
    hash: "#junkbot",
    expected: {
      game: GAME_JUNKBOT,
      levelSlug: undefined,
      levelGroup: undefined,
      screen: SCREEN_TITLE,
      canonicalHash: "#junkbot",
      wantsEdit: false,
    },
  },
  {
    hash: "#JUNKBOT2",
    expected: {
      game: GAME_JUNKBOT_UNDERCOVER,
      levelSlug: undefined,
      levelGroup: undefined,
      screen: SCREEN_TITLE,
      canonicalHash: "#junkbot2",
      wantsEdit: false,
    },
  },
  {
    hash: "#junkbot-undercover",
    expected: {
      game: GAME_JUNKBOT_UNDERCOVER,
      levelSlug: undefined,
      levelGroup: undefined,
      screen: SCREEN_TITLE,
      canonicalHash: "#junkbot2",
      wantsEdit: false,
    },
  },
  {
    hash: "#junkbot-uc",
    expected: {
      game: GAME_JUNKBOT_UNDERCOVER,
      levelSlug: undefined,
      levelGroup: undefined,
      screen: SCREEN_TITLE,
      canonicalHash: "#junkbot2",
      wantsEdit: false,
    },
  },
  {
    hash: "#junkbot-1",
    expected: {
      game: GAME_JUNKBOT,
      levelSlug: undefined,
      levelGroup: undefined,
      screen: SCREEN_TITLE,
      canonicalHash: "#junkbot",
      wantsEdit: false,
    },
  },
  {
    hash: "#junkbot-2",
    expected: {
      game: GAME_JUNKBOT_UNDERCOVER,
      levelSlug: undefined,
      levelGroup: undefined,
      screen: SCREEN_TITLE,
      canonicalHash: "#junkbot2",
      wantsEdit: false,
    },
  },
  {
    hash: "#tests/tippy-toast",
    expected: {
      game: GAME_TEST_CASES,
      levelSlug: "tippy-toast",
      levelGroup: undefined,
      screen: SCREEN_LEVEL,
      canonicalHash: "#tests/tippy-toast",
      wantsEdit: false,
    },
  },
  {
    hash: "#tests/levels/armor-farmer",
    expected: {
      game: GAME_TEST_CASES,
      levelSlug: "armor-farmer",
      levelGroup: undefined,
      screen: SCREEN_LEVEL,
      canonicalHash: "#tests/armor-farmer",
      wantsEdit: false,
    },
  },
  {
    hash: "#tests/armor-farmer/edit",
    expected: {
      game: GAME_TEST_CASES,
      levelSlug: "armor-farmer",
      levelGroup: undefined,
      screen: SCREEN_LEVEL,
      canonicalHash: "#tests/armor-farmer/edit",
      wantsEdit: true,
    },
  },
  {
    hash: "#tests/levels/armor-farmer/edit",
    expected: {
      game: GAME_TEST_CASES,
      levelSlug: "armor-farmer",
      levelGroup: undefined,
      screen: SCREEN_LEVEL,
      canonicalHash: "#tests/armor-farmer/edit",
      wantsEdit: true,
    },
  },
  // @TODO maybe
  // {
  // 	hash: "#descent",
  // 	expected: {
  // 		game: GAME_JUNKBOT_UNDERCOVER,
  // 		levelSlug: "descent",
  // 		levelGroup: undefined,
  // 		screen: SCREEN_TITLE,
  // 		canonicalHash: "#junkbot2/levels/basement-1/descent",
  // 		wantsEdit: false,
  // 	},
  // },
  {
    hash: "#local/levels/custom-level",
    expected: {
      game: GAME_USER_CREATED,
      levelSlug: "custom-level",
      levelGroup: undefined,
      screen: SCREEN_LEVEL,
      // canonicalHash: "#my-computer-NOT_A_SHARABLE_LINK/levels/custom-level", // @TODO maybe rename to clarify these URLs aren't sharable
      canonicalHash: "#local/levels/custom-level",
      wantsEdit: false,
    },
  },
  {
    hash: "#local/levels/custom-level/edit",
    expected: {
      game: GAME_USER_CREATED,
      levelSlug: "custom-level",
      levelGroup: undefined,
      screen: SCREEN_LEVEL,
      canonicalHash: "#local/levels/custom-level/edit",
      wantsEdit: true,
    },
  },
  {
    hash: "#local/levels/page-1/art-in-the-lobby-1",
    expected: {
      game: GAME_USER_CREATED,
      levelSlug: "art-in-the-lobby-1",
      levelGroup: undefined, // ignore/strip "page-1" since it's an un-paginated listing
      screen: SCREEN_LEVEL,
      canonicalHash: "#local/levels/art-in-the-lobby-1",
      wantsEdit: false,
    },
  },
  {
    hash: "#local/levels/",
    expected: {
      game: GAME_USER_CREATED,
      levelSlug: undefined,
      levelGroup: undefined,
      screen: SCREEN_LEVEL_SELECT,
      canonicalHash: "#local/levels",
      wantsEdit: false,
    },
  },
  // edge case: if you name a level "edit", "/edit" should be treated as the level name, not the edit mode
  {
    hash: "#local/levels/edit",
    expected: {
      game: GAME_USER_CREATED,
      levelSlug: "edit",
      levelGroup: undefined,
      screen: SCREEN_LEVEL,
      canonicalHash: "#local/levels/edit",
      wantsEdit: false,
    },
  },
  // hypothetical edge case: if there were a built-in level called "edit"
  {
    hash: "#junkbot2/levels/basement-1/edit",
    expected: {
      game: GAME_JUNKBOT_UNDERCOVER,
      levelSlug: "edit",
      levelGroup: "basement-1",
      screen: SCREEN_LEVEL,
      canonicalHash: "#junkbot2/levels/basement-1/edit",
      wantsEdit: false,
    },
  },
]

const testRouting = () => {
  for (const { hash, expected } of routingTests) {
    // const { game, levelName, levelSection, screen, canonicalHash, wantsEdit } = parseHash(hash);
    const actual = parseRoute(hash);
    const mismatched = Object.keys(expected).filter((key) => actual[key] !== expected[key]);
    if (mismatched.length) {
      // eslint-disable-next-line no-console
      console.warn(`Routing test failed for hash ${hash}\n`, ...mismatched.map((key) => `"${key}": expected ${JSON.stringify(expected[key])} but got ${JSON.stringify(actual[key])}\n`));
    }
  }
};

const testIDs = () => {
  for (const [gameSlug, gameID] of Object.entries(canonicalSlugToGame)) {
    // eslint-disable-next-line no-console
    console.assert(parseGameID(gameSlug) === gameID, `parseGameID("${gameSlug}") should be "${gameID}"`);
    // eslint-disable-next-line no-console
    console.assert(parseGameID(gameID) === gameID, `parseGameID("${gameID}") should be "${gameID}"`);
    // eslint-disable-next-line no-console
    console.assert(gameNameToSlug(gameSlug) === gameSlug, `gameNameToSlug("${gameSlug}") should be "${gameSlug}"`);
  }
};
