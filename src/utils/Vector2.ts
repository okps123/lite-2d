/**
 * 2D 벡터 클래스
 * 위치, 방향, 속도 등을 표현하는 데 사용됩니다.
 */
export class Vector2 {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * 벡터 더하기
   */
  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  /**
   * 벡터 빼기
   */
  subtract(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  /**
   * 스칼라 곱셈
   */
  multiply(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  /**
   * 스칼라 나눗셈
   */
  divide(scalar: number): Vector2 {
    if (scalar === 0) {
      throw new Error('0으로 나눌 수 없습니다');
    }
    return new Vector2(this.x / scalar, this.y / scalar);
  }

  /**
   * 벡터의 길이 (magnitude)
   */
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * 벡터의 길이의 제곱 (성능 최적화용)
   */
  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * 정규화된 벡터 (길이가 1인 벡터)
   */
  normalize(): Vector2 {
    const len = this.length();
    if (len === 0) {
      return new Vector2(0, 0);
    }
    return this.divide(len);
  }

  /**
   * 내적 (dot product)
   */
  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * 다른 벡터와의 거리
   */
  distance(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 다른 벡터와의 거리의 제곱 (성능 최적화용)
   */
  distanceSquared(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  /**
   * 벡터 복사
   */
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  /**
   * 다른 벡터의 값을 복사
   */
  copy(v: Vector2): void {
    this.x = v.x;
    this.y = v.y;
  }

  /**
   * 값 설정
   */
  set(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * 두 벡터 사이의 각도 (라디안)
   */
  angle(v: Vector2): number {
    return Math.atan2(v.y - this.y, v.x - this.x);
  }

  /**
   * 벡터를 회전 (라디안)
   */
  rotate(angle: number): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  /**
   * 벡터의 문자열 표현
   */
  toString(): string {
    return `Vector2(${this.x}, ${this.y})`;
  }

  /**
   * 벡터가 같은지 비교
   */
  equals(v: Vector2, epsilon: number = 0.0001): boolean {
    return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
  }

  // 정적 메서드들

  /**
   * 제로 벡터 (0, 0)
   */
  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  /**
   * 단위 벡터 (1, 1)
   */
  static one(): Vector2 {
    return new Vector2(1, 1);
  }

  /**
   * 위쪽 벡터 (0, -1)
   */
  static up(): Vector2 {
    return new Vector2(0, -1);
  }

  /**
   * 아래쪽 벡터 (0, 1)
   */
  static down(): Vector2 {
    return new Vector2(0, 1);
  }

  /**
   * 왼쪽 벡터 (-1, 0)
   */
  static left(): Vector2 {
    return new Vector2(-1, 0);
  }

  /**
   * 오른쪽 벡터 (1, 0)
   */
  static right(): Vector2 {
    return new Vector2(1, 0);
  }

  /**
   * 두 벡터 사이를 선형 보간
   * @param a 시작 벡터
   * @param b 끝 벡터
   * @param t 보간 비율 (0~1)
   */
  static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    t = Math.max(0, Math.min(1, t)); // clamp
    return new Vector2(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t
    );
  }

  /**
   * 벡터의 최소값
   */
  static min(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(
      Math.min(a.x, b.x),
      Math.min(a.y, b.y)
    );
  }

  /**
   * 벡터의 최대값
   */
  static max(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(
      Math.max(a.x, b.x),
      Math.max(a.y, b.y)
    );
  }
}
