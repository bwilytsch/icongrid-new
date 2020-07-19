import Vector from "./Vector";
import Shape, { createEllipse, createRectangle } from "./Shape";
import {
  createRotationMatrix,
  degToRad,
  radToDeg,
  applyMatrix
} from "./Transform";
import { RBB } from "./AABB";
import Mouse, { getPosition } from "./Mouse";
import { isPointInsideRBB } from "./utils";
import { angleAroundCenter } from "./Math";

/**
 * Frame Independent Cursor lerp
 * https://codepen.io/schteppe/pen/ZqRNza
 */

const axes = {
  X: new Vector(1, 0),
  Y: new Vector(0, 1),
  XY: new Vector(1, 1)
};

const states = {
  DEFAULT: "DEFAULT",
  SHAPESELCETED: "SHAPESELECTED",
  SHAPEEDIT: "SHAPEEDIT"
};

// @IDEA: use middleware to transform/normalize events?
// Build Gizmo/Hanlder class to update seperately

const blockEvent = e => {
  e.stopPropagation();
  e.preventDefault();
};

class NewControls {
  constructor(ele, onStart, onMove, onEnd) {
    this.ele = ele || document.createElement("div");
    this.state = states.DEFAULT;

    // Bind callbacks
    this.bind(onStart, onMove, onEnd);

    this._pointerStart = new Vector();
    this._pointerCurrent = new Vector();
    this._delta = new Vector();

    // Bind listeners
    this.ele.addEventListener("touchstart", this.down);
    this.ele.addEventListener("mousedown", this.down);
  }
  down(e) {
    blockEvent(e);
    const [x, y] = getPosition(e);
    this._pointerStart.set(x, y);
    // Set start
    // Trigger finish event
    this.ele.addEventListener("mousemove", this.move);
    this.ele.addEventListener("touchmove", this.move);

    this.ele.addEventListener("touchend", this.up);
    this.ele.addEventListener("mouseup", this.up);
  }
  up(e) {
    blockEvent(e);
    this.ele.removeEventListener("mousemove", this.move);
    this.ele.removeEventListener("touchmove", this.move);

    this.ele.removeEventListener("touchend", this.up);
    this.ele.removeEventListener("mouseup", this.up);
  }
  move(e) {
    blockEvent(e);
    const [x, y] = getPosition(e);
    this._pointerCurrent.set(x, y);
    this._delta.set(this._pointerStart.clone().sub(this._pointerCurrent));
    // Trigger move/change event
  }
  bind(onStart, onMove, onEnd) {
    this.onStart = onStart.bind(this);
    this.onMove = onMove.bind(this);
    this.onEnd = onEnd.bind(this);
  }
}

const getCursor = (position, center) => {
  const p = position
    .clone()
    .sub(center)
    .normalize();
  const c = new Vector(1, 0);
  const dot = Vector.dotProduct(c, p);

  // @TODO: Get angle and set degrees back for custom cursor

  switch (true) {
    case Math.abs(dot) <= 0.2:
      return "ns-resize";
    case Math.abs(dot) >= 0.8:
      return "ew-resize";
    case dot <= -0.5:
      return "nwse-resize";
    case dot >= 0.5:
      return "nesw-resize";
    default:
      return "pointer";
  }
};

class ControlHandle extends Shape {
  constructor({
    axis,
    name,
    actionName,
    position,
    rotation,
    center,
    offset,
    cursorStyle,
    handler,
    type,
    width,
    height,
    connection,
    style
  }) {
    super({ name });
    this.actionName = actionName || null;
    this.position = position || new Vector();
    this.type = type || "Rectangle";
    this.width = width || 8;
    this.height = height || 8;
    this.offset = offset || new Vector(4, 4);
    this.center = center || new Vector();
    this.cursorStyle = cursorStyle || null;
    this.axis = axis || axes.XY;
    this.style = style || {};

    this.path =
      type === "Rectangle"
        ? createRectangle(
            this.position.x,
            this.position.y,
            this.width,
            this.height
          )
        : createEllipse(
            this.position.x - this.offset.x,
            this.position.y - this.offset.y,
            this.width,
            this.height
          );
    this.handler = handler || function() {};
    this.visible = true;
    this.connection = connection || null;

    const buffer = new Vector(12, 12);
    const dim = new Vector(width, height).mulScalar(0.5);

    this.aabb = new RBB({
      center: type === "Rectangle" ? center.clone() : position.clone(),
      radius: dim.add(buffer),
      rotation
    });

    const rotationMatrix = createRotationMatrix(
      degToRad(rotation.x),
      this.center
    );
    this.applyMatrix(rotationMatrix);
    this.aabb.applyMatrix(rotationMatrix);
  }
  applyMatrix(mat3) {
    this.path.forEach(point => applyMatrix(point, mat3));
  }
}

class Label extends Shape {
  constructor({ text, position, ...props }) {
    position = position || new Vector();
    const offset = new Vector(40, 8);

    super({
      path: createRectangle(
        position.x - offset.x,
        position.y - offset.y,
        80,
        24
      ),
      position,
      center: position.clone(),
      ...props
    });
    this.text = text || "";
  }
  setText(text) {
    this.text = text;
  }
}

/**
 * Actions:
 * ROTATE, TRANSLATE, SCALE
 *
 * Events:
 * ROTATE, TRANSLATE, SCALE
 */

/**
 *
 */

class Controls {
  constructor({ element, actions, events }) {
    this.ele = element || document.body;
    this.actions = actions;
    this.events = events;
    this._action = events.TRANSLATE;
    this._axis = axes.XY;
    this.children = [];
    this.center = new Vector();
    this.target = null;
    this.path = [];
    this.axis = new Vector();
    this.event = events.TRANSLATE;
    this.mouse = new Mouse(this.ele);
    this.mouse.name = "controls";

    this.active = false;

    // Transform temps
    this.scaleStart = new Vector();
    this.sizeStart = new Vector();
    this.positionStart = new Vector();
    this.rotationStart = new Vector();
    this.startPath = [];

    // Show and hide Controls
    this.visible = false;

    // Callback
    this.onBlurCallback = () => {};
    this.onFocusCallback = () => {};

    this.lastHandle = null;

    this.ele.addEventListener("mousemove", e => {
      if (!this.target) {
        return;
      }

      const pos = getPosition(e);

      // Add hit detection
      const hits = this.children.filter((handle, idx) => {
        const { aabb } = handle;

        if (!aabb || aabb.type !== "RBB") return false;

        return isPointInsideRBB(pos, aabb);
      });

      if (hits.length > 0) {
        if (this.lastHandle === hits[0]) return;

        document.body.style.cursor = hits[0].cursorStyle
          ? hits[0].cursorStyle
          : getCursor(pos, this.target.center);
        this.lastHandle = hits[0];
      }
    });

    // Bind events
    this.mouse.onMouseUp(() => {
      // Overwrite temp buffers
      this.scaleStart.copy(this.target.scale);
      this.sizeStart.set(this.target.width, this.target.height);
      this.startPath = this.target.path.map(point => point.clone());
    });

    this.mouse.onMouseDown(pos => {
      const hits = this.children.filter((handle, idx) => {
        const { aabb } = handle;

        if (!aabb || aabb.type !== "RBB") return false;

        return isPointInsideRBB(pos, aabb);
      });

      console.log("controls: ", hits);

      if (hits.length > 0) {
        this._action = hits[0].actionName;
        this._axis = hits[0].axis;
      } else {
        this.blur();
      }
    });
  }
  toggle(active) {
    if (active) {
      this.visible = true;
      this.mouse.start();
    } else {
      this.visible = false;
      this.mouse.dispose();
    }
  }
  handleMove(e) {
    // console.log("moving");
  }
  build() {
    // Add handles
  }
  setTarget(shape) {
    if (this.target && shape) {
      if (this.target === shape) {
        return;
      }
    }

    if (!shape) {
      this.toggle(false);
      this.path = [];
      this.blur();
    } else {
      this.scaleStart.copy(shape.scale);
      this.sizeStart.set(shape.width, shape.height);
      this.startPath = shape.path.map(point => point.clone());
      this.toggle(true);
      this.focus();
    }

    this.target = shape;
  }
  hasTarget() {
    return this.target !== null;
  }
  getText() {
    if (!this.target) return null;

    switch (this._action) {
      // case this.events.SCALE:
      //   return `${this.target.scale.x.toFixed(1) *
      //     100}% / ${this.target.scale.y.toFixed(1) * 100}%`;
      case this.events.ROTATE:
        return `${this.target.rotation.x.toFixed(1)}°`;
      default:
        return `${this.target.position.x.toFixed(
          1
        )} x ${this.target.position.y.toFixed(1)}`;
    }
  }
  update(shape) {
    // this.center.copy(shape.center);
    // this.path = shape.path;

    const { width, height, rotation, center } = shape;
    // Recalculate from center
    const position = center.clone().sub(new Vector(width / 2, height / 2));

    const style = { fill: null, stroke: "#FF0000" };

    this.children[6] = new Label({
      text: `${position.x} x ${position.y}`,
      style: { fill: "#FF0000", text: "#000000" }
    });

    this.children[0] = new ControlHandle({
      actionName: this.events.TRANSLATE,
      name: "CN",
      type: "Ellipse",
      position: center.clone(),
      center: center.clone(),
      scale: new Vector(1, 1),
      rotation: rotation,
      cursorStyle: "move",
      style
    });
    this.children[2] = new ControlHandle({
      actionName: this.events.SCALE,
      name: "NW",
      type: "Ellipse",
      position: position.clone(),
      center: center.clone(),
      rotation: rotation,
      style
    });
    this.children[3] = new ControlHandle({
      actionName: this.events.SCALE,
      name: "NE",
      type: "Ellipse",
      position: position.clone().add(new Vector(width, 0)),
      center: center.clone(),
      rotation: rotation,
      style
    });
    this.children[4] = new ControlHandle({
      actionName: this.events.SCALE,
      name: "SE",
      type: "Ellipse",
      position: position.clone().add(new Vector(width, height)),
      center: center.clone(),
      rotation: rotation,
      style
    });
    this.children[5] = new ControlHandle({
      actionName: this.events.SCALE,
      name: "SW",
      type: "Ellipse",
      position: position.clone().add(new Vector(0, height)),
      center: center.clone(),
      rotation: rotation,
      style
    });
    this.children[6] = new ControlHandle({
      actionName: this.events.SCALE,
      name: "SW",
      type: "Ellipse",
      position: position.clone().add(new Vector(width / 2, 0)),
      center: center.clone(),
      rotation: rotation,
      axis: axes.Y,
      style
    });
    this.children[7] = new ControlHandle({
      actionName: this.events.ROTATE,
      name: "SW",
      type: "Ellipse",
      position: position.clone().add(new Vector(width + 12, -12)),
      center: center.clone(),
      rotation: rotation,
      cursorStyle: "pointer",
      style
    });
    this.children[8] = new ControlHandle({
      actionName: this.events.ROTATE,
      name: "SW",
      type: "Ellipse",
      position: position.clone().add(new Vector(-12, -12)),
      center: center.clone(),
      rotation: rotation,
      cursorStyle: "pointer",
      style
    });
    this.children[9] = new ControlHandle({
      actionName: this.events.ROTATE,
      name: "SW",
      type: "Ellipse",
      position: position.clone().add(new Vector(width + 12, height + 12)),
      center: center.clone(),
      rotation: rotation,
      cursorStyle: "pointer",
      style
    });
    this.children[10] = new ControlHandle({
      actionName: this.events.ROTATE,
      name: "SW",
      type: "Ellipse",
      position: position.clone().add(new Vector(-12, height + 12)),
      center: center.clone(),
      rotation: rotation,
      cursorStyle: "pointer",
      style
    });
    // SCALE locked axis
    this.children[11] = new ControlHandle({
      actionName: this.events.SCALE,
      name: "SW",
      type: "Ellipse",
      position: position.clone().add(new Vector(width / 2, height)),
      center: center.clone(),
      rotation: rotation,
      axis: axes.Y,
      style
    });
    this.children[12] = new ControlHandle({
      actionName: this.events.SCALE,
      name: "SW",
      type: "Ellipse",
      position: position.clone().add(new Vector(0, height / 2)),
      center: center.clone(),
      rotation: rotation,
      axis: axes.X,
      style
    });
    this.children[13] = new ControlHandle({
      actionName: this.events.SCALE,
      name: "SW",
      type: "Ellipse",
      position: position.clone().add(new Vector(width, height / 2)),
      center: center.clone(),
      rotation: rotation,
      axis: axes.X,
      style
    });
    this.children[14] = new ControlHandle({
      actionName: this.events.TRANSLATE,
      name: "BB",
      type: "Rectangle",
      position: position.clone(),
      center: center.clone(),
      rotation: rotation,
      scale: new Vector(1, 1),
      width,
      height,
      axis: axes.X,
      style
    });

    // const text = this.getText();

    // if (!text) return;

    // this.children[15] = new Label({
    //   text,
    //   position: position.clone().add(new Vector(width / 2, height))
    // });
  }
  bindEditShape(handler) {
    let angle = 0;
    let translate = new Vector();
    let scale = new Vector(1, 1);

    this.mouse.onMouseMove(({ position, distance, start, previous }) => {
      if (!this.target || !this._action) return;
      if (this._action === this.events.ROTATE) {
        angle = angleAroundCenter(position, previous, this.target.center);
      }
      if (this._action === this.events.TRANSLATE) {
        translate.copy(distance.mul(this._axis));
      }

      // @TODO: Add Axis look for X and Y
      if (this._action === this.events.SCALE) {
        // Get Direction from dot product....
        let d =
          position
            .clone()
            .sub(this.target.center)
            .mag() /
          start
            .clone()
            .sub(this.target.center)
            .mag();

        scale.copy(this.scaleStart);

        if (this._axis.x === 1) {
          scale.mul(new Vector(d, 1));
        }

        if (this._axis.y === 1) {
          scale.mul(new Vector(1, d));
        }
      }
      if (!angle) {
        // Reset if NaN
        angle = 0;
      }
      const mat3 = this.actions[this._action](
        this.target,
        distance,
        angle,
        scale
      );

      const newSize = this.sizeStart.clone().mul(scale);
      const newRotation = this.target.rotation.set(
        (this.target.rotation.x + radToDeg(angle)) % 360,
        0
      );
      const newPosition = this.target.center.sub(
        newSize.clone().mulScalar(0.5)
      );

      // calc new position and center to avid bugs

      // @NOTE: Removed scale,update
      handler(this.target._id, {
        path: [...this.startPath].map(point =>
          applyMatrix(
            this._action === this.events.SCALE ? point.clone() : point,
            mat3
          )
        ),
        width: newSize.x,
        height: newSize.y,
        position: newPosition,
        // children: this.target.children.map(child => child.path.map(point => applyMatrix(point, mat3))),
        rotation: newRotation
      });
      // Reset values
      scale.set(1, 1);
      translate.set(0, 0);
      angle = 0;
    });
  }
  setActive(bool) {
    this.active = bool;
  }
  focus() {
    if (this.active) return;
    console.log("focus");
    this.toggle(true);
    this.onFocusCallback();
    this.setActive(true);
  }
  onFocus(handler) {
    this.onFocusCallback = handler;
  }
  blur() {
    if (!this.active) return;
    console.log("blur");
    // Reset
    this._action = null;
    this.setActive(false);
    this.onBlurCallback();
  }
  onBlur(handler) {
    this.onBlurCallback = handler;
  }
  applyMatrix(mat3) {
    this.controlHandles.forEach(ch => {
      ch.applyMatrix(mat3);
    });
  }
}

export default Controls;
export { ControlHandle, Label, NewControls };
