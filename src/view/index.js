import Area from "./Area";
import Controls from "./Controls";
import Renderer from "../Renderer";
import Emitter from "../Emitter";
import Object2D from "../core/Object2D";
import { Rectangle } from "../primitives";
import { events } from "../EditorEvents";
import { udpateShape, updateShape } from "../Shape";
import Vector from "../core/Vector";

// Debugger
// import Shape, { createRectangle } from "../Shape";
// import Vector from "../core/Vector";

// Like the pattern
export class Generic {
  // Maybe use this in Shape
  setAttrs(obj) {
    Object.keys(obj).forEach(key => {
      this[key] = obj[key];
    });
  }
}

// Facade
// class Rectangle extends Shape {
//   constructor(x, y, w, h) {
//     const hh = h / 2;
//     const hw = w / 2;

//     super({
//       name: "Rectangle",
//       type: "Rectangle",
//       width: w,
//       height: h,
//       position: new Vector(x, y),
//       center: new Vector(x + hw, y + hh),
//       path: createRectangle(x, y, w, h),
//       scale: new Vector(1, 1),
//       rotation: new Vector(),
//       style: {
//         stroke: "#44B0FF",
//         fill: "rgba(68, 176, 255, 0.32)"
//       }
//     });
//   }
//   update(x, y, w, h) {
//     const hh = h / 2;
//     const hw = w / 2;

//     this.width = w;
//     this.height = h;
//     this.position.set(x, y);
//     this.center.set(x + hw, y + hh);
//     this.path = createRectangle(x, y, w, h);
//     this.aabb.set(this.path);
//   }
// }

// EditorView States
// default, shape selected, shape editable

// I don't get the need for class inheritance
class EditorView extends Emitter {
  constructor(domElement, shapes, selected, components, emitter) {
    super(emitter);
    this.ele = domElement;

    // Parent Object
    this.objects = new Object2D();
    this.ui = new Object2D();

    this.selected = selected;

    // @TODO: Figure out what components are
    this.components = components;

    this.renderer = new Renderer({ clearColor: "#EEEEEE" });
    this.uiRenderer = new Renderer({ clearColor: "transparent" });

    this.uiRenderer.domElement.style.position = "absolute";
    this.uiRenderer.domElement.style.top = 0;
    this.uiRenderer.domElement.style.left = 0;
    this.uiRenderer.domElement.className = "ui-layer";

    // General selection
    this.area = new Area(this.uiRenderer.domElement, emitter);

    /**
     * ### Plugins ###
     */

    this.controls = new Controls(emitter);
    this.area.use(this.controls);

    // Rectangle/Area selection
    this.selection = new Rectangle();

    // Add them in the right order
    this.objects.add(shapes);

    this.ui.add(this.area.view);
    this.ui.add(this.controls.view);

    // UI Components
    this.ele.append(this.renderer.domElement, this.uiRenderer.domElement);

    emitter.on(events.RENDERSHAPES, () => {
      console.log("render shapes");
      // if (this.controls.enabled) return;

      this.render(this.objects, true);
    });

    // Need additional event?
    emitter.on(events.SHAPESELECTED, async () => {
      if (this.selected.isEmpty()) {
        await this.controls._detach();

        this.render(this.objects, true);

        this.uiRenderer.clear();
      } else {
        await this.controls._attach(this.selection);

        // Render all shapes but selection
        this.render(
          shapes.getChildren().filter(shape =>
            this.selected.list.reduce((acc, cur) => {
              return cur._id !== shape._id && acc;
            }, true)
          ),
          true
        );

        this.uiRenderer.clear();
        this.uiRenderer.render(this.selected.list);
        this.uiRenderer.render(this.ui);
      }
    });

    // @NOTE: Bad naming here
    emitter.on(events.UDPDATECONTROLS, ({ selected }) => {
      // @NOTE: Fix this
      // console.log("update controls");
      this.uiRenderer.clear();

      if (!this.selected.isEmpty()) {
        if (!this.selected.only()) {
          let union = this.selected.first().aabb;

          if (this.selected.list.length > 1) {
            union = selected.list.reduce((acc, cur) => {
              return acc.union(cur.aabb);
            }, union);
          }

          const dim = union.max.clone().sub(union.min);

          updateShape(this.selection, {
            position: union.min,
            width: dim.x,
            height: dim.y,
            center: union.min.clone().add(dim.clone().mulScalar(0.5)),
            rotation: new Vector()
          });
        } else {
          const copy = this.selected.first();

          updateShape(this.selection, copy);
        }

        // Visual update
        if (!this.controls.enabled) {
          // @NOTE: NEEDED during dragging
          this.controls.update(this.selection);
        } else {
          this.controls.update();
        }
      } else {
        // Hide if empty
        if (this.controls.view.visible) {
          this.controls.view.visible = false;
        }
      }

      // console.log("update controls");
      this.uiRenderer.render(this.selected.list);
      this.uiRenderer.render(this.ui);
    });
  }
  render(shapes, clear = false) {
    if (clear) {
      this.renderer.clear();
    }

    this.renderer.render(shapes, { showConstrains: false });
  }
}

export default EditorView;
