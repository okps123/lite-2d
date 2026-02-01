import { Vector2 } from '../../utils/Vector2';
import type { Collider } from '../colliders/Collider';
import { BoxCollider } from '../colliders/BoxCollider';
import { CircleCollider } from '../colliders/CircleCollider';

/**
 * Raycast Hit 정보
 */
export interface RaycastHit {
  /** 충돌한 Collider */
  collider: Collider;
  /** 충돌 지점 */
  point: Vector2;
  /** 충돌 법선 */
  normal: Vector2;
  /** Ray 원점으로부터의 거리 */
  distance: number;
}

/**
 * Raycast 유틸리티
 * Ray와 Collider 간의 교차 검사를 수행합니다.
 */
export class Raycast {
  /**
   * Ray와 AABB의 교차 검사
   */
  static raycastAABB(
    origin: Vector2,
    direction: Vector2,
    collider: BoxCollider,
    maxDistance: number
  ): RaycastHit | null {
    const bounds = collider.getBounds();

    // Slab method (Andrew Woo의 알고리즘)
    let tmin = 0;
    let tmax = maxDistance;

    // X축 검사
    if (Math.abs(direction.x) < 0.0001) {
      // Ray가 X축에 평행
      if (origin.x < bounds.min.x || origin.x > bounds.max.x) {
        return null;
      }
    } else {
      const invD = 1.0 / direction.x;
      let t1 = (bounds.min.x - origin.x) * invD;
      let t2 = (bounds.max.x - origin.x) * invD;

      if (t1 > t2) {
        [t1, t2] = [t2, t1];
      }

      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);

      if (tmin > tmax) {
        return null;
      }
    }

    // Y축 검사
    if (Math.abs(direction.y) < 0.0001) {
      // Ray가 Y축에 평행
      if (origin.y < bounds.min.y || origin.y > bounds.max.y) {
        return null;
      }
    } else {
      const invD = 1.0 / direction.y;
      let t1 = (bounds.min.y - origin.y) * invD;
      let t2 = (bounds.max.y - origin.y) * invD;

      if (t1 > t2) {
        [t1, t2] = [t2, t1];
      }

      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);

      if (tmin > tmax) {
        return null;
      }
    }

    // tmin이 0보다 작으면 Ray 원점이 AABB 내부
    const t = tmin >= 0 ? tmin : tmax;
    if (t < 0 || t > maxDistance) {
      return null;
    }

    // 충돌 지점
    const point = origin.add(direction.multiply(t));

    // 법선 계산 (어느 면에 충돌했는지)
    let normal: Vector2;
    const epsilon = 0.0001;

    if (Math.abs(point.x - bounds.min.x) < epsilon) {
      normal = new Vector2(-1, 0); // 왼쪽 면
    } else if (Math.abs(point.x - bounds.max.x) < epsilon) {
      normal = new Vector2(1, 0); // 오른쪽 면
    } else if (Math.abs(point.y - bounds.min.y) < epsilon) {
      normal = new Vector2(0, -1); // 위쪽 면
    } else {
      normal = new Vector2(0, 1); // 아래쪽 면
    }

    return {
      collider: collider,
      point: point,
      normal: normal,
      distance: t,
    };
  }

  /**
   * Ray와 Circle의 교차 검사
   */
  static raycastCircle(
    origin: Vector2,
    direction: Vector2,
    collider: CircleCollider,
    maxDistance: number
  ): RaycastHit | null {
    const center = collider.getWorldPosition();
    const radius = collider.radius;

    // Ray 원점에서 Circle 중심으로의 벡터
    const oc = origin.subtract(center);

    // 2차 방정식 계수
    // t^2 * (d·d) + t * 2(oc·d) + (oc·oc - r²) = 0
    const a = direction.dot(direction);
    const b = 2.0 * oc.dot(direction);
    const c = oc.dot(oc) - radius * radius;

    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return null; // 교차 없음
    }

    // 더 가까운 교점 찾기
    const sqrtD = Math.sqrt(discriminant);
    let t = (-b - sqrtD) / (2.0 * a);

    // 첫 번째 교점이 음수면 두 번째 교점 사용 (Ray 원점이 Circle 내부)
    if (t < 0) {
      t = (-b + sqrtD) / (2.0 * a);
    }

    if (t < 0 || t > maxDistance) {
      return null;
    }

    // 충돌 지점
    const point = origin.add(direction.multiply(t));

    // 법선 계산 (중심에서 충돌 지점 방향)
    const normal = point.subtract(center).normalize();

    return {
      collider: collider,
      point: point,
      normal: normal,
      distance: t,
    };
  }

  /**
   * Ray와 Collider의 교차 검사 (다형성 디스패처)
   */
  static raycastCollider(
    origin: Vector2,
    direction: Vector2,
    collider: Collider,
    maxDistance: number
  ): RaycastHit | null {
    if (collider instanceof BoxCollider) {
      return this.raycastAABB(origin, direction, collider, maxDistance);
    } else if (collider instanceof CircleCollider) {
      return this.raycastCircle(origin, direction, collider, maxDistance);
    }
    return null;
  }
}
