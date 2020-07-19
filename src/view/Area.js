import Drag from "./Drag";
import Emitter from "../Emitter";
import { events } from "../EditorEvents";
// import { isPointInsideAABB, isAABBInsideAABB } from "../utils";
import { Rectangle } from "../primitives";
import Vector from "../core/Vector";
import { updateShape } from "../Shape";
import Object2D from "../core/Object2D";

const getClientRect = (p0, p1) => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const parse = point => {
    if (point.x < minX) {
      minX = point.x;
    }

    if (point.x > maxX) {
      maxX = point.x;
    }

    if (point.y < minY) {
      minY = point.y;
    }

    if (point.y > maxY) {
      maxY = point.y;
    }
  };

  parse(p0);
  parse(p1);

  return [minX, minY, maxX - minX, maxY - minY];
};

export class Plugins {
  constructor() {
    // Collection of controls
    this._enabled = false;
    this._collection = [];
  }
  add(plugin) {
    if (this._collection.filter(item => plugin === item).length > 0) return;

    this._collection.push(plugin);

    // Activate
    if (!this._enabled) {
      this._enabled = true;
    }
  }
  remove(plugin) {
    this._collection = this.filter(con => con !== plugin);

    if (this._collection.getLength() === 0) {
      this._enabled = false;
    }
  }
  forEach(fn, params) {
    return this._collection.reduce((res, plugin) => {
      if (!plugin.enabled) {
        return false;
      }

      return plugin[fn](params) !== false && res;
    }, this._enabled);
  }
  first() {
    return this._collection[0];
  }
  getLength() {
    return this._collection.length;
  }
  last() {
    return this._collection[this.getLength() - 1];
  }
  clear() {
    this._collection = [];
  }
}

// Facade
// class Rectangle extends Shape {
//   constructor(x, y, w, h) {
//     const hh = h / 2;
//     const hw = w / 2;

//     super({
//       name: "Rectangle",
//       type: "Rectangle",
//       width: w,
//       height: h,
//       position: new Vector(x, y),
//       center: new Vector(x + hw, y + hh),
//       path: createRectangle(x, y, w, h),
//       scale: new Vector(1, 1),
//       rotation: new Vector(),
//       style: {
//         stroke: "#44B0FF",
//         fill: "rgba(68, 176, 255, 0.32)"
//       }
//     });
//   }
//   update(x, y, w, h) {
//     const hh = h / 2;
//     const hw = w / 2;

//     this.width = w;
//     this.height = h;
//     this.position.set(x, y);
//     this.center.set(x + hw, y + hh);
//     this.path = createRectangle(x, y, w, h);
//     this.aabb.set(this.path);
//   }
// }

// Track all user interaction e.g mouse, touch etc.
class Area extends Emitter {
  constructor(domElement, emitter) {
    super(emitter);
    this.ele = domElement;
    this.name = "Artboard";
    this.parent = null;
    this._plugins = new Plugins();
    this.enabled = true;

    this.onStart = this.onStart.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onEnd = this.onEnd.bind(this);

    // Placeholder
    const w = 0;
    const h = 0;
    const x = 0;
    const y = 0;

    this.pointerselection = new Rectangle(x, y, w, h);

    // Overwrite styles
    this.pointerselection.style = {
      stroke: "#44B0FF",
      fill: "rgba(68, 176, 255, 0.32)"
    };

    this.view = new Object2D();
    this.view.add(this.pointerselection);

    this._drag = new Drag(this.ele, this.onStart, this.onMove, this.onEnd);
  }
  getParent() {
    return this.parent ? this.parent : this;
  }
  onStart({ pos }) {
    // console.log("area: start");

    if (!this.enabled) return;

    // If selection has been made look in other intputs first
    if (this._plugins.forEach("onStart", { pos })) return;

    // console.log("area:onstart");

    if (
      !this.trigger(events.SHAPESELECT, {
        selection: pos.clone(),
        initial: true
      })
    )
      return;

    // Updated Controls
    this.pointerselection.visible = true;
    updateShape(this.pointerselection, { position: pos, width: 0, height: 0 });
    // this.pointerselection.update(pos.x, pos.y, 0, 0);
  }
  onMove({ pos, start }) {
    if (this._plugins.forEach("onMove", { start, pos })) return;

    // console.log("area:onmove");

    if (
      !this.trigger(events.SHAPESELECT, {
        selection: this.pointerselection.aabb
      })
    )
      return;

    // Updated Controls
    const [x, y, w, h] = getClientRect(pos, start);
    // this.pointerselection.update(x, y, w, h);

    updateShape(this.pointerselection, {
      position: new Vector(x, y),
      width: w,
      height: h
    });
  }
  onEnd({ pos }) {
    // Trigger events
    if (this._plugins.forEach("onEnd", { pos })) return;

    if (
      !this.trigger(events.SHAPESELECT, {
        selection: this.pointerselection.aabb,
        finished: true
      })
    )
      return;

    // Hide Pointer Selection
    this.pointerselection.visible = false;

    // Trigger final shape selection
    this.trigger(events.SHAPESELECTED);
  }
  use(plugin) {
    this._plugins.add(plugin);
    plugin.parent = this;
  }
  enable() {
    this._drag.enable();
  }
  disable() {
    this._drag.disable();
  }
}

export default Area;
