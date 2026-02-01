import { Transform } from './Transform';
import { Component } from './Component';
import type { Scene } from './Scene';

/**
 * GameObject 클래스
 * 모든 게임 오브젝트의 베이스 클래스입니다.
 * Cocos2D의 Node와 유사한 역할을 합니다.
 */
export class GameObject {
  private _name: string;
  private _transform: Transform;
  private _active: boolean = true;
  private _scene: Scene | null = null;
  private _components: Component[] = [];
  private _children: GameObject[] = [];
  private _parent: GameObject | null = null;
  private _started: boolean = false;
  private _sortingOrder: number = 0;

  constructor(name: string = 'GameObject') {
    this._name = name;
    this._transform = new Transform();
  }

  /**
   * GameObject 이름
   */
  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  /**
   * Transform 컴포넌트
   */
  get transform(): Transform {
    return this._transform;
  }

  /**
   * 활성화 상태
   */
  get active(): boolean {
    return this._active;
  }

  set active(value: boolean) {
    this._active = value;
  }

  /**
   * 소속된 Scene
   */
  get scene(): Scene | null {
    return this._scene;
  }

  set scene(value: Scene | null) {
    this._scene = value;
  }

  /**
   * 컴포넌트 목록
   */
  get components(): readonly Component[] {
    return this._components;
  }

  /**
   * 자식 GameObject 목록
   */
  get children(): readonly GameObject[] {
    return this._children;
  }

  /**
   * 부모 GameObject
   */
  get parent(): GameObject | null {
    return this._parent;
  }

  /**
   * start가 호출되었는지 여부
   */
  get started(): boolean {
    return this._started;
  }

  /**
   * 렌더링 순서 (값이 클수록 나중에 렌더링됨, 즉 위에 표시됨)
   */
  get sortingOrder(): number {
    return this._sortingOrder;
  }

  set sortingOrder(value: number) {
    if (this._sortingOrder === value) {
      return; // 변경 없음
    }

    this._sortingOrder = value;

    // Scene에 재정렬 요청 (루트 오브젝트인 경우에만)
    if (this._scene && this._parent === null) {
      this._scene.reorderGameObject(this);
    }
  }

  /**
   * 초기화 (생성 시 한 번 호출)
   */
  awake(): void {
    // 컴포넌트 awake 호출
    for (const component of this._components) {
      if (component.enabled) {
        component.awake();
      }
    }
  }

  /**
   * 첫 업데이트 전에 호출
   */
  start(): void {
    if (this._started) return;
    this._started = true;

    // 컴포넌트 start 호출
    for (const component of this._components) {
      if (component.enabled && !component.started) {
        component.start();
        component.started = true;
      }
    }
  }

  /**
   * 커스텀 업데이트 (서브클래스에서 오버라이드)
   * 이 메서드는 컴포넌트와 자식 업데이트 전에 호출됩니다.
   */
  onUpdate(_deltaTime: number): void {
    // 서브클래스에서 오버라이드
  }

  /**
   * 매 프레임 업데이트
   */
  update(deltaTime: number): void {
    if (!this._active) return;

    // start가 아직 호출되지 않았다면 호출
    if (!this._started) {
      this.start();
    }

    // 서브클래스의 커스텀 업데이트
    this.onUpdate(deltaTime);

    // 컴포넌트 update 호출
    for (const component of this._components) {
      if (component.enabled) {
        component.update(deltaTime);
      }
    }

    // 자식 update (재귀)
    for (const child of this._children) {
      if (child.active) {
        child.update(deltaTime);
      }
    }
  }

  /**
   * 커스텀 렌더링 (서브클래스에서 오버라이드)
   * 이 메서드는 Transform이 적용된 로컬 좌표계에서 호출됩니다.
   */
  onRender(_ctx: CanvasRenderingContext2D): void {
    // 서브클래스에서 오버라이드
  }

  /**
   * 렌더링
   * @param ctx Canvas 렌더링 컨텍스트
   * @param parentTransformed 부모의 Transform이 이미 적용되었는지 여부
   */
  render(ctx: CanvasRenderingContext2D, parentTransformed: boolean = false): void {
    if (!this._active) return;

    ctx.save();

    if (parentTransformed) {
      // 부모의 Transform이 이미 적용된 경우, 로컬 Transform만 적용
      ctx.translate(this._transform.position.x, this._transform.position.y);
      ctx.rotate(this._transform.rotation);
      ctx.scale(this._transform.scale.x, this._transform.scale.y);
    } else {
      // 루트 오브젝트인 경우, world Transform 적용
      const worldPos = this._transform.getWorldPosition();
      const worldRot = this._transform.getWorldRotation();
      const worldScale = this._transform.getWorldScale();

      ctx.translate(worldPos.x, worldPos.y);
      ctx.rotate(worldRot);
      ctx.scale(worldScale.x, worldScale.y);
    }

    // 서브클래스의 커스텀 렌더링
    this.onRender(ctx);

    // 컴포넌트 render 호출
    for (const component of this._components) {
      if (component.enabled) {
        component.render(ctx);
      }
    }

    // 자식 render (재귀) - 로컬 좌표계에서 렌더링
    for (const child of this._children) {
      if (child.active) {
        child.render(ctx, true); // 자식에게는 부모 Transform이 적용되었음을 알림
      }
    }

    ctx.restore();
  }

  /**
   * GameObject 파괴
   */
  destroy(): void {
    // 컴포넌트 파괴
    for (const component of this._components) {
      component.onDestroy();
    }
    this._components = [];

    // 자식들도 파괴
    for (const child of [...this._children]) {
      child.destroy();
    }
    this._children = [];

    // 부모에서 제거
    if (this._parent !== null) {
      this._parent.removeChild(this);
    }

    // Scene에서 제거
    if (this._scene !== null) {
      this._scene.removeGameObject(this);
    }
  }

  /**
   * 자식 GameObject 추가
   */
  addChild(child: GameObject): void {
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
    child._scene = this._scene;

    // Transform 계층 구조 연결
    this._transform.addChild(child._transform);
  }

  /**
   * 자식 GameObject 제거
   */
  removeChild(child: GameObject): void {
    const index = this._children.indexOf(child);
    if (index === -1) {
      return; // 자식이 아닌 경우
    }

    this._children.splice(index, 1);
    child._parent = null;
    child._scene = null;

    // Transform 계층 구조 해제
    this._transform.removeChild(child._transform);
  }

  /**
   * 모든 자식 제거
   */
  removeAllChildren(): void {
    for (const child of [...this._children]) {
      this.removeChild(child);
    }
  }

  /**
   * 이름으로 자식 GameObject 찾기
   */
  findChild(name: string): GameObject | null {
    for (const child of this._children) {
      if (child.name === name) {
        return child;
      }
    }
    return null;
  }

  /**
   * 이름으로 자식 GameObject 재귀 검색
   */
  findChildRecursive(name: string): GameObject | null {
    for (const child of this._children) {
      if (child.name === name) {
        return child;
      }
      const found = child.findChildRecursive(name);
      if (found !== null) {
        return found;
      }
    }
    return null;
  }

  /**
   * 컴포넌트 추가
   */
  addComponent<T extends Component>(component: T): T {
    component.gameObject = this;
    this._components.push(component);
    component.awake();
    return component;
  }

  /**
   * 컴포넌트 가져오기
   */
  getComponent<T extends Component>(
    type: new (...args: any[]) => T
  ): T | null {
    for (const component of this._components) {
      if (component instanceof type) {
        return component as T;
      }
    }
    return null;
  }

  /**
   * 모든 컴포넌트 가져오기
   */
  getComponents<T extends Component>(
    type: new (...args: any[]) => T
  ): T[] {
    const result: T[] = [];
    for (const component of this._components) {
      if (component instanceof type) {
        result.push(component as T);
      }
    }
    return result;
  }

  /**
   * 컴포넌트 제거
   */
  removeComponent<T extends Component>(component: T): void {
    const index = this._components.indexOf(component);
    if (index !== -1) {
      component.onDestroy();
      this._components.splice(index, 1);
    }
  }

  /**
   * 충돌 이벤트 콜백 (서브클래스에서 오버라이드)
   */
  onCollisionEnter(_collision: any): void {
    // 서브클래스에서 오버라이드
  }

  onCollisionStay(_collision: any): void {
    // 서브클래스에서 오버라이드
  }

  onCollisionExit(_other: any): void {
    // 서브클래스에서 오버라이드
  }

  onTriggerEnter(_other: any): void {
    // 서브클래스에서 오버라이드
  }

  onTriggerStay(_other: any): void {
    // 서브클래스에서 오버라이드
  }

  onTriggerExit(_other: any): void {
    // 서브클래스에서 오버라이드
  }

  /**
   * GameObject 정보를 문자열로 반환
   */
  toString(): string {
    return `GameObject(${this._name}, active: ${this._active}, children: ${this._children.length})`;
  }
}
