import { Vector2 } from '../../utils/Vector2';
import { Collider } from './Collider';
import type { AABB } from '../PhysicsTypes';

/**
 * BoxCollider (AABB - Axis-Aligned Bounding Box)
 * 회전하지 않는 박스 충돌체입니다.
 */
export class BoxCollider extends Collider {
  private _size: Vector2 = new Vector2(50, 50);

  /**
   * 박스 크기 (width, height)
   */
  get size(): Vector2 {
    return this._size;
  }

  set size(value: Vector2) {
    this._size = value;
  }

  /**
   * 경계 상자 계산
   */
  computeBounds(): AABB {
    const worldPos = this.getWorldPosition();
    const halfSize = this._size.multiply(0.5);

    return {
      min: new Vector2(worldPos.x - halfSize.x, worldPos.y - halfSize.y),
      max: new Vector2(worldPos.x + halfSize.x, worldPos.y + halfSize.y),
    };
  }

  /**
   * 점이 BoxCollider 내부에 있는지 확인
   */
  containsPoint(point: Vector2): boolean {
    const bounds = this.getBounds();
    return (
      point.x >= bounds.min.x &&
      point.x <= bounds.max.x &&
      point.y >= bounds.min.y &&
      point.y <= bounds.max.y
    );
  }

  /**
   * 디버그용 렌더링 (optional)
   */
  render(_ctx: CanvasRenderingContext2D): void {
    if (!this.enabled) return;

    // TODO: 나중에 디버그 모드에서 경계 표시
    // const bounds = this.getBounds();
    // ctx.strokeStyle = this._isTrigger ? 'yellow' : 'green';
    // ctx.strokeRect(
    //   bounds.min.x,
    //   bounds.min.y,
    //   bounds.max.x - bounds.min.x,
    //   bounds.max.y - bounds.min.y
    // );
  }
}
