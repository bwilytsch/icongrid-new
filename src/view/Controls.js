import Vector from "../core/Vector";
import Object2D from "../core/Object2D";
import Emitter from "../Emitter";
import { events } from "../EditorEvents";
import { Rectangle } from "../primitives";

import { isPointInsideAABB } from "../utils";
import { updateShape } from "../Shape";

const blockEvent = e => {
  e.stopPropagation();
  e.preventDefault();
};

const _tmpPosition = new Vector();

export const getPosition = e => {
  blockEvent(e);

  let x = 0;
  let y = 0;

  if (e.touches && e.touches.length > 0) {
    x = e.touches[0].pageX;
    y = e.touches[0].pageY;
  } else {
    x = e.pageX;
    y = e.pageY;
  }

  return _tmpPosition.set(x - e.target.offsetLeft, y - e.target.offsetTop);
};

const modes = {
  TRANSLATE: "TRANSLATE",
  ROTATE: "ROTATE",
  SCALE: "SCALE"
};

const SIZE = 24;
const hSIZE = SIZE / 2;

// Use normalized system
const initControls = [
  {
    name: "nw",
    action: modes.SCALE,
    cursorStyle: "nw-resize",
    offset: new Vector(0, 0),
    axis: new Vector(1, 1),
    style: {
      fill: null,
      stroke: "#FF0000"
    }
  },
  {
    name: "ne",
    action: modes.SCALE,
    cursorStyle: "ne-resize",
    offset: new Vector(1, 0),
    axis: new Vector(1, 1)
  },
  {
    name: "se",
    action: modes.SCALE,
    cursorStyle: "se-resize",
    offset: new Vector(1, 1),
    axis: new Vector(1, 1)
  },
  {
    name: "sw",
    action: modes.SCALE,
    cursorStyle: "sw-resize",
    offset: new Vector(0, 1),
    axis: new Vector(1, 1)
  },
  {
    name: "center",
    action: modes.TRANSLATE,
    cursorStyle: "move",
    offset: new Vector(0.5, 0.5),
    axis: new Vector(1, 1)
  },
  {
    name: "w",
    action: modes.TRANSLATE,
    cursorStyle: "ew-resize",
    offset: new Vector(0, 0.5),
    axis: new Vector(1, 0)
  },
  {
    name: "e",
    action: modes.TRANSLATE,
    cursorStyle: "ew-resize",
    offset: new Vector(1, 0.5),
    axis: new Vector(1, 0)
  },
  {
    name: "n",
    action: modes.TRANSLATE,
    cursorStyle: "ns-resize",
    offset: new Vector(0.5, 0),
    axis: new Vector(0, 1)
  },
  {
    name: "s",
    action: modes.TRANSLATE,
    cursorStyle: "ns-resize",
    offset: new Vector(0.5, 1),
    axis: new Vector(0, 1)
  }
];

// Model
export class Handle extends Rectangle {
  constructor(
    action = modes.TRANSLATE,
    cursorStyle = "pointer",
    axis = new Vector(1, 1),
    offset = new Vector(0.5, 0.5),
    ...params
  ) {
    // Should be a very simple class
    super(...params);
    this.name = "Handle";
    this.action = action;
    this.axis = axis;
    this.offset = offset;
    this.cursorStyle = cursorStyle;
  }
}

// Controller
// Moving away from mouse or drag class due to needed hover capabilities for cursor feedback
class Controls extends Emitter {
  // Add emitter? How to do the binding
  constructor(emitter) {
    super(emitter);
    this.enabled = false;
    this.dragging = false;
    this.parent = null;

    // Gizmo when having an active shape
    this.view = new Object2D();

    // Hide from the start
    this.view.visible = false;
    this._gizmo = new Rectangle(0, 0, 0, 0);

    // Handles
    initControls.forEach(c => {
      const rect = new Handle(
        c.action,
        c.cursorStyle,
        c.axis,
        c.offset,
        0,
        0,
        SIZE,
        SIZE
      );
      this._gizmo.add(rect);
    });

    this.view.add(this._gizmo);

    // this.domElement = domElement;

    // Data Points
    this._start = new Vector();
    this._current = new Vector();
    this._axis = new Vector(1, 1);
    this._tmpDistance = new Vector();
    this._tmpAngle = new Vector();
    this._mode = modes.TRANSLATE;

    // Bind events to scope
    this.onStart = this.onStart.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onEnd = this.onEnd.bind(this);
    this.onHover = this.onHover.bind(this);
  }
  async enable() {
    this.enabled = true;

    // this.domElement.addEventListener("touchstart", this.start);
    // this.domElement.addEventListener("mousedown", this.start);

    console.log("enable");
    console.log("find parent", this.getParent(), this.dragging);

    if (!this.getParent()) return;

    const { ele } = this.getParent();

    // console.log(ele);

    ele.addEventListener("mousemove", this.onHover);
    ele.addEventListener("touchmove", this.onHover);
  }
  async disable() {
    this.enabled = false;

    // this.ele.removeEventListener("touchstart", this.start);
    // this.ele.removeEventListener("mousedown", this.start);

    console.log("disable");

    if (!this.getParent()) return;

    const { ele } = this.getParent();

    ele.removeEventListener("mousemove", this.onHover);
    ele.removeEventListener("touchmove", this.onHover);
  }
  onStart({ pos }) {
    // Debounce if disabled
    if (!this.enabled) return;

    console.log("controls: start");

    this._start.copy(pos);
    this._current.copy(pos);
    this.dragging = true;

    const hits = this._gizmo
      .getChildren()
      .filter(handler => isPointInsideAABB(this._current, handler.aabb));

    if (hits[0]) {
      this.setMode(hits[0].action);
      this.setAxis(hits[0].axis);
    } else {
      this._detach();
      this.parent.onStart({ pos });
      // Bubble event upwards
      console.log("controls_parent:", this.enabled);
    }

    // this.domElement.addEventListener("touchend", this.end);
    // this.domElement.addEventListener("mouseup", this.end);
  }
  onMove({ pos }) {
    // console.log("controls: move");

    if (!this.dragging) return;

    this._tmpDistance.copy(this._current.distanceTo(pos).mulScalar(-1));

    this._current.copy(pos);

    if (
      !this.trigger(events.TRANSFORM, {
        start: this._start.clone(),
        distance: this._tmpDistance.clone(),
        angle: this._tmpAngle.clone(),
        type: this._mode,
        axis: this._axis
      })
    )
      return;

    this.trigger(events.TRANSFORMED);
    this._changed();
  }
  onEnd({ pos }) {
    console.log("controls: end");

    this.dragging = false;
    this._start.copy(pos);

    // this.domElement.removeEventListener("touchend", this.end);
    // this.domElement.removeEventListener("mouseup", this.end);

    this._changed();
  }
  onHover(e) {
    if (this.dragging) return;
    // console.log("controls:hover");

    const pos = getPosition(e);

    const hits = this._gizmo
      .getChildren()
      .filter(handler => isPointInsideAABB(pos, handler.aabb));

    // expensive look up
    if (hits[0]) {
      if (hits[0].cursorStyle === this.getParent().ele.style.cursor) return;
      this.getParent().ele.style.cursor = hits[0].cursorStyle;
    } else {
      this.getParent().ele.style.cursor = "";
    }
  }
  setMode(mode) {
    // Debounce if no vaid mode
    if (
      mode !== modes.TRANSLATE ||
      mode !== modes.ROTATE ||
      mode !== modes.SCALE
    )
      return;
    this._mode = mode;
  }
  setAxis(axis) {
    if (axis instanceof Vector) {
      this._axis.copy(axis);
    }
  }
  getMode() {
    return this._mode;
  }
  getAxis() {
    return this._axis;
  }
  getParent() {
    return this.parent.getParent();
  }
  update(object) {
    // @TODO: fix this
    // if (!this.object) return;

    if (object && !this.view.visible) {
      this.view.visible = true;
    }

    // Might need this in the future
    const { position, width, height, rotation, center } = this.object
      ? this.object
      : object;

    updateShape(this._gizmo, { position, height, width, rotation, center });

    const dim = new Vector(width, height);

    this._gizmo.getChildren().forEach(child => {
      // const newPos = child.offset.clone().add()mul(position.clone());
      const newPos = position.clone().add(dim.clone().mul(child.offset));
      updateShape(child, {
        position: newPos.sub(new Vector(hSIZE, hSIZE)),
        center,
        rotation
      });
    });
  }
  async _attach(object) {
    // if (object === this.object) return;
    console.log("attached", object);

    this.object = object;
    this.show();

    await this.enable();
    this.update();

    return this;
  }
  async _detach() {
    // Bring everything back to default
    this.hide();
    this.setAttrs({
      object: null,
      dragging: false
    });

    await this.disable();

    return this;
  }
  show() {
    this.view.visible = true;
  }
  hide() {
    this.view.visible = false;
  }
  setAttrs(obj) {
    // Neat little helper function
    Object.keys(obj).forEach(key => {
      if (!this[key]) return;
      this[key] = obj[key];
    });
  }
  translationSnap() {
    // as Vector
  }
  rotationSnap() {
    // in degrees
  }
  _changed() {
    // @TODO: This will be most likely a render function
    // this.update(this.object);
    // this.onChangeCallback();
  }
}

export default Controls;
