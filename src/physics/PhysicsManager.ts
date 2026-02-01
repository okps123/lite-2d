import { Vector2 } from '../utils/Vector2';
import { RigidBody } from './RigidBody';
import type { Collider } from './colliders/Collider';
import { CollisionDetection } from './collision/CollisionDetection';
import { CollisionResolver } from './collision/CollisionResolver';
import { CollisionInfo } from './collision/CollisionInfo';
import { Raycast, RaycastHit } from './collision/Raycast';
import { PhysicsConstants, CollisionEvent, BodyType } from './PhysicsTypes';

/**
 * PhysicsManager (Singleton)
 * 물리 시스템 전체를 관리합니다.
 */
export class PhysicsManager {
  private static _instance: PhysicsManager | null = null;

  private _rigidbodies: Set<RigidBody> = new Set();
  private _colliders: Set<Collider> = new Set();

  private _gravity: Vector2 = PhysicsConstants.GRAVITY.clone();
  private _fixedTimestep: number = PhysicsConstants.FIXED_TIMESTEP;
  private _accumulator: number = 0;

  // 충돌 쌍 추적 (ColliderID1-ColliderID2 -> CollisionInfo)
  private _collisionPairs: Map<string, CollisionInfo> = new Map();

  private constructor() {
    // Singleton
  }

  /**
   * Singleton 인스턴스 가져오기
   */
  static getInstance(): PhysicsManager {
    if (!PhysicsManager._instance) {
      PhysicsManager._instance = new PhysicsManager();
    }
    return PhysicsManager._instance;
  }

  /**
   * 중력 설정
   */
  get gravity(): Vector2 {
    return this._gravity;
  }

  set gravity(value: Vector2) {
    this._gravity = value;
  }

  /**
   * Fixed Timestep 설정
   */
  get fixedTimestep(): number {
    return this._fixedTimestep;
  }

  set fixedTimestep(value: number) {
    this._fixedTimestep = Math.max(0.001, value);
  }

  /**
   * RigidBody 등록
   */
  registerRigidbody(body: RigidBody): void {
    this._rigidbodies.add(body);
  }

  /**
   * RigidBody 제거
   */
  unregisterRigidbody(body: RigidBody): void {
    this._rigidbodies.delete(body);
  }

  /**
   * Collider 등록
   */
  registerCollider(collider: Collider): void {
    this._colliders.add(collider);
  }

  /**
   * Collider 제거
   */
  unregisterCollider(collider: Collider): void {
    this._colliders.delete(collider);
  }

  /**
   * 물리 업데이트 (Engine.update에서 호출)
   */
  update(deltaTime: number): void {
    // Fixed Timestep Accumulator
    this._accumulator += deltaTime;

    // Accumulator 최대값 제한 (Spiral of Death 방지)
    const maxAccumulator = this._fixedTimestep * 5;
    if (this._accumulator > maxAccumulator) {
      this._accumulator = maxAccumulator;
    }

    // Fixed Timestep만큼 물리 업데이트
    while (this._accumulator >= this._fixedTimestep) {
      this.fixedUpdate(this._fixedTimestep);
      this._accumulator -= this._fixedTimestep;
    }
  }

  /**
   * 고정 타임스텝 물리 업데이트
   */
  private fixedUpdate(dt: number): void {
    // 1. RigidBody 물리 업데이트
    for (const body of this._rigidbodies) {
      if (body.enabled && body.bodyType === BodyType.DYNAMIC && !body.isSleeping) {
        body.fixedUpdate(dt);
      }
    }

    // 2. Collider Bounds 업데이트
    for (const collider of this._colliders) {
      if (collider.enabled) {
        collider.updateBounds();
      }
    }

    // 3. 이전 충돌 상태 저장
    for (const collider of this._colliders) {
      if (collider.enabled) {
        collider.updateCollisionState();
      }
    }

    // 4. Broad Phase (Brute Force - 모든 쌍 검사)
    const potentialPairs: Array<[Collider, Collider]> = [];
    const colliderArray = Array.from(this._colliders).filter((c) => c.enabled);

    for (let i = 0; i < colliderArray.length; i++) {
      for (let j = i + 1; j < colliderArray.length; j++) {
        potentialPairs.push([colliderArray[i], colliderArray[j]]);
      }
    }

    // 5. Narrow Phase (정밀 충돌 감지)
    const currentCollisions = new Map<string, CollisionInfo>();

    for (const [a, b] of potentialPairs) {
      // AABB Broad Phase 추가 검사 (성능 최적화)
      if (!this.aabbOverlap(a.getBounds(), b.getBounds())) {
        continue;
      }

      const info = CollisionDetection.detect(a, b);
      if (info) {
        const key = this.collisionPairKey(a, b);
        currentCollisions.set(key, info);

        // 충돌 상태 기록
        a.addCollision(b);
        b.addCollision(a);
      }
    }

    // 6. 충돌 해결

    // 6-1. Position Solver (위치 보정 반복)
    const iterations = PhysicsConstants.POSITION_ITERATIONS;
    for (let iter = 0; iter < iterations; iter++) {
      // Bounds 업데이트
      for (const collider of this._colliders) {
        if (collider.enabled) {
          collider.updateBounds();
        }
      }

      // 모든 충돌 쌍에 대해 위치 보정
      for (const [_key, info] of currentCollisions) {
        const a = info.colliderA;
        const b = info.colliderB;

        if (!a.isTrigger && !b.isTrigger) {
          const updatedInfo = CollisionDetection.detect(a, b);
          if (updatedInfo) {
            CollisionResolver.resolvePositionOnly(updatedInfo);
          }
        }
      }
    }

    // 6-2. Velocity Solver (Impulse 적용 - 한 번)
    for (const [_key, info] of currentCollisions) {
      const a = info.colliderA;
      const b = info.colliderB;

      if (!a.isTrigger && !b.isTrigger) {
        // 최종 충돌 정보로 Impulse 적용
        const finalInfo = CollisionDetection.detect(a, b);
        if (finalInfo) {
          // resolve()는 position과 velocity를 모두 처리하지만
          // 이미 position solver로 안정화되었으므로 positional correction은 최소화됨
          CollisionResolver.resolve(finalInfo);
        }
      }
    }

    // 7. 충돌 이벤트 디스패치
    this.dispatchCollisionEvents(currentCollisions);

    // 7. 이전 충돌 정보 업데이트
    this._collisionPairs = currentCollisions;
  }

  /**
   * AABB 겹침 검사 (Broad Phase 추가 최적화)
   */
  private aabbOverlap(a: any, b: any): boolean {
    return !(
      a.max.x < b.min.x ||
      a.min.x > b.max.x ||
      a.max.y < b.min.y ||
      a.min.y > b.max.y
    );
  }

  /**
   * 충돌 쌍 키 생성
   */
  private collisionPairKey(a: Collider, b: Collider): string {
    const idA = a.id;
    const idB = b.id;
    return idA < idB ? `${idA}-${idB}` : `${idB}-${idA}`;
  }

  /**
   * 충돌 이벤트 디스패치
   */
  private dispatchCollisionEvents(currentCollisions: Map<string, CollisionInfo>): void {
    const allColliders = Array.from(this._colliders).filter((c) => c.enabled);

    // Enter 및 Stay 이벤트
    for (const [_key, info] of currentCollisions) {
      const a = info.colliderA;
      const b = info.colliderB;

      // A -> B 이벤트
      if (a.gameObject) {
        const collisionEvent: CollisionEvent = {
          other: b,
          contact: info.contacts[0],
          normal: info.normal,
          penetration: info.penetration,
        };

        if (a.isCollisionEnter(b)) {
          if (a.isTrigger || b.isTrigger) {
            a.gameObject.onTriggerEnter?.(b);
          } else {
            a.gameObject.onCollisionEnter?.(collisionEvent);
          }
        } else if (a.isCollisionStay(b)) {
          if (a.isTrigger || b.isTrigger) {
            a.gameObject.onTriggerStay?.(b);
          } else {
            a.gameObject.onCollisionStay?.(collisionEvent);
          }
        }
      }

      // B -> A 이벤트
      if (b.gameObject) {
        const collisionEvent: CollisionEvent = {
          other: a,
          contact: info.contacts[0],
          normal: info.normal.multiply(-1), // 법선 반전
          penetration: info.penetration,
        };

        if (b.isCollisionEnter(a)) {
          if (a.isTrigger || b.isTrigger) {
            b.gameObject.onTriggerEnter?.(a);
          } else {
            b.gameObject.onCollisionEnter?.(collisionEvent);
          }
        } else if (b.isCollisionStay(a)) {
          if (a.isTrigger || b.isTrigger) {
            b.gameObject.onTriggerStay?.(a);
          } else {
            b.gameObject.onCollisionStay?.(collisionEvent);
          }
        }
      }
    }

    // Exit 이벤트
    for (const collider of allColliders) {
      for (const otherCollider of allColliders) {
        if (collider === otherCollider) continue;

        if (collider.isCollisionExit(otherCollider)) {
          if (collider.gameObject) {
            if (collider.isTrigger || otherCollider.isTrigger) {
              collider.gameObject.onTriggerExit?.(otherCollider);
            } else {
              collider.gameObject.onCollisionExit?.(otherCollider);
            }
          }
        }
      }
    }
  }

  /**
   * Raycast (단일 충돌 검사)
   */
  raycast(origin: Vector2, direction: Vector2, maxDistance: number = 1000): RaycastHit | null {
    const dir = direction.normalize();
    let closestHit: RaycastHit | null = null;
    let closestDistance = maxDistance;

    for (const collider of this._colliders) {
      if (!collider.enabled) continue;

      const hit = Raycast.raycastCollider(origin, dir, collider, maxDistance);
      if (hit && hit.distance < closestDistance) {
        closestHit = hit;
        closestDistance = hit.distance;
      }
    }

    return closestHit;
  }

  /**
   * RaycastAll (모든 충돌 검사)
   */
  raycastAll(origin: Vector2, direction: Vector2, maxDistance: number = 1000): RaycastHit[] {
    const dir = direction.normalize();
    const hits: RaycastHit[] = [];

    for (const collider of this._colliders) {
      if (!collider.enabled) continue;

      const hit = Raycast.raycastCollider(origin, dir, collider, maxDistance);
      if (hit) {
        hits.push(hit);
      }
    }

    // 거리 기준 정렬
    hits.sort((a, b) => a.distance - b.distance);
    return hits;
  }

  /**
   * 원형 영역 내 Collider 검사
   */
  overlapCircle(center: Vector2, radius: number): Collider[] {
    const result: Collider[] = [];

    for (const collider of this._colliders) {
      if (!collider.enabled) continue;

      const colliderPos = collider.getWorldPosition();
      const distance = colliderPos.distance(center);

      // 간단한 거리 검사 (정확하지 않지만 빠름)
      if (distance <= radius + 50) {
        // 50은 대략적인 Collider 크기 추정
        result.push(collider);
      }
    }

    return result;
  }

  /**
   * 물리 시스템 초기화
   */
  reset(): void {
    this._rigidbodies.clear();
    this._colliders.clear();
    this._collisionPairs.clear();
    this._accumulator = 0;
  }
}
