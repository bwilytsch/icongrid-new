// import Emitter from "./Emitter";

export const events = {
  RENDER: "render",
  RENDERSHAPES: "rendershapes",
  RENDERUI: "renderui",
  RENDERSELECTION: "renderselection",
  UDPDATECONTROLS: "updatecontrols",
  SHAPESELECT: "shapeselect",
  SHAPESELECTED: "shapeselected",
  SHAPECREATE: "shapecreate",
  SHAPECREATED: "shapecreated",
  SHAPEREMOVE: "shaperemove",
  TRANSFORM: "transform",
  TRANSFORMED: "transformed",
  EDITORMODE: "editormode"
};

class Events {
  constructor(handlers) {
    this.handlers = {
      warn: [console.warn],
      error: [console.error],
      ...handlers
    };
  }
}

class EditorEvents extends Events {
  constructor() {
    super({
      shapecreate: [],
      shapecreated: [],
      shaperemove: [],
      shaperemoved: [],
      selectshape: [],
      editormode: [],
      multiselectshape: [],
      shapeselect: [],
      shapeselected: [],
      render: [],
      rendershapes: [],
      renderui: [],
      updatecontrols: [],
      renderselection: [],
      keydown: [],
      keyup: [],
      import: [],
      export: [],
      save: [],
      delete: [],
      down: [],
      up: [],
      move: [],
      contextmenu: [],
      transform: [],
      transformed: [],
      translate: [],
      translated: [],
      rotate: [],
      rotated: [],
      scale: [],
      scaled: []
    });
  }
}

export default EditorEvents;
