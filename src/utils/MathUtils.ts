/**
 * 수학 유틸리티 함수들
 */
export class MathUtils {
  /**
   * 원주율
   */
  static readonly PI = Math.PI;

  /**
   * 2 * PI
   */
  static readonly TWO_PI = Math.PI * 2;

  /**
   * PI / 2
   */
  static readonly HALF_PI = Math.PI / 2;

  /**
   * 도를 라디안으로 변환
   */
  static degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 라디안을 도로 변환
   */
  static radToDeg(radians: number): number {
    return radians * (180 / Math.PI);
  }

  /**
   * 값을 최소값과 최대값 사이로 제한
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 선형 보간
   * @param a 시작 값
   * @param b 끝 값
   * @param t 보간 비율 (0~1)
   */
  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * 값을 0~1 범위로 정규화
   * @param value 정규화할 값
   * @param min 최소값
   * @param max 최대값
   */
  static normalize(value: number, min: number, max: number): number {
    return (value - min) / (max - min);
  }

  /**
   * 값을 다른 범위로 매핑
   * @param value 변환할 값
   * @param inMin 입력 최소값
   * @param inMax 입력 최대값
   * @param outMin 출력 최소값
   * @param outMax 출력 최대값
   */
  static map(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
  ): number {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  /**
   * 두 값이 거의 같은지 비교
   */
  static approximately(a: number, b: number, epsilon: number = 0.0001): boolean {
    return Math.abs(a - b) < epsilon;
  }

  /**
   * 값의 부호 반환 (-1, 0, 1)
   */
  static sign(value: number): number {
    if (value > 0) return 1;
    if (value < 0) return -1;
    return 0;
  }

  /**
   * 최소값과 최대값 사이의 랜덤 값
   */
  static random(min: number = 0, max: number = 1): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * 최소값과 최대값 사이의 랜덤 정수
   */
  static randomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 배열에서 랜덤 요소 선택
   */
  static randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * 각도를 -180 ~ 180 범위로 정규화
   */
  static normalizeAngle(degrees: number): number {
    degrees = degrees % 360;
    if (degrees > 180) {
      degrees -= 360;
    } else if (degrees < -180) {
      degrees += 360;
    }
    return degrees;
  }

  /**
   * 라디안을 -PI ~ PI 범위로 정규화
   */
  static normalizeRadians(radians: number): number {
    radians = radians % this.TWO_PI;
    if (radians > Math.PI) {
      radians -= this.TWO_PI;
    } else if (radians < -Math.PI) {
      radians += this.TWO_PI;
    }
    return radians;
  }

  /**
   * 두 각도 사이의 최단 차이 (도 단위)
   */
  static deltaAngle(current: number, target: number): number {
    let delta = target - current;
    delta = ((delta + 180) % 360) - 180;
    return delta;
  }

  /**
   * 값이 범위 내에 있는지 확인
   */
  static inRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * 값을 소수점 자리수로 반올림
   */
  static roundTo(value: number, decimals: number): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * Smoothstep 보간 (부드러운 곡선 보간)
   */
  static smoothstep(edge0: number, edge1: number, x: number): number {
    const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  /**
   * 값을 점진적으로 목표값에 도달 (댐핑)
   */
  static damp(
    current: number,
    target: number,
    smoothing: number,
    deltaTime: number
  ): number {
    return this.lerp(current, target, 1 - Math.exp(-smoothing * deltaTime));
  }

  /**
   * 바운스 이징 (통통 튀는 효과)
   */
  static easeOutBounce(t: number): number {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      t -= 1.5 / 2.75;
      return 7.5625 * t * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      t -= 2.25 / 2.75;
      return 7.5625 * t * t + 0.9375;
    } else {
      t -= 2.625 / 2.75;
      return 7.5625 * t * t + 0.984375;
    }
  }

  /**
   * Ease In Quad
   */
  static easeInQuad(t: number): number {
    return t * t;
  }

  /**
   * Ease Out Quad
   */
  static easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  /**
   * Ease In Out Quad
   */
  static easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
}
