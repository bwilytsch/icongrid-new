// a = point1, b = point2, c = center
export const angleAroundCenter = (a, b, c) => {
  const ac = a
    .clone()
    .sub(c)
    .normalize();
  const bc = b
    .clone()
    .sub(c)
    .normalize();

  // const dot = Vector.dotProduct(ac, bc);

  // const magAC = ac.mag();
  // const magBC = bc.mag();

  // console.log(dot / magAC / magBC);

  let angle = Math.atan2(bc.y, bc.x) - Math.atan2(ac.y, ac.x);

  if (angle < 0) {
    angle += 2 * Math.PI;
  }

  return angle;
};
