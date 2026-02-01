import { Vector2 } from '../../utils/Vector2';
import type { Collider } from '../colliders/Collider';
import { BoxCollider } from '../colliders/BoxCollider';
import { CircleCollider } from '../colliders/CircleCollider';
import { CollisionInfo } from './CollisionInfo';
import type { ContactPoint } from '../PhysicsTypes';

/**
 * 충돌 감지 알고리즘
 * Narrow Phase 충돌 검사를 수행합니다.
 */
export class CollisionDetection {
  /**
   * 두 Collider 간의 충돌 검사 (다형성 디스패처)
   */
  static detect(a: Collider, b: Collider): CollisionInfo | null {
    if (a instanceof BoxCollider && b instanceof BoxCollider) {
      return this.testAABB(a, b);
    } else if (a instanceof CircleCollider && b instanceof CircleCollider) {
      return this.testCircleCircle(a, b);
    } else if (a instanceof BoxCollider && b instanceof CircleCollider) {
      return this.testAABBCircle(a, b);
    } else if (a instanceof CircleCollider && b instanceof BoxCollider) {
      const info = this.testAABBCircle(b, a);
      if (info) {
        info.swapColliders();
      }
      return info;
    }
    return null;
  }

  /**
   * AABB vs AABB 충돌 검사 (SAT 사용)
   */
  static testAABB(a: BoxCollider, b: BoxCollider): CollisionInfo | null {
    const boundsA = a.getBounds();
    const boundsB = b.getBounds();

    // AABB 겹침 검사
    if (
      boundsA.max.x < boundsB.min.x ||
      boundsA.min.x > boundsB.max.x ||
      boundsA.max.y < boundsB.min.y ||
      boundsA.min.y > boundsB.max.y
    ) {
      return null; // 충돌 없음
    }

    // 침투 깊이 계산 (각 축에서)
    const overlapX1 = boundsA.max.x - boundsB.min.x; // A의 오른쪽 - B의 왼쪽
    const overlapX2 = boundsB.max.x - boundsA.min.x; // B의 오른쪽 - A의 왼쪽
    const overlapY1 = boundsA.max.y - boundsB.min.y; // A의 아래 - B의 위
    const overlapY2 = boundsB.max.y - boundsA.min.y; // B의 아래 - A의 위

    const overlapX = Math.min(overlapX1, overlapX2);
    const overlapY = Math.min(overlapY1, overlapY2);

    // MTV (Minimum Translation Vector) 계산
    let normal: Vector2;
    let penetration: number;

    if (overlapX < overlapY) {
      // X축이 최소 침투
      penetration = overlapX;
      normal = overlapX1 < overlapX2 ? new Vector2(1, 0) : new Vector2(-1, 0);
    } else {
      // Y축이 최소 침투
      penetration = overlapY;
      normal = overlapY1 < overlapY2 ? new Vector2(0, 1) : new Vector2(0, -1);
    }

    // 접촉점 계산 (중심 지점)
    const contactPoint: ContactPoint = {
      point: new Vector2(
        Math.max(boundsA.min.x, boundsB.min.x) + Math.min(boundsA.max.x, boundsB.max.x)
      ).multiply(0.5),
      normal: normal,
      penetration: penetration,
    };

    return new CollisionInfo(a, b, [contactPoint], normal, penetration);
  }

  /**
   * Circle vs Circle 충돌 검사
   */
  static testCircleCircle(a: CircleCollider, b: CircleCollider): CollisionInfo | null {
    const posA = a.getWorldPosition();
    const posB = b.getWorldPosition();

    const delta = posB.subtract(posA);
    const distanceSquared = delta.lengthSquared();
    const radiusSum = a.radius + b.radius;

    if (distanceSquared >= radiusSum * radiusSum) {
      return null; // 충돌 없음
    }

    const distance = Math.sqrt(distanceSquared);
    const penetration = radiusSum - distance;

    // 법선 벡터 (A -> B 방향)
    let normal: Vector2;
    if (distance > 0.0001) {
      normal = delta.normalize();
    } else {
      // 정확히 같은 위치 (기본 법선 사용)
      normal = new Vector2(1, 0);
    }

    // 접촉점 (두 원의 경계 지점)
    const contactPos = posA.add(normal.multiply(a.radius));
    const contactPoint: ContactPoint = {
      point: contactPos,
      normal: normal,
      penetration: penetration,
    };

    return new CollisionInfo(a, b, [contactPoint], normal, penetration);
  }

  /**
   * AABB vs Circle 충돌 검사 (Closest Point 방식)
   */
  static testAABBCircle(box: BoxCollider, circle: CircleCollider): CollisionInfo | null {
    const boxBounds = box.getBounds();
    const circlePos = circle.getWorldPosition();

    // AABB에서 Circle 중심에 가장 가까운 점 찾기
    const closestX = Math.max(boxBounds.min.x, Math.min(circlePos.x, boxBounds.max.x));
    const closestY = Math.max(boxBounds.min.y, Math.min(circlePos.y, boxBounds.max.y));
    const closest = new Vector2(closestX, closestY);

    // Circle 중심에서 가장 가까운 점까지의 거리
    const delta = circlePos.subtract(closest);
    const distanceSquared = delta.lengthSquared();

    if (distanceSquared >= circle.radius * circle.radius) {
      return null; // 충돌 없음
    }

    const distance = Math.sqrt(distanceSquared);
    const penetration = circle.radius - distance;

    // 법선 벡터
    let normal: Vector2;
    if (distance > 0.0001) {
      // Circle 밖에서 충돌
      normal = delta.normalize();
    } else {
      // Circle 중심이 AABB 내부에 있음
      // 가장 가까운 AABB 경계를 찾아 법선 계산
      const distToLeft = circlePos.x - boxBounds.min.x;
      const distToRight = boxBounds.max.x - circlePos.x;
      const distToTop = circlePos.y - boxBounds.min.y;
      const distToBottom = boxBounds.max.y - circlePos.y;

      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

      if (minDist === distToLeft) {
        normal = new Vector2(-1, 0);  // 왼쪽 면 가까움 -> 왼쪽으로 밀어냄
      } else if (minDist === distToRight) {
        normal = new Vector2(1, 0);   // 오른쪽 면 가까움 -> 오른쪽으로 밀어냄
      } else if (minDist === distToTop) {
        normal = new Vector2(0, -1);  // 위쪽 면 가까움 -> 위로 밀어냄
      } else {
        normal = new Vector2(0, 1);   // 아래쪽 면 가까움 -> 아래로 밀어냄
      }
    }

    // 접촉점
    const contactPoint: ContactPoint = {
      point: closest,
      normal: normal,
      penetration: penetration,
    };

    return new CollisionInfo(box, circle, [contactPoint], normal, penetration);
  }
}
