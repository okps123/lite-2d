import { Component } from '../core/Component';
import type { SoundManager } from './SoundManager';
import type { AudioSourceConfig, PlayingSound } from './types';

/**
 * AudioSource 컴포넌트
 * GameObject에 사운드 재생 기능을 제공합니다.
 */
export class AudioSource extends Component {
  private _soundManager: SoundManager | null = null;
  private _audioKey: string = '';
  private _playOnAwake: boolean = false;
  private _loop: boolean = false;
  private _volume: number = 1.0;
  private _type: 'bgm' | 'sfx' = 'sfx';
  private _playingSound: PlayingSound | null = null;

  constructor(config?: AudioSourceConfig) {
    super();

    if (config) {
      this._audioKey = config.audioKey ?? '';
      this._playOnAwake = config.playOnAwake ?? false;
      this._loop = config.loop ?? false;
      this._volume = config.volume ?? 1.0;
      this._type = config.type ?? 'sfx';
    }
  }

  /**
   * 오디오 키
   */
  get audioKey(): string {
    return this._audioKey;
  }

  set audioKey(value: string) {
    this._audioKey = value;
  }

  /**
   * Awake 시 자동 재생 여부
   */
  get playOnAwake(): boolean {
    return this._playOnAwake;
  }

  set playOnAwake(value: boolean) {
    this._playOnAwake = value;
  }

  /**
   * 루프 재생 여부
   */
  get loop(): boolean {
    return this._loop;
  }

  set loop(value: boolean) {
    this._loop = value;

    // 재생 중인 사운드에도 적용
    if (this._playingSound) {
      this._playingSound.audio.loop = value;
    }
  }

  /**
   * 볼륨 (0.0 ~ 1.0)
   */
  get volume(): number {
    return this._volume;
  }

  set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value));

    // 재생 중인 사운드에도 적용
    if (this._playingSound && this._soundManager) {
      this._playingSound.volume = this._volume;
      // SoundManager의 private 메서드에 접근할 수 없으므로,
      // 직접 볼륨 계산 (Master × Type × Individual)
      const typeVolume =
        this._type === 'bgm'
          ? this._soundManager.bgmVolume
          : this._soundManager.sfxVolume;
      this._playingSound.audio.volume =
        this._soundManager.masterVolume * typeVolume * this._volume;
    }
  }

  /**
   * 사운드 타입
   */
  get type(): 'bgm' | 'sfx' {
    return this._type;
  }

  set type(value: 'bgm' | 'sfx') {
    this._type = value;
  }

  /**
   * 재생 중인지 여부
   */
  get isPlaying(): boolean {
    return this._playingSound?.isPlaying ?? false;
  }

  /**
   * 일시정지 상태인지 여부
   */
  get isPaused(): boolean {
    return this._playingSound?.isPaused ?? false;
  }

  /**
   * 컴포넌트 초기화
   */
  awake(): void {
    // GameObject → Scene → Engine → SoundManager
    if (this.gameObject?.scene?.engine) {
      this._soundManager = (this.gameObject.scene.engine as any).soundManager;
    }
  }

  /**
   * 첫 업데이트 전
   */
  start(): void {
    if (this._playOnAwake && this._audioKey) {
      this.play();
    }
  }

  /**
   * 사운드 재생
   */
  play(): void {
    if (!this._soundManager || !this._audioKey) {
      console.warn(
        'AudioSource: SoundManager 또는 audioKey가 설정되지 않았습니다.'
      );
      return;
    }

    // 이미 재생 중이면 중지
    if (this._playingSound) {
      this.stop();
    }

    const options = {
      volume: this._volume,
      loop: this._loop,
    };

    if (this._type === 'bgm') {
      this._playingSound = this._soundManager.playBGM(this._audioKey, options);
    } else {
      this._playingSound = this._soundManager.playSFX(this._audioKey, options);
    }
  }

  /**
   * 사운드 정지
   */
  stop(): void {
    if (this._playingSound && this._soundManager) {
      this._soundManager.stop(this._playingSound.id);
      this._playingSound = null;
    }
  }

  /**
   * 사운드 일시정지
   */
  pause(): void {
    if (this._playingSound && this._soundManager) {
      this._soundManager.pause(this._playingSound.id);
    }
  }

  /**
   * 사운드 재개
   */
  resume(): void {
    if (this._playingSound && this._soundManager) {
      this._soundManager.resume(this._playingSound.id);
    }
  }

  /**
   * 페이드 인
   */
  fadeIn(duration: number): void {
    if (this._playingSound && this._soundManager) {
      this._soundManager.fadeIn(this._playingSound.id, duration);
    }
  }

  /**
   * 페이드 아웃
   */
  fadeOut(duration: number): void {
    if (this._playingSound && this._soundManager) {
      this._soundManager.fadeOut(this._playingSound.id, duration);
    }
  }

  /**
   * 컴포넌트 파괴 시
   */
  onDestroy(): void {
    this.stop();
  }
}
