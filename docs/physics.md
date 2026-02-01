
## 개요

Lite2D의 물리 시스템은 2D 게임을 위한 강체 동역학(Rigid Body Dynamics)과 충돌 처리를 제공합니다. Component 기반 설계로 GameObject에 쉽게 추가할 수 있습니다.

## 주요 기능

- **RigidBody**: 중력, 속도, 힘, 마찰 등 물리 시뮬레이션
- **Collider**: AABB와 Circle 충돌체 지원
- **충돌 감지**: 정밀한 충돌 감지 및 해결
- **충돌 이벤트**: Enter/Stay/Exit 이벤트 콜백
- **Trigger**: 물리 반응 없이 이벤트만 발생
- **PhysicsMaterial**: 마찰과 반발 계수 설정
- **Raycast**: 레이 기반 충돌 검사
- **Fixed Timestep**: 안정적인 물리 시뮬레이션

## 빠른 시작

### 1. 기본 물리 오브젝트 생성

```typescript
import { GameObject, RigidBody, BoxCollider, Vector2, PhysicsMaterial } from 'lite2d';

// GameObject 생성
const box = new GameObject('Box');
box.transform.position = new Vector2(400, 100);

// RigidBody 추가 (물리 시뮬레이션)
const rigidbody = new RigidBody();
rigidbody.mass = 1.0;
rigidbody.useGravity = true;
box.addComponent(rigidbody);

// BoxCollider 추가 (충돌 감지)
const collider = new BoxCollider();
collider.size = new Vector2(50, 50);
box.addComponent(collider);

// 씬에 추가
scene.addGameObject(box);
```

### 2. 충돌 이벤트 처리

```typescript
class Player extends GameObject {
  onCollisionEnter(collision: CollisionEvent): void {
    console.log('충돌 발생!', collision.other.gameObject?.name);

    // 충돌 법선 방향으로 튕김
    const rb = this.getComponent(RigidBody);
    if (rb) {
      rb.addImpulse(collision.normal.multiply(100));
    }
  }

  onTriggerEnter(other: Collider): void {
    console.log('트리거 진입:', other.gameObject?.name);
  }
}
```

## 핵심 클래스

### RigidBody

GameObject에 물리 속성을 부여하는 컴포넌트입니다.

#### 주요 속성

```typescript
class RigidBody extends Component {
  // 물리 속성
  mass: number;                    // 질량 (kg)
  velocity: Vector2;               // 속도 (pixels/s)
  angularVelocity: number;         // 각속도 (radians/s)

  // 옵션
  bodyType: BodyType;              // STATIC, KINEMATIC, DYNAMIC
  useGravity: boolean;             // 중력 적용 여부
  drag: number;                    // 선형 저항 (0~1)
  angularDrag: number;             // 각 저항 (0~1)
  gravityScale: number;            // 중력 스케일 (기본 1.0)

  // 메서드
  addForce(force: Vector2): void;
  addImpulse(impulse: Vector2): void;
  addTorque(torque: number): void;
  setVelocity(velocity: Vector2): void;
  wakeUp(): void;
}
```

#### BodyType

- **STATIC**: 움직이지 않는 물체 (벽, 바닥 등)
- **KINEMATIC**: 스크립트로 제어되는 물체 (물리 영향 무시)
- **DYNAMIC**: 물리 시뮬레이션이 적용되는 물체 (기본값)

#### 예제: 점프하는 캐릭터

```typescript
class Player extends GameObject {
  private rigidbody: RigidBody | null = null;

  start(): void {
    this.rigidbody = this.getComponent(RigidBody);
  }

  onUpdate(deltaTime: number): void {
    const input = this.scene?.engine?.inputManager;

    // 점프
    if (input?.isKeyPressed(' ') && this.isGrounded()) {
      this.rigidbody?.addImpulse(new Vector2(0, -500));
    }

    // 좌우 이동
    const moveX = (input?.isKeyHeld('d') ? 1 : 0) - (input?.isKeyHeld('a') ? 1 : 0);
    this.rigidbody?.setVelocity(new Vector2(moveX * 200, this.rigidbody.velocity.y));
  }

  private isGrounded(): boolean {
    // Raycast로 바닥 검사
    const hit = PhysicsManager.getInstance().raycast(
      this.transform.position,
      new Vector2(0, 1),
      30
    );
    return hit !== null;
  }
}
```

### Collider

충돌 감지를 담당하는 베이스 클래스입니다. BoxCollider와 CircleCollider가 있습니다.

#### BoxCollider (AABB)

```typescript
const collider = new BoxCollider();
collider.size = new Vector2(50, 50);       // 크기
collider.offset = new Vector2(0, 0);       // Transform 기준 오프셋
collider.isTrigger = false;                // Trigger 모드
collider.material = PhysicsMaterial.default;
box.addComponent(collider);
```

#### CircleCollider

```typescript
const collider = new CircleCollider();
collider.radius = 25;                      // 반지름
collider.offset = new Vector2(0, 0);
collider.isTrigger = false;
collider.material = PhysicsMaterial.bouncy;
circle.addComponent(collider);
```

### PhysicsMaterial

물리 재질 속성을 정의합니다.

```typescript
class PhysicsMaterial {
  friction: number;      // 마찰 계수 (0~1)
  restitution: number;   // 반발 계수 (0~1)
  density: number;       // 밀도
}

// 프리셋
PhysicsMaterial.default  // friction: 0.4, restitution: 0.2
PhysicsMaterial.bouncy   // friction: 0.3, restitution: 0.9
PhysicsMaterial.ice      // friction: 0.05, restitution: 0.1

// 커스텀 재질
const customMaterial = new PhysicsMaterial();
customMaterial.friction = 0.6;
customMaterial.restitution = 0.3;
```

### PhysicsManager

물리 시스템을 관리하는 싱글톤 클래스입니다.

```typescript
const physics = PhysicsManager.getInstance();

// 중력 설정
physics.gravity = new Vector2(0, 980);  // 기본값

// Raycast
const hit = physics.raycast(
  origin: Vector2,
  direction: Vector2,
  maxDistance: number
);

if (hit) {
  console.log('충돌:', hit.collider.gameObject?.name);
  console.log('거리:', hit.distance);
  console.log('위치:', hit.point);
}

// 모든 충돌 검사
const hits = physics.raycastAll(origin, direction, maxDistance);

// 원형 영역 검사
const colliders = physics.overlapCircle(center: Vector2, radius: number);
```

## 충돌 이벤트

GameObject에서 충돌 이벤트를 오버라이드하여 처리할 수 있습니다.

### Collision 이벤트 (물리 반응 있음)

```typescript
class MyObject extends GameObject {
  onCollisionEnter(collision: CollisionEvent): void {
    // 충돌이 시작될 때 한 번 호출
    console.log('충돌 시작:', collision.other.gameObject?.name);
    console.log('충돌 법선:', collision.normal);
    console.log('침투 깊이:', collision.penetration);
  }

  onCollisionStay(collision: CollisionEvent): void {
    // 충돌 중 매 프레임 호출
  }

  onCollisionExit(other: Collider): void {
    // 충돌이 끝날 때 한 번 호출
    console.log('충돌 종료:', other.gameObject?.name);
  }
}
```

### Trigger 이벤트 (물리 반응 없음)

```typescript
class TriggerZone extends GameObject {
  awake(): void {
    const collider = new BoxCollider();
    collider.size = new Vector2(100, 100);
    collider.isTrigger = true;  // Trigger 모드 활성화
    this.addComponent(collider);
  }

  onTriggerEnter(other: Collider): void {
    // Trigger 영역에 진입
    console.log('진입:', other.gameObject?.name);
  }

  onTriggerStay(other: Collider): void {
    // Trigger 영역 안에 있음
  }

  onTriggerExit(other: Collider): void {
    // Trigger 영역에서 나감
    console.log('탈출:', other.gameObject?.name);
  }
}
```

## 고급 기능

### Raycast

레이를 발사하여 충돌을 검사합니다.

```typescript
// 마우스 클릭 방향으로 Raycast
class Shooter extends GameObject {
  onUpdate(_deltaTime: number): void {
    const input = this.scene?.engine?.inputManager;

    if (input?.isMouseButtonPressed(0)) {
      const mousePos = input.getMousePosition();
      const origin = this.transform.position;
      const direction = mousePos.subtract(origin).normalize();

      const hit = PhysicsManager.getInstance().raycast(origin, direction, 1000);

      if (hit) {
        console.log('명중!', hit.collider.gameObject?.name);
        console.log('거리:', hit.distance);

        // 충돌 지점에 이펙트 생성
        this.createEffect(hit.point);
      }
    }
  }
}
```

### 힘과 충격량

```typescript
const rb = gameObject.getComponent(RigidBody);

// 힘 추가 (가속도 기반, 지속적)
rb.addForce(new Vector2(100, 0));

// 충격량 추가 (즉시 속도 변화)
rb.addImpulse(new Vector2(0, -200));

// 토크 추가 (회전력)
rb.addTorque(10);

// 속도 직접 설정
rb.setVelocity(new Vector2(100, 0));
```

### 마찰과 반발

```typescript
// 미끄러운 얼음
const iceMaterial = new PhysicsMaterial();
iceMaterial.friction = 0.05;
iceMaterial.restitution = 0.1;

const iceCollider = new BoxCollider();
iceCollider.material = iceMaterial;

// 튀는 공
const bouncyMaterial = new PhysicsMaterial();
bouncyMaterial.friction = 0.3;
bouncyMaterial.restitution = 0.9;

const ballCollider = new CircleCollider();
ballCollider.material = bouncyMaterial;
```

## 성능 최적화

### Sleep 시스템

움직임이 없는 RigidBody는 자동으로 sleep 상태가 되어 물리 계산에서 제외됩니다.

```typescript
const rb = new RigidBody();
// Sleep 임계값 (기본: 0.5)
// 속도가 이 값보다 작으면 일정 시간 후 sleep

// 강제로 깨우기
rb.wakeUp();
```

### Broad Phase

- 현재: Brute Force (O(n²))
- Collider 50개 이하에서 충분한 성능
- 향후: Spatial Hash로 업그레이드 가능 (O(n))

### Fixed Timestep

물리 시뮬레이션은 60Hz 고정 업데이트로 실행되어 프레임레이트와 무관하게 안정적입니다.

```typescript
// PhysicsConstants (변경 가능)
PhysicsConstants.FIXED_TIMESTEP = 1/60;    // 60Hz
PhysicsConstants.GRAVITY = new Vector2(0, 980);
PhysicsConstants.MAX_VELOCITY = 5000;
```

## 예제: 플랫포머 게임

```typescript
// 플레이어
class Player extends GameObject {
  private rb: RigidBody | null = null;
  private grounded: boolean = false;

  awake(): void {
    // RigidBody
    this.rb = new RigidBody();
    this.rb.mass = 1.0;
    this.rb.useGravity = true;
    this.rb.drag = 0.1;
    this.addComponent(this.rb);

    // Collider
    const collider = new BoxCollider();
    collider.size = new Vector2(40, 60);
    this.addComponent(collider);
  }

  onUpdate(deltaTime: number): void {
    const input = this.scene?.engine?.inputManager;
    if (!input || !this.rb) return;

    // 이동
    const moveX = (input.isKeyHeld('ArrowRight') ? 1 : 0) -
                  (input.isKeyHeld('ArrowLeft') ? 1 : 0);
    this.rb.velocity = new Vector2(moveX * 200, this.rb.velocity.y);

    // 점프
    if (input.isKeyPressed('Space') && this.grounded) {
      this.rb.addImpulse(new Vector2(0, -400));
    }
  }

  onCollisionEnter(collision: CollisionEvent): void {
    // 바닥 충돌 검사
    if (collision.normal.y < -0.5) {
      this.grounded = true;
    }
  }

  onCollisionExit(_other: Collider): void {
    this.grounded = false;
  }
}

// 플랫폼
class Platform extends GameObject {
  awake(): void {
    // STATIC RigidBody (움직이지 않음)
    const rb = new RigidBody();
    rb.bodyType = BodyType.STATIC;
    this.addComponent(rb);

    // Collider
    const collider = new BoxCollider();
    collider.size = new Vector2(200, 20);
    this.addComponent(collider);
  }
}

// 코인 (Trigger)
class Coin extends GameObject {
  awake(): void {
    const collider = new CircleCollider();
    collider.radius = 15;
    collider.isTrigger = true;  // 물리 반응 없음
    this.addComponent(collider);
  }

  onTriggerEnter(other: Collider): void {
    if (other.gameObject?.name === 'Player') {
      console.log('코인 획득!');
      this.destroy();
    }
  }
}
```

## 주의사항

### Transform 수정 시 주의

물리 시스템이 적용된 GameObject의 Transform을 직접 수정하면 예기치 않은 동작이 발생할 수 있습니다.

```typescript
// ❌ 직접 수정 (물리 시뮬레이션과 충돌)
gameObject.transform.position = new Vector2(100, 100);

// ✅ RigidBody를 통한 이동 (권장)
const rb = gameObject.getComponent(RigidBody);
rb.setVelocity(new Vector2(100, 0));
rb.addImpulse(new Vector2(100, 0));

// ✅ Kinematic 모드 사용
rb.bodyType = BodyType.KINEMATIC;
gameObject.transform.position = new Vector2(100, 100);
```

### 터널링 현상

빠르게 움직이는 물체가 얇은 벽을 통과할 수 있습니다.

**해결 방법:**
- 최대 속도 제한 (PhysicsConstants.MAX_VELOCITY)
- 벽 두께 증가
- Fixed Timestep 증가 (예: 1/120초)

## 디버그 기능

향후 추가 예정:
- Collider 경계 시각화
- 충돌 법선 벡터 표시
- Raycast 디버그 렌더링

## 참고

- Box2D - 2D 물리 엔진의 표준
- Matter.js - JavaScript 2D 물리 엔진
- Unity Physics2D - API 디자인 참고
