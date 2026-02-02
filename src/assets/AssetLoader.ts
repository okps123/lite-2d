/**
 * AssetLoader 클래스
 * 이미지, 오디오 등의 리소스를 비동기로 로드하고 캐싱합니다.
 * Engine에서 인스턴스를 생성하고 관리합니다. (engine.assetLoader로 접근)
 */
export class AssetLoader {
  private _images: Map<string, HTMLImageElement> = new Map();
  private _audios: Map<string, HTMLAudioElement> = new Map();
  private _loadingPromises: Map<string, Promise<any>> = new Map();

  /**
   * 이미지 로드
   */
  async loadImage(key: string, path: string): Promise<HTMLImageElement> {
    // 이미 로드된 경우
    if (this._images.has(key)) {
      return this._images.get(key)!;
    }

    // 로딩 중인 경우 같은 Promise 반환
    if (this._loadingPromises.has(key)) {
      return this._loadingPromises.get(key)!;
    }

    // 새로 로드
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this._images.set(key, img);
        this._loadingPromises.delete(key);
        resolve(img);
      };
      img.onerror = () => {
        this._loadingPromises.delete(key);
        reject(new Error(`이미지 로드 실패: ${path}`));
      };
      img.src = path;
    });

    this._loadingPromises.set(key, promise);
    return promise;
  }

  /**
   * 여러 이미지 한 번에 로드
   */
  async loadImages(assets: { key: string; path: string }[]): Promise<void> {
    const promises = assets.map((asset) =>
      this.loadImage(asset.key, asset.path)
    );
    await Promise.all(promises);
  }

  /**
   * 오디오 로드
   */
  async loadAudio(key: string, path: string): Promise<HTMLAudioElement> {
    // 이미 로드된 경우
    if (this._audios.has(key)) {
      return this._audios.get(key)!;
    }

    // 로딩 중인 경우
    if (this._loadingPromises.has(key)) {
      return this._loadingPromises.get(key)!;
    }

    // 새로 로드
    const promise = new Promise<HTMLAudioElement>((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => {
        this._audios.set(key, audio);
        this._loadingPromises.delete(key);
        resolve(audio);
      };
      audio.onerror = () => {
        this._loadingPromises.delete(key);
        reject(new Error(`오디오 로드 실패: ${path}`));
      };
      audio.src = path;
      audio.load();
    });

    this._loadingPromises.set(key, promise);
    return promise;
  }

  /**
   * 여러 오디오 한 번에 로드
   */
  async loadAudios(assets: { key: string; path: string }[]): Promise<void> {
    const promises = assets.map((asset) =>
      this.loadAudio(asset.key, asset.path)
    );
    await Promise.all(promises);
  }

  /**
   * 이미지 가져오기
   */
  getImage(key: string): HTMLImageElement | null {
    return this._images.get(key) || null;
  }

  /**
   * 오디오 가져오기
   */
  getAudio(key: string): HTMLAudioElement | null {
    return this._audios.get(key) || null;
  }

  /**
   * 이미지가 로드되었는지 확인
   */
  hasImage(key: string): boolean {
    return this._images.has(key);
  }

  /**
   * 오디오가 로드되었는지 확인
   */
  hasAudio(key: string): boolean {
    return this._audios.has(key);
  }

  /**
   * 특정 이미지 캐시 제거
   */
  unloadImage(key: string): void {
    this._images.delete(key);
  }

  /**
   * 특정 오디오 캐시 제거
   */
  unloadAudio(key: string): void {
    const audio = this._audios.get(key);
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    this._audios.delete(key);
  }

  /**
   * 모든 이미지 캐시 제거
   */
  unloadAllImages(): void {
    this._images.clear();
  }

  /**
   * 모든 오디오 캐시 제거
   */
  unloadAllAudios(): void {
    for (const audio of this._audios.values()) {
      audio.pause();
      audio.src = '';
    }
    this._audios.clear();
  }

  /**
   * 모든 리소스 캐시 제거
   */
  unloadAll(): void {
    this.unloadAllImages();
    this.unloadAllAudios();
    this._loadingPromises.clear();
  }

  /**
   * 로드된 이미지 개수
   */
  getLoadedImageCount(): number {
    return this._images.size;
  }

  /**
   * 로드된 오디오 개수
   */
  getLoadedAudioCount(): number {
    return this._audios.size;
  }

  /**
   * 로드 진행 중인 리소스 개수
   */
  getLoadingCount(): number {
    return this._loadingPromises.size;
  }

  /**
   * JSON 파일 로드
   */
  async loadJSON<T = any>(path: string): Promise<T> {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`JSON 로드 실패: ${path}`);
    }
    return response.json();
  }

  /**
   * 텍스트 파일 로드
   */
  async loadText(path: string): Promise<string> {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`텍스트 파일 로드 실패: ${path}`);
    }
    return response.text();
  }

  /**
   * 로딩 진행률 (0~1)
   */
  getLoadingProgress(
    totalAssets: number,
    loadedCallback?: (loaded: number, total: number) => void
  ): number {
    const loaded = this.getLoadedImageCount() + this.getLoadedAudioCount();
    if (loadedCallback) {
      loadedCallback(loaded, totalAssets);
    }
    return totalAssets > 0 ? loaded / totalAssets : 1;
  }
}
