import Vector from "./Vector";

// @TODO: Research this
// https://pomax.github.io/bezierjs/

// @TODO: Rework this
class Bezier {
  constructor({ startPoint, endPoint, handleOne, handleTwo }) {
    this.startPoint = new Vector(startPoint.x, startPoint.y);
    this.endPoint = new Vector(endPoint.x, endPoint.y);
    this.handleOne = new Vector(handleOne.x, handleOne.y);
    this.handleTwo = new Vector(handleTwo.x, handleTwo.y);
  }
  get x() {
    return this.startPoint.x;
  }
  get y() {
    return this.startPoint.y;
  }
  copy(bezier) {
    this.startPoint = bezier.startPoint.clone();
    this.endPoint = bezier.endPoint.clone();
    this.handleOne = bezier.handleOne.clone();
    this.handleTwo = bezier.handleTwo.clone();
    return this;
  }
  clone() {
    return new Bezier(this);
  }
  _serialize() {
    return {
      startPoint: this.startPoint._serialize(),
      endPoint: this.endPoint._serialize(),
      handleOne: this.handleOne._serialize(),
      handleTwo: this.handleTwo._serialize()
    };
  }
}

export default Bezier;
