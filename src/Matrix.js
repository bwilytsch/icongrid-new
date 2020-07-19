class Matrix3 {
  static compose(...mats) {
    return mats.reduce((result, mat) => result.mul(mat), new Matrix3());
  }
  constructor(
    a = 1,
    b = 0,
    c = 0,
    d = 1,
    e = 0,
    f = 0,
    tx = 0,
    ty = 0,
    tz = 1
  ) {
    this.set(a, b, c, d, e, f, tx, ty, tz);
  }
  set(a, b, c, d, e, f, tx, ty, tz) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
    this.tx = tx;
    this.ty = ty;
    this.tz = tz;
    return this;
  }
  mul(mat3) {
    //  a b tx
    //  c d ty
    //  e f tz

    const a1 = this.a * mat3.a + this.b * mat3.c + this.tx * mat3.e;
    const b1 = this.a * mat3.b + this.b * mat3.d + this.tx * mat3.f;
    const tx1 = this.a * mat3.tx + this.b * mat3.ty + this.tx * mat3.tz;

    const c1 = this.c * mat3.a + this.d * mat3.c + this.ty * mat3.e;
    const d1 = this.c * mat3.b + this.d * mat3.d + this.ty * mat3.f;
    const ty1 = this.c * mat3.tx + this.d * mat3.ty + this.ty * mat3.tz;

    const e1 = this.e * mat3.a + this.f * mat3.c + this.tz * mat3.e;
    const f1 = this.e * mat3.b + this.f * mat3.d + this.tz * mat3.f;
    const tz1 = this.e * mat3.tx + this.f * mat3.ty + this.tz * mat3.tz;

    this.set(a1, b1, c1, d1, e1, f1, tx1, ty1, tz1);

    return this;
  }
  mulScalar(scalar) {
    this.a *= scalar;
    this.b *= scalar;
    this.c *= scalar;
    this.d *= scalar;
    this.e *= scalar;
    this.f *= scalar;
    this.tx *= scalar;
    this.ty *= scalar;
    this.tz *= scalar;
    return this;
  }
  copy(mat3) {
    this.a = mat3.a;
    this.b = mat3.b;
    this.c = mat3.c;
    this.d = mat3.d;
    this.e = mat3.e;
    this.f = mat3.f;
    this.tx = mat3.tx;
    this.ty = mat3.ty;
    this.tz = mat3.tz;
    return this;
  }
  clone() {
    return new Matrix3().copy(this);
  }
}

export default Matrix3;
