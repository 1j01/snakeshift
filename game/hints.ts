export const hintsByLevelName: Record<string, string[] | undefined> = {
  "Bridge": [
    "Black snakes can go on white, and white snakes can go on black.",
    "Grow the black snake first by collecting the black star.",
    "Make a straight line across for the white snake to cross",
    "Make the bridge in the middle, where it's narrower.",
  ],
  "Ferry": [
    "Consider divisibility.",
    "The black snake is 6-long, and so it can fit on two 3-long snakes.",
    "While both 3-long snakes are under the 6-long snake, they can't move, but the 2-long snake can.",
    // "Arrange the snakes in a row so that the shortest snake can move from one end to the other, creating a passage in spacetime.",
    "Arrange the snakes in a row so that the shortest snake can move from the left to the right while the black snake is in the middle.",
  ],
  "Yin and Yang: Give and Take": [
    "Make a bridge for each color.",
    // "The bridges must make room for the snake to exit (or the first must)",
    "The first bridge must make room for the snake to exit.",
    "One way to make the bridges is a 2x2 square.",
  ],
  "Fill The Box": [
    "Avoid creating 1-wide gaps. If there are two of these, it's impossible to fill both.",
    "The initial moves of each snake can make it easier.",
    "Construct a Hamiltonian path on a grid graph.",
  ],
  "North Star": [
    "Free the white snake heads so they can form a bridge.",
    "Free the middle white snake head last to let the black snake head get to all of them.",
  ],
  "Corkscrew": [
    "Grow the white snake and then cover the black food.",
    "Let the black snake eat all but one of the covered stars.",
    "The remaining star should be on the side, not the middle, so it can be eaten while crossing to the top.",
  ],
  "The Three Pagodas": [
    "Alternate bridging?",
    "The black snake (black chicken in the myth) can turn around when growing from one to two segments",
    "The longer white snake can provide a pathway with an exit for the black snake",
    "Get the white food last",
  ],
  "Lock Picking": [
    "Slide the pins (horizontal white snakes) into the compartment on the right.",
    "The black snake must be facing the right way when bridging the pins",
    "If you do the middle pin first, the top or bottom one can't fit.",
    "The last pin doesn't need to fit in the compartment on the right.",
  ],
  "Yin and Yang: Challenge": [
    "While symmetrical, there is an imbalance.",
    "The black snake has plenty of room to get out of the way if you grow it first.",
    "Bridge the black food, then grow the black snake, then move the black snake around the rim to get it off of the white snake. Finally, bridge the white food and collect all of it.",
    "Avoid creating 1-wide gaps (dead ends) in which food needs to be collected. If you create multiple of these it can become impossible.",
    "You can simplify collecting the white food by removing white boundaries with the black snake, making the area box like or easier to navigate.",
  ],
  "Security by Obscurity": [
    "Don't be fooled by similarity to the prior level.", // too aggressive/negative?
    "Think outside the box!", // vague but accurate...!
  ],
  "Greedy Eyes": [
    "The snakes are greedy, but don't let them eat without setting up for the other snake to move.",
    // Or: Each move should set up for the other snake to move.
    // Or: Don't move without assisting the other snake.
    // Or: Always keep in mind the mobility of the other snake... as you move...
    // Or: Always be setting up the other snake to be able to move. Especially before eating. Don't get greedy!
    "Try to free the snake from the upper left fairly early on.",
    "If a snake is too long to get around, maybe have it eat later.",
    // "...Or make sure there are multiple snakes around to help."? TODO: have to play it and think about what's necessary more...
    // Or: Consider the order you want snakes to grow in.
    // Or: maybe keep one snake short until the end (3-long?) as it may not fit as well if it's longer, but it doesn't matter if it's the last to eat.
    "Explore! Don't be afraid to backtrack.",
    // Or: "I've never solved this the same way twice."
  ],
  "The Finish Line": [
    "Try to get snakes outside the checker pattern.",
    "Explore! Don't be afraid to backtrack.",
    // Or: "I've never solved this the same way twice."
  ],
}

// Make sure all of the above level names are on the level select screen
const realLevelNames = [...document.querySelectorAll("#level-select .level-button")].map((el) => el.textContent!.trim())
for (const levelName in hintsByLevelName) {
  if (!realLevelNames.includes(levelName)) {
    console.warn(`Level name "${levelName}" not found on level select screen.`)
  }
}
