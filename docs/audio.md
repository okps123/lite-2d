# 오디오 시스템

## 개요

Lite2D의 오디오 시스템은 게임 내 소리 재생을 위한 SoundManager와 AudioSource 컴포넌트를 제공합니다. HTMLAudioElement 기반으로 배경음악(BGM)과 효과음(SFX)을 관리할 수 있습니다.

## 주요 기능

- **SoundManager**: 중앙 집중식 사운드 관리
- **3단계 볼륨 제어**: Master, BGM, SFX 독립 제어
- **페이드 효과**: 페이드 인/아웃, BGM 크로스페이드
- **동시 재생**: 동일한 사운드의 다중 재생 지원
- **AudioSource 컴포넌트**: GameObject에 사운드 기능 추가
- **자동 메모리 관리**: 종료된 사운드 자동 정리
- **브라우저 정책 대응**: 자동재생 차단 처리

## 빠른 시작

### 1. 기본 사운드 재생

```typescript
import { Engine, Scene } from 'lite2d';

// 엔진 초기화
const engine = new Engine('gameCanvas', 800, 600);

// 오디오 파일 로드
await engine.assetLoader.loadAudios([
  { key: 'bgm-main', path: './assets/music/main.mp3' },
  { key: 'sfx-jump', path: './assets/sounds/jump.wav' },
  { key: 'sfx-coin', path: './assets/sounds/coin.wav' },
]);

// BGM 재생 (루프, 2초 페이드인)
engine.soundManager.playBGM('bgm-main', {
  loop: true,
  volume: 0.7,
  fadeIn: 2.0
});

// 효과음 재생
engine.soundManager.playSFX('sfx-jump', { volume: 0.8 });
```

### 2. AudioSource 컴포넌트 사용

```typescript
import { GameObject, AudioSource, Keys } from 'lite2d';

class Player extends GameObject {
  private audioSource: AudioSource | null = null;

  awake(): void {
    super.awake();

    // AudioSource 컴포넌트 추가
    this.audioSource = this.addComponent(new AudioSource({
      audioKey: 'sfx-jump',
      type: 'sfx',
      volume: 0.8,
      loop: false,
      playOnAwake: false,
    }));
  }

  onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    const input = this.scene?.engine?.inputManager;

    // 스페이스바를 누르면 점프 사운드 재생
    if (input?.isKeyPressed(Keys.Space)) {
      this.audioSource?.play();
    }
  }
}
```

## 핵심 클래스

### SoundManager

게임 내 모든 사운드를 관리하는 중앙 매니저입니다.

#### 주요 메서드

```typescript
class SoundManager {
  // === 재생 제어 ===
  play(key: string, options?: PlayOptions): PlayingSound | null;
  playBGM(key: string, options?: BGMOptions): PlayingSound | null;
  playSFX(key: string, options?: SFXOptions): PlayingSound | null;

  stop(soundId: string): void;
  stopAll(): void;
  stopBGM(): void;

  pause(soundId: string): void;
  resume(soundId: string): void;

  // === 볼륨 제어 ===
  setMasterVolume(volume: number): void;  // 0.0 ~ 1.0
  setBGMVolume(volume: number): void;
  setSFXVolume(volume: number): void;

  // === 페이드 효과 ===
  fadeIn(soundId: string, duration: number): void;
  fadeOut(soundId: string, duration: number): void;
  crossfadeBGM(newKey: string, duration: number): void;

  // === Getter ===
  get currentBGM(): PlayingSound | null;
  get masterVolume(): number;
  get bgmVolume(): number;
  get sfxVolume(): number;
}
```

#### PlayOptions

```typescript
interface PlayOptions {
  volume?: number;      // 개별 볼륨 (0.0 ~ 1.0)
  loop?: boolean;       // 루프 재생 여부
  fadeIn?: number;      // 페이드인 시간 (초)
  startTime?: number;   // 시작 위치 (초)
}

interface BGMOptions extends PlayOptions {
  crossfade?: number;   // 크로스페이드 시간 (초)
}

interface SFXOptions extends PlayOptions {}
```

### AudioSource

GameObject에 사운드 재생 기능을 제공하는 컴포넌트입니다.

#### 주요 속성 및 메서드

```typescript
class AudioSource extends Component {
  // 속성
  audioKey: string;              // 오디오 키
  playOnAwake: boolean;          // Awake 시 자동 재생
  loop: boolean;                 // 루프 재생
  volume: number;                // 볼륨 (0.0 ~ 1.0)
  type: 'bgm' | 'sfx';          // 사운드 타입

  // 상태
  get isPlaying(): boolean;
  get isPaused(): boolean;

  // 메서드
  play(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  fadeIn(duration: number): void;
  fadeOut(duration: number): void;
}
```

#### 생성자 옵션

```typescript
interface AudioSourceConfig {
  audioKey?: string;
  playOnAwake?: boolean;
  loop?: boolean;
  volume?: number;
  type?: 'bgm' | 'sfx';
}
```

## 사용 예제

### 예제 1: BGM 크로스페이드

```typescript
class BattleScene extends Scene {
  async load(): Promise<void> {
    await super.load();

    // 기존 BGM에서 전투 BGM으로 2초 크로스페이드
    this.engine?.soundManager.crossfadeBGM('bgm-battle', 2.0);
  }

  unload(): void {
    // 씬 종료 시 BGM 페이드아웃
    const bgm = this.engine?.soundManager.currentBGM;
    if (bgm) {
      this.engine?.soundManager.fadeOut(bgm.id, 1.0);
    }
    super.unload();
  }
}
```

### 예제 2: 다중 효과음 재생

```typescript
class Coin extends GameObject {
  onCollisionEnter(collision: CollisionEvent): void {
    // 동일한 효과음을 여러 번 재생해도 겹쳐서 재생됨
    this.scene?.engine?.soundManager.playSFX('sfx-coin', {
      volume: 0.9
    });

    this.destroy();
  }
}
```

### 예제 3: 볼륨 설정 UI

```typescript
class SettingsUI extends GameObject {
  private masterSlider: number = 1.0;
  private bgmSlider: number = 1.0;
  private sfxSlider: number = 1.0;

  onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    const soundManager = this.scene?.engine?.soundManager;
    if (!soundManager) return;

    // 슬라이더 값이 변경되면 볼륨 업데이트
    soundManager.setMasterVolume(this.masterSlider);
    soundManager.setBGMVolume(this.bgmSlider);
    soundManager.setSFXVolume(this.sfxSlider);
  }
}
```

### 예제 4: 발소리 효과 (루프 재생)

```typescript
class Player extends GameObject {
  private footstepAudio: AudioSource | null = null;
  private isMoving: boolean = false;

  awake(): void {
    super.awake();

    this.footstepAudio = this.addComponent(new AudioSource({
      audioKey: 'sfx-footstep',
      type: 'sfx',
      volume: 0.6,
      loop: true,
      playOnAwake: false,
    }));
  }

  onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    const input = this.scene?.engine?.inputManager;
    const moving = input?.isAnyKeyDown(['w', 'a', 's', 'd']) ?? false;

    // 이동 상태가 변경될 때만 재생/정지
    if (moving && !this.isMoving) {
      this.footstepAudio?.play();
    } else if (!moving && this.isMoving) {
      this.footstepAudio?.stop();
    }

    this.isMoving = moving;
  }
}
```

## 고급 기능

### 볼륨 계산 (3단계)

SoundManager는 3단계 볼륨 계산을 사용합니다:

```
최종 볼륨 = Master 볼륨 × 타입 볼륨 × 개별 볼륨
```

예시:
- Master: 0.8
- BGM: 0.7
- 개별: 1.0
- **최종**: 0.8 × 0.7 × 1.0 = 0.56

이를 통해 전체 볼륨, BGM/SFX 카테고리별 볼륨, 개별 사운드 볼륨을 독립적으로 제어할 수 있습니다.

### 페이드 효과

페이드 효과는 `update()` 메서드에서 deltaTime 기반으로 처리됩니다:

```typescript
// 2초 동안 페이드 인
soundManager.fadeIn(soundId, 2.0);

// 3초 동안 페이드 아웃 (완료 시 자동 정지)
soundManager.fadeOut(soundId, 3.0);

// BGM 크로스페이드 (이전 BGM 페이드아웃 + 새 BGM 페이드인)
soundManager.crossfadeBGM('new-bgm', 2.0);
```

### 메모리 관리

SoundManager는 자동으로 종료된 사운드를 정리합니다:

1. **onended 이벤트**: 사운드 종료 시 즉시 정리
2. **update() 주기적 정리**: 매 프레임마다 종료된 사운드 검사
3. **메모리 해제**: `audio.src = ''`로 메모리 해제

```typescript
// 수동으로 모든 사운드 정리
soundManager.stopAll();

// Engine.destroy() 호출 시 자동 정리
engine.destroy();
```

### 브라우저 자동재생 정책

브라우저는 사용자 인터랙션 없이 오디오 재생을 차단할 수 있습니다. SoundManager는 이를 자동으로 처리합니다:

```typescript
const playPromise = audio.play();
playPromise
  .then(() => {
    // 재생 성공
  })
  .catch((error) => {
    // 자동재생 차단됨 - 경고만 출력
    console.warn('오디오 자동재생이 차단되었습니다.');
  });
```

**권장사항**: 첫 사운드는 버튼 클릭 등 사용자 이벤트에서 재생하세요.

## 성능 최적화

### 동시 재생 제한

동일한 효과음이 너무 많이 재생되면 성능에 영향을 줄 수 있습니다:

```typescript
class Gun extends GameObject {
  private lastShotTime: number = 0;
  private shotCooldown: number = 0.1; // 100ms

  shoot(): void {
    const now = Date.now();
    if (now - this.lastShotTime < this.shotCooldown * 1000) {
      return; // 쿨다운 중
    }

    this.scene?.engine?.soundManager.playSFX('sfx-gunshot');
    this.lastShotTime = now;
  }
}
```

### 사전 로딩

게임 시작 시 모든 오디오를 사전 로드하세요:

```typescript
async function preloadAssets(engine: Engine): Promise<void> {
  await engine.assetLoader.loadAudios([
    // BGM
    { key: 'bgm-main', path: './assets/music/main.mp3' },
    { key: 'bgm-battle', path: './assets/music/battle.mp3' },

    // SFX
    { key: 'sfx-jump', path: './assets/sounds/jump.wav' },
    { key: 'sfx-coin', path: './assets/sounds/coin.wav' },
    { key: 'sfx-hit', path: './assets/sounds/hit.wav' },
  ]);
}
```

## 디버깅

### 재생 중인 사운드 확인

```typescript
const soundManager = engine.soundManager;

// 현재 재생 중인 BGM
console.log('Current BGM:', soundManager.currentBGM?.key);

// 볼륨 설정 확인
console.log('Master:', soundManager.masterVolume);
console.log('BGM:', soundManager.bgmVolume);
console.log('SFX:', soundManager.sfxVolume);
```

### 일반적인 문제 해결

**Q: 사운드가 재생되지 않습니다.**
- AssetLoader로 오디오를 로드했는지 확인하세요.
- 브라우저 콘솔에서 자동재생 차단 경고를 확인하세요.
- 사용자 인터랙션(클릭 등) 후에 재생해보세요.

**Q: 사운드가 겹쳐서 재생됩니다.**
- 이것은 정상 동작입니다. 동시 재생을 원하지 않으면 재생 전에 정지하세요.
- AudioSource 사용 시 `play()` 전에 `stop()`을 호출합니다.

**Q: BGM이 끊깁니다.**
- `loop: true` 옵션을 사용했는지 확인하세요.
- 오디오 파일이 올바르게 로드되었는지 확인하세요.

## 참고

- [API 문서](api.md) - 전체 API 레퍼런스
- [튜토리얼](tutorial.md) - 시작하기 가이드
- [아키텍처](architecture.md) - 프레임워크 구조

## 관련 파일

- `src/audio/SoundManager.ts` - 사운드 매니저 구현
- `src/audio/AudioSource.ts` - AudioSource 컴포넌트
- `src/audio/types.ts` - 타입 정의
- `examples/audio/` - 오디오 예제
