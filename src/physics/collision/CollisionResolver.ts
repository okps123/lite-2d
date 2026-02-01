import { RigidBody } from '../RigidBody';
import { BodyType, PhysicsConstants } from '../PhysicsTypes';
import type { CollisionInfo } from './CollisionInfo';

/**
 * 충돌 해결
 * Impulse 기반 충돌 해결을 수행합니다.
 */
export class CollisionResolver {
  /**
   * 충돌 해결 (메인 메서드)
   */
  static resolve(info: CollisionInfo): void {
    const bodyA = info.colliderA.gameObject?.getComponent(RigidBody);
    const bodyB = info.colliderB.gameObject?.getComponent(RigidBody);

    if (!bodyA || !bodyB) return;

    // Static 물체끼리는 충돌 해결 불필요
    if (bodyA.bodyType === BodyType.STATIC && bodyB.bodyType === BodyType.STATIC) {
      return;
    }

    // 1. Positional Correction (침투 보정)
    this.resolvePositionalCorrection(info, bodyA, bodyB);

    // 2. Impulse Resolution (속도 해결)
    this.resolveImpulse(info, bodyA, bodyB);
  }

  /**
   * 위치 보정만 수행 (Iteration용)
   */
  static resolvePositionOnly(info: CollisionInfo): void {
    const bodyA = info.colliderA.gameObject?.getComponent(RigidBody);
    const bodyB = info.colliderB.gameObject?.getComponent(RigidBody);

    if (!bodyA || !bodyB) return;

    // Static 물체끼리는 충돌 해결 불필요
    if (bodyA.bodyType === BodyType.STATIC && bodyB.bodyType === BodyType.STATIC) {
      return;
    }

    // Positional Correction만 수행
    this.resolvePositionalCorrection(info, bodyA, bodyB);
  }

  /**
   * Positional Correction (침투 보정)
   * 겹친 물체를 분리합니다.
   */
  private static resolvePositionalCorrection(
    info: CollisionInfo,
    bodyA: RigidBody,
    bodyB: RigidBody
  ): void {
    const percent = PhysicsConstants.CORRECTION_PERCENT;
    const slop = PhysicsConstants.CORRECTION_SLOP;

    // 보정할 침투 깊이 계산 (slop 이하는 무시)
    const correctionDepth = Math.max(info.penetration - slop, 0);
    if (correctionDepth <= 0) return;

    // 총 inverse mass
    const totalInverseMass = bodyA.inverseMass + bodyB.inverseMass;
    if (totalInverseMass === 0) return;

    // 보정 벡터 계산
    const correction = info.normal.multiply((correctionDepth / totalInverseMass) * percent);

    // A를 법선 반대 방향으로 이동
    if (bodyA.bodyType === BodyType.DYNAMIC && bodyA.gameObject) {
      const posA = bodyA.gameObject.transform.position;
      bodyA.gameObject.transform.position = posA.subtract(
        correction.multiply(bodyA.inverseMass)
      );
    }

    // B를 법선 방향으로 이동
    if (bodyB.bodyType === BodyType.DYNAMIC && bodyB.gameObject) {
      const posB = bodyB.gameObject.transform.position;
      bodyB.gameObject.transform.position = posB.add(correction.multiply(bodyB.inverseMass));
    }
  }

  /**
   * Impulse Resolution (충격량 해결)
   * 속도를 반영하여 물체를 튕겨냅니다.
   */
  private static resolveImpulse(
    info: CollisionInfo,
    bodyA: RigidBody,
    bodyB: RigidBody
  ): void {
    // 상대 속도 계산
    const relativeVel = bodyB.velocity.subtract(bodyA.velocity);
    const velAlongNormal = relativeVel.dot(info.normal);

    // 이미 분리 중이면 무시 (접근하지 않음)
    if (velAlongNormal > 0) return;

    // 반발 계수 (두 재질 중 작은 값 사용)
    const e = Math.min(info.colliderA.material.restitution, info.colliderB.material.restitution);

    // Impulse 크기 계산
    // j = -(1 + e) * velAlongNormal / (invMassA + invMassB)
    const totalInverseMass = bodyA.inverseMass + bodyB.inverseMass;
    if (totalInverseMass === 0) return;

    const j = (-(1 + e) * velAlongNormal) / totalInverseMass;

    // Impulse 벡터
    const impulse = info.normal.multiply(j);

    // 속도 적용
    if (bodyA.bodyType === BodyType.DYNAMIC) {
      bodyA.velocity = bodyA.velocity.subtract(impulse.multiply(bodyA.inverseMass));
    }
    if (bodyB.bodyType === BodyType.DYNAMIC) {
      bodyB.velocity = bodyB.velocity.add(impulse.multiply(bodyB.inverseMass));
    }

    // 마찰 적용
    this.resolveFriction(info, bodyA, bodyB, j);
  }

  /**
   * 마찰력 적용 (Coulomb's law)
   */
  private static resolveFriction(
    info: CollisionInfo,
    bodyA: RigidBody,
    bodyB: RigidBody,
    normalImpulseMagnitude: number
  ): void {
    // 상대 속도 재계산 (Impulse 적용 후)
    const relativeVel = bodyB.velocity.subtract(bodyA.velocity);

    // 접선 방향 계산 (법선에 수직)
    const normalVel = info.normal.multiply(relativeVel.dot(info.normal));
    const tangentVel = relativeVel.subtract(normalVel);

    // 접선 속도가 0이면 마찰 없음
    if (tangentVel.lengthSquared() < 0.0001) return;

    const tangent = tangentVel.normalize();

    // 마찰 계수 결합 (기하 평균)
    const friction = Math.sqrt(
      info.colliderA.material.friction * info.colliderB.material.friction
    );

    // 접선 impulse 크기 계산
    const totalInverseMass = bodyA.inverseMass + bodyB.inverseMass;
    if (totalInverseMass === 0) return;

    const jt = -relativeVel.dot(tangent) / totalInverseMass;

    // Coulomb's law: 마찰력은 수직항력(normalImpulse)의 friction 배를 초과할 수 없음
    const maxFriction = Math.abs(normalImpulseMagnitude) * friction;
    const frictionImpulseMagnitude = Math.max(
      -maxFriction,
      Math.min(jt, maxFriction)
    );

    // 마찰 impulse 벡터
    const frictionImpulse = tangent.multiply(frictionImpulseMagnitude);

    // 속도 적용
    if (bodyA.bodyType === BodyType.DYNAMIC) {
      bodyA.velocity = bodyA.velocity.subtract(frictionImpulse.multiply(bodyA.inverseMass));
    }
    if (bodyB.bodyType === BodyType.DYNAMIC) {
      bodyB.velocity = bodyB.velocity.add(frictionImpulse.multiply(bodyB.inverseMass));
    }
  }
}
