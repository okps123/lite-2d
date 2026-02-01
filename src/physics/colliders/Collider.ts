import { Component } from '../../core/Component';
import { Vector2 } from '../../utils/Vector2';
import { PhysicsMaterial } from '../PhysicsMaterial';
import type { AABB } from '../PhysicsTypes';
import type { PhysicsManager } from '../PhysicsManager';

/**
 * Collider 베이스 클래스
 * 충돌 감지를 담당합니다.
 */
export abstract class Collider extends Component {
  protected _isTrigger: boolean = false;
  protected _material: PhysicsMaterial = PhysicsMaterial.default;
  protected _offset: Vector2 = Vector2.zero();
  protected _bounds: AABB | null = null;

  // 충돌 상태 추적 (ID를 키로 사용)
  protected _currentCollisions: Set<number> = new Set();
  protected _previousCollisions: Set<number> = new Set();

  // 고유 ID (PhysicsManager에서 할당)
  private static _nextId: number = 1;
  private _id: number = Collider._nextId++;

  /**
   * Collider ID
   */
  get id(): number {
    return this._id;
  }

  /**
   * Trigger 모드 (물리 반응 없이 이벤트만)
   */
  get isTrigger(): boolean {
    return this._isTrigger;
  }

  set isTrigger(value: boolean) {
    this._isTrigger = value;
  }

  /**
   * 물리 재질
   */
  get material(): PhysicsMaterial {
    return this._material;
  }

  set material(value: PhysicsMaterial) {
    this._material = value;
  }

  /**
   * Transform 기준 오프셋
   */
  get offset(): Vector2 {
    return this._offset;
  }

  set offset(value: Vector2) {
    this._offset = value;
  }

  /**
   * 캐싱된 경계 상자
   */
  get bounds(): AABB | null {
    return this._bounds;
  }

  /**
   * 추상 메서드: 경계 상자 계산
   */
  abstract computeBounds(): AABB;

  /**
   * 추상 메서드: 점이 Collider 내부에 있는지 확인
   */
  abstract containsPoint(point: Vector2): boolean;

  /**
   * 경계 상자 업데이트
   */
  updateBounds(): void {
    this._bounds = this.computeBounds();
  }

  /**
   * 월드 위치 계산 (Transform + Offset)
   */
  getWorldPosition(): Vector2 {
    if (!this.gameObject) {
      return this._offset.clone();
    }
    return this.gameObject.transform.getWorldPosition().add(this._offset);
  }

  /**
   * 경계 상자 가져오기 (캐싱된 값 또는 재계산)
   */
  getBounds(): AABB {
    if (!this._bounds) {
      this.updateBounds();
    }
    return this._bounds!;
  }

  /**
   * 충돌 상태 업데이트
   */
  updateCollisionState(): void {
    this._previousCollisions = new Set(this._currentCollisions);
    this._currentCollisions.clear();
  }

  /**
   * 충돌 추가
   */
  addCollision(otherCollider: Collider): void {
    this._currentCollisions.add(otherCollider.id);
  }

  /**
   * Enter 이벤트가 필요한지 확인
   */
  isCollisionEnter(otherCollider: Collider): boolean {
    return (
      this._currentCollisions.has(otherCollider.id) &&
      !this._previousCollisions.has(otherCollider.id)
    );
  }

  /**
   * Stay 이벤트가 필요한지 확인
   */
  isCollisionStay(otherCollider: Collider): boolean {
    return (
      this._currentCollisions.has(otherCollider.id) &&
      this._previousCollisions.has(otherCollider.id)
    );
  }

  /**
   * Exit 이벤트가 필요한지 확인
   */
  isCollisionExit(otherCollider: Collider): boolean {
    return (
      !this._currentCollisions.has(otherCollider.id) &&
      this._previousCollisions.has(otherCollider.id)
    );
  }

  /**
   * 컴포넌트 초기화 (생성 시 호출)
   */
  awake(): void {
    // PhysicsManager에 등록
    const PhysicsManager = this.getPhysicsManager();
    if (PhysicsManager) {
      PhysicsManager.registerCollider(this);
    }
  }

  /**
   * 컴포넌트 파괴 시 호출
   */
  onDestroy(): void {
    // PhysicsManager에서 제거
    const PhysicsManager = this.getPhysicsManager();
    if (PhysicsManager) {
      PhysicsManager.unregisterCollider(this);
    }
  }

  /**
   * PhysicsManager 가져오기
   */
  private getPhysicsManager(): PhysicsManager | null {
    // 순환 참조 회피를 위해 동적 import
    try {
      const { PhysicsManager: PM } = require('../PhysicsManager');
      return PM.getInstance();
    } catch {
      return null;
    }
  }
}
