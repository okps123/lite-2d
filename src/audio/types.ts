/**
 * 사운드 재생 옵션
 */
export interface PlayOptions {
  /** 볼륨 (0.0 ~ 1.0) */
  volume?: number;
  /** 루프 재생 여부 */
  loop?: boolean;
  /** 페이드인 시간 (초) */
  fadeIn?: number;
  /** 시작 위치 (초) */
  startTime?: number;
}

/**
 * BGM 재생 옵션
 */
export interface BGMOptions extends PlayOptions {
  /** 크로스페이드 시간 (초) */
  crossfade?: number;
}

/**
 * SFX 재생 옵션
 */
export interface SFXOptions extends PlayOptions {}

/**
 * 재생 중인 사운드 정보
 */
export interface PlayingSound {
  /** 고유 ID */
  id: string;
  /** AssetLoader 키 */
  key: string;
  /** HTMLAudioElement 인스턴스 */
  audio: HTMLAudioElement;
  /** 사운드 타입 */
  type: 'bgm' | 'sfx';
  /** 개별 볼륨 (0.0 ~ 1.0) */
  volume: number;
  /** 재생 중 여부 */
  isPlaying: boolean;
  /** 일시정지 여부 */
  isPaused: boolean;
  /** 생성 시각 (timestamp) */
  createdAt: number;
}

/**
 * 페이드 효과 정보
 */
export interface FadeInfo {
  /** 사운드 ID */
  soundId: string;
  /** 페이드 타입 */
  type: 'in' | 'out';
  /** 페이드 지속 시간 (초) */
  duration: number;
  /** 경과 시간 (초) */
  elapsed: number;
  /** 시작 볼륨 */
  startVolume: number;
  /** 목표 볼륨 */
  targetVolume: number;
  /** 완료 시 콜백 */
  onComplete?: () => void;
}

/**
 * AudioSource 컴포넌트 설정
 */
export interface AudioSourceConfig {
  /** 오디오 키 */
  audioKey?: string;
  /** Awake 시 자동 재생 */
  playOnAwake?: boolean;
  /** 루프 재생 */
  loop?: boolean;
  /** 볼륨 (0.0 ~ 1.0) */
  volume?: number;
  /** 사운드 타입 */
  type?: 'bgm' | 'sfx';
}
