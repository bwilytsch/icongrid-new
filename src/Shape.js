import Vector from "./core/Vector";
import Bezier from "./Bezier";
import Object2D from "./core/Object2D";
import AABB from "./AABB";
import {
  createRotationMatrix,
  applyMatrix,
  degToRad,
  createTranslationMatrix
} from "./Transform";
import Matrix3 from "./Matrix";

// Import and extend Shape with Object2D

// Deep Copy
// copy(data: Data) {
//   data = Object.assign({}, data);
//   data.nodes = Object.assign({}, data.nodes);

//   Object.keys(data.nodes).forEach(key => {
//       data.nodes[key] = Object.assign({}, data.nodes[key])
//   });
//   return data;
// }

export const setAttrs = (shape, changes) => {
  Object.keys(changes).forEach(key => {
    if (shape[key] !== undefined) {
      if (changes[key] instanceof Vector) {
        shape[key].copy(changes[key]);
      } else {
        shape[key] = changes[key];
      }
    }
  });
};

export const updateShape = (shape, changes) => {
  const mat3 = new Matrix3();

  // console.log(changes);

  // if (changes.position) {
  //   const distance = new Vector().copy(
  //     changes.position.distanceTo(shape.position).mulScalar(-1)
  //   );
  //   const translationMatrix = createTranslationMatrix(distance);
  //   mat3.mul(translationMatrix);
  // }

  if (changes.rotation) {
    const rotationMatrix = createRotationMatrix(
      degToRad(changes.rotation.x),
      changes.center
    );
    mat3.mul(rotationMatrix);
  }

  setAttrs(shape, changes);

  // Update dependecies
  shape.path = createRectangle(
    shape.position.x,
    shape.position.y,
    shape.width,
    shape.height
  );

  // @NOTE: BAD - to iterations through all elements

  shape.path.map(point => applyMatrix(point, mat3));

  shape.aabb.set(shape.path);
};

const getPointAtAngle = (angle, center, radius) => {
  return radius
    .clone()
    .mul(new Vector(Math.cos(angle), Math.sin(angle)))
    .add(center);
};

const getRelativeControlPoints = (startAngle, endAngle, radius) => {
  const factor = getApproximationFactor(startAngle, endAngle);
  const distToCtrlPoint = Math.sqrt(
    radius.x * radius.x * (1 + factor * factor)
  );
  const distToCtrlPoint2 = Math.sqrt(
    radius.y * radius.y * (1 + factor * factor)
  );

  const angle1 = startAngle + Math.atan(factor);
  const angle2 = endAngle - Math.atan(factor);
  return [
    new Vector(
      Math.cos(angle1) * distToCtrlPoint,
      Math.sin(angle1) * distToCtrlPoint2
    ),
    new Vector(
      Math.cos(angle2) * distToCtrlPoint,
      Math.sin(angle2) * distToCtrlPoint2
    )
  ];
};
const getApproximationFactor = (startAngle, endAngle) => {
  // Returns a mutliplication constant with an inaccuracy of 1.96×10^-4
  let arc = endAngle - startAngle;
  if (Math.abs(arc) > Math.PI) {
    arc -= Math.PI * 2;
    arc %= Math.PI * 2;
  }
  return (4 / 3) * Math.tan(arc / 4);
};

// Can be max 90 degrees
export const createArc = ({
  radius,
  position,
  startAngle,
  endAngle,
  offsetAngle
}) => {
  const [c1, c2] = getRelativeControlPoints(startAngle, endAngle, radius);

  return new Bezier({
    startPoint: getPointAtAngle(startAngle, position, radius),
    endPoint: getPointAtAngle(endAngle, position, radius),
    handleOne: c1.add(position),
    handleTwo: c2.add(position)
  });
};

export const createStar = (x, y, w, h, edges = 5, delta = 0.4) => {
  const path = [];
  const center = new Vector(x, y);

  const outerRadius = new Vector(w / 2, h / 2);
  const innerRadius = outerRadius.clone().mulScalar(delta);

  // Account for inner and outer edges
  if (delta !== 1) {
    edges *= 2;
  }

  // For every spike we need a low
  for (let i = 0; i < edges; i++) {
    let angle = ((Math.PI * 2) / edges) * i;
    // Correct rotation to have first point point upwards
    angle -= Math.PI / 2;
    let p1 = new Vector(Math.cos(angle), Math.sin(angle))
      .mul(i % 2 === 0 ? outerRadius : innerRadius)
      .add(center);

    path.push(
      new Bezier({
        startPoint: p1.clone(),
        endPoint: p1.clone(),
        handleOne: p1.clone(),
        handleTwo: p1.clone()
      })
    );
  }

  // Link endpoints
  path.forEach((bezier, idx) => {
    if (idx === path.length - 1) {
      bezier.endPoint = path[0].startPoint;
    } else {
      bezier.endPoint = path[idx + 1].startPoint;
    }
  });

  return path;
};

export const createEllipse = (x, y, w, h) => {
  const rx = w / 2;
  const ry = h / 2;

  const cx = x + rx;
  const cy = y + ry;

  const position = new Vector(cx, cy);
  const radius = new Vector(rx, ry);

  const path = [];

  for (let i = 0; i < 4; i++) {
    const startAngle = (Math.PI / 2) * i;
    const endAngle = (Math.PI / 2) * (i + 1);

    path.push(createArc({ radius, position, startAngle, endAngle }));
  }

  // With Beziers
  return path;
};

export const createRectangle = (x, y, w, h) => {
  const minX = x;
  const minY = y;
  const maxX = x + w;
  const maxY = y + h;

  const p1 = new Vector(minX, minY);
  const p2 = new Vector(maxX, minY);
  const p3 = new Vector(maxX, maxY);
  const p4 = new Vector(minX, maxY);

  return [
    new Bezier({
      startPoint: p1,
      endPoint: p2,
      handleOne: p1.clone(),
      handleTwo: p1.clone()
    }),
    new Bezier({
      startPoint: p2,
      endPoint: p3,
      handleOne: p2.clone(),
      handleTwo: p2.clone()
    }),
    new Bezier({
      startPoint: p3,
      endPoint: p4,
      handleOne: p3.clone(),
      handleTwo: p3.clone()
    }),
    new Bezier({
      startPoint: p4,
      endPoint: p1,
      handleOne: p4.clone(),
      handleTwo: p4.clone()
    })
  ];
};

// Model
class Shape extends Object2D {
  constructor({
    name,
    path,
    center = new Vector(),
    position = new Vector(),
    scale = new Vector(),
    rotation = new Vector(),
    _id,
    type,
    updated,
    width,
    height,
    visible,
    children,
    style
  }) {
    super();
    // this._id = uuidv4();
    this.name = name || "Shape";
    this.type = type || "Unknown";
    this.width = width || 1;
    this.height = height || 1;
    this.path = path ? path.map(point => new Bezier(point)) : [];
    this.center = new Vector(center.x, center.y);
    this.position = new Vector(position.x, position.y);
    // @NOTE not keeping tracking of sclae
    this.scale = new Vector(scale.x, scale.y);
    this.rotation = new Vector(rotation.x, rotation.y);
    this.updated = updated || false;
    this.visible = visible || true;
    this.aabb = new AABB().set(this.path);

    // Add children
    children && children.forEach(child => this.add(new Shape(child)));
    // this.children = children ? children.map(child => new Shape(child)) : [];
    this.style = style || {
      fill: "#000000",
      stroke: "null"
    };
  }
  _serialize() {
    return {
      name: this.name,
      width: this.width,
      height: this.height,
      path: this.path.map(point => point._serialize()),
      center: this.center._serialize(),
      position: this.position._serialize(),
      scale: this.scale._serialize(),
      rotation: this.rotation._serialize(),
      type: this.type,
      visible: this.visible,
      children: this.children.map(child => child._serialize()),
      style: this.style
    };
  }
}

export default Shape;
