import { Vector2 } from '../../utils/Vector2';
import type { Collider } from '../colliders/Collider';
import type { ContactPoint } from '../PhysicsTypes';

/**
 * 충돌 정보
 * 두 Collider 간의 충돌 데이터를 담습니다.
 */
export class CollisionInfo {
  private _colliderA: Collider;
  private _colliderB: Collider;
  private _contacts: ContactPoint[];
  private _normal: Vector2;
  private _penetration: number;

  constructor(
    colliderA: Collider,
    colliderB: Collider,
    contacts: ContactPoint[],
    normal: Vector2,
    penetration: number
  ) {
    this._colliderA = colliderA;
    this._colliderB = colliderB;
    this._contacts = contacts;
    this._normal = normal;
    this._penetration = penetration;
  }

  /**
   * Collider A
   */
  get colliderA(): Collider {
    return this._colliderA;
  }

  /**
   * Collider B
   */
  get colliderB(): Collider {
    return this._colliderB;
  }

  /**
   * 접촉점 목록
   */
  get contacts(): ContactPoint[] {
    return this._contacts;
  }

  /**
   * 충돌 법선 (A -> B 방향)
   */
  get normal(): Vector2 {
    return this._normal;
  }

  /**
   * 침투 깊이
   */
  get penetration(): number {
    return this._penetration;
  }

  /**
   * Collider A와 B를 교환합니다.
   */
  swapColliders(): void {
    const temp = this._colliderA;
    this._colliderA = this._colliderB;
    this._colliderB = temp;

    // 법선 방향도 반전
    this._normal = this._normal.multiply(-1);
  }
}
