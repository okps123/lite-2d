/**
 * 물리 재질
 * 마찰과 반발 계수를 정의합니다.
 */
export class PhysicsMaterial {
  private _friction: number;
  private _restitution: number;
  private _density: number;

  /**
   * @param friction 마찰 계수 (0~1)
   * @param restitution 반발 계수 (0~1, 0=완전 비탄성, 1=완전 탄성)
   * @param density 밀도 (kg/pixel²)
   */
  constructor(friction: number = 0.4, restitution: number = 0.2, density: number = 1.0) {
    this._friction = friction;
    this._restitution = restitution;
    this._density = density;
  }

  /**
   * 마찰 계수 (0~1)
   */
  get friction(): number {
    return this._friction;
  }

  set friction(value: number) {
    this._friction = Math.max(0, Math.min(1, value));
  }

  /**
   * 반발 계수 (0~1)
   */
  get restitution(): number {
    return this._restitution;
  }

  set restitution(value: number) {
    this._restitution = Math.max(0, Math.min(1, value));
  }

  /**
   * 밀도 (kg/pixel²)
   */
  get density(): number {
    return this._density;
  }

  set density(value: number) {
    this._density = Math.max(0.001, value);
  }

  /**
   * 기본 재질 (friction: 0.4, restitution: 0.2)
   */
  static readonly default = new PhysicsMaterial(0.4, 0.2, 1.0);

  /**
   * 튀는 재질 (friction: 0.3, restitution: 0.9)
   */
  static readonly bouncy = new PhysicsMaterial(0.3, 0.9, 1.0);

  /**
   * 미끄러운 재질 (friction: 0.05, restitution: 0.1)
   */
  static readonly ice = new PhysicsMaterial(0.05, 0.1, 0.9);

  /**
   * 고무 재질 (friction: 0.9, restitution: 0.8)
   */
  static readonly rubber = new PhysicsMaterial(0.9, 0.8, 1.1);
}
