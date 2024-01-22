import Entity from "./entity"
import { CollisionLayer, Hit } from "./types"

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

  at(x: number, y: number): Hit | null {
    if (x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height) {
      return { entity: this, layer: this.layer }
    }
    return null
  }

  // used as-is by Block, but defined here as a placeholder for new entities as well
  draw(ctx: CanvasRenderingContext2D) {
    // "lighter" blend mode can avoid seams between adjacent white blocks.
    // There is no equivalent for the color black, as this works only by using additive blending instead of alpha blending,
    // and black is zero, so adding it doesn't change anything.
    // This blend mode can be used to blend arbitrary colors seamlessly, but not if they overlap.
    // https://stackoverflow.com/a/53292886/2624876

    // A more general approach is to extend the coordinates.

    // (A stroke works similarly, but is imperfect, as it has its own anti-aliasing.
    // If you use the fill tool in an image editor, you can see that it leaves a slightly different color at the edges.)

    // Offsetting by a single pixel is almost perfect. The change in geometry is usually not noticeable.
    // However there's a case where there's still a seam: if two blocks overlap, one white, one black,
    // sharing one or more edges, those edges will be offset (or not), in this scheme, the same way as each other,
    // rather than one extending to cover the other.

    const pixel = 1 / ctx.getTransform().a
    ctx.fillStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.fillRect(this.x, this.y, this.width + pixel, this.height + pixel)
  }
}
