import {
  Engine,
  Scene,
  GameObject,
  Keys,
  AudioSource,
} from '../../src/index';

/**
 * 오디오 데모용 GameObject
 */
class AudioDemo extends GameObject {
  private keyboardInfo: string = '';

  awake(): void {
    super.awake();

    // AudioSource 컴포넌트 추가 (테스트용)
    this.addComponent(
      new AudioSource({
        audioKey: 'sfx-beep',
        type: 'sfx',
        volume: 0.8,
        loop: false,
        playOnAwake: false,
      })
    );
  }

  onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    const input = this.scene?.engine?.inputManager;
    const soundManager = this.scene?.engine?.soundManager;
    if (!input || !soundManager) return;

    this.keyboardInfo = '';

    // 스페이스바: SFX 1 재생
    if (input.isKeyPressed(Keys.Space)) {
      soundManager.playSFX('sfx-beep', { volume: 0.8 });
      this.keyboardInfo = 'Played SFX 1 (Space)';
    }

    // Enter: SFX 2 재생
    if (input.isKeyPressed(Keys.Enter)) {
      soundManager.playSFX('sfx-click', { volume: 0.8 });
      this.keyboardInfo = 'Played SFX 2 (Enter)';
    }

    // B: BGM 토글
    if (input.isKeyPressed('b') || input.isKeyPressed('B')) {
      if (soundManager.currentBGM) {
        soundManager.fadeOut(soundManager.currentBGM.id, 1.0);
        this.keyboardInfo = 'BGM Stopped (B)';
      } else {
        soundManager.playBGM('bgm-main', {
          loop: true,
          volume: 0.7,
          fadeIn: 1.0,
        });
        this.keyboardInfo = 'BGM Started (B)';
      }
    }

    // M: 음소거 토글
    if (input.isKeyPressed('m') || input.isKeyPressed('M')) {
      const currentVolume = soundManager.masterVolume;
      soundManager.setMasterVolume(currentVolume > 0 ? 0 : 1.0);
      this.keyboardInfo = `Master Volume: ${soundManager.masterVolume > 0 ? 'ON' : 'OFF'} (M)`;
    }

    // 1-3: SFX 재생
    if (input.isKeyPressed('1')) {
      soundManager.playSFX('sfx-beep');
      this.keyboardInfo = 'Played SFX 1 (1)';
    }
    if (input.isKeyPressed('2')) {
      soundManager.playSFX('sfx-click');
      this.keyboardInfo = 'Played SFX 2 (2)';
    }
    if (input.isKeyPressed('3')) {
      soundManager.playSFX('sfx-explosion');
      this.keyboardInfo = 'Played SFX 3 (3)';
    }

    // 마우스 클릭: SFX 재생
    if (input.isMouseButtonPressed(0)) {
      soundManager.playSFX('sfx-click', { volume: 0.6 });
      this.keyboardInfo = 'Played SFX (Click)';
    }
  }

  onRender(ctx: CanvasRenderingContext2D): void {
    super.onRender(ctx);

    const soundManager = this.scene?.engine?.soundManager;
    if (!soundManager) return;

    // 배경 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // 제목
    ctx.fillStyle = '#00d9ff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎵 Audio System Demo', 400, 60);

    // 볼륨 바 시각화
    const barY = 150;
    const barHeight = 30;
    const barWidth = 300;
    const barX = (800 - barWidth) / 2;

    // Master Volume
    this.drawVolumeBar(
      ctx,
      barX,
      barY,
      barWidth,
      barHeight,
      soundManager.masterVolume,
      'Master Volume',
      '#e94560'
    );

    // BGM Volume
    this.drawVolumeBar(
      ctx,
      barX,
      barY + 60,
      barWidth,
      barHeight,
      soundManager.bgmVolume,
      'BGM Volume',
      '#00d9ff'
    );

    // SFX Volume
    this.drawVolumeBar(
      ctx,
      barX,
      barY + 120,
      barWidth,
      barHeight,
      soundManager.sfxVolume,
      'SFX Volume',
      '#ffa500'
    );

    // 현재 상태 표시
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    const statusY = barY + 200;

    const bgmStatus = soundManager.currentBGM
      ? `Playing: ${soundManager.currentBGM.key}`
      : 'No BGM Playing';
    ctx.fillText(`BGM Status: ${bgmStatus}`, 400, statusY);

    // 키보드 입력 정보
    if (this.keyboardInfo) {
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(this.keyboardInfo, 400, statusY + 40);
    }

    // 사용 방법
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    const helpY = 420;
    const helpX = 50;

    ctx.fillText('🎹 Keyboard Controls:', helpX, helpY);
    ctx.fillText('  Space - Play SFX 1', helpX + 20, helpY + 25);
    ctx.fillText('  Enter - Play SFX 2', helpX + 20, helpY + 45);
    ctx.fillText('  B - Toggle BGM', helpX + 20, helpY + 65);
    ctx.fillText('  M - Toggle Mute', helpX + 20, helpY + 85);
    ctx.fillText('  1-3 - Play SFX 1-3', helpX + 20, helpY + 105);

    ctx.fillText('🖱️ Mouse Controls:', helpX + 400, helpY);
    ctx.fillText('  Click - Play SFX', helpX + 420, helpY + 25);

    // FPS 표시
    if (this.scene?.engine) {
      ctx.fillStyle = '#00ff00';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`FPS: ${this.scene.engine.fps}`, 780, 20);
    }
  }

  private drawVolumeBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    value: number,
    label: string,
    color: string
  ): void {
    // 배경
    ctx.fillStyle = '#16213e';
    ctx.fillRect(x, y, width, height);

    // 볼륨 바
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * value, height);

    // 테두리
    ctx.strokeStyle = '#0f3460';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // 라벨
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y - 8);

    // 값 표시
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(value * 100)}%`, x + width, y - 8);
  }
}

/**
 * 메인 함수
 */
async function main() {
  // 엔진 초기화
  const engine = new Engine('gameCanvas', 800, 600);

  // 신디사이저 사운드 생성 (테스트용)
  await createTestAudio(engine);

  // 씬 생성
  const scene = new Scene('AudioDemoScene', 800, 600);
  scene.backgroundColor = '#0f3460';

  // AudioDemo GameObject 추가
  const audioDemo = new AudioDemo('AudioDemo');
  scene.addGameObject(audioDemo);

  // 씬 로드 및 시작
  await engine.loadScene(scene);
  engine.start();

  // UI 이벤트 연결
  setupUI(engine);
}

/**
 * 테스트용 오디오 생성 (Web Audio API)
 */
async function createTestAudio(engine: Engine): Promise<void> {
  console.log('Creating test audio...');

  // AudioContext 생성
  const audioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)();

  // BGM (간단한 멜로디)
  const bgmBuffer = createBGMAudio(audioContext);
  const bgmBlob = audioBufferToWave(bgmBuffer);
  const bgmUrl = URL.createObjectURL(bgmBlob);

  // SFX 1 (비프음)
  const sfx1Buffer = createBeepAudio(audioContext, 0.2, 440);
  const sfx1Blob = audioBufferToWave(sfx1Buffer);
  const sfx1Url = URL.createObjectURL(sfx1Blob);

  // SFX 2 (클릭음)
  const sfx2Buffer = createBeepAudio(audioContext, 0.1, 880);
  const sfx2Blob = audioBufferToWave(sfx2Buffer);
  const sfx2Url = URL.createObjectURL(sfx2Blob);

  // SFX 3 (폭발음)
  const sfx3Buffer = createExplosionAudio(audioContext);
  const sfx3Blob = audioBufferToWave(sfx3Buffer);
  const sfx3Url = URL.createObjectURL(sfx3Blob);

  // AssetLoader에 등록 (URL을 직접 사용)
  const audio1 = new Audio(bgmUrl);
  const audio2 = new Audio(sfx1Url);
  const audio3 = new Audio(sfx2Url);
  const audio4 = new Audio(sfx3Url);

  // 수동으로 AssetLoader에 추가
  (engine.assetLoader as any)._audios.set('bgm-main', audio1);
  (engine.assetLoader as any)._audios.set('sfx-beep', audio2);
  (engine.assetLoader as any)._audios.set('sfx-click', audio3);
  (engine.assetLoader as any)._audios.set('sfx-explosion', audio4);

  console.log('Test audio created successfully!');
}

function createBGMAudio(
  audioContext: AudioContext
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 4; // 4초
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  // 간단한 멜로디 (C-E-G-C)
  const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
  const noteDuration = duration / notes.length;

  for (let i = 0; i < notes.length; i++) {
    const freq = notes[i];
    const startSample = Math.floor(i * noteDuration * sampleRate);
    const endSample = Math.floor((i + 1) * noteDuration * sampleRate);

    for (let j = startSample; j < endSample; j++) {
      const t = j / sampleRate;
      const envelope = Math.max(0, 1 - (j - startSample) / (endSample - startSample));
      data[j] = Math.sin(2 * Math.PI * freq * t) * 0.3 * envelope;
    }
  }

  return buffer;
}

function createBeepAudio(
  audioContext: AudioContext,
  duration: number,
  frequency: number
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(
    1,
    sampleRate * duration,
    sampleRate
  );
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const envelope = Math.max(0, 1 - t / duration);
    data[i] = Math.sin(2 * Math.PI * frequency * t) * 0.5 * envelope;
  }

  return buffer;
}

function createExplosionAudio(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.5;
  const buffer = audioContext.createBuffer(
    1,
    sampleRate * duration,
    sampleRate
  );
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const envelope = Math.max(0, 1 - t / duration);
    // 노이즈 + 저주파
    const noise = (Math.random() * 2 - 1) * 0.3;
    const lowFreq = Math.sin(2 * Math.PI * 60 * t) * 0.7;
    data[i] = (noise + lowFreq) * envelope;
  }

  return buffer;
}

function audioBufferToWave(audioBuffer: AudioBuffer): Blob {
  const length = audioBuffer.length * audioBuffer.numberOfChannels * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  const channels: Float32Array[] = [];
  let offset = 0;
  let pos = 0;

  // WAV 헤더 작성
  const setUint16 = (data: number) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };
  const setUint32 = (data: number) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };

  // RIFF identifier
  setUint32(0x46464952);
  // file length
  setUint32(36 + length);
  // RIFF type
  setUint32(0x45564157);
  // format chunk identifier
  setUint32(0x20746d66);
  // format chunk length
  setUint32(16);
  // sample format (raw)
  setUint16(1);
  // channel count
  setUint16(audioBuffer.numberOfChannels);
  // sample rate
  setUint32(audioBuffer.sampleRate);
  // byte rate
  setUint32(audioBuffer.sampleRate * 2 * audioBuffer.numberOfChannels);
  // block align
  setUint16(audioBuffer.numberOfChannels * 2);
  // bits per sample
  setUint16(16);
  // data chunk identifier
  setUint32(0x61746164);
  // data chunk length
  setUint32(length);

  // 채널 데이터 수집
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  // 인터리브 및 16bit PCM 변환
  while (pos < buffer.byteLength) {
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * UI 이벤트 설정
 */
function setupUI(engine: Engine): void {
  const soundManager = engine.soundManager;

  // BGM 버튼
  document.getElementById('playBGM')?.addEventListener('click', () => {
    soundManager.playBGM('bgm-main', {
      loop: true,
      volume: 0.7,
      fadeIn: 2.0,
    });
    updateStatus(engine);
  });

  document.getElementById('pauseBGM')?.addEventListener('click', () => {
    if (soundManager.currentBGM) {
      soundManager.pause(soundManager.currentBGM.id);
    }
  });

  document.getElementById('resumeBGM')?.addEventListener('click', () => {
    if (soundManager.currentBGM) {
      soundManager.resume(soundManager.currentBGM.id);
    }
  });

  document.getElementById('stopBGM')?.addEventListener('click', () => {
    if (soundManager.currentBGM) {
      soundManager.fadeOut(soundManager.currentBGM.id, 1.0);
    }
    updateStatus(engine);
  });

  document.getElementById('crossfadeBGM')?.addEventListener('click', () => {
    soundManager.crossfadeBGM('bgm-main', 2.0);
    updateStatus(engine);
  });

  // SFX 버튼
  document.getElementById('playSFX1')?.addEventListener('click', () => {
    soundManager.playSFX('sfx-beep', { volume: 0.8 });
  });

  document.getElementById('playSFX2')?.addEventListener('click', () => {
    soundManager.playSFX('sfx-click', { volume: 0.8 });
  });

  document.getElementById('playSFX3')?.addEventListener('click', () => {
    soundManager.playSFX('sfx-explosion', { volume: 0.8 });
  });

  document.getElementById('stopAllSFX')?.addEventListener('click', () => {
    soundManager.stopAll();
    updateStatus(engine);
  });

  // 볼륨 슬라이더
  const masterSlider = document.getElementById(
    'masterVolume'
  ) as HTMLInputElement;
  const bgmSlider = document.getElementById('bgmVolume') as HTMLInputElement;
  const sfxSlider = document.getElementById('sfxVolume') as HTMLInputElement;

  masterSlider?.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value) / 100;
    soundManager.setMasterVolume(value);
    document.getElementById('masterValue')!.textContent = `${Math.round(value * 100)}%`;
    updateStatus(engine);
  });

  bgmSlider?.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value) / 100;
    soundManager.setBGMVolume(value);
    document.getElementById('bgmValue')!.textContent = `${Math.round(value * 100)}%`;
    updateStatus(engine);
  });

  sfxSlider?.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value) / 100;
    soundManager.setSFXVolume(value);
    document.getElementById('sfxValue')!.textContent = `${Math.round(value * 100)}%`;
    updateStatus(engine);
  });

  // 초기 상태 업데이트
  updateStatus(engine);
  setInterval(() => updateStatus(engine), 500);
}

function updateStatus(engine: Engine): void {
  const soundManager = engine.soundManager;

  document.getElementById('currentBGM')!.textContent =
    soundManager.currentBGM?.key || 'None';
  document.getElementById('currentMaster')!.textContent =
    soundManager.masterVolume.toFixed(2);
  document.getElementById('currentBGMVol')!.textContent =
    soundManager.bgmVolume.toFixed(2);
  document.getElementById('currentSFX')!.textContent =
    soundManager.sfxVolume.toFixed(2);
}

// 시작
main().catch(console.error);
