import type { AssetLoader } from '../assets/AssetLoader';
import type {
  PlayOptions,
  BGMOptions,
  SFXOptions,
  PlayingSound,
  FadeInfo,
} from './types';

/**
 * SoundManager 클래스
 * 게임 내 모든 사운드 재생을 관리합니다.
 */
export class SoundManager {
  // 재생 중인 사운드들 (키별로 여러 인스턴스 가능)
  private _playingSounds: Map<string, PlayingSound[]> = new Map();

  // 볼륨 설정
  private _masterVolume: number = 1.0;
  private _bgmVolume: number = 1.0;
  private _sfxVolume: number = 1.0;

  // 현재 재생 중인 BGM
  private _currentBGM: PlayingSound | null = null;

  // AssetLoader 참조
  private _assetLoader: AssetLoader;

  // 페이드 진행 중인 사운드들
  private _fadingSounds: FadeInfo[] = [];

  // 사운드 ID 생성용
  private _nextSoundId: number = 0;

  constructor(assetLoader: AssetLoader) {
    this._assetLoader = assetLoader;
  }

  /**
   * 현재 재생 중인 BGM
   */
  get currentBGM(): PlayingSound | null {
    return this._currentBGM;
  }

  /**
   * 마스터 볼륨
   */
  get masterVolume(): number {
    return this._masterVolume;
  }

  /**
   * BGM 볼륨
   */
  get bgmVolume(): number {
    return this._bgmVolume;
  }

  /**
   * SFX 볼륨
   */
  get sfxVolume(): number {
    return this._sfxVolume;
  }

  /**
   * 사운드 재생
   */
  play(key: string, options?: PlayOptions): PlayingSound | null {
    // 1. AssetLoader에서 원본 오디오 가져오기
    const sourceAudio = this._assetLoader.getAudio(key);
    if (!sourceAudio) {
      console.error(`오디오 에셋을 찾을 수 없습니다: ${key}`);
      return null;
    }

    // 2. 동시 재생을 위해 복제
    const audio = sourceAudio.cloneNode() as HTMLAudioElement;

    // 3. PlayingSound 객체 생성
    const playingSound: PlayingSound = {
      id: this.generateId(),
      key,
      audio,
      type: 'sfx',
      volume: options?.volume ?? 1.0,
      isPlaying: false,
      isPaused: false,
      createdAt: Date.now(),
    };

    // 4. 설정 적용
    audio.loop = options?.loop ?? false;
    if (options?.startTime !== undefined) {
      audio.currentTime = options.startTime;
    }

    // 5. 볼륨 적용 (마스터 볼륨 × 타입 볼륨 × 개별 볼륨)
    this.updateAudioVolume(playingSound);

    // 6. 재생 (브라우저 자동재생 정책으로 실패할 수 있음)
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          playingSound.isPlaying = true;
        })
        .catch((error) => {
          console.warn(
            '오디오 자동재생이 차단되었습니다. 사용자 인터랙션이 필요합니다.',
            error
          );
          playingSound.isPlaying = false;
          return;
        });
    } else {
      playingSound.isPlaying = true;
    }

    // 7. 관리 목록에 추가
    if (!this._playingSounds.has(key)) {
      this._playingSounds.set(key, []);
    }
    this._playingSounds.get(key)!.push(playingSound);

    // 8. 종료 시 정리
    audio.onended = () => {
      this.removePlayingSound(playingSound);
    };

    // 9. 페이드인 처리
    if (options?.fadeIn && options.fadeIn > 0) {
      const originalVolume = playingSound.volume;
      playingSound.volume = 0;
      this.updateAudioVolume(playingSound);
      this.fadeIn(playingSound.id, options.fadeIn);
      // fadeIn이 완료되면 원래 볼륨으로 복원되도록 targetVolume 설정
      const fadeInfo = this._fadingSounds.find(
        (f) => f.soundId === playingSound.id
      );
      if (fadeInfo) {
        fadeInfo.targetVolume = originalVolume;
      }
    }

    return playingSound;
  }

  /**
   * BGM 재생
   */
  playBGM(key: string, options?: BGMOptions): PlayingSound | null {
    // 크로스페이드 옵션이 있으면 크로스페이드 처리
    if (options?.crossfade && options.crossfade > 0 && this._currentBGM) {
      this.crossfadeBGM(key, options.crossfade);
      return this._currentBGM;
    }

    // 기존 BGM 정지
    if (this._currentBGM) {
      this.stop(this._currentBGM.id);
    }

    // 새 BGM 재생
    const playingSound = this.play(key, options);
    if (playingSound) {
      playingSound.type = 'bgm';
      this._currentBGM = playingSound;
      this.updateAudioVolume(playingSound);
    }

    return playingSound;
  }

  /**
   * SFX 재생
   */
  playSFX(key: string, options?: SFXOptions): PlayingSound | null {
    const playingSound = this.play(key, options);
    if (playingSound) {
      playingSound.type = 'sfx';
      this.updateAudioVolume(playingSound);
    }
    return playingSound;
  }

  /**
   * 사운드 정지
   */
  stop(soundId: string): void {
    const sound = this.findSoundById(soundId);
    if (!sound) return;

    sound.audio.pause();
    sound.audio.currentTime = 0;
    sound.isPlaying = false;
    sound.isPaused = false;

    // BGM이었다면 currentBGM 초기화
    if (this._currentBGM?.id === soundId) {
      this._currentBGM = null;
    }

    // 목록에서 제거
    this.removePlayingSound(sound);
  }

  /**
   * 모든 사운드 정지
   */
  stopAll(): void {
    for (const sounds of this._playingSounds.values()) {
      for (const sound of sounds) {
        sound.audio.pause();
        sound.audio.currentTime = 0;
        sound.audio.src = ''; // 메모리 해제
      }
    }

    this._playingSounds.clear();
    this._currentBGM = null;
    this._fadingSounds = [];
  }

  /**
   * BGM 정지
   */
  stopBGM(): void {
    if (this._currentBGM) {
      this.stop(this._currentBGM.id);
    }
  }

  /**
   * 사운드 일시정지
   */
  pause(soundId: string): void {
    const sound = this.findSoundById(soundId);
    if (!sound || !sound.isPlaying) return;

    sound.audio.pause();
    sound.isPlaying = false;
    sound.isPaused = true;
  }

  /**
   * 사운드 재개
   */
  resume(soundId: string): void {
    const sound = this.findSoundById(soundId);
    if (!sound || !sound.isPaused) return;

    sound.audio
      .play()
      .then(() => {
        sound.isPlaying = true;
        sound.isPaused = false;
      })
      .catch((error) => {
        console.warn('사운드 재개 실패:', error);
      });
  }

  /**
   * 마스터 볼륨 설정
   */
  setMasterVolume(volume: number): void {
    this._masterVolume = Math.max(0, Math.min(1, volume));

    // 모든 재생 중인 사운드 볼륨 업데이트
    for (const sounds of this._playingSounds.values()) {
      for (const sound of sounds) {
        this.updateAudioVolume(sound);
      }
    }
  }

  /**
   * BGM 볼륨 설정
   */
  setBGMVolume(volume: number): void {
    this._bgmVolume = Math.max(0, Math.min(1, volume));

    // BGM 사운드들만 볼륨 업데이트
    for (const sounds of this._playingSounds.values()) {
      for (const sound of sounds) {
        if (sound.type === 'bgm') {
          this.updateAudioVolume(sound);
        }
      }
    }
  }

  /**
   * SFX 볼륨 설정
   */
  setSFXVolume(volume: number): void {
    this._sfxVolume = Math.max(0, Math.min(1, volume));

    // SFX 사운드들만 볼륨 업데이트
    for (const sounds of this._playingSounds.values()) {
      for (const sound of sounds) {
        if (sound.type === 'sfx') {
          this.updateAudioVolume(sound);
        }
      }
    }
  }

  /**
   * 페이드 인
   */
  fadeIn(soundId: string, duration: number): void {
    const sound = this.findSoundById(soundId);
    if (!sound) return;

    // 기존 페이드 제거
    this._fadingSounds = this._fadingSounds.filter(
      (f) => f.soundId !== soundId
    );

    // 새 페이드 추가
    const fadeInfo: FadeInfo = {
      soundId,
      type: 'in',
      duration,
      elapsed: 0,
      startVolume: sound.volume,
      targetVolume: 1.0,
    };

    this._fadingSounds.push(fadeInfo);
  }

  /**
   * 페이드 아웃
   */
  fadeOut(soundId: string, duration: number): void {
    const sound = this.findSoundById(soundId);
    if (!sound) return;

    // 기존 페이드 제거
    this._fadingSounds = this._fadingSounds.filter(
      (f) => f.soundId !== soundId
    );

    // 새 페이드 추가
    const fadeInfo: FadeInfo = {
      soundId,
      type: 'out',
      duration,
      elapsed: 0,
      startVolume: sound.volume,
      targetVolume: 0,
      onComplete: () => {
        this.stop(soundId);
      },
    };

    this._fadingSounds.push(fadeInfo);
  }

  /**
   * BGM 크로스페이드
   */
  crossfadeBGM(newKey: string, duration: number): void {
    const oldBGM = this._currentBGM;

    // 새 BGM 재생 (페이드인)
    const newBGM = this.playBGM(newKey, {
      loop: true,
      fadeIn: duration,
    });

    // 이전 BGM 페이드아웃
    if (oldBGM && newBGM) {
      // 이전 BGM은 currentBGM이 아니므로 직접 페이드아웃
      this.fadeOut(oldBGM.id, duration);
    }
  }

  /**
   * 매 프레임 업데이트 (Engine.update에서 호출)
   */
  update(deltaTime: number): void {
    // 페이드 처리
    for (let i = this._fadingSounds.length - 1; i >= 0; i--) {
      const fade = this._fadingSounds[i];
      fade.elapsed += deltaTime;

      const progress = Math.min(fade.elapsed / fade.duration, 1.0);
      const currentVolume =
        fade.type === 'in'
          ? fade.startVolume + (fade.targetVolume - fade.startVolume) * progress
          : fade.startVolume - (fade.startVolume - fade.targetVolume) * progress;

      const sound = this.findSoundById(fade.soundId);
      if (sound) {
        sound.volume = currentVolume;
        this.updateAudioVolume(sound);
      }

      // 페이드 완료
      if (progress >= 1.0) {
        if (fade.onComplete) {
          fade.onComplete();
        }
        this._fadingSounds.splice(i, 1);
      }
    }

    // 종료된 사운드 정리
    this.cleanupEndedSounds();
  }

  /**
   * 정리
   */
  destroy(): void {
    // 모든 사운드 정지 및 정리
    this.stopAll();
  }

  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return `sound_${this._nextSoundId++}`;
  }

  /**
   * ID로 사운드 찾기
   */
  private findSoundById(soundId: string): PlayingSound | null {
    for (const sounds of this._playingSounds.values()) {
      const found = sounds.find((s) => s.id === soundId);
      if (found) return found;
    }
    return null;
  }

  /**
   * PlayingSound 제거
   */
  private removePlayingSound(playingSound: PlayingSound): void {
    const sounds = this._playingSounds.get(playingSound.key);
    if (!sounds) return;

    const index = sounds.indexOf(playingSound);
    if (index !== -1) {
      sounds.splice(index, 1);
    }

    // 배열이 비었으면 키도 제거
    if (sounds.length === 0) {
      this._playingSounds.delete(playingSound.key);
    }

    // 메모리 해제
    playingSound.audio.src = '';
  }

  /**
   * 사운드 볼륨 업데이트 (3단계: Master × Type × Individual)
   */
  private updateAudioVolume(sound: PlayingSound): void {
    const typeVolume = sound.type === 'bgm' ? this._bgmVolume : this._sfxVolume;
    sound.audio.volume = this._masterVolume * typeVolume * sound.volume;
  }

  /**
   * 종료된 사운드 정리
   */
  private cleanupEndedSounds(): void {
    for (const [key, sounds] of this._playingSounds.entries()) {
      // 종료되지 않은 사운드들만 필터링
      const activeSounds = sounds.filter((s) => !s.audio.ended);

      // 종료된 사운드들 정리
      const endedSounds = sounds.filter((s) => s.audio.ended);
      for (const sound of endedSounds) {
        sound.audio.src = ''; // 메모리 해제

        // BGM이었다면 currentBGM 초기화
        if (this._currentBGM?.id === sound.id) {
          this._currentBGM = null;
        }
      }

      // 배열 업데이트 또는 키 제거
      if (activeSounds.length === 0) {
        this._playingSounds.delete(key);
      } else if (activeSounds.length < sounds.length) {
        this._playingSounds.set(key, activeSounds);
      }
    }
  }
}
