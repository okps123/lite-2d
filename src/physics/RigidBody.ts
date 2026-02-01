import { Component } from '../core/Component';
import { Vector2 } from '../utils/Vector2';
import { BodyType, PhysicsConstants } from './PhysicsTypes';
import type { PhysicsManager } from './PhysicsManager';

/**
 * RigidBody 컴포넌트
 * GameObject에 물리 속성을 부여합니다.
 */
export class RigidBody extends Component {
  // 물리 상태
  private _bodyType: BodyType = BodyType.DYNAMIC;
  private _mass: number = 1.0;
  private _velocity: Vector2 = Vector2.zero();
  private _angularVelocity: number = 0;
  private _acceleration: Vector2 = Vector2.zero();

  // 힘 누적
  private _force: Vector2 = Vector2.zero();
  private _torque: number = 0;

  // 옵션
  private _useGravity: boolean = true;
  private _drag: number = 0.1;
  private _angularDrag: number = 0.05;
  private _gravityScale: number = 1.0;

  // Sleep 시스템
  private _isSleeping: boolean = false;
  private _sleepTimer: number = 0;

  /**
   * RigidBody 타입
   */
  get bodyType(): BodyType {
    return this._bodyType;
  }

  set bodyType(value: BodyType) {
    this._bodyType = value;
    if (value === BodyType.DYNAMIC) {
      this.wakeUp();
    }
  }

  /**
   * 질량 (kg)
   */
  get mass(): number {
    return this._mass;
  }

  set mass(value: number) {
    this._mass = Math.max(0.001, value);
  }

  /**
   * 질량의 역수 (1/mass)
   * Static이면 0 (무한 질량)
   */
  get inverseMass(): number {
    if (this._bodyType === BodyType.STATIC) {
      return 0;
    }
    return 1 / this._mass;
  }

  /**
   * 속도 (pixels/s)
   */
  get velocity(): Vector2 {
    return this._velocity;
  }

  set velocity(value: Vector2) {
    this._velocity = value;
    if (value.lengthSquared() > 0.01) {
      this.wakeUp();
    }
  }

  /**
   * 각속도 (radians/s)
   */
  get angularVelocity(): number {
    return this._angularVelocity;
  }

  set angularVelocity(value: number) {
    this._angularVelocity = value;
    if (Math.abs(value) > 0.01) {
      this.wakeUp();
    }
  }

  /**
   * 가속도 (pixels/s²)
   */
  get acceleration(): Vector2 {
    return this._acceleration;
  }

  /**
   * 중력 적용 여부
   */
  get useGravity(): boolean {
    return this._useGravity;
  }

  set useGravity(value: boolean) {
    this._useGravity = value;
  }

  /**
   * 선형 저항 (0~1)
   */
  get drag(): number {
    return this._drag;
  }

  set drag(value: number) {
    this._drag = Math.max(0, Math.min(1, value));
  }

  /**
   * 각 저항 (0~1)
   */
  get angularDrag(): number {
    return this._angularDrag;
  }

  set angularDrag(value: number) {
    this._angularDrag = Math.max(0, Math.min(1, value));
  }

  /**
   * 중력 스케일 (기본 1.0)
   */
  get gravityScale(): number {
    return this._gravityScale;
  }

  set gravityScale(value: number) {
    this._gravityScale = value;
  }

  /**
   * Sleep 상태 여부
   */
  get isSleeping(): boolean {
    return this._isSleeping;
  }

  /**
   * 힘 추가 (F = ma 방식)
   * @param force 힘 벡터 (pixels/s²)
   */
  addForce(force: Vector2): void {
    if (this._bodyType !== BodyType.DYNAMIC) return;

    this._force = this._force.add(force);
    this.wakeUp();
  }

  /**
   * 충격량 추가 (즉시 속도 변화)
   * @param impulse 충격량 벡터 (pixels/s)
   */
  addImpulse(impulse: Vector2): void {
    if (this._bodyType !== BodyType.DYNAMIC) return;

    this._velocity = this._velocity.add(impulse.multiply(this.inverseMass));
    this.wakeUp();
  }

  /**
   * 토크 추가 (회전력)
   * @param torque 토크 값
   */
  addTorque(torque: number): void {
    if (this._bodyType !== BodyType.DYNAMIC) return;

    this._torque += torque;
    this.wakeUp();
  }

  /**
   * 속도 직접 설정
   * @param velocity 속도 벡터
   */
  setVelocity(velocity: Vector2): void {
    this._velocity = velocity;
    if (velocity.lengthSquared() > 0.01) {
      this.wakeUp();
    }
  }

  /**
   * 각속도 직접 설정
   * @param angularVelocity 각속도
   */
  setAngularVelocity(angularVelocity: number): void {
    this._angularVelocity = angularVelocity;
    if (Math.abs(angularVelocity) > 0.01) {
      this.wakeUp();
    }
  }

  /**
   * Sleep 상태에서 깨우기
   */
  wakeUp(): void {
    this._isSleeping = false;
    this._sleepTimer = 0;
  }

  /**
   * 물리 업데이트 (PhysicsManager에서 호출)
   * @param deltaTime Fixed timestep (초)
   */
  fixedUpdate(deltaTime: number): void {
    if (this._bodyType !== BodyType.DYNAMIC) return;
    if (this._isSleeping) return;
    if (!this.gameObject) return;

    // 1. 중력 적용
    if (this._useGravity) {
      const gravity = PhysicsConstants.GRAVITY.multiply(this._gravityScale);
      this._force = this._force.add(gravity.multiply(this._mass));
    }

    // 2. 가속도 계산 (F = ma → a = F/m)
    this._acceleration = this._force.multiply(this.inverseMass);

    // 3. 속도 적분 (v += a * dt)
    this._velocity = this._velocity.add(this._acceleration.multiply(deltaTime));

    // 4. 저항 적용
    const dragFactor = Math.max(0, 1 - this._drag * deltaTime * 10);
    this._velocity = this._velocity.multiply(dragFactor);

    // 5. 최대 속도 제한
    const speedSquared = this._velocity.lengthSquared();
    if (speedSquared > PhysicsConstants.MAX_VELOCITY * PhysicsConstants.MAX_VELOCITY) {
      this._velocity = this._velocity.normalize().multiply(PhysicsConstants.MAX_VELOCITY);
    }

    // 6. 위치 적분 (Transform 업데이트)
    const displacement = this._velocity.multiply(deltaTime);
    this.gameObject.transform.translate(displacement);

    // 7. 각속도 및 회전 업데이트
    const angularDragFactor = Math.max(0, 1 - this._angularDrag * deltaTime * 10);
    this._angularVelocity *= angularDragFactor;
    this.gameObject.transform.rotate(this._angularVelocity * deltaTime);

    // 8. 힘 초기화
    this._force = Vector2.zero();
    this._torque = 0;

    // 9. Sleep 시스템 업데이트
    this.updateSleep(deltaTime);
  }

  /**
   * Sleep 시스템 업데이트
   */
  private updateSleep(deltaTime: number): void {
    const speed = this._velocity.length();
    const angularSpeed = Math.abs(this._angularVelocity);

    if (
      speed < PhysicsConstants.SLEEP_THRESHOLD &&
      angularSpeed < PhysicsConstants.SLEEP_THRESHOLD
    ) {
      this._sleepTimer += deltaTime;
      if (this._sleepTimer >= PhysicsConstants.SLEEP_TIME) {
        this._isSleeping = true;
        this._velocity = Vector2.zero();
        this._angularVelocity = 0;
      }
    } else {
      this._sleepTimer = 0;
    }
  }

  /**
   * 컴포넌트 초기화 (생성 시 호출)
   */
  awake(): void {
    // PhysicsManager에 등록
    const PhysicsManager = this.getPhysicsManager();
    if (PhysicsManager) {
      PhysicsManager.registerRigidbody(this);
    }
  }

  /**
   * 컴포넌트 파괴 시 호출
   */
  onDestroy(): void {
    // PhysicsManager에서 제거
    const PhysicsManager = this.getPhysicsManager();
    if (PhysicsManager) {
      PhysicsManager.unregisterRigidbody(this);
    }
  }

  /**
   * PhysicsManager 가져오기
   */
  private getPhysicsManager(): PhysicsManager | null {
    // 순환 참조 회피를 위해 동적 import
    try {
      const { PhysicsManager: PM } = require('./PhysicsManager');
      return PM.getInstance();
    } catch {
      return null;
    }
  }
}
