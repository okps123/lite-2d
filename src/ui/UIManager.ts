import { UIElement } from './UIElement';
import { InputBox } from './InputBox';
import { InputManager } from '../input/InputManager';
import { Camera } from '../rendering/Camera';
import { Vector2 } from '../utils/Vector2';

/**
 * UIManager 클래스
 * UI 요소의 이벤트 처리 및 포커스 관리를 담당합니다.
 */
export class UIManager {
  private _uiElements: UIElement[] = [];
  private _focusedElement: UIElement | null = null;
  private _hoveredElement: UIElement | null = null;
  private _pressedElement: UIElement | null = null;

  private _inputManager: InputManager;
  private _camera: Camera;

  private _eventConsumed: boolean = false; // UI가 이벤트를 소비했는지 여부

  constructor(inputManager: InputManager, camera: Camera) {
    this._inputManager = inputManager;
    this._camera = camera;
  }

  /**
   * UI 요소 등록
   */
  register(element: UIElement): void {
    if (!this._uiElements.includes(element)) {
      this._uiElements.push(element);
    }
  }

  /**
   * UI 요소 등록 해제
   */
  unregister(element: UIElement): void {
    const index = this._uiElements.indexOf(element);
    if (index !== -1) {
      this._uiElements.splice(index, 1);

      // 포커스/hover/press 상태 정리
      if (this._focusedElement === element) {
        this._focusedElement = null;
      }
      if (this._hoveredElement === element) {
        this._hoveredElement = null;
      }
      if (this._pressedElement === element) {
        this._pressedElement = null;
      }
    }
  }

  /**
   * 모든 UI 요소 등록 해제
   */
  unregisterAll(): void {
    this._uiElements = [];
    this._focusedElement = null;
    this._hoveredElement = null;
    this._pressedElement = null;
  }

  /**
   * UI 이벤트 소비 여부 확인
   * 게임 로직에서 UI 클릭을 무시하고 싶을 때 사용
   */
  isEventConsumed(): boolean {
    return this._eventConsumed;
  }

  /**
   * 포커스된 요소 반환
   */
  getFocusedElement(): UIElement | null {
    return this._focusedElement;
  }

  /**
   * 포커스 설정
   * @param element 포커스할 요소 (null이면 포커스 해제)
   */
  setFocus(element: UIElement | null): void {
    if (this._focusedElement === element) return;

    // 이전 포커스 해제 (InputBox의 blur는 서브클래스에서 처리)
    if (this._focusedElement) {
      // InputBox는 별도로 blur() 메서드를 가지고 있으므로
      // 여기서는 단순히 참조만 해제
      this._focusedElement = null;
    }

    // 새 포커스 설정
    this._focusedElement = element;

    // InputBox는 별도로 focus() 메서드를 가지고 있으므로
    // 서브클래스에서 처리
  }

  /**
   * 매 프레임 업데이트
   * @param _deltaTime 프레임 간 시간 (초 단위)
   */
  update(_deltaTime: number): void {
    this._eventConsumed = false;

    // 마우스 이벤트 처리
    this.handleMouseEvents();

    // 키보드 이벤트 처리 (포커스된 InputBox용)
    this.handleKeyboardEvents();
  }

  /**
   * 마우스 이벤트 처리
   */
  private handleMouseEvents(): void {
    const mousePos = this._inputManager.getMousePosition();
    const elementUnderMouse = this.findElementAtPosition(mousePos);

    // Hover 상태 업데이트
    if (elementUnderMouse !== this._hoveredElement) {
      if (this._hoveredElement) {
        this._hoveredElement.onMouseLeave();
        this._hoveredElement.hovered = false;
      }
      if (elementUnderMouse) {
        elementUnderMouse.onMouseEnter();
        elementUnderMouse.hovered = true;
      }
      this._hoveredElement = elementUnderMouse;
    }

    // 클릭 처리 (왼쪽 버튼)
    if (this._inputManager.isMouseButtonPressed(0)) {
      if (elementUnderMouse) {
        elementUnderMouse.onMouseDown();
        this._pressedElement = elementUnderMouse;
        this._eventConsumed = true; // UI가 이벤트 소비

        // InputBox 클릭 시 포커스 설정
        if (elementUnderMouse instanceof InputBox) {
          this.setFocus(elementUnderMouse);
          elementUnderMouse.focus();
        } else {
          // 다른 UI 클릭 시 포커스 해제
          if (this._focusedElement instanceof InputBox) {
            this._focusedElement.blur();
          }
          this.setFocus(null);
        }
      } else {
        // 빈 공간 클릭 시 포커스 해제
        if (this._focusedElement instanceof InputBox) {
          this._focusedElement.blur();
        }
        this.setFocus(null);
      }
    }

    // 릴리즈 처리
    if (this._inputManager.isMouseButtonReleased(0)) {
      if (this._pressedElement) {
        this._pressedElement.onMouseUp();

        // 같은 요소에서 눌렀다 뗐으면 클릭
        if (this._pressedElement === elementUnderMouse) {
          this._pressedElement.onClick();
        }

        this._pressedElement = null;
        this._eventConsumed = true; // UI가 이벤트 소비
      }
    }
  }

  /**
   * 키보드 이벤트 처리 (InputBox용)
   */
  private handleKeyboardEvents(): void {
    if (!this._focusedElement) return;
    if (!(this._focusedElement instanceof InputBox)) return;

    const inputBox = this._focusedElement as InputBox;

    // 특수 키 처리
    if (this._inputManager.isKeyPressed('Backspace')) {
      inputBox.deleteCharacter();
      return; // 특수 키는 문자 입력과 함께 처리하지 않음
    }

    if (this._inputManager.isKeyPressed('Enter')) {
      inputBox.submit();
      return;
    }

    if (this._inputManager.isKeyPressed('ArrowLeft')) {
      inputBox.moveCursor(-1);
      return;
    }

    if (this._inputManager.isKeyPressed('ArrowRight')) {
      inputBox.moveCursor(1);
      return;
    }

    // IME 조합 완료된 텍스트 처리 (한글, 일본어 등)
    const composedText = this._inputManager.getComposedText();
    if (composedText) {
      // 조합 완료된 텍스트를 한 번에 입력
      for (const char of composedText) {
        inputBox.insertCharacter(char);
      }
      return;
    }

    // 조합 중이면 일반 키 입력 무시
    if (this._inputManager.isComposing()) {
      return;
    }

    // 출력 가능한 문자 입력 처리 (영문, 숫자, 기호 등)
    // 이번 프레임에 눌린 모든 키를 확인하여 출력 가능한 문자만 입력
    const pressedKeys = this._inputManager.getKeysPressed();

    for (const key of pressedKeys) {
      // 길이가 1인 문자만 입력
      // 특수 키(Shift, Control 등)는 길이가 1보다 크므로 자동으로 제외됨
      if (key.length === 1) {
        inputBox.insertCharacter(key);
      }
    }
  }

  /**
   * 특정 위치에 있는 UI 요소 찾기
   * sortingOrder가 높은 순서대로 검색 (위에 있는 것 우선)
   * @param position 검색할 위치 (스크린 좌표)
   * @returns 찾은 UI 요소 (없으면 null)
   */
  private findElementAtPosition(position: Vector2): UIElement | null {
    // sortingOrder 역순으로 정렬 (높은 값 먼저)
    const sortedElements = [...this._uiElements].sort(
      (a, b) => b.sortingOrder - a.sortingOrder
    );

    for (const element of sortedElements) {
      if (!element.active || !element.interactive || !element.enabled) {
        continue;
      }

      let containsMouse = false;

      if (element.screenSpace) {
        // Screen Space: 직접 비교
        containsMouse = element.containsPoint(position);
      } else {
        // World Space: 월드 좌표로 변환 후 비교
        const mouseWorldPos = this._camera.screenToWorld(position);
        containsMouse = element.containsPoint(mouseWorldPos);
      }

      if (containsMouse) {
        return element; // 첫 번째로 히트한 요소 반환
      }
    }

    return null;
  }
}
