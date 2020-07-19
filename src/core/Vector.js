class Vector {
  static dotProduct(vec0, vec1) {
    return vec0.x * vec1.x + vec0.y * vec1.y;
  }
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  abs() {
    this.x = Math.abs(this.x);
    this.y = Math.abs(this.y);
    return this;
  }
  divScalar(scalar) {
    this.x /= scalar;
    this.y /= scalar;
    return this;
  }
  dot(vec0) {
    return this.x * vec0.x + this.y * vec0.y;
  }
  div(vec0) {
    this.x /= vec0.x;
    this.y /= vec0.y;
    return this;
  }
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
  setX(x) {
    this.x = x;
    return this;
  }
  setY(y) {
    this.y = y;
    return this;
  }
  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  copy(vec0) {
    this.x = vec0.x;
    this.y = vec0.y;
    return this;
  }
  sub(vec0) {
    this.x -= vec0.x;
    this.y -= vec0.y;
    return this;
  }
  add(vec0) {
    this.x += vec0.x;
    this.y += vec0.y;
    return this;
  }
  mul(vec0) {
    this.x *= vec0.x;
    this.y *= vec0.y;
    return this;
  }
  normalize() {
    const mag = this.mag();
    this.divScalar(mag);
    return this;
  }
  length() {
    // For x & y
    return 2;
  }
  mulScalar(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
  distanceTo(vec0) {
    const { x: x1, y: y1 } = this;
    const { x: x2, y: y2 } = vec0;
    var a = x1 - x2;
    var b = y1 - y2;
    // return Math.sqrt(a * a + b * b);
    return new Vector(a, b);
  }
  clone() {
    return new Vector().copy(this);
  }
  print() {
    console.log(`x: ${this.x}, y: ${this.y}`);
  }
  _serialize() {
    return { x: this.x, y: this.y };
  }
}

export default Vector;
