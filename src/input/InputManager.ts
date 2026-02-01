import { Vector2 } from '../utils/Vector2';

/**
 * InputManager 클래스
 * 키보드와 마우스 입력을 관리합니다.
 */
export class InputManager {
  private _keys: Map<string, boolean> = new Map();
  private _keysPressed: Map<string, boolean> = new Map();
  private _keysReleased: Map<string, boolean> = new Map();
  private _keysPrevious: Map<string, boolean> = new Map();

  private _mousePosition: Vector2 = Vector2.zero();
  private _mouseButtons: Map<number, boolean> = new Map();
  private _mouseButtonsPressed: Map<number, boolean> = new Map();
  private _mouseButtonsReleased: Map<number, boolean> = new Map();
  private _mouseButtonsPrevious: Map<number, boolean> = new Map();

  // IME 조합 관련
  private _isComposing: boolean = false;
  private _composedText: string | null = null;

  private _canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this.setupEventListeners();
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 키보드 이벤트
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));

    // IME 조합 이벤트 (한글, 일본어 등)
    window.addEventListener('compositionstart', this.onCompositionStart.bind(this));
    window.addEventListener('compositionupdate', this.onCompositionUpdate.bind(this));
    window.addEventListener('compositionend', this.onCompositionEnd.bind(this));

    // 마우스 이벤트
    this._canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this._canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this._canvas.addEventListener('mouseup', this.onMouseUp.bind(this));

    // 컨텍스트 메뉴 비활성화 (우클릭)
    this._canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * 키 다운 이벤트
   */
  private onKeyDown(event: KeyboardEvent): void {
    // IME 조합 중일 때는 개별 자모 키 입력 무시
    // event.isComposing 속성을 우선 체크 (브라우저가 제공하는 정확한 상태)
    if (event.isComposing || this._isComposing) {
      return;
    }
    this._keys.set(event.key, true);
  }

  /**
   * 키 업 이벤트
   */
  private onKeyUp(event: KeyboardEvent): void {
    this._keys.set(event.key, false);
  }

  /**
   * IME 조합 시작 (한글, 일본어 등)
   */
  private onCompositionStart(_event: CompositionEvent): void {
    this._isComposing = true;
  }

  /**
   * IME 조합 업데이트
   */
  private onCompositionUpdate(_event: CompositionEvent): void {
    // 조합 중인 텍스트는 별도로 저장하지 않음
    // 조합이 완료될 때만 텍스트를 처리
  }

  /**
   * IME 조합 완료
   */
  private onCompositionEnd(event: CompositionEvent): void {
    this._composedText = event.data || '';
    // 다음 프레임까지 isComposing 유지하여 compositionend 직후 keydown 방지
    requestAnimationFrame(() => {
      this._isComposing = false;
    });
  }

  /**
   * 마우스 이동 이벤트
   */
  private onMouseMove(event: MouseEvent): void {
    const rect = this._canvas.getBoundingClientRect();
    this._mousePosition.x = event.clientX - rect.left;
    this._mousePosition.y = event.clientY - rect.top;
  }

  /**
   * 마우스 버튼 다운 이벤트
   */
  private onMouseDown(event: MouseEvent): void {
    this._mouseButtons.set(event.button, true);
  }

  /**
   * 마우스 버튼 업 이벤트
   */
  private onMouseUp(event: MouseEvent): void {
    this._mouseButtons.set(event.button, false);
  }

  /**
   * 프레임 종료 시 상태 업데이트 (매 프레임마다 호출해야 함)
   */
  update(): void {
    // 키보드 상태 업데이트
    this._keysPressed.clear();
    this._keysReleased.clear();

    for (const [key, isDown] of this._keys.entries()) {
      const wasDown = this._keysPrevious.get(key) || false;

      if (isDown && !wasDown) {
        this._keysPressed.set(key, true);
      } else if (!isDown && wasDown) {
        this._keysReleased.set(key, true);
      }

      this._keysPrevious.set(key, isDown);
    }

    // 마우스 버튼 상태 업데이트
    this._mouseButtonsPressed.clear();
    this._mouseButtonsReleased.clear();

    for (const [button, isDown] of this._mouseButtons.entries()) {
      const wasDown = this._mouseButtonsPrevious.get(button) || false;

      if (isDown && !wasDown) {
        this._mouseButtonsPressed.set(button, true);
      } else if (!isDown && wasDown) {
        this._mouseButtonsReleased.set(button, true);
      }

      this._mouseButtonsPrevious.set(button, isDown);
    }
  }

  /**
   * 키가 현재 눌려있는지 확인
   */
  isKeyDown(key: string): boolean {
    return this._keys.get(key) || false;
  }

  /**
   * 키가 이번 프레임에 막 눌렸는지 확인
   */
  isKeyPressed(key: string): boolean {
    return this._keysPressed.get(key) || false;
  }

  /**
   * 키가 이번 프레임에 막 떼어졌는지 확인
   */
  isKeyReleased(key: string): boolean {
    return this._keysReleased.get(key) || false;
  }

  /**
   * 이번 프레임에 눌린 모든 키 목록 반환
   * @returns 눌린 키 목록
   */
  getKeysPressed(): string[] {
    return Array.from(this._keysPressed.keys());
  }

  /**
   * IME 조합 중인지 확인
   * @returns 조합 중이면 true
   */
  isComposing(): boolean {
    return this._isComposing;
  }

  /**
   * 조합이 완료된 텍스트 반환 (한 번만 반환되고 초기화됨)
   * @returns 조합 완료된 텍스트 (없으면 null)
   */
  getComposedText(): string | null {
    const text = this._composedText;
    this._composedText = null;
    return text;
  }

  /**
   * 마우스 위치 반환 (Canvas 좌표)
   */
  getMousePosition(): Vector2 {
    return this._mousePosition.clone();
  }

  /**
   * 마우스 버튼이 현재 눌려있는지 확인
   * @param button 0: 왼쪽, 1: 중간, 2: 오른쪽
   */
  isMouseButtonDown(button: number): boolean {
    return this._mouseButtons.get(button) || false;
  }

  /**
   * 마우스 버튼이 이번 프레임에 막 눌렸는지 확인
   */
  isMouseButtonPressed(button: number): boolean {
    return this._mouseButtonsPressed.get(button) || false;
  }

  /**
   * 마우스 버튼이 이번 프레임에 막 떼어졌는지 확인
   */
  isMouseButtonReleased(button: number): boolean {
    return this._mouseButtonsReleased.get(button) || false;
  }

  /**
   * 왼쪽 마우스 버튼이 눌려있는지
   */
  isLeftMouseDown(): boolean {
    return this.isMouseButtonDown(0);
  }

  /**
   * 오른쪽 마우스 버튼이 눌려있는지
   */
  isRightMouseDown(): boolean {
    return this.isMouseButtonDown(2);
  }

  /**
   * 중간 마우스 버튼이 눌려있는지
   */
  isMiddleMouseDown(): boolean {
    return this.isMouseButtonDown(1);
  }

  /**
   * 특정 키들 중 하나라도 눌려있는지 확인
   */
  isAnyKeyDown(keys: string[]): boolean {
    for (const key of keys) {
      if (this.isKeyDown(key)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 모든 키들이 눌려있는지 확인
   */
  areAllKeysDown(keys: string[]): boolean {
    for (const key of keys) {
      if (!this.isKeyDown(key)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 이벤트 리스너 정리
   */
  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('keyup', this.onKeyUp.bind(this));
    window.removeEventListener('compositionstart', this.onCompositionStart.bind(this));
    window.removeEventListener('compositionupdate', this.onCompositionUpdate.bind(this));
    window.removeEventListener('compositionend', this.onCompositionEnd.bind(this));
    this._canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this._canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this._canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }
}

/**
 * 자주 사용하는 키 코드 상수
 */
export const Keys = {
  // 화살표 키
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',

  // WASD
  W: 'w',
  A: 'a',
  S: 's',
  D: 'd',

  // 스페이스 & 엔터
  Space: ' ',
  Enter: 'Enter',

  // 시프트, 컨트롤, 알트
  Shift: 'Shift',
  Control: 'Control',
  Alt: 'Alt',

  // ESC
  Escape: 'Escape',

  // 숫자
  Num0: '0',
  Num1: '1',
  Num2: '2',
  Num3: '3',
  Num4: '4',
  Num5: '5',
  Num6: '6',
  Num7: '7',
  Num8: '8',
  Num9: '9',
};
