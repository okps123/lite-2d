# 코딩 스타일 가이드

## 언어 규칙

### 주석 및 문서화
- **주석**: 한국어로 작성
- **문서화**: 한국어로 작성
- **커밋 메시지**: 한국어로 작성
- **변수명/함수명**: 영어로 작성 (코드 표준 준수)

```typescript
// ✅ 좋은 예
/**
 * 충돌 감지 알고리즘
 * Narrow Phase 충돌 검사를 수행합니다.
 */
export class CollisionDetection {
  static detect(a: Collider, b: Collider): CollisionInfo | null {
    // 충돌 검사 로직
  }
}

// ❌ 나쁜 예
export class 충돌감지 {  // 클래스명은 영어로
  static 감지(a: Collider, b: Collider): CollisionInfo | null {  // 메서드명도 영어로
    // Collision detection logic  // 주석은 한국어로
  }
}
```

## TypeScript 규칙

### 타입 안정성
- 사용하지 않는 변수/import는 즉시 제거
- TypeScript strict mode 활성화
- any 타입 사용 지양

```typescript
// ✅ 좋은 예
import {
  Engine,
  Scene,
  GameObject,
} from '../../src/index';

// ❌ 나쁜 예
import {
  Engine,
  Scene,
  GameObject,
  PhysicsManager,  // 사용하지 않는 import
} from '../../src/index';

const unusedVariable = 123;  // 사용하지 않는 변수
```

## 물리 엔진 규칙

### 물리 상수 (PhysicsTypes.ts)
이 값들은 안정적인 물리 시뮬레이션을 위해 신중하게 조정된 값입니다.
**임의로 변경하지 마세요.**

```typescript
export const PhysicsConstants = {
  /** 중력 가속도 (pixels/s²) */
  GRAVITY: new Vector2(0, 980),

  /** 고정 타임스텝 (초) - 60Hz */
  FIXED_TIMESTEP: 1 / 60,

  /** 최대 속도 제한 (pixels/s) */
  MAX_VELOCITY: 5000,

  /** Sleep 임계값 (속도) */
  SLEEP_THRESHOLD: 0.5,

  /** Sleep 타이머 (초) */
  SLEEP_TIME: 0.5,

  /** Positional Correction 비율 - 40% */
  CORRECTION_PERCENT: 0.4,

  /** Positional Correction 허용 침투 깊이 - 0.05 픽셀 */
  CORRECTION_SLOP: 0.05,

  /** Position Solver 반복 횟수 - 4회 */
  POSITION_ITERATIONS: 4,

  /** Velocity Solver 반복 횟수 - 6회 (현재 미사용) */
  VELOCITY_ITERATIONS: 6,
};
```

### 충돌 해결 알고리즘 (PhysicsManager.ts)

**중요**: 다음 구조를 유지해야 합니다.

1. **Position Solver** (반복)
   - 위치 보정만 수행
   - POSITION_ITERATIONS 만큼 반복
   - 각 iteration마다 충돌 재감지

2. **Velocity Solver** (한 번)
   - Impulse 적용
   - 마찰력 계산
   - 한 번만 실행

```typescript
// 6-1. Position Solver (위치 보정 반복)
const iterations = PhysicsConstants.POSITION_ITERATIONS;
for (let iter = 0; iter < iterations; iter++) {
  // Bounds 업데이트
  for (const collider of this._colliders) {
    if (collider.enabled) {
      collider.updateBounds();
    }
  }

  // 모든 충돌 쌍에 대해 위치 보정만
  for (const [_key, info] of currentCollisions) {
    const a = info.colliderA;
    const b = info.colliderB;

    if (!a.isTrigger && !b.isTrigger) {
      const updatedInfo = CollisionDetection.detect(a, b);
      if (updatedInfo) {
        CollisionResolver.resolvePositionOnly(updatedInfo);
      }
    }
  }
}

// 6-2. Velocity Solver (Impulse 적용 - 한 번)
for (const [_key, info] of currentCollisions) {
  const a = info.colliderA;
  const b = info.colliderB;

  if (!a.isTrigger && !b.isTrigger) {
    const finalInfo = CollisionDetection.detect(a, b);
    if (finalInfo) {
      CollisionResolver.resolve(finalInfo);
    }
  }
}
```

### Circle-Box 충돌 Normal 방향 (CollisionDetection.ts)

**중요**: Circle이 Box 내부에 있을 때 normal 방향이 매우 중요합니다.

```typescript
// Circle 중심이 AABB 내부에 있을 때
const distToLeft = circlePos.x - boxBounds.min.x;
const distToRight = boxBounds.max.x - circlePos.x;
const distToTop = circlePos.y - boxBounds.min.y;
const distToBottom = boxBounds.max.y - circlePos.y;

const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

// ✅ 올바른 normal 방향 (Box 밖으로 밀어냄)
if (minDist === distToLeft) {
  normal = new Vector2(-1, 0);  // 왼쪽으로 밀어냄
} else if (minDist === distToRight) {
  normal = new Vector2(1, 0);   // 오른쪽으로 밀어냄
} else if (minDist === distToTop) {
  normal = new Vector2(0, -1);  // 위로 밀어냄
} else {
  normal = new Vector2(0, 1);   // 아래로 밀어냄
}

// ❌ 잘못된 방향 (Box 안쪽으로 밀어넣음 - 절대 사용 금지!)
// if (minDist === distToLeft) {
//   normal = new Vector2(1, 0);   // 반대 방향!
// }
```

## 파일 구조

### 예제 파일
- 각 예제는 독립적인 `.ts` 파일과 `.html` 파일로 구성
- `examples/` 디렉토리 하위에 카테고리별로 분류
- webpack.config.js에 entry와 HtmlWebpackPlugin 추가 필수

```
examples/
├── basic/
│   ├── main.ts
│   └── index.html
├── physics/
│   ├── main.ts        # 물리 데모
│   ├── fluid.ts       # 유체 시뮬레이션
│   ├── index.html
│   └── fluid.html
└── ui/
    ├── main.ts
    └── index.html
```

### 물리 시스템 파일 구조
```
src/physics/
├── PhysicsManager.ts              # 물리 시스템 관리
├── PhysicsTypes.ts                # 타입 정의 및 상수
├── PhysicsMaterial.ts             # 물리 재질
├── RigidBody.ts                   # 강체 컴포넌트
├── colliders/
│   ├── Collider.ts                # 베이스 클래스
│   ├── BoxCollider.ts             # AABB 충돌체
│   └── CircleCollider.ts          # 원형 충돌체
└── collision/
    ├── CollisionInfo.ts           # 충돌 정보
    ├── CollisionDetection.ts      # 충돌 감지
    ├── CollisionResolver.ts       # 충돌 해결
    └── Raycast.ts                 # 레이캐스트
```

## 렌더링 규칙

### GameObject 렌더링
- 모든 GameObject는 `onRender` 메서드로 렌더링
- Canvas 2D Context 사용
- save/restore로 상태 관리

```typescript
// ✅ 좋은 예
box.onRender = function (ctx: CanvasRenderingContext2D) {
  const col = this.getComponent(BoxCollider);
  if (!col) return;

  ctx.save();
  ctx.fillStyle = '#e74c3c';
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 2;
  ctx.fillRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);
  ctx.strokeRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);
  ctx.restore();
};
```

## 성능 고려사항

### 물리 엔진
- Brute Force 충돌 감지 사용 (O(n²))
- Collider 50-100개까지 안정적
- 100개 이상 시 Spatial Hash 고려

### 유체 시뮬레이션
- 입자당 6픽셀 이하 권장
- 총 입자 수 150개 이하 권장
- 너무 많은 입자는 성능 저하 유발

## 디버깅 규칙

### 콘솔 로그
- 중요한 이벤트만 로깅
- 개발 완료 후 불필요한 console.log 제거
- 에러는 console.error 사용

```typescript
// ✅ 좋은 예
console.log(`[Raycast] 명중! ${hit.collider.gameObject?.name}`);
console.error('[Physics] RigidBody not found');

// ❌ 나쁜 예
console.log('test');  // 의미 없는 로그
console.log(someObject);  // 객체 전체 출력
```

## Git 커밋 규칙

### 커밋 메시지
- 한국어로 작성
- 명확하고 간결하게
- 변경 사항의 "왜"를 설명

```bash
# ✅ 좋은 예
git commit -m "Circle-Box 충돌 시 normal 방향 버그 수정

Circle이 Box 내부에 있을 때 normal이 반대 방향이었던 문제 해결.
이제 올바르게 Box 밖으로 밀어낸다."

# ❌ 나쁜 예
git commit -m "fix bug"
git commit -m "update"
```

## 참고 사항

### 물리 엔진 튜닝
물리 엔진의 상수 값을 조정할 때는:
1. 한 번에 하나씩만 변경
2. 변경 전 값을 기록
3. 테스트 후 문제 발생 시 즉시 복원
4. 안정적인 값을 찾으면 이 문서 업데이트

### 새로운 Collider 추가
1. `Collider` 클래스 상속
2. `computeBounds()` 구현
3. `containsPoint()` 구현
4. `CollisionDetection.detect()`에 케이스 추가
5. 충돌 테스트 예제 작성

### 문의사항
이 문서의 내용이 불명확하거나 업데이트가 필요한 경우 팀에 문의하세요.
