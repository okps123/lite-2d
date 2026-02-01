import type { GameObject } from './GameObject';

/**
 * Component 베이스 클래스
 * GameObject에 추가 기능을 제공하는 확장 가능한 컴포넌트 시스템입니다.
 *
 * 예시: RigidBody, Collider, Animator, AudioSource 등
 */
export abstract class Component {
  private _gameObject: GameObject | null = null;
  private _enabled: boolean = true;
  private _started: boolean = false;

  /**
   * 이 컴포넌트가 속한 GameObject
   */
  get gameObject(): GameObject | null {
    return this._gameObject;
  }

  set gameObject(value: GameObject | null) {
    this._gameObject = value;
  }

  /**
   * 컴포넌트 활성화 상태
   */
  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
  }

  /**
   * start가 호출되었는지 여부
   */
  get started(): boolean {
    return this._started;
  }

  set started(value: boolean) {
    this._started = value;
  }

  /**
   * 컴포넌트 초기화 (생성 시 호출)
   */
  awake(): void {
    // 서브클래스에서 오버라이드
  }

  /**
   * 첫 업데이트 전에 호출
   */
  start(): void {
    // 서브클래스에서 오버라이드
  }

  /**
   * 매 프레임 업데이트
   */
  update(_deltaTime: number): void {
    // 서브클래스에서 오버라이드
  }

  /**
   * 렌더링 (필요한 경우)
   */
  render(_ctx: CanvasRenderingContext2D): void {
    // 서브클래스에서 오버라이드
  }

  /**
   * 컴포넌트 파괴 시 호출
   */
  onDestroy(): void {
    // 서브클래스에서 오버라이드
  }
}
