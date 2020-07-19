import "./styles.css";
import Vector from "./Vector";
import Mouse from "./Mouse";
import Renderer from "./Renderer";
import Controls from "./Controls";
import { createElement, isPointInsideAABB } from "./utils";
import {
  createTranslationMatrix,
  createScaleMatrix,
  createRotationMatrix,
  applyMatrix,
  degToRad,
  // radToDeg,
  getCenter
} from "./Transform";
import Shape, { createEllipse, createRectangle, createStar } from "./Shape";
// import { angleAroundCenter } from "./Math";
import { loadFile, saveFile } from "./Storage";
import Selected from "./Selected";

// New code
import Editor from "./Editor";

let metaInformation = {};

const events = {
  ROTATE: "ROTATE",
  TRANSLATE: "TRANSLATE",
  SCALE: "SCALE"
};

const actions = {
  TRANSLATE: (shape, distance) => {
    const mat3 = createTranslationMatrix(distance);
    return mat3;
  },
  SCALE: (shape, distance, angle, scale) => {
    const mat3 = createScaleMatrix(
      scale,
      shape.center,
      degToRad(shape.rotation.x)
    );
    return mat3;
  },
  ROTATE: (shape, distance, angle) => {
    const mat3 = createRotationMatrix(angle, shape.center);
    return mat3;
  }
};

// Will allow for multi-selection
const selected = new Selected();

let focusCount = 0;
let blurCount = 0;

// View
class EditorUI {
  constructor() {
    // Renderer
    this._renderer = new Renderer();
    this._action = events.TRANSLATE;
    this._mouse = new Mouse(this._renderer._canvas);
    this._mouse.start();
    this._mouse.name = "editor";

    this._controls = new Controls({
      actions,
      events,
      element: this._renderer._canvas
    });

    // this._controls.onFocus = this._controls.onFocus.bind(this);
    // this._controls.onBlur = this._controls.onBlur.bind(this);

    document.body.appendChild(this._renderer._canvas);

    // Add UI
    this.button = createElement("button", "btn", "Add Rectangle");

    this.circleButton = createElement("button", "btn", "Add Ellipse");
    this.polygonButton = createElement("button", "btn", "Add Polygon");

    this.moveButton = createElement("button", "btn", "Move");

    this.rotateButton = createElement("button", "btn", "Rotate");

    this.scaleButton = createElement("button", "btn", "Scale");

    this.deleteButton = createElement("button", "btn", "Delete");

    this.positionX = createElement("input", "input");
    this.positionX.value = 0;

    this.rotationX = createElement("input", null, "x");
    this.rotationY = createElement("span", null, "x");

    this.scaleX = createElement("span", null, "x");
    this.scaleY = createElement("span", null, "y");

    this.toolRotate = createElement("button", "btn", "Rotate Tool");
    this.toolTranslate = createElement("button", "btn", "Translate Tool");
    this.toolScale = createElement("button", "btn", "Scale Tool");

    this.widthInput = createElement("input", "null", 0);
    this.heightInput = createElement("input", "null", 0);

    // Bind tools
    this.toolRotate.addEventListener(
      "click",
      () => {
        this._action = events.ROTATE;
      },
      false
    );
    this.toolScale.addEventListener(
      "click",
      () => {
        this._action = events.SCALE;
      },
      false
    );
    this.toolTranslate.addEventListener(
      "click",
      () => {
        this._action = events.TRANSLATE;
      },
      false
    );

    this.positionY = createElement("input", "input");
    this.positionY.value = 0;

    document.body.append(
      this.button,
      this.circleButton,
      this.polygonButton,
      this.deleteButton,
      this.toolRotate,
      this.toolTranslate,
      this.toolScale,
      createElement("label", null, "width"),
      this.widthInput,
      createElement("label", null, "height"),
      this.heightInput,
      createElement("label", null, "x"),
      this.positionX,
      createElement("label", null, "y"),
      this.positionY,
      createElement("label", null, "rotation"),
      this.rotationX
    );
  }
  bindSelectShape(handler) {
    // this._mouse.onMouseDown(() => {
    //   console.log("touch select");
    //   this._controls.setTarget(handler(this._mouse.position));
    // });
    this._mouse.onMouseDown(() => {
      console.log("mouse select");
      this._controls.setTarget(handler(this._mouse.position));
    });

    this._controls.onFocus(() => {
      focusCount++;
      console.log("controls -> mouse : focus", focusCount);
      this._mouse.setActive(false);
    });
    this._controls.onBlur(() => {
      blurCount++;
      console.log("controls -> mouse : blur", blurCount);
      this._mouse.setActive(true);
    });
  }
  bindDeleteShape(handler) {
    this.deleteButton.addEventListener("click", () => {
      if (selected.isEmpty()) return;
      handler(selected.first()._id);
    });
  }
  bindEditShape(handler) {
    this.positionX.addEventListener("change", e => {
      if (!selected.isEmpty()) return;

      const dist = new Vector(e.target.value, 0);

      const mat3 = createTranslationMatrix(dist);

      const currentShape = selected.first();

      handler(currentShape._id, {
        path: currentShape.path.map(point => applyMatrix(point, mat3)),
        center: currentShape.center.add(dist),
        position: currentShape.position.add(dist)
      });
    });

    this.positionY.addEventListener("change", e => {
      // if (!currentShape) return;
      if (!selected.isEmpty()) return;

      const dist = new Vector(0, e.target.value);

      const mat3 = createTranslationMatrix(dist);

      const currentShape = selected.first();

      handler(currentShape._id, {
        path: currentShape.path.map(point => applyMatrix(point, mat3)),
        center: currentShape.center.add(dist),
        position: currentShape.position.add(dist)
      });
    });

    this._controls.bindEditShape(handler);
  }
  bindAddShape(handler) {
    console.log("triggered");

    this.circleButton.addEventListener("click", () => {
      const x = 128;
      const y = 128;
      const w = 256;
      const h = 256;

      const hw = w / 2;
      const hh = h / 2;

      handler({
        name: "Ellipse",
        type: "Ellipse",
        width: w,
        height: h,
        position: new Vector(x, y),
        center: new Vector(x + hw, y + hh),
        path: createEllipse(x, y, w, h),
        scale: new Vector(1, 1),
        rotation: new Vector()
      });
    });

    this.button.addEventListener("click", () => {
      const x = 128;
      const y = 128;
      const w = 256;
      const h = 256;

      const hw = w / 2;
      const hh = h / 2;

      handler({
        name: "Rectangle",
        type: "Rectangle",
        width: w,
        height: h,
        position: new Vector(x, y),
        center: new Vector(x + hw, y + hh),
        path: createRectangle(x, y, w, h),
        scale: new Vector(1, 1),
        rotation: new Vector()
      });
    });

    this.polygonButton.addEventListener("click", () => {
      const x = 128;
      const y = 128;
      const w = 256;
      const h = 256;

      const hw = w / 2;
      const hh = h / 2;

      handler({
        name: "Polygon",
        type: "Polygon",
        width: w,
        height: h,
        position: new Vector(x, y),
        center: new Vector(x + hw, y + hh),
        path: createStar(x + hw, y + hh, w, h, 3, 1),
        scale: new Vector(1, 1),
        rotation: new Vector(),
        style: {
          stroke: "#0000FF"
        }
      });
    });
  }
  render(shapes) {
    // console.log("inside render", shapes);
    this._renderer.clear();
    this._renderer.render(shapes, { showConstrains: true });

    const currentShape = selected.first();

    if (currentShape) {
      this.widthInput.value = currentShape.width.toFixed(1);
      this.heightInput.value = currentShape.height.toFixed(1);
      this.positionX.value = currentShape.position.x.toFixed(1);
      this.positionY.value = currentShape.position.y.toFixed(1);
      this.rotationX.value = currentShape.rotation.x.toFixed(1) + "°";

      this._controls.update(currentShape);
      this._renderer.render(this._controls);
      this._renderer.render(this._controls.children);
    } else {
      // reset
      this.widthInput.value = 0;
      this.heightInput.value = 0;
      this.positionX.value = 0;
      this.positionY.value = 0;
      this.rotationX.value = 0 + "°";
      this._action = events.TRANSLATE;
    }
  }
}

// Service
class EditorService {
  constructor() {
    let { file, ...meta } = loadFile();
    metaInformation = meta;

    this.shapes = file.map(shape => {
      const obj = new Shape(shape);
      obj.aabb.set(obj.path);
      return obj;
    });

    this.shapeListChanged = () => {};
  }
  add(shape) {
    this.shapes.push(new Shape(shape));

    // this.selectedId = this.shapes[this.shapes.length - 1]._id;

    selected.add(this.shapes[this.shapes.length - 1]);

    this._commit(this.shapes);
  }
  delete(id) {
    if (this.shapes.length === 0) return;
    this.shapes = this.shapes.filter(shape => shape._id !== id);
    selected.clear();
    // currentShape = null;

    this._commit(this.shapes);
  }
  select(mousePos) {
    if (this.shapes.length === 0) return;

    const hits = this.shapes.filter(shape =>
      isPointInsideAABB(mousePos, shape.aabb)
    );

    console.log("editor: ", hits);

    if (hits.length > 0) {
      selected.add(hits[0]);
    } else {
      selected.clear();
    }

    this._commit(this.shapes);

    return selected.first();
  }
  edit(id, shapeToEdit) {
    if (this.shapes.length === 0) return;
    this.shapes = this.shapes.map(shape => {
      if (shape._id === id) {
        Object.keys(shapeToEdit).forEach(key => {
          if (shape[key].copy) {
            shape[key].copy(shapeToEdit[key]);
          } else {
            shape[key] = shapeToEdit[key];
          }
        });

        shape.aabb.set(shape.path);
        shape.center.copy(getCenter(shape));
      }
      return shape;
    });

    this._commit(this.shapes);
  }
  bindShapeListChanged(callback) {
    // Bind callback
    this.onShapeListChanged = callback;
  }
  _commit(shapes) {
    this.onShapeListChanged(shapes);
    saveFile(shapes, metaInformation);
  }
}

// Controller
class OldEditor {
  constructor(editorService, editorUI) {
    this.editorService = editorService;
    this.editorUI = editorUI;

    // Bind
    this.handleAddShape = this.handleAddShape.bind(this);
    this.handleEditShape = this.handleEditShape.bind(this);
    this.handleSelectShape = this.handleSelectShape.bind(this);
    this.handleDeleteShape = this.handleDeleteShape.bind(this);
    this.onShapeListChanged = this.onShapeListChanged.bind(this);

    this.editorService.bindShapeListChanged(this.onShapeListChanged);
    this.editorUI.bindAddShape(this.handleAddShape);
    this.editorUI.bindEditShape(this.handleEditShape);
    this.editorUI.bindDeleteShape(this.handleDeleteShape);
    this.editorUI.bindSelectShape(this.handleSelectShape);

    this.onShapeListChanged(this.editorService.shapes);
  }
  onShapeListChanged(shapes) {
    this.editorUI.render(shapes);
  }
  handleAddShape(shape) {
    this.editorService.add(shape);
  }
  handleEditShape(id, shape) {
    this.editorService.edit(id, shape);
  }
  handleSelectShape(mousePos) {
    return this.editorService.select(mousePos);
  }
  handleDeleteShape(id) {
    this.editorService.delete(id);
  }
}

// Start App
new OldEditor(new EditorService(), new EditorUI());

// New App
const editor = new Editor(null, document.getElementById("app"));
editor.install();
