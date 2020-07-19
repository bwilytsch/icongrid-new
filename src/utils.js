export const createElement = (tag, className, value) => {
  const ele = document.createElement(tag);
  ele.className = className;
  ele.textContent = value;
  return ele;
};

export function isPointInsideAABB(point, box) {
  return (
    point.x >= box.min.x &&
    point.x <= box.max.x &&
    point.y >= box.min.y &&
    point.y <= box.max.y
  );
}

export function isAABBInsideAABB(box0, box1) {
  return (
    box0.min.x < box1.max.x &&
    box0.max.x > box1.min.x &&
    box0.min.y < box1.max.y &&
    box0.max.y > box1.min.y
  );
}

export function isPointInsideRBB(point, bb) {
  const { center, radius } = bb;
  // We assume rx === ry;

  const dP = point
    .clone()
    .sub(center)
    .mag();
  const dR = radius.x;
  return dP <= dR;
}

export function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}
