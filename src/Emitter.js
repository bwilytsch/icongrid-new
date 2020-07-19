// General Event Handler

class Emitter {
  constructor(events) {
    this.events = events instanceof Emitter ? events.events : events.handlers;
    this.silent = false;
  }
  on(eventName, handler) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push(handler);
  }
  trigger(eventName, params) {
    if (!(eventName in this.events))
      throw new Error(`The event ${eventName} cannot be triggered`);

    if (this.silent) return;

    // return false if at least one event is false
    return this.events[eventName].reduce((r, fn) => {
      return fn(params) !== false && r;
    }, true);
  }
  bind(eventName, handler) {
    // @NOTE: Duplicate from "on" method
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push(handler);
  }
  unbind(eventName, handler) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(
        h => h !== handler
      );
    }

    if (this.events[eventName].length === 0) {
      delete this.events[eventName];
    }
  }
  mute() {
    this.silent = true;
  }
  unmute() {
    this.silent = false;
  }
  exists(eventName) {
    // Returns if event exists
    return Array.isArray(this.events[eventName]);
  }
}

export default Emitter;
