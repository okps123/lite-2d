import { GameObject } from '../core/GameObject';
import { Vector2 } from '../utils/Vector2';

/**
 * UIElement 추상 클래스
 * 모든 UI 요소의 베이스 클래스입니다.
 * GameObject를 상속받아 Transform, sortingOrder 등을 활용합니다.
 */
export abstract class UIElement extends GameObject {
  // 기본 속성
  protected _width: number = 100;
  protected _height: number = 50;
  protected _screenSpace: boolean = true; // true=HUD(카메라 무시), false=월드 좌표
  protected _anchor: Vector2 = new Vector2(0.5, 0.5); // 0~1 (0.5, 0.5 = 중앙)

  // 상호작용
  protected _interactive: boolean = true; // 클릭 가능 여부
  protected _hovered: boolean = false; // 마우스 오버 상태
  protected _enabled: boolean = true; // 활성화 상태

  // 스타일
  protected _backgroundColor: string | null = null;
  protected _borderColor: string | null = null;
  protected _borderWidth: number = 0;
  protected _padding: number = 0;
  protected _opacity: number = 1.0;

  constructor(name: string = 'UIElement') {
    super(name);
  }

  /**
   * 너비
   */
  get width(): number {
    return this._width;
  }

  set width(value: number) {
    this._width = value;
  }

  /**
   * 높이
   */
  get height(): number {
    return this._height;
  }

  set height(value: number) {
    this._height = value;
  }

  /**
   * 스크린 고정 여부 (true: HUD, false: 월드 좌표)
   */
  get screenSpace(): boolean {
    return this._screenSpace;
  }

  set screenSpace(value: boolean) {
    this._screenSpace = value;
  }

  /**
   * 앵커 포인트 (0~1, 기본값 0.5, 0.5 = 중앙)
   */
  get anchor(): Vector2 {
    return this._anchor;
  }

  set anchor(value: Vector2) {
    this._anchor = value;
  }

  /**
   * 클릭 가능 여부
   */
  get interactive(): boolean {
    return this._interactive;
  }

  set interactive(value: boolean) {
    this._interactive = value;
  }

  /**
   * 마우스 오버 상태
   */
  get hovered(): boolean {
    return this._hovered;
  }

  set hovered(value: boolean) {
    this._hovered = value;
  }

  /**
   * 활성화 상태
   */
  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
  }

  /**
   * 배경색
   */
  get backgroundColor(): string | null {
    return this._backgroundColor;
  }

  set backgroundColor(value: string | null) {
    this._backgroundColor = value;
  }

  /**
   * 테두리 색상
   */
  get borderColor(): string | null {
    return this._borderColor;
  }

  set borderColor(value: string | null) {
    this._borderColor = value;
  }

  /**
   * 테두리 두께
   */
  get borderWidth(): number {
    return this._borderWidth;
  }

  set borderWidth(value: number) {
    this._borderWidth = value;
  }

  /**
   * 패딩
   */
  get padding(): number {
    return this._padding;
  }

  set padding(value: number) {
    this._padding = value;
  }

  /**
   * 투명도 (0~1)
   */
  get opacity(): number {
    return this._opacity;
  }

  set opacity(value: number) {
    this._opacity = Math.max(0, Math.min(1, value));
  }

  /**
   * 점이 UI 요소 내부에 있는지 확인 (AABB 충돌 감지)
   * @param point 확인할 점의 좌표
   * @returns 점이 내부에 있으면 true
   */
  containsPoint(point: Vector2): boolean {
    const bounds = this.getScreenBounds();

    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }

  /**
   * 스크린 좌표 기준 경계 영역 반환 (앵커 적용)
   * @returns 경계 영역 { x, y, width, height }
   */
  getScreenBounds(): { x: number; y: number; width: number; height: number } {
    // 스크린 스페이스면 로컬 위치, 아니면 월드 위치 사용
    const worldPos = this._screenSpace
      ? this.transform.position
      : this.transform.getWorldPosition();

    // 앵커 적용
    const x = worldPos.x - this._width * this._anchor.x;
    const y = worldPos.y - this._height * this._anchor.y;

    return {
      x: x,
      y: y,
      width: this._width,
      height: this._height,
    };
  }

  /**
   * 마우스가 UI 요소 위로 진입했을 때
   */
  onMouseEnter(): void {
    // 서브클래스에서 오버라이드
  }

  /**
   * 마우스가 UI 요소에서 벗어났을 때
   */
  onMouseLeave(): void {
    // 서브클래스에서 오버라이드
  }

  /**
   * 마우스 버튼을 눌렀을 때
   */
  onMouseDown(): void {
    // 서브클래스에서 오버라이드
  }

  /**
   * 마우스 버튼을 뗐을 때
   */
  onMouseUp(): void {
    // 서브클래스에서 오버라이드
  }

  /**
   * 클릭했을 때 (같은 요소에서 down -> up)
   */
  onClick(): void {
    // 서브클래스에서 오버라이드
  }

  /**
   * 커스텀 렌더링 (서브클래스에서 반드시 구현)
   * Screen Space인 경우 카메라 변환을 무시하고 렌더링해야 함
   */
  abstract onRender(ctx: CanvasRenderingContext2D): void;
}
