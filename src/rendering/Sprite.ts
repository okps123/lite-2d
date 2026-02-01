import { GameObject } from '../core/GameObject';
import { Vector2 } from '../utils/Vector2';

/**
 * Sprite 클래스
 * 2D 이미지를 렌더링하는 GameObject입니다.
 */
export class Sprite extends GameObject {
  private _image: HTMLImageElement | null = null;
  private _width: number = 0;
  private _height: number = 0;
  private _anchor: Vector2 = new Vector2(0.5, 0.5); // 중앙이 기본
  private _flipX: boolean = false;
  private _flipY: boolean = false;
  private _opacity: number = 1.0;
  private _tint: string | null = null;

  // 스프라이트시트 지원
  private _sourceRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;

  constructor(name: string = 'Sprite') {
    super(name);
  }

  /**
   * 이미지
   */
  get image(): HTMLImageElement | null {
    return this._image;
  }

  /**
   * 렌더링 너비
   */
  get width(): number {
    return this._width;
  }

  set width(value: number) {
    this._width = value;
  }

  /**
   * 렌더링 높이
   */
  get height(): number {
    return this._height;
  }

  set height(value: number) {
    this._height = value;
  }

  /**
   * 앵커 포인트 (0~1, 0.5는 중앙)
   */
  get anchor(): Vector2 {
    return this._anchor;
  }

  set anchor(value: Vector2) {
    this._anchor = value;
  }

  /**
   * X축 플립
   */
  get flipX(): boolean {
    return this._flipX;
  }

  set flipX(value: boolean) {
    this._flipX = value;
  }

  /**
   * Y축 플립
   */
  get flipY(): boolean {
    return this._flipY;
  }

  set flipY(value: boolean) {
    this._flipY = value;
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
   * 틴트 색상 (null이면 적용 안 됨)
   */
  get tint(): string | null {
    return this._tint;
  }

  set tint(value: string | null) {
    this._tint = value;
  }

  /**
   * 스프라이트시트 영역 설정
   */
  get sourceRect(): { x: number; y: number; width: number; height: number } | null {
    return this._sourceRect;
  }

  set sourceRect(value: { x: number; y: number; width: number; height: number } | null) {
    this._sourceRect = value;
  }

  /**
   * 이미지 로드 및 설정
   */
  async setImage(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this._image = img;
        // 너비/높이가 설정되지 않았으면 이미지 크기로 설정
        if (this._width === 0) {
          this._width = img.width;
        }
        if (this._height === 0) {
          this._height = img.height;
        }
        resolve();
      };
      img.onerror = () => {
        reject(new Error(`이미지 로드 실패: ${path}`));
      };
      img.src = path;
    });
  }

  /**
   * 이미지를 직접 설정
   */
  setImageDirect(image: HTMLImageElement): void {
    this._image = image;
    if (this._width === 0) {
      this._width = image.width;
    }
    if (this._height === 0) {
      this._height = image.height;
    }
  }

  /**
   * 스프라이트시트에서 특정 영역 설정
   */
  setSourceRect(x: number, y: number, width: number, height: number): void {
    this._sourceRect = { x, y, width, height };
    // 렌더링 크기도 업데이트
    if (this._width === 0 || this._width === this._image?.width) {
      this._width = width;
    }
    if (this._height === 0 || this._height === this._image?.height) {
      this._height = height;
    }
  }

  /**
   * 렌더링 (로컬 좌표계에서 호출됨)
   */
  onRender(ctx: CanvasRenderingContext2D): void {
    if (!this._image || this._opacity <= 0) {
      return;
    }

    ctx.save();

    // 투명도 적용
    if (this._opacity < 1.0) {
      ctx.globalAlpha = this._opacity;
    }

    // 앵커 포인트 적용 (로컬 좌표계에서)
    const anchorOffsetX = -this._width * this._anchor.x;
    const anchorOffsetY = -this._height * this._anchor.y;

    // 플립 적용
    let scaleX = 1;
    let scaleY = 1;
    let translateX = 0;
    let translateY = 0;

    if (this._flipX) {
      scaleX = -1;
      translateX = this._width;
    }
    if (this._flipY) {
      scaleY = -1;
      translateY = this._height;
    }

    if (this._flipX || this._flipY) {
      ctx.translate(translateX + anchorOffsetX, translateY + anchorOffsetY);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-anchorOffsetX, -anchorOffsetY);
    }

    // 이미지 그리기
    if (this._sourceRect) {
      // 스프라이트시트 사용
      ctx.drawImage(
        this._image,
        this._sourceRect.x,
        this._sourceRect.y,
        this._sourceRect.width,
        this._sourceRect.height,
        anchorOffsetX,
        anchorOffsetY,
        this._width,
        this._height
      );
    } else {
      // 전체 이미지 사용
      ctx.drawImage(
        this._image,
        anchorOffsetX,
        anchorOffsetY,
        this._width,
        this._height
      );
    }

    // 틴트 적용 (단순 구현)
    if (this._tint) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = this._tint;
      ctx.fillRect(anchorOffsetX, anchorOffsetY, this._width, this._height);
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
  }

  /**
   * Sprite 정보를 문자열로 반환
   */
  toString(): string {
    return `Sprite(${this.name}, size: ${this._width}x${this._height}, opacity: ${this._opacity})`;
  }
}
