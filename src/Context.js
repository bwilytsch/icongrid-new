import Emitter from "./Emitter";

// Register, install and use plugins
class Context extends Emitter {
  constructor(id, events) {
    super(events);
    this.id = id;
    this.plugins = null;
  }
}

export default Context;
