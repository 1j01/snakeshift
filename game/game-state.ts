import { Block } from "./block"
import Entity from "./entity"
import Snake from "./snake"

export const entities: Entity[] = []

export let activePlayer: Snake | undefined = undefined

export function initLevel() {
  entities.length = 0
  const size = 10
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      entities.push(new Block(x * size, y * size, size, (x + y) % 2 === 0 ? 1 : 2))
    }
  }
  activePlayer = new Snake()
  entities.push(activePlayer)
  const otherSnake = new Snake()
  for (const segment of otherSnake.segments) {
    segment.y += segment.size * 2
  }
  entities.push(otherSnake)
}
