import Entity from "./entity"
import { levelInfo } from "./game-state"
import { hitTestAllEntities } from "./helpers"
import { Point } from "./types"


export class Ripple {
  positions: Point[] = []
  velocities: Point[] = []
  radius = 0
  speed = 1
  life = 2
  constructor(x: number, y: number) {
    const numPoints = 100
    for (let i = 0; i < numPoints; i++) {
      this.positions.push({ x, y })
      this.velocities.push({ x: Math.sin(i / numPoints * Math.PI * 2), y: Math.cos(i / numPoints * Math.PI * 2) })
    }
  }
  update(deltaTime: number, entities: Entity[]) {
    // this.radius += this.speed * deltaTime / 1000
    this.life -= deltaTime / 1000
    for (let i = 0; i < this.positions.length; i++) {
      let dx = this.velocities[i].x * this.speed * deltaTime / 1000
      let dy = this.velocities[i].y * this.speed * deltaTime / 1000
      this.positions[i].x += dx
      this.positions[i].y += dy
      const hitEntity = hitTestAllEntities(this.positions[i].x, this.positions[i].y).find((hit) => hit.entity.solid)?.entity
      if (hitEntity) {
        // const hitTile = { x: Math.floor(this.positions[i].x), y: Math.floor(this.positions[i].y) }
        // const fromTile = { x: Math.floor(this.positions[i].x - dx), y: Math.floor(this.positions[i].y - dy) }
        // // nudge position back onto the original tile, then update velocity based on the change
        // const boundaryX = this.velocities[i].x > 0 ? fromTile.x + 1 : fromTile.x
        // const boundaryY = this.velocities[i].y > 0 ? fromTile.y + 1 : fromTile.y
        // const nudgeX = boundaryX - this.positions[i].x
        // const nudgeY = boundaryY - this.positions[i].y
        // this.positions[i].x += nudgeX
        // this.positions[i].y += nudgeY
        // // this.velocities[i].x += nudgeX
        // // this.velocities[i].y += nudgeY
        // if (Math.abs(nudgeX) > Math.abs(nudgeY)) {
        //   this.velocities[i].x *= -1 // Hit vertical boundary
        // } else {
        //   this.velocities[i].y *= -1 // Hit horizontal boundary
        // }

        const normal = getSurfaceNormal(hitEntity, this.positions[i]) // Get normal at collision
        const velocity = this.velocities[i]

        // Reflect velocity using the formula: V' = V - 2 (V ⋅ N) N
        const dotProduct = velocity.x * normal.x + velocity.y * normal.y
        this.velocities[i] = {
          x: velocity.x - 2 * dotProduct * normal.x,
          y: velocity.y - 2 * dotProduct * normal.y
        }

        // Move the point slightly away from the surface to avoid sticking
        this.positions[i].x += this.velocities[i].x * 0.1
        this.positions[i].y += this.velocities[i].y * 0.1

      }
    }
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.beginPath()
    // ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < this.positions.length; i++) {
      const position = this.positions[i]
      ctx.lineTo(position.x, position.y)
    }
    ctx.closePath()
    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, this.life)})`
    ctx.lineWidth = 0.1 * Math.min(1, this.life)
    ctx.stroke()
    ctx.restore()
  }
}
function getSurfaceNormal(entity: Entity, point: Point): Point {
  // Insane ChatGPT-generated code
  const left = entity.x
  const right = entity.x + entity.width
  const top = entity.y
  const bottom = entity.y + entity.height

  const distLeft = Math.abs(point.x - left)
  const distRight = Math.abs(point.x - right)
  const distTop = Math.abs(point.y - top)
  const distBottom = Math.abs(point.y - bottom)

  // Find the closest surface
  const minDist = Math.min(distLeft, distRight, distTop, distBottom)

  if (minDist === distLeft) {
    return { x: -1, y: 0 } // Left wall
  } else if (minDist === distRight) {
    return { x: 1, y: 0 } // Right wall
  } else if (minDist === distTop) {
    return { x: 0, y: -1 } // Top wall
  } else {
    return { x: 0, y: 1 } // Bottom wall
  }
}

const ripples: Ripple[] = []
let lastTime = 0

export function drawEffects(ctx: CanvasRenderingContext2D, entities: Entity[]) {
  const currentTime = performance.now()
  for (const ripple of ripples) {
    ripple.update(currentTime - lastTime, entities)
    ripple.draw(ctx)
  }
  if (Math.random() < 0.1) {
    ripples.push(new Ripple(Math.random() * levelInfo.width, Math.random() * levelInfo.height))
  }
  for (let i = ripples.length - 1; i >= 0; i--) {
    if (ripples[i].life <= 0) {
      ripples.splice(i, 1)
    }
  }
  lastTime = currentTime
}

