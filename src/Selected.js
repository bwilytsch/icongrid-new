// https://github.com/retejs/rete/blob/master/src/selected.ts

class Selected {
  constructor() {
    this.list = [];
  }
  add(item, accumulate = false) {
    if (!accumulate) {
      this.list = [item];
    } else if (!this.contains(item)) {
      this.list.push(item);
    }
  }
  remove(item) {
    this.list = this.list.filter(itm => itm !== item);
  }
  contains(item) {
    return this.list.indexOf(item) !== -1;
  }
  first() {
    return this.list[0];
  }
  last() {
    return this.list[this.list.length - 1];
  }
  only() {
    return this.list.length === 1;
  }
  clear() {
    this.list = [];
  }
  isEmpty() {
    return this.list.length === 0;
  }
  each(fn) {
    this.list.forEach(item => fn(item));
  }
}

export default Selected;
