import { uuidv4 } from "../utils";

export default class Object2D {
  constructor() {
    this._id = uuidv4();
    this.children = [];
    this.visible = true;
  }
  add(child) {
    this.children.push(child);
  }
  remove(childId) {
    this.children = this.children.filter(
      child => child && child._id !== childId
    );
  }
  isEmpty() {
    return this.children.length === 0;
  }
  getChild(index) {
    return this.children[index];
  }
  getChildren() {
    return this.children;
  }
  clear() {
    this.children = [];
  }
  dispose() {
    // dispose of anything not needed + traverse through children
    if (!this.isEmpty()) {
      this.getChildren().forEach(child => child.dipose());
    }
  }
}
