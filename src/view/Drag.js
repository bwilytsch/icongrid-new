import Vector from "../core/Vector";

const blockEvent = e => {
  e.stopPropagation();
  e.preventDefault();
};

const _tmpPosition = new Vector();

export const getPosition = e => {
  e.preventDefault();

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

// @TODO: Add angle/radial calculation to this
export default class Drag {
  constructor(ele, onStart, onMove, onEnd) {
    this.ele = ele || document.createElement("div");

    // Bind callbacks
    this.bind(onStart, onMove, onEnd);

    this._pointerStart = new Vector();
    this._pointerCurrent = new Vector();
    this._delta = new Vector();

    this.down = this.down.bind(this);
    this.move = this.move.bind(this);
    this.up = this.up.bind(this);

    this.enable = this.enable.bind(this);
    this.disable = this.disable.bind(this);

    this.enabled = true;
    this.enable();

    // Bind listeners
  }
  down(e) {
    blockEvent(e);
    const pos = getPosition(e);
    this._pointerStart.copy(pos);

    this.ele.addEventListener("mousemove", this.move);
    this.ele.addEventListener("touchmove", this.move);

    // Put release on a more global scope
    window.addEventListener("touchend", this.up);
    window.addEventListener("mouseup", this.up);
    this.onStart({ pos: pos.clone() });
  }
  up(e) {
    blockEvent(e);
    const pos = getPosition(e);
    this._pointerStart.copy(pos);

    this.ele.removeEventListener("mousemove", this.move);
    this.ele.removeEventListener("touchmove", this.move);

    window.removeEventListener("touchend", this.up);
    window.removeEventListener("mouseup", this.up);
    this.onEnd({ pos: pos.clone() });
  }
  move(e) {
    blockEvent(e);
    const pos = getPosition(e);
    this._pointerCurrent.copy(pos);
    this._delta.copy(this._pointerStart.clone().sub(this._pointerCurrent));

    // Trigger move/change event
    this.onMove({
      pos: pos.clone(),
      delta: this._delta.clone(),
      start: this._pointerStart.clone()
    });
  }
  bind(onStart, onMove, onEnd) {
    this.onStart = onStart.bind(this);
    this.onMove = onMove.bind(this);
    this.onEnd = onEnd.bind(this);
  }
  enable() {
    this.ele.addEventListener("touchstart", this.down);
    this.ele.addEventListener("mousedown", this.down);

    // this.ele.addEventListener("mousemove", this.move);
    // this.ele.addEventListener("touchmove", this.move);
    this.enabled = true;
  }
  disable() {
    this.ele.removeEventListener("touchstart", this.down);
    this.ele.removeEventListener("mousedown", this.down);

    // this.ele.removeEventListener("mousemove", this.move);
    // this.ele.removeEventListener("touchmove", this.move);
    this.enabled = false;
  }
}
