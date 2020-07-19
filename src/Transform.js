import Matrix3 from "./Matrix";
import Vector from "./core/Vector";
// import Vector from "./Vector";

export const applyMatrix = (point, mat3) => {
  if (Array.isArray(point)) {
    point.forEach(p => applyMatrix(p, mat3));
  } else {
    if (point.startPoint) {
      point.startPoint = applyMatrix(point.startPoint, mat3);
      point.endPoint = applyMatrix(point.endPoint, mat3);
      point.handleOne = applyMatrix(point.handleOne, mat3);
      point.handleTwo = applyMatrix(point.handleTwo, mat3);
    } else {
      const clone = point.clone();
      const x = mat3.a * clone.x + mat3.b * clone.y + mat3.tx * 1;
      const y = mat3.c * clone.x + mat3.d * clone.y + mat3.ty * 1;
      point.set(x, y);
    }
    return point;
  }
};

export const getCenter = shape => {
  const {
    aabb: { min, max }
  } = shape;

  return max
    .clone()
    .sub(min)
    .mulScalar(0.5)
    .add(min);

  // const { position, width, height } = shape;

  // return position.clone().add(new Vector(width, height).mulScalar(0.5));
};

export const degToRad = rad => (rad / 180) * Math.PI;

export const radToDeg = deg => (deg / Math.PI) * 180;

export const rotate = (shape, deg) => {
  const angle = degToRad(deg);
  const mat3 = createRotationMatrix(angle, shape.center);
  shape.path.forEach(point => {
    applyMatrix(point, mat3);
  });

  update(shape, { rotation: new Vector(angle, 0) });
};

export const translate = (shape, position) => {
  const distance = position.clone().sub(shape.position.clone());
  const mat3 = createTranslationMatrix(distance);
  shape.path.forEach(point => {
    applyMatrix(point, mat3);
  });

  update(shape, { position, center: shape.center.clone().sub(distance) });
};

export const scale = (shape, scale) => {
  const mat3 = createScaleMatrix(
    scale,
    shape.center,
    degToRad(shape.rotation.x)
  );
  shape.path.forEach(point => {
    applyMatrix(point, mat3);
  });

  // @NOTE: scale is not being updated
};

// Limiting to
export const update = (shape, changes) => {
  Object.keys(changes).forEach(key => {
    if (shape[key]) {
      if (changes[key] instanceof Vector) {
        shape[key].copy(changes[key]);
      }
    }
  });
};

export const createTranslationMatrix = distance => {
  return new Matrix3(1, 0, 0, 1, 0, 0, distance.x, distance.y, 1);
};

export const createScaleMatrix = (scale, pivot, angle) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const mcos = Math.cos(-angle);
  const msin = Math.sin(-angle);

  // Bring to origin
  const translate = createTranslationMatrix(pivot.clone().mulScalar(-1));

  // Align object with y-axis
  const rotation = new Matrix3(cos, sin, -sin, cos, 0, 0, 0, 0, 1);

  // Perform transformation
  const scaleMatrix = new Matrix3(scale.x, 0, 0, scale.y, 0, 0, 0, 0, 1);

  // Bring back to original rotation
  const counterRotation = new Matrix3(mcos, msin, -msin, mcos, 0, 0, 0, 0, 1);

  // Bring back to original position
  const reverseTranlsate = createTranslationMatrix(pivot);

  return Matrix3.compose(
    reverseTranlsate,
    rotation,
    scaleMatrix,
    counterRotation,
    translate
  );
};

export const createRotationMatrix = (angle, pivot) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const saveMatrix = createTranslationMatrix(pivot.clone().mulScalar(-1));

  const rotMatrix = new Matrix3(cos, sin, -sin, cos, 0, 0, 0, 0, 1);

  const restoreMatrix = createTranslationMatrix(pivot);

  return Matrix3.compose(
    restoreMatrix,
    rotMatrix,
    saveMatrix
  );
};
