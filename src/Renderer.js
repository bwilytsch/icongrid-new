import { createElement } from "./utils";
import { degToRad } from "./Transform";
import Vector from "./Vector";

const defaultStyle = {
  fill: "#111111"
};

// Introduce the concept of layers?
// 0: Base/Grid
// 1: Static
// 2: Gizmo & Selected Items

// 1. Select Item(s)
// 2. Create two render groups

class Renderer {
  constructor({ clearColor } = {}) {
    this._canvas = createElement("canvas", "main");
    this._canvas.width = 512;
    this._canvas.height = 512;
    this._ctx = this._canvas.getContext("2d");
    this.domElement = this._canvas;
    this._renderCalls = 0;

    this._buffer = null;

    // Properties
    this.clearColor = clearColor || "#EEE";

    if (clearColor === "transparent") {
      // Change Clear function
      this.clear = this._clearWithTransparent.bind(this);
    } else {
      this.clear = this._clearWithSolidColor.bind(this);
    }
  }
  _clearWithSolidColor() {
    this._ctx.fillStyle = this.clearColor;
    this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
  }
  _clearWithTransparent() {
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }
  clear() {
    // Use the right render for different types
  }
  createSnapshot() {
    // Create a snapshot of all objects
    const t0 = new Date();
    const image = this._canvas.toDataURL();
    this._buffer = new Image();

    this._buffer.onload = () => {
      this._ctx.drawImage(this._buffer, image.width, image.height);
      const delta = new Date() - t0;
      console.log("image loaded", delta);
    };

    this._buffer.src = image;
  }
  render(shapes, opts = { showConstrains: false }, depth = 0) {
    // Implement Render Order

    // Add children render capabilities\
    if (depth === 0) {
      this._renderCalls++;
    }

    if (Array.isArray(shapes)) {
      shapes.forEach(shape => this.render(shape, undefined, depth + 1));
    } else {
      if (!shapes.visible) return;

      // @TODO: Render all children out
      if (shapes.children && shapes.getChildren) {
        shapes
          .getChildren()
          .forEach(child => this.render(child, undefined, depth + 1));
      }

      if (!shapes.path || shapes.path.length === 0) return;

      const firstPoint = shapes.path[0];
      this._ctx.save();

      this._ctx.beginPath();
      this._ctx.moveTo(firstPoint.x, firstPoint.y);

      if (firstPoint.startPoint) {
        for (let i = 0; i < shapes.path.length; i++) {
          const point = shapes.path[i];
          this._ctx.bezierCurveTo(
            point.handleOne.x,
            point.handleOne.y,
            point.handleTwo.x,
            point.handleTwo.y,
            point.endPoint.x,
            point.endPoint.y
          );
        }
      } else {
        for (let i = 1; i < shapes.path.length; i++) {
          const point = shapes.path[i];
          this._ctx.lineTo(point.x, point.y);
        }
        this._ctx.lineTo(firstPoint.x, firstPoint.y);
      }

      this._ctx.closePath();
      if (shapes.style) {
        if (shapes.style.fill) {
          this._ctx.fillStyle = shapes.style.fill;
          this._ctx.fill();
        }

        if (shapes.style.stroke) {
          this._ctx.strokeStyle = shapes.style.stroke;
          this._ctx.stroke();
        }
      }

      this._ctx.restore();

      // Debug
      if (!shapes.aabb) return;

      const { aabb } = shapes;

      this._ctx.save();
      this._ctx.beginPath();

      if (aabb.type === "RBB") {
        // Logic
        const { center, radius, rotation } = aabb;
        this._ctx.ellipse(
          center.x,
          center.y,
          radius.x,
          radius.y,
          -degToRad(rotation.x),
          0,
          Math.PI * 2
        );
      } else {
        // Render AABB
        if (opts.showConstrains) {
          const { min, max } = aabb;
          const points = [
            new Vector(min.x, min.y),
            new Vector(max.x, min.y),
            new Vector(max.x, max.y),
            new Vector(min.x, max.y)
          ];
          points.forEach((point, idx) => {
            if (idx === 0) {
              this._ctx.moveTo(point.x, point.y);
            } else {
              this._ctx.lineTo(point.x, point.y);
            }
          });
        }
      }

      this._ctx.closePath();

      this._ctx.strokeStyle = shapes.style.stroke;
      this._ctx.stroke();

      this._ctx.restore();

      if (shapes.text) {
        this._ctx.fillStyle = shapes.style.text;
        this._ctx.font = "12px sans-serif";
        this._ctx.textAlign = "center";
        this._ctx.textBaseline = "middle";
        this._ctx.fillText(shapes.text, shapes.center.x, shapes.center.y + 4);
      }

      // Draw Bounding Box
      // if (currentShape && currentShape._id === shapes._id) {
      //   this._ctx.save();
      //   this._ctx.beginPath();

      //   this._ctx.strokeStyle = "#0000FF";
      //   this._ctx.lineWidth = 1;

      //   const size = 4;

      //   // Debug
      //   currentShape.path.forEach(point => {
      //     // Viz points
      //     this._ctx.strokeRect(
      //       point.startPoint.x - size / 2,
      //       point.startPoint.y - size / 2,
      //       size,
      //       size
      //     );
      //     this._ctx.strokeRect(
      //       point.handleOne.x - size / 2,
      //       point.handleOne.y - size / 2,
      //       size,
      //       size
      //     );
      //     this._ctx.strokeRect(
      //       point.handleTwo.x - size / 2,
      //       point.handleTwo.y - size / 2,
      //       size,
      //       size
      //     );

      //     // Viz handles
      //     this._ctx.moveTo(point.handleOne.x, point.handleOne.y);
      //     this._ctx.lineTo(point.startPoint.x, point.startPoint.y);

      //     this._ctx.moveTo(point.handleTwo.x, point.handleTwo.y);
      //     this._ctx.lineTo(point.endPoint.x, point.endPoint.y);
      //   });

      //   // Gizmo
      //   // const { center, width, height } = currentShape;

      //   // const half = new Vector(width, height).mulScalar(0.5);

      //   // const min = center.clone().sub(half);
      //   // const max = center.clone().add(half);

      //   // const points = [
      //   //   new Vector(min.x, min.y),
      //   //   new Vector(max.x, min.y),
      //   //   new Vector(max.x, max.y),
      //   //   new Vector(min.x, max.y)
      //   // ];

      //   // this._ctx.beginPath();

      //   // const rotMat = createRotationMatrix(
      //   //   degToRad(currentShape.rotation.x),
      //   //   currentShape.center
      //   // );

      //   // points.forEach((point, idx) => {
      //   //   point = applyMatrix(point, rotMat);
      //   //   if (idx === 0) {
      //   //     this._ctx.moveTo(point.x, point.y);
      //   //   } else {
      //   //     this._ctx.lineTo(point.x, point.y);
      //   //   }
      //   // });

      //   // this._ctx.closePath();

      //   // this._ctx.moveTo(min.x, min.y);
      //   // this._ctx.lineTo(max.x, min.y);
      //   // this._ctx.lineTo(max.x, max.y);
      //   // this._ctx.lineTo(min.x, max.y);

      //   // this._ctx.closePath();

      //   this._ctx.stroke();

      //   // Center
      //   this._ctx.fillStyle = "#0000FF";
      //   this._ctx.fillRect(
      //     currentShape.center.x - size / 2,
      //     currentShape.center.y - size / 2,
      //     size,
      //     size
      //   );

      //   this._ctx.restore();
      // }
    }
  }
}

export default Renderer;
