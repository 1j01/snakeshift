import Entity from "./entity"
import { levelInfo } from "./game-state"

export class Ripple {
  x: number
  y: number
  radius = 0
  speed = 1
  life = 1
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
  update(deltaTime: number, entities: Entity[]) {
    this.radius += this.speed * deltaTime / 1000
    this.life -= deltaTime / 1000
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255, 255, 255, ${this.life})`
    ctx.lineWidth = 0.1 * this.life
    ctx.stroke()
    ctx.restore()
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

