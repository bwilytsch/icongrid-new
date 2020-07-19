import Vector from "./Vector";
import { applyMatrix } from "./Transform";

export class RBB {
  constructor({ center, radius, rotation }) {
    this.type = "RBB";
    this.radius = radius || new Vector(1, 1);
    this.center = center || new Vector();
    this.rotation = rotation || new Vector();
  }
  set(shape) {}
  applyMatrix(mat) {
    this.center = applyMatrix(this.center.clone(), mat);
    return this;
  }
}

class AABB {
  constructor({ min, max, node } = {}) {
    this.min = min || new Vector();
    this.max = max || new Vector();
    this.node = node || null;

    if (!this.min || !this.max) {
      this.reset();
    }
  }
  reset() {
    this.min.set(Infinity, Infinity);
    this.max.set(-Infinity, -Infinity);
  }
  set(path) {
    this.reset();
    path.forEach(point => {
      // const { startPoint: point } = bezier;

      if (point.x < this.min.x) {
        this.min.x = point.x;
      }

      if (point.x > this.max.x) {
        this.max.x = point.x;
      }

      if (point.y < this.min.y) {
        this.min.y = point.y;
      }

      if (point.y > this.max.y) {
        this.max.y = point.y;
      }
    });

    return this;
  }
  copy(aabb) {
    return new AABB({ ...aabb });
  }
  union(aabb) {
    let minX, minY, maxX, maxY;

    minX = aabb.min.x < this.min.x ? aabb.min.x : this.min.x;
    minY = aabb.min.y < this.min.y ? aabb.min.y : this.min.y;
    maxX = aabb.max.x > this.max.x ? aabb.max.x : this.max.x;
    maxY = aabb.max.y > this.max.y ? aabb.max.y : this.max.y;

    return new AABB({
      min: new Vector(minX, minY),
      max: new Vector(maxX, maxY),
      node: null
    });
  }
  applyMatrix(mat) {
    this.min = applyMatrix(this.min.clone(), mat);
    this.max = applyMatrix(this.max.clone(), mat);

    return this;
  }
}

export default AABB;
