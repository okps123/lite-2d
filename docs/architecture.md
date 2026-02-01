# Lite2D 아키텍처

## 개요

Lite2D는 Cocos2D에서 영감을 받은 GameObject 기반의 2D 게임 프레임워크입니다. 명확한 계층 구조와 Update/Render 루프를 제공합니다.

## 전체 구조

```
Engine (싱글톤 역할)
  ├─ Canvas
  ├─ InputManager
  ├─ AssetLoader
  └─ Scene
       ├─ Camera
       └─ GameObject[]
             ├─ Transform
             ├─ Component[]
             └─ children: GameObject[]
                     └─ (재귀 구조)
```

## 핵심 개념

### 1. GameObject 상속 구조

모든 게임 오브젝트는 `GameObject` 클래스를 상속받습니다.

```typescript
class GameObject {
  - name: string
  - transform: Transform
  - active: boolean
  - scene: Scene
  - components: Component[]
  - children: GameObject[]

  + awake(): void
  + start(): void
  + update(deltaTime): void
  + render(ctx): void
  + destroy(): void
  + addChild(child): void
  + removeChild(child): void
}
```

**특징:**
- 라이프사이클 메서드 제공 (awake, start, update, render)
- Tree 구조 지원 (부모-자식 관계)
- Component 시스템 지원 (확장 가능)

### 2. Transform 시스템

GameObject의 위치, 회전, 스케일을 관리합니다.

```typescript
class Transform {
  - position: Vector2      // 로컬 위치
  - rotation: number       // 로컬 회전 (라디안)
  - scale: Vector2         // 로컬 스케일
  - parent: Transform
  - children: Transform[]

  + getWorldPosition(): Vector2
  + getWorldRotation(): number
  + getWorldScale(): Vector2
  + translate(delta: Vector2): void
  + rotate(angle: number): void
}
```

**특징:**
- 부모-자식 관계 지원
- 로컬 좌표 → 월드 좌표 자동 변환
- Dirty Flag 패턴으로 최적화

**중요 - Dirty Flag 문제:**

Transform은 성능 최적화를 위해 world position/rotation/scale을 캐싱합니다. position을 수정할 때는 반드시 setter를 통해야 dirty flag가 설정됩니다:

```typescript
// ❌ 잘못된 방법 - dirty flag가 설정되지 않음
this.transform.position.x += 10;

// ✅ 올바른 방법 1 - setter 호출
this.transform.position = new Vector2(
  this.transform.position.x + 10,
  this.transform.position.y
);

// ✅ 올바른 방법 2 - translate() 메서드 사용 (권장)
this.transform.translate(new Vector2(10, 0));

// ✅ 회전도 마찬가지
this.transform.rotate(Math.PI / 4);
```

`translate()`와 `rotate()` 메서드를 사용하면 자동으로 dirty flag가 설정되어 world transform이 다음 프레임에 올바르게 계산됩니다.

**왜 World Transform을 캐싱하는가?**

Transform은 성능 최적화를 위해 world position/rotation/scale을 캐싱합니다:

1. **계산 비용**: World transform은 부모 체인을 따라 재귀적으로 계산해야 하므로 비용이 큽니다.

```typescript
// Child4의 world position 계산
Root → Child1 → Child2 → Child3 → Child4
// 각 단계마다 부모의 transform을 고려한 복잡한 수학 연산
```

2. **빈번한 호출**: 매 프레임 렌더링 시 `getWorldPosition()` 등이 여러 번 호출됩니다.

```typescript
// GameObject.render()에서
const worldPos = this._transform.getWorldPosition();   // 1번째
const worldRot = this._transform.getWorldRotation();   // 2번째
const worldScale = this._transform.getWorldScale();   // 3번째
```

3. **변경 빈도**: 대부분의 GameObject는 매 프레임마다 움직이지 않습니다 (배경, 정적 오브젝트 등).

**성능 향상:**

```typescript
// 시나리오: 100개의 GameObject, 10%만 움직임

// ❌ 캐싱 없이
// - 매 프레임 100개 모두 재계산
// - 비용: 100 * (복잡한 재귀 계산)

// ✅ 캐싱 사용
// - 움직인 10개만 재계산 (dirty)
// - 나머지 90개는 캐시 반환 (clean)
// - 비용: 10 * (복잡한 계산) + 90 * (메모리 읽기)
// - 약 9배 성능 향상!
```

**Dirty Flag 동작 방식:**

```typescript
getWorldPosition(): Vector2 {
  // dirty일 때만 재계산
  if (this._isDirty || this._worldPosition === null) {
    this.updateWorldTransform();  // 비싼 계산
  }
  return this._worldPosition!.clone();  // 캐시 반환 (빠름)
}
```

부모가 변경되면 모든 자식도 자동으로 dirty 상태가 됩니다:

```typescript
private markDirty(): void {
  this._isDirty = true;
  // 자식들도 모두 dirty (부모가 바뀌면 자식 world도 바뀜)
  for (const child of this._children) {
    child.markDirty();
  }
}
```

### 3. Scene 관리

게임 씬을 관리하고 GameObject들을 담습니다.

```typescript
class Scene {
  - name: string
  - rootObjects: GameObject[]
  - camera: Camera
  - isLoaded: boolean
  - engine: Engine

  + load(): Promise<void>
  + unload(): void
  + addGameObject(obj): void
  + update(deltaTime): void
  + render(ctx): void
}
```

**특징:**
- 루트 레벨 GameObject 관리
- Camera 포함
- 씬 로드/언로드 지원

### 4. Engine (게임 루프)

전체 게임 엔진을 관리하고 게임 루프를 실행합니다.

```typescript
class Engine {
  - canvas: HTMLCanvasElement
  - ctx: CanvasRenderingContext2D
  - currentScene: Scene
  - inputManager: InputManager
  - assetLoader: AssetLoader

  + start(): void
  + stop(): void
  + loadScene(scene): Promise<void>
  - gameLoop(timestamp): void
  - update(deltaTime): void
  - render(): void
}
```

**게임 루프:**
```
requestAnimationFrame
  ↓
1. Delta Time 계산
  ↓
2. InputManager.update()
  ↓
3. Scene.update(deltaTime)
  ↓
4. Canvas 클리어
  ↓
5. Camera 변환 적용
  ↓
6. Scene.render(ctx)
  ↓
다음 프레임 예약
```

## 렌더링 파이프라인

### Render 호출 흐름

```
Engine.render()
  ↓
Canvas 클리어
  ↓
배경색 그리기
  ↓
ctx.save()
  ↓
Camera.applyTransform(ctx)  // 카메라 변환
  ↓
Scene.render(ctx)
  ├─> GameObject.render(ctx, false)  (루트 오브젝트들, parentTransformed=false)
  │     ├─> ctx.save()
  │     ├─> World Transform 적용 (getWorldPosition, getWorldRotation, getWorldScale)
  │     ├─> onRender(ctx) 호출  (서브클래스의 커스텀 렌더링, 로컬 좌표계)
  │     ├─> Component.render(ctx)  (모든 컴포넌트)
  │     ├─> children.forEach(child => child.render(ctx, true))  (재귀, parentTransformed=true)
  │     │     ├─> ctx.save()
  │     │     ├─> Local Transform만 적용 (position, rotation, scale)
  │     │     ├─> onRender(ctx) 호출
  │     │     ├─> Component.render(ctx)
  │     │     └─> ctx.restore()
  │     └─> ctx.restore()
  └─> (다음 루트 오브젝트)
  ↓
ctx.restore()
```

**중요:** `render()` 메서드는 `parentTransformed` 매개변수를 받습니다:
- `false` (기본값): 루트 오브젝트 - World Transform 적용
- `true`: 자식 오브젝트 - Local Transform만 적용 (부모의 Transform이 이미 적용되어 있음)

이렇게 하면 Transform이 중복 적용되는 것을 방지합니다.

### onRender 패턴

GameObject를 상속받을 때 렌더링을 커스터마이징하려면 `onRender()` 메서드를 오버라이드합니다:

```typescript
class ColorBox extends GameObject {
  onRender(ctx: CanvasRenderingContext2D): void {
    // 이미 Transform이 적용된 로컬 좌표계에서 렌더링
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(-25, -25, 50, 50); // 중앙 앵커
  }
}
```

**주의:** `render()` 메서드를 직접 오버라이드하지 마세요. `render()`는 Transform 적용과 계층 구조 관리를 담당하므로, 커스텀 렌더링은 반드시 `onRender()`에서 구현해야 합니다.

### Transform 변환 계층

부모-자식 관계에서 Transform이 어떻게 전파되는지:

```
Parent GameObject (루트)
  position: (100, 100)  [로컬 = 월드]
  rotation: 0
  scale: (1, 1)
    ↓ render(ctx, false) 호출
    ↓ World Transform 적용: translate(100, 100)
    ↓
Child GameObject
  position: (50, 0)     [로컬]
  rotation: PI/4        [로컬]
  scale: (1, 1)
    ↓ render(ctx, true) 호출
    ↓ Local Transform만 적용: translate(50, 0), rotate(PI/4)
    ↓
최종 Canvas 좌표: (150, 100)  [부모 Transform + 자식 Transform]
최종 회전: PI/4
```

## Update 파이프라인

### Update 호출 흐름

```
Engine.update(deltaTime)
  ↓
InputManager.update()
  ↓
Scene.update(deltaTime)
  └─> GameObject.update(deltaTime)  (루트 오브젝트들)
        ├─> start() 호출 (아직 시작 안 했으면)
        ├─> onUpdate(deltaTime)  (서브클래스의 커스텀 업데이트)
        ├─> Component.update(deltaTime)  (모든 컴포넌트)
        └─> children.forEach(child => child.update(deltaTime))  (재귀)
```

### onUpdate 패턴

GameObject를 상속받을 때 업데이트 로직을 커스터마이징하려면 `onUpdate()` 메서드를 오버라이드합니다:

```typescript
class Player extends GameObject {
  private speed: number = 200;

  onUpdate(deltaTime: number): void {
    // 커스텀 업데이트 로직
    const input = this.scene?.engine?.inputManager;
    if (input?.isKeyDown(Keys.ArrowRight)) {
      this.transform.translate(new Vector2(this.speed * deltaTime, 0));
    }
  }
}
```

**주의:** `update()` 메서드를 직접 오버라이드하지 마세요. `update()`는 컴포넌트와 자식 업데이트 관리를 담당하므로, 커스텀 업데이트는 반드시 `onUpdate()`에서 구현해야 합니다.

**렌더링과의 일관성:**
- **업데이트**: `onUpdate()` 오버라이드 (컴포넌트/자식 업데이트 전에 호출)
- **렌더링**: `onRender()` 오버라이드 (Transform 적용 후, 로컬 좌표계에서 호출)

## Component 시스템

GameObject에 기능을 추가하는 확장 가능한 시스템입니다.

```typescript
class Component {
  - gameObject: GameObject
  - enabled: boolean

  + awake(): void
  + start(): void
  + update(deltaTime): void
  + render(ctx): void
  + onDestroy(): void
}
```

**사용 예시:**
```typescript
class PhysicsComponent extends Component {
  velocity: Vector2 = Vector2.zero();

  update(deltaTime: number): void {
    if (this.gameObject) {
      this.gameObject.transform.position =
        this.gameObject.transform.position.add(
          this.velocity.multiply(deltaTime)
        );
    }
  }
}

// GameObject에 추가
const obj = new GameObject('Player');
const physics = obj.addComponent(new PhysicsComponent());
physics.velocity = new Vector2(100, 0);
```

## 입력 시스템

InputManager는 키보드와 마우스 입력을 처리합니다.

```typescript
class InputManager {
  + isKeyDown(key: string): boolean
  + isKeyPressed(key: string): boolean  // 막 눌렸는지
  + isKeyReleased(key: string): boolean // 막 떼어졌는지
  + getMousePosition(): Vector2
  + isMouseButtonDown(button: number): boolean
}
```

**특징:**
- 프레임 단위 상태 추적
- Pressed/Released 이벤트 감지
- 이전 프레임과 현재 프레임 비교

## Camera 시스템

Camera는 뷰포트와 월드 좌표 변환을 관리합니다.

```typescript
class Camera {
  - position: Vector2
  - zoom: number
  - viewportWidth: number
  - viewportHeight: number

  + worldToScreen(worldPos): Vector2
  + screenToWorld(screenPos): Vector2
  + applyTransform(ctx): void
  + follow(target, smoothing): void
}
```

**변환 순서:**
1. 뷰포트 중앙으로 이동 (translate)
2. 줌 적용 (scale)
3. 카메라 회전 적용 (rotate)
4. 카메라 위치만큼 반대로 이동 (-translate)

## Asset 로딩

AssetLoader는 이미지와 오디오를 비동기로 로드하고 캐싱합니다.

```typescript
class AssetLoader {
  + loadImage(key, path): Promise<HTMLImageElement>
  + loadAudio(key, path): Promise<HTMLAudioElement>
  + getImage(key): HTMLImageElement | null
  + getAudio(key): HTMLAudioElement | null
}
```

**특징:**
- 비동기 로딩
- 자동 캐싱
- 중복 로딩 방지
- 로딩 진행률 추적

## 최적화 기법

### 1. Dirty Flag (Transform)
Transform이 변경될 때만 월드 좌표를 재계산합니다.

### 2. Object Pooling (미구현)
GameObject를 재사용하여 GC 압력 감소 (향후 추가 예정)

### 3. Culling (미구현)
화면 밖 오브젝트 렌더링 스킵 (향후 추가 예정)

## 확장 가능성

### 추가 가능한 기능들

1. **Collision System**
   - Collider 컴포넌트
   - Physics 시뮬레이션

2. **Animation System**
   - Animator 컴포넌트
   - 스프라이트 애니메이션

3. **Particle System**
   - ParticleEmitter 컴포넌트

4. **Audio System**
   - AudioSource 컴포넌트
   - 공간 오디오

5. **TileMap System**
   - 타일 기반 맵 렌더링

6. **UI System**
   - Button, Text 등 UI 컴포넌트

## 디자인 패턴

### 사용된 패턴

1. **Component Pattern**: GameObject + Component 구조
2. **Composite Pattern**: GameObject 계층 구조
3. **Game Loop Pattern**: requestAnimationFrame 기반 루프
4. **Singleton-like Pattern**: Engine 인스턴스
5. **Object Pool Pattern**: AssetLoader 캐싱
6. **Dirty Flag Pattern**: Transform 최적화

## 메모리 관리

### GameObject 파괴

```typescript
gameObject.destroy();
  ↓
1. 모든 Component의 onDestroy() 호출
2. 모든 자식 GameObject 재귀적으로 파괴
3. 부모에서 제거
4. Scene에서 제거
```

### 리소스 정리

```typescript
engine.destroy();
  ↓
1. 게임 루프 중지
2. InputManager 이벤트 리스너 제거
3. AssetLoader 캐시 정리
4. 현재 Scene 언로드
```

## 성능 고려사항

### FPS 제한
Engine의 `targetFPS` 설정으로 프레임 레이트 제한 가능 (기본 60FPS)

### Delta Time
프레임 간 시간 차이를 고려하여 일정한 게임 속도 유지

### Canvas 최적화
- `ctx.save()`/`ctx.restore()` 최소화
- Transform 변환 캐싱
- 불필요한 렌더링 스킵

## 다음 단계

- [API 문서](api.md) - 상세한 API 레퍼런스
- [게임 루프](gameloop.md) - 게임 루프 상세 설명
- [튜토리얼](tutorial.md) - 실전 예제
