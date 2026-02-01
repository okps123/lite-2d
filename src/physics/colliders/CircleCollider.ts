import { Vector2 } from '../../utils/Vector2';
import { Collider } from './Collider';
import type { AABB } from '../PhysicsTypes';

/**
 * CircleCollider
 * 원형 충돌체입니다.
 */
export class CircleCollider extends Collider {
  private _radius: number = 25;

  /**
   * 원의 반지름
   */
  get radius(): number {
    return this._radius;
  }

  set radius(value: number) {
    this._radius = Math.max(0.1, value);
  }

  /**
   * 경계 상자 계산 (원을 감싸는 AABB)
   */
  computeBounds(): AABB {
    const worldPos = this.getWorldPosition();

    return {
      min: new Vector2(worldPos.x - this._radius, worldPos.y - this._radius),
      max: new Vector2(worldPos.x + this._radius, worldPos.y + this._radius),
    };
  }

  /**
   * 점이 CircleCollider 내부에 있는지 확인
   */
  containsPoint(point: Vector2): boolean {
    const worldPos = this.getWorldPosition();
    const distanceSquared = point.subtract(worldPos).lengthSquared();
    return distanceSquared <= this._radius * this._radius;
  }

  /**
   * 디버그용 렌더링 (optional)
   */
  render(_ctx: CanvasRenderingContext2D): void {
    if (!this.enabled) return;

    // TODO: 나중에 디버그 모드에서 경계 표시
    // const worldPos = this.getWorldPosition();
    // ctx.beginPath();
    // ctx.arc(worldPos.x, worldPos.y, this._radius, 0, Math.PI * 2);
    // ctx.strokeStyle = this._isTrigger ? 'yellow' : 'green';
    // ctx.stroke();
  }
}
