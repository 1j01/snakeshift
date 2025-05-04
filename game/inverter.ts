import { Collectable } from "./collectable"

const yinYangTexture = document.createElement('img')
export const yinYangTextureLoaded = new Promise(resolve => yinYangTexture.onload = resolve)
yinYangTexture.src = 'graphics/yin-yang.svg'
// yinYangTexture.src = 'graphics/brick-2.svg'
yinYangTexture.width = 128
yinYangTexture.height = 128

// Simplest way to ensure the texture is loaded before drawing it
// TODO: integrate with resource loading used for audio
// await yinYangTextureLoaded
// Second-simplest way is to export the promise and await it in main.ts (avoids top-level await)

let yinYangPattern: CanvasPattern | null = null

export class Inverter extends Collectable {
  static readonly VISUAL_SIZE = 0.8

  solid = false

  _time = 0

  toJSON(): object {
    const obj = { ...this } as Partial<this>
    delete obj._time
    delete obj.solid
    return obj
  }

  step(time: number): void { // weird that this isn't a delta
    this._time = time
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.scale(this.width, this.height)
    ctx.translate(1 / 2, 1 / 2)
    ctx.rotate(-(this._time / 1000 + this.x / 10 + this.y / 10) * Math.PI / 12)

    // drawImage is REALLY slow, so we use a pattern instead
    // ctx.drawImage(yinYangTexture, this.x, this.y, this.width + pixel, this.height + pixel)
    if (!yinYangPattern) {
      yinYangPattern = ctx.createPattern(yinYangTexture, 'repeat')
      const yinYangTextureCanvas = document.createElement('canvas')
      yinYangTextureCanvas.width = yinYangTexture.width
      yinYangTextureCanvas.height = yinYangTexture.height
      const yinYangTextureCtx = yinYangTextureCanvas.getContext('2d')!
      yinYangTextureCtx.drawImage(yinYangTexture, 0, 0, yinYangTexture.width, yinYangTexture.height)
      yinYangPattern = ctx.createPattern(yinYangTextureCanvas, 'repeat')
    }
    if (yinYangPattern) {
      yinYangPattern.setTransform(new DOMMatrix()
        .translate(-1 / 2, -1 / 2)
        .scale(1 / yinYangTexture.width, 1 / yinYangTexture.height)
      )
      ctx.fillStyle = yinYangPattern
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height)
    }

    ctx.restore()
  }
}
