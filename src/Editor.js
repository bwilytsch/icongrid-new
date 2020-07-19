import Context from "./Context";
import Selected from "./Selected";
import EditorEvents, { events } from "./EditorEvents";
import EditorView from "./view";
import { loadFile } from "./Storage";
import Shape, { setAttrs } from "./Shape";
import Matrix3 from "./Matrix";
import { applyMatrix, createTranslationMatrix } from "./Transform";
import { isPointInsideAABB, isAABBInsideAABB } from "./utils";
import Vector from "./core/Vector";
import Object2D from "./core/Object2D";

/**
 * Editor
 *  - view
 *  - controls
 */

const filterAlgorithmSingle = point => shape =>
  isPointInsideAABB(point, shape.aabb);
const filterAlgorithmMulti = aabb => shape =>
  isAABBInsideAABB(aabb, shape.aabb);

export const transform = {
  TRANSLATE: "TRANSLATE",
  ROTATE: "ROTATE",
  SCALE: "SCALE"
};

class Editor extends Context {
  constructor(id, container) {
    super(id, new EditorEvents());

    this.selected = new Selected();

    this._mode = "default";

    // Figure this out.
    this.components = null;

    // Load File
    let { file } = loadFile();

    this.shapes = new Object2D();

    // Hydrate File
    file.forEach(shapaData => {
      const shape = new Shape(shapaData);
      shape.aabb.set(shape.path);
      this.shapes.add(shape);
    });

    // Register and manage ui & view
    this.view = new EditorView(
      container,
      this.shapes,
      this.selected,
      this.components,
      this
    );
  }
  selectShape(shape, accumulate = false) {
    this.selected.add(shape, accumulate);
  }
  addShape(shape) {
    if (!this.trigger(events.SHAPECREATE, shape)) return;

    this.shapes.add(shape);
    // @TODO
    // this.view.addShape(shape);

    this.trigger(events.SHAPECREATED, shape);
  }
  removeShape(shape) {
    // Delete shape from memory and update + save file
  }
  install() {
    this.on(events.SHAPESELECT, ({ selection, initial = false }) => {
      this.selected.clear();

      const filterFunc =
        selection instanceof Vector
          ? filterAlgorithmSingle
          : filterAlgorithmMulti;

      // Oh, boy...
      const shapes = this.shapes.getChildren().filter(filterFunc(selection));

      if (shapes.length > 1) {
        shapes.forEach(shape => {
          this.selectShape(shape, true);
        });
      } else if (shapes.length === 1) {
        this.selectShape(shapes[0], false);
      }

      if (
        !this.trigger(events.UDPDATECONTROLS, {
          selected: this.selected
        })
      )
        return;

      if (initial) {
        this.trigger(events.RENDERSHAPES);
      }
    });

    // Split into scale, rotate, translate
    this.on(events.TRANSFORM, ({ type, start, distance, angle, axis }) => {
      let mat3 = new Matrix3();

      if (type === transform.TRANSLATE) {
        // console.log("translate by", distance);
        mat3 = createTranslationMatrix(distance.mul(axis));
      }

      this.selected.each(shape => {
        // Transform each selected shape
        // Just send matrix?
        // shape.position.add(distance);
        // shape.center = shape.position
        //   .clone()
        //   .add(new Vector(shape.width / 2, shape.height / 2));

        // Update attributes
        setAttrs(shape, {
          position: shape.position.clone().add(distance),
          center: shape.position
            .clone()
            .add(distance)
            .add(new Vector(shape.width / 2, shape.height / 2))
        });

        shape.path.map(point => applyMatrix(point, mat3));

        // Update Object completly + Hacky
        // Position, rotation, center
        // Move this into the shape Changes itself
        shape.aabb.set(shape.path);
      });

      // @NOTE: Bad
      if (
        !this.trigger(events.UDPDATECONTROLS, {
          selected: this.selected,
          attach: false
        })
      )
        return;

      // Save changes after transform

      // this.view.render(this.shapes, true);
    });

    // Initial render
    this.view.render(this.shapes, true);
  }
}

export default Editor;
