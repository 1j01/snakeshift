import Entity from "./entity"
import { CollisionLayer } from "./types"

export class RectangularEntity extends Entity {
  constructor(
    public x = 0,
    public y = 0,
    public width = 1,
    public height = 1,
    public layer = CollisionLayer.White,
  ) {
    super()
  }

  at(x: number, y: number): CollisionLayer {
    if (x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height) {
      return this.layer
    }
    return CollisionLayer.None
  }

  // used as-is by Block, but defined here as a placeholder for new entities as well
  draw(ctx: CanvasRenderingContext2D) {
    // "lighter" avoids seams between adjacent blocks
    // There is no equivalent for the color black, as this works only by using additive blending instead of alpha blending,
    // and black is zero, so adding it doesn't change anything.
    // This blend mode can be used to blend arbitrary colors seamlessly, but not if they overlap.
    // https://stackoverflow.com/a/53292886/2624876
    ctx.globalCompositeOperation = this.layer === CollisionLayer.White ? 'lighter' : 'source-over'
    ctx.fillStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.fillRect(this.x, this.y, this.width, this.height)
    ctx.globalCompositeOperation = 'source-over'
  }
}
