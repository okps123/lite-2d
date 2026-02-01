/**
 * UI 관련 타입 정의
 */

/**
 * 버튼 스타일 인터페이스
 */
export interface ButtonStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  textColor: string;
  scale: number; // 1.0 = 기본 크기, 1.05 = 5% 확대
}

/**
 * 텍스트 정렬 타입
 */
export type TextAlign = 'left' | 'center' | 'right';

/**
 * 수직 정렬 타입
 */
export type VerticalAlign = 'top' | 'middle' | 'bottom';

/**
 * 텍스트 그림자 설정
 */
export interface TextShadow {
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
}

/**
 * 텍스트 외곽선 설정
 */
export interface TextOutline {
  color: string;
  width: number;
}

/**
 * UI 이벤트 콜백 타입
 */
export type UIEventCallback = () => void;

/**
 * 텍스트 변경 콜백 타입
 */
export type TextChangeCallback = (text: string) => void;
