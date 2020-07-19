import Vector from "./Vector";

const _tmpPosition = new Vector();

// Add InputManager?
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

// Rename to UserInput
class Mouse {
  constructor(domElement) {
    this.position = new Vector();
    this.domElement = domElement;
    this.startPoint = new Vector();
    this.previousPoint = new Vector();
    this.endPoint = new Vector();
    this.active = false;
    this.bb = this.domElement.getBoundingClientRect();
    this.name = "";

    // Bind
    this.onMouseMove = this.onMouseMove.bind(this);
    this.handleStart = this.handleStart.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);

    this.mouseMoveCallback = () => {};
    this.mouseUpCallback = () => {};
    this.mouseDownCallback = () => {};
  }
  setActive(bool) {
    this.active = bool;
    console.log(this.active, this.name);
  }
  onMouseDown(cb) {
    if (cb) {
      this.mouseDownCallback = cb;
    }
  }
  onMouseMove(cb) {
    if (cb) {
      this.mouseMoveCallback = cb;
    }
  }
  onMouseUp(cb) {
    if (cb) {
      console.log("bind up");
      this.mouseUpCallback = cb;
    }
  }
  getEventPosition(e) {
    e.preventDefault();
    // const { clientX: x, clientY: y } = e;
    // console.log(x,y, this.bb.x);
    let x = 0;
    let y = 0;

    if (e.touches && e.touches.length > 0) {
      x = e.touches[0].pageX;
      y = e.touches[0].pageY;
    } else {
      x = e.pageX;
      y = e.pageY;
    }

    return [x - this.domElement.offsetLeft, y - this.domElement.offsetTop];
  }
  handleStart(e) {
    e.preventDefault();
    if (!this.active) return;
    const [x, y] = this.getEventPosition(e);
    this.startPoint.set(x, y);
    this.position.set(x, y);
    this.previousPoint.copy(this.startPoint);
    this.domElement.addEventListener("touchmove", this.handleMove);
    this.domElement.addEventListener("touchend", this.handleEnd);
    this.domElement.addEventListener("mousemove", this.handleMove);
    this.domElement.addEventListener("mouseup", this.handleEnd);

    this.mouseDownCallback(this.position);
  }
  handleEnd(e) {
    e.preventDefault();
    const [x, y] = this.getEventPosition(e);
    this.endPoint.set(x, y);
    this.position.set(x, y);
    this.domElement.removeEventListener("touchmove", this.handleMove);
    this.domElement.removeEventListener("touchend", this.handleEnd);
    this.domElement.removeEventListener("mousemove", this.handleMove);
    this.domElement.removeEventListener("mouseup", this.handleEnd);

    this.mouseUpCallback(this.endPoint.distanceTo(this.startPoint));
  }
  handleMove(e) {
    e.preventDefault();
    const [x, y] = this.getEventPosition(e);
    this.position.set(x, y);
    this.endPoint.set(x, y);
    const distance = this.previousPoint.distanceTo(this.endPoint).mulScalar(-1);
    this.mouseMoveCallback({
      start: this.startPoint,
      previous: this.previousPoint,
      position: this.position,
      distance
    });
    this.previousPoint.set(x, y);
    return this.position;
  }
  start() {
    this.setActive(true);
    this.domElement.addEventListener("touchstart", this.handleStart);
    this.domElement.addEventListener("mousedown", this.handleStart);
  }
  dispose() {
    this.domElement.removeEventListener("touchstart", this.handleStart);
    this.domElement.removeEventListener("mousedown", this.handleStart);
  }
}

export default Mouse;
