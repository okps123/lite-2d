import { Sprite } from './Sprite';

/**
 * AnimatedSprite 클래스
 * 스프라이트 시트 기반 애니메이션을 지원하는 Sprite입니다.
 */
export class AnimatedSprite extends Sprite {
  private _frameCount: number = 1;
  private _currentFrame: number = 0;
  private _frameTime: number = 0;
  private _frameDuration: number = 0.1; // 초 단위
  private _frameWidth: number = 0;
  private _frameHeight: number = 0;
  private _isPlaying: boolean = true;
  private _loop: boolean = true;

  constructor(name: string = 'AnimatedSprite') {
    super(name);
  }

  /**
   * 현재 프레임 인덱스
   */
  get currentFrame(): number {
    return this._currentFrame;
  }

  set currentFrame(value: number) {
    this._currentFrame = Math.max(0, Math.min(value, this._frameCount - 1));
    this.updateSourceRect();
  }

  /**
   * 총 프레임 수
   */
  get frameCount(): number {
    return this._frameCount;
  }

  /**
   * 프레임 당 지속 시간 (초)
   */
  get frameDuration(): number {
    return this._frameDuration;
  }

  set frameDuration(value: number) {
    this._frameDuration = Math.max(0.001, value);
  }

  /**
   * 애니메이션 재생 중 여부
   */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * 루프 여부
   */
  get loop(): boolean {
    return this._loop;
  }

  set loop(value: boolean) {
    this._loop = value;
  }

  /**
   * 프레임 크기 설정
   * @param width 프레임 너비
   * @param height 프레임 높이
   * @param scale 렌더링 스케일 (기본값 1)
   */
  setFrameSize(width: number, height: number, scale: number = 1): void {
    this._frameWidth = width;
    this._frameHeight = height;
    this.width = width * scale;
    this.height = height * scale;
    this.updateSourceRect();
  }

  /**
   * 애니메이션 설정
   * @param frameCount 총 프레임 수
   * @param frameDuration 프레임 당 지속 시간 (초)
   */
  setAnimation(frameCount: number, frameDuration: number = 0.1): void {
    this._frameCount = Math.max(1, frameCount);
    this._frameDuration = Math.max(0.001, frameDuration);
    this._currentFrame = 0;
    this._frameTime = 0;
    this._isPlaying = true;
    this.updateSourceRect();
  }

  /**
   * 애니메이션 재생
   */
  play(): void {
    this._isPlaying = true;
  }

  /**
   * 애니메이션 일시정지
   */
  pause(): void {
    this._isPlaying = false;
  }

  /**
   * 애니메이션 정지 및 첫 프레임으로 이동
   */
  stop(): void {
    this._isPlaying = false;
    this._currentFrame = 0;
    this._frameTime = 0;
    this.updateSourceRect();
  }

  /**
   * 특정 프레임으로 이동
   */
  gotoFrame(frame: number): void {
    this._currentFrame = Math.max(0, Math.min(frame, this._frameCount - 1));
    this._frameTime = 0;
    this.updateSourceRect();
  }

  /**
   * 현재 프레임에 맞게 sourceRect 업데이트
   */
  private updateSourceRect(): void {
    if (this._frameWidth > 0 && this._frameHeight > 0) {
      this.setSourceRect(
        this._currentFrame * this._frameWidth,
        0,
        this._frameWidth,
        this._frameHeight
      );
    }
  }

  onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    if (!this._isPlaying || this._frameCount <= 1) {
      return;
    }

    // 애니메이션 업데이트
    this._frameTime += deltaTime;
    if (this._frameTime >= this._frameDuration) {
      this._frameTime -= this._frameDuration;

      if (this._loop) {
        this._currentFrame = (this._currentFrame + 1) % this._frameCount;
      } else {
        if (this._currentFrame < this._frameCount - 1) {
          this._currentFrame++;
        } else {
          this._isPlaying = false;
        }
      }

      this.updateSourceRect();
    }
  }

  /**
   * AnimatedSprite 정보를 문자열로 반환
   */
  toString(): string {
    return `AnimatedSprite(${this.name}, frame: ${this._currentFrame}/${this._frameCount}, playing: ${this._isPlaying})`;
  }
}
