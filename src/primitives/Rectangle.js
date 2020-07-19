import Vector from "../core/Vector";
import Shape, { createRectangle } from "../Shape";

class Rectangle extends Shape {
  constructor(x, y, w, h) {
    const hh = h / 2;
    const hw = w / 2;

    super({
      name: "Rectangle",
      type: "Rectangle",
      width: w,
      height: h,
      position: new Vector(x, y),
      center: new Vector(x + hw, y + hh),
      path: createRectangle(x, y, w, h),
      scale: new Vector(1, 1),
      rotation: new Vector(),
      style: {
        stroke: "#FF0000",
        fill: null
      }
    });
  }
  // update(x, y, w, h) {
  //   const hh = h / 2;
  //   const hw = w / 2;

  //   this.width = w;
  //   this.height = h;
  //   this.position.set(x, y);
  //   this.center.set(x + hw, y + hh);
  //   this.path = createRectangle(x, y, w, h);
  //   this.aabb.set(this.path);
  // }
}

export default Rectangle;
