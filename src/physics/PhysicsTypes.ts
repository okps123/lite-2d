import { Vector2 } from '../utils/Vector2';
import type { Collider } from './colliders/Collider';

/**
 * RigidBody 타입
 */
export enum BodyType {
  /** 움직이지 않는 물체 (무한 질량) */
  STATIC,
  /** 스크립트로 제어되는 물체 (물리 영향 무시) */
  KINEMATIC,
  /** 물리 시뮬레이션이 적용되는 물체 */
  DYNAMIC,
}

/**
 * 충돌 이벤트 데이터
 */
export interface CollisionEvent {
  /** 충돌한 상대 Collider */
  other: Collider;
  /** 접촉점 정보 */
  contact: ContactPoint;
  /** 충돌 법선 벡터 */
  normal: Vector2;
  /** 침투 깊이 */
  penetration: number;
}

/**
 * 접촉점 정보
 */
export interface ContactPoint {
  /** 접촉 위치 */
  point: Vector2;
  /** 접촉 법선 */
  normal: Vector2;
  /** 침투 깊이 */
  penetration: number;
}

/**
 * AABB (Axis-Aligned Bounding Box)
 */
export interface AABB {
  /** 최소 좌표 */
  min: Vector2;
  /** 최대 좌표 */
  max: Vector2;
}

/**
 * 물리 시스템 상수
 */
export const PhysicsConstants = {
  /** 중력 가속도 (pixels/s²) */
  GRAVITY: new Vector2(0, 980),
  /** 고정 타임스텝 (초) */
  FIXED_TIMESTEP: 1 / 60,
  /** 최대 속도 제한 (pixels/s) */
  MAX_VELOCITY: 5000,
  /** Sleep 임계값 (속도) */
  SLEEP_THRESHOLD: 0.5,
  /** Sleep 타이머 (초) */
  SLEEP_TIME: 0.5,
  /** Positional Correction 비율 */
  CORRECTION_PERCENT: 0.4,
  /** Positional Correction 허용 침투 깊이 */
  CORRECTION_SLOP: 0.05,
  /** Position Solver 반복 횟수 */
  POSITION_ITERATIONS: 4,
  /** Velocity Solver 반복 횟수 */
  VELOCITY_ITERATIONS: 6,
};
