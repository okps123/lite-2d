import { Vector2 } from '../utils/Vector2';

/**
 * Transform 클래스
 * 게임 오브젝트의 위치, 회전, 스케일을 관리합니다.
 * 부모-자식 관계를 통해 계층 구조를 지원합니다.
 */
export class Transform {
  private _position: Vector2;
  private _rotation: number; // 라디안
  private _scale: Vector2;
  private _parent: Transform | null = null;
  private _children: Transform[] = [];

  // 캐싱 및 Dirty Flag
  private _worldPosition: Vector2 | null = null;
  private _worldRotation: number | null = null;
  private _worldScale: Vector2 | null = null;
  private _isDirty: boolean = true;

  constructor(position?: Vector2, rotation: number = 0, scale?: Vector2) {
    this._position = position ? position.clone() : Vector2.zero();
    this._rotation = rotation;
    this._scale = scale ? scale.clone() : Vector2.one();
  }

  /**
   * 로컬 위치 (getter)
   */
  get position(): Vector2 {
    return this._position;
  }

  /**
   * 로컬 위치 (setter)
   */
  set position(value: Vector2) {
    this._position = value;
    this.markDirty();
  }

  /**
   * 로컬 회전 (getter, 라디안)
   */
  get rotation(): number {
    return this._rotation;
  }

  /**
   * 로컬 회전 (setter, 라디안)
   */
  set rotation(value: number) {
    this._rotation = value;
    this.markDirty();
  }

  /**
   * 로컬 스케일 (getter)
   */
  get scale(): Vector2 {
    return this._scale;
  }

  /**
   * 로컬 스케일 (setter)
   */
  set scale(value: Vector2) {
    this._scale = value;
    this.markDirty();
  }

  /**
   * 부모 Transform
   */
  get parent(): Transform | null {
    return this._parent;
  }

  /**
   * 자식 Transform 목록
   */
  get children(): readonly Transform[] {
    return this._children;
  }

  /**
   * 월드 좌표 계산
   */
  getWorldPosition(): Vector2 {
    if (this._isDirty || this._worldPosition === null) {
      this.updateWorldTransform();
    }
    return this._worldPosition!.clone();
  }

  /**
   * 월드 회전 계산 (라디안)
   */
  getWorldRotation(): number {
    if (this._isDirty || this._worldRotation === null) {
      this.updateWorldTransform();
    }
    return this._worldRotation!;
  }

  /**
   * 월드 스케일 계산
   */
  getWorldScale(): Vector2 {
    if (this._isDirty || this._worldScale === null) {
      this.updateWorldTransform();
    }
    return this._worldScale!.clone();
  }

  /**
   * 월드 변환 정보 업데이트
   */
  private updateWorldTransform(): void {
    if (this._parent === null) {
      // 부모가 없으면 로컬 = 월드
      this._worldPosition = this._position.clone();
      this._worldRotation = this._rotation;
      this._worldScale = this._scale.clone();
    } else {
      // 부모의 월드 변환 적용
      const parentWorldPos = this._parent.getWorldPosition();
      const parentWorldRot = this._parent.getWorldRotation();
      const parentWorldScale = this._parent.getWorldScale();

      // 부모의 스케일과 회전을 적용한 로컬 위치
      const scaledPos = new Vector2(
        this._position.x * parentWorldScale.x,
        this._position.y * parentWorldScale.y
      );
      const rotatedPos = scaledPos.rotate(parentWorldRot);

      // 월드 위치 = 부모 월드 위치 + 회전/스케일 적용된 로컬 위치
      this._worldPosition = parentWorldPos.add(rotatedPos);

      // 월드 회전 = 부모 월드 회전 + 로컬 회전
      this._worldRotation = parentWorldRot + this._rotation;

      // 월드 스케일 = 부모 월드 스케일 * 로컬 스케일
      this._worldScale = new Vector2(
        parentWorldScale.x * this._scale.x,
        parentWorldScale.y * this._scale.y
      );
    }

    this._isDirty = false;
  }

  /**
   * Dirty Flag 설정 (자신과 모든 자식)
   */
  private markDirty(): void {
    this._isDirty = true;
    for (const child of this._children) {
      child.markDirty();
    }
  }

  /**
   * 자식 Transform 추가
   */
  addChild(child: Transform): void {
    if (child._parent === this) {
      return; // 이미 자식인 경우
    }

    // 기존 부모에서 제거
    if (child._parent !== null) {
      child._parent.removeChild(child);
    }

    // 자식 추가
    this._children.push(child);
    child._parent = this;
    child.markDirty();
  }

  /**
   * 자식 Transform 제거
   */
  removeChild(child: Transform): void {
    const index = this._children.indexOf(child);
    if (index === -1) {
      return; // 자식이 아닌 경우
    }

    this._children.splice(index, 1);
    child._parent = null;
    child.markDirty();
  }

  /**
   * 모든 자식 제거
   */
  removeAllChildren(): void {
    for (const child of this._children) {
      child._parent = null;
      child.markDirty();
    }
    this._children = [];
  }

  /**
   * 부모로부터 제거 (자신을 부모의 자식 목록에서 제거)
   */
  detachFromParent(): void {
    if (this._parent !== null) {
      this._parent.removeChild(this);
    }
  }

  /**
   * 지정한 위치를 바라보도록 회전 설정
   */
  lookAt(target: Vector2): void {
    const worldPos = this.getWorldPosition();
    const direction = target.subtract(worldPos);
    this.rotation = Math.atan2(direction.y, direction.x);
  }

  /**
   * 로컬 위치 이동
   */
  translate(delta: Vector2): void {
    this._position = this._position.add(delta);
    this.markDirty();
  }

  /**
   * 로컬 회전 (라디안)
   */
  rotate(deltaRadians: number): void {
    this._rotation += deltaRadians;
    this.markDirty();
  }

  /**
   * Transform 복제
   */
  clone(): Transform {
    const cloned = new Transform(
      this._position.clone(),
      this._rotation,
      this._scale.clone()
    );
    return cloned;
  }

  /**
   * Transform 정보를 문자열로 반환
   */
  toString(): string {
    return `Transform(pos: ${this._position.toString()}, rot: ${this._rotation.toFixed(
      2
    )}, scale: ${this._scale.toString()})`;
  }
}
