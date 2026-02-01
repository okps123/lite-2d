import { Vector2 } from '../utils/Vector2';

/**
 * Camera 클래스
 * 게임 뷰포트와 카메라 변환을 관리합니다.
 */
export class Camera {
  private _position: Vector2;
  private _zoom: number;
  private _viewportWidth: number;
  private _viewportHeight: number;
  private _rotation: number; // 라디안

  constructor(
    viewportWidth: number,
    viewportHeight: number,
    position?: Vector2
  ) {
    this._viewportWidth = viewportWidth;
    this._viewportHeight = viewportHeight;
    this._position = position ? position.clone() : Vector2.zero();
    this._zoom = 1.0;
    this._rotation = 0;
  }

  /**
   * 카메라 위치
   */
  get position(): Vector2 {
    return this._position;
  }

  set position(value: Vector2) {
    this._position = value;
  }

  /**
   * 줌 레벨 (1.0이 기본)
   */
  get zoom(): number {
    return this._zoom;
  }

  set zoom(value: number) {
    this._zoom = Math.max(0.1, value); // 최소 줌 제한
  }

  /**
   * 뷰포트 너비
   */
  get viewportWidth(): number {
    return this._viewportWidth;
  }

  set viewportWidth(value: number) {
    this._viewportWidth = value;
  }

  /**
   * 뷰포트 높이
   */
  get viewportHeight(): number {
    return this._viewportHeight;
  }

  set viewportHeight(value: number) {
    this._viewportHeight = value;
  }

  /**
   * 카메라 회전 (라디안)
   */
  get rotation(): number {
    return this._rotation;
  }

  set rotation(value: number) {
    this._rotation = value;
  }

  /**
   * 월드 좌표를 스크린 좌표로 변환
   */
  worldToScreen(worldPos: Vector2): Vector2 {
    // 카메라 위치를 기준으로 상대 좌표 계산
    let relative = worldPos.subtract(this._position);

    // 카메라 회전 적용
    if (this._rotation !== 0) {
      relative = relative.rotate(-this._rotation);
    }

    // 줌 적용
    relative = relative.multiply(this._zoom);

    // 뷰포트 중앙을 원점으로
    const screenX = relative.x + this._viewportWidth / 2;
    const screenY = relative.y + this._viewportHeight / 2;

    return new Vector2(screenX, screenY);
  }

  /**
   * 스크린 좌표를 월드 좌표로 변환
   */
  screenToWorld(screenPos: Vector2): Vector2 {
    // 뷰포트 중앙을 원점으로 변환
    let relative = new Vector2(
      screenPos.x - this._viewportWidth / 2,
      screenPos.y - this._viewportHeight / 2
    );

    // 줌 역적용
    relative = relative.divide(this._zoom);

    // 카메라 회전 역적용
    if (this._rotation !== 0) {
      relative = relative.rotate(this._rotation);
    }

    // 카메라 위치 더하기
    return relative.add(this._position);
  }

  /**
   * Canvas Context에 카메라 변환 적용
   */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    // 뷰포트 중앙으로 이동
    ctx.translate(this._viewportWidth / 2, this._viewportHeight / 2);

    // 줌 적용
    ctx.scale(this._zoom, this._zoom);

    // 카메라 회전 적용
    if (this._rotation !== 0) {
      ctx.rotate(-this._rotation);
    }

    // 카메라 위치만큼 반대로 이동
    ctx.translate(-this._position.x, -this._position.y);
  }

  /**
   * 특정 GameObject를 화면 중앙에 오도록 카메라 이동
   */
  follow(target: Vector2, smoothing: number = 1): void {
    if (smoothing >= 1) {
      // 즉시 이동
      this._position.copy(target);
    } else {
      // 부드럽게 이동 (lerp)
      this._position = Vector2.lerp(this._position, target, smoothing);
    }
  }

  /**
   * 카메라가 특정 지점을 바라보도록 설정
   */
  lookAt(target: Vector2): void {
    this._position.copy(target);
  }

  /**
   * 뷰포트 경계 (월드 좌표)
   */
  getViewportBounds(): {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
  } {
    const halfWidth = (this._viewportWidth / 2) / this._zoom;
    const halfHeight = (this._viewportHeight / 2) / this._zoom;

    return {
      left: this._position.x - halfWidth,
      right: this._position.x + halfWidth,
      top: this._position.y - halfHeight,
      bottom: this._position.y + halfHeight,
      width: halfWidth * 2,
      height: halfHeight * 2,
    };
  }

  /**
   * 특정 지점이 카메라 뷰포트 내에 있는지 확인
   */
  isInViewport(worldPos: Vector2, margin: number = 0): boolean {
    const bounds = this.getViewportBounds();
    return (
      worldPos.x >= bounds.left - margin &&
      worldPos.x <= bounds.right + margin &&
      worldPos.y >= bounds.top - margin &&
      worldPos.y <= bounds.bottom + margin
    );
  }

  /**
   * 카메라를 흔들기 효과 (간단한 구현)
   */
  shake(intensity: number, _duration: number): void {
    // TODO: 실제 구현은 Engine의 update에서 타이머와 함께 처리해야 함
    // 여기서는 간단히 랜덤 오프셋만 적용
    const offsetX = (Math.random() - 0.5) * intensity;
    const offsetY = (Math.random() - 0.5) * intensity;
    this._position.x += offsetX;
    this._position.y += offsetY;
  }

  /**
   * 카메라 정보를 문자열로 반환
   */
  toString(): string {
    return `Camera(pos: ${this._position.toString()}, zoom: ${this._zoom.toFixed(
      2
    )})`;
  }
}
