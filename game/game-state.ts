import Entity from "./entity"
import Snake from "./snake"

export const entities: Entity[] = []

export let activePlayer: Snake | undefined = undefined

export function initLevel() {
  entities.length = 0
  activePlayer = new Snake()
  entities.push(activePlayer)
  const otherSnake = new Snake()
  for (const segment of otherSnake.segments) {
    segment.y += segment.size * 2
  }
  entities.push(otherSnake)
}
