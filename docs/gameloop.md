# 게임 루프 (Game Loop)

## 개요

Lite2D의 게임 루프는 `requestAnimationFrame`을 기반으로 구현되어 있습니다. 매 프레임마다 Update → Render 순서로 실행됩니다.

## 전체 흐름

```
requestAnimationFrame(timestamp)
     ↓
Engine.gameLoop(timestamp)
     ↓
┌────────────────────────────┐
│  1. Delta Time 계산         │
│  - 이전 프레임과의 시간 차이 │
│  - 초 단위로 변환           │
└────────────────────────────┘
     ↓
┌────────────────────────────┐
│  2. FPS 제한 (선택적)       │
│  - targetFPS 기반 스킵      │
└────────────────────────────┘
     ↓
┌────────────────────────────┐
│  3. FPS 계산               │
│  - 1초마다 프레임 수 측정   │
└────────────────────────────┘
     ↓
┌────────────────────────────┐
│  4. UPDATE 단계            │
│  - InputManager.update()  │
│  - Scene.update(deltaTime)│
└────────────────────────────┘
     ↓
┌────────────────────────────┐
│  5. RENDER 단계            │
│  - Canvas 클리어           │
│  - 배경 그리기             │
│  - Camera 변환 적용        │
│  - Scene.render(ctx)      │
└────────────────────────────┘
     ↓
다음 프레임 예약 (requestAnimationFrame)
```

## 1. Delta Time 계산

Delta Time은 프레임 간 시간 차이를 나타냅니다.

```typescript
// 초 단위로 변환
this._deltaTime = (timestamp - this._lastFrameTime) / 1000;
this._lastFrameTime = timestamp;
```

**왜 필요한가?**
- 프레임 레이트가 다른 기기에서도 일정한 게임 속도 유지
- 60fps: deltaTime ≈ 0.0167초
- 30fps: deltaTime ≈ 0.0333초

**사용 예시:**
```typescript
// deltaTime을 곱해서 초당 이동 거리를 계산
const speed = 200; // pixels per second
this.transform.position.x += speed * deltaTime;
```

## 2. FPS 제한

목표 FPS에 맞춰 프레임을 스킵할 수 있습니다.

```typescript
const minFrameTime = 1000 / this._targetFPS;
if (this._deltaTime * 1000 < minFrameTime - 1) {
  // 너무 빠르면 다음 프레임 대기
  this._requestId = requestAnimationFrame((t) => this.gameLoop(t));
  return;
}
```

**기본값:** 60 FPS

**변경 방법:**
```typescript
engine.targetFPS = 30; // 30fps로 제한
```

## 3. FPS 계산

실제 프레임 레이트를 측정합니다.

```typescript
this._frameCount++;
if (timestamp - this._fpsUpdateTime >= 1000) {
  this._fps = this._frameCount;
  this._frameCount = 0;
  this._fpsUpdateTime = timestamp;
}
```

**확인 방법:**
```typescript
console.log(`Current FPS: ${engine.fps}`);

// 또는 화면에 표시
engine.drawFPS(10, 20, '#00ff00');
```

## 4. UPDATE 단계

게임 로직을 업데이트하는 단계입니다.

### 4.1. InputManager 업데이트

```typescript
this._inputManager.update();
```

**동작:**
- 이전 프레임과 현재 프레임의 키 상태 비교
- Pressed/Released 이벤트 감지
- 내부 상태 업데이트

### 4.2. Scene 업데이트

```typescript
if (this._currentScene !== null) {
  this._currentScene.update(deltaTime);
}
```

**Scene.update() 내부:**
```typescript
update(deltaTime: number): void {
  // 루트 GameObject들의 update 호출
  for (const obj of this._rootObjects) {
    if (obj.active) {
      obj.update(deltaTime);
    }
  }
}
```

### 4.3. GameObject 업데이트 (재귀)

```typescript
update(deltaTime: number): void {
  if (!this._active) return;

  // start 호출 (처음 한 번만)
  if (!this._started) {
    this.start();
  }

  // 서브클래스의 커스텀 업데이트
  this.onUpdate(deltaTime);

  // 컴포넌트 update
  for (const component of this._components) {
    if (component.enabled) {
      component.update(deltaTime);
    }
  }

  // 자식 update (재귀)
  for (const child of this._children) {
    if (child.active) {
      child.update(deltaTime);
    }
  }
}
```

**호출 순서:**
```
Scene.update(deltaTime)
  → GameObject A.update(deltaTime)
      → onUpdate(deltaTime)  (서브클래스의 커스텀 업데이트)
      → Component 1.update(deltaTime)
      → Component 2.update(deltaTime)
      → Child A-1.update(deltaTime)
          → onUpdate(deltaTime)
          → Component 3.update(deltaTime)
          → Child A-1-1.update(deltaTime)
      → Child A-2.update(deltaTime)
  → GameObject B.update(deltaTime)
      → onUpdate(deltaTime)
      → ...
```

## 5. RENDER 단계

화면에 그리는 단계입니다.

### 5.1. Canvas 클리어

```typescript
this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
```

### 5.2. 배경 그리기

```typescript
if (this._currentScene) {
  this._ctx.fillStyle = this._currentScene.backgroundColor;
  this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
}
```

### 5.3. Camera 변환 적용

```typescript
this._ctx.save();
this._currentScene.camera.applyTransform(this._ctx);
```

**Camera.applyTransform() 내부:**
```typescript
applyTransform(ctx: CanvasRenderingContext2D): void {
  // 1. 뷰포트 중앙으로 이동
  ctx.translate(this._viewportWidth / 2, this._viewportHeight / 2);

  // 2. 줌 적용
  ctx.scale(this._zoom, this._zoom);

  // 3. 카메라 회전 적용
  if (this._rotation !== 0) {
    ctx.rotate(-this._rotation);
  }

  // 4. 카메라 위치만큼 반대로 이동
  ctx.translate(-this._position.x, -this._position.y);
}
```

### 5.4. Scene 렌더링

```typescript
this._currentScene.render(this._ctx);
```

**Scene.render() 내부:**
```typescript
render(ctx: CanvasRenderingContext2D): void {
  // 루트 GameObject들의 render 호출
  for (const obj of this._rootObjects) {
    if (obj.active) {
      obj.render(ctx);
    }
  }
}
```

### 5.5. GameObject 렌더링 (재귀)

```typescript
render(ctx: CanvasRenderingContext2D, parentTransformed: boolean = false): void {
  if (!this._active) return;

  ctx.save();

  if (parentTransformed) {
    // 부모의 Transform이 이미 적용된 경우, 로컬 Transform만 적용
    ctx.translate(this._transform.position.x, this._transform.position.y);
    ctx.rotate(this._transform.rotation);
    ctx.scale(this._transform.scale.x, this._transform.scale.y);
  } else {
    // 루트 오브젝트인 경우, world Transform 적용
    const worldPos = this._transform.getWorldPosition();   // ← 캐싱됨
    const worldRot = this._transform.getWorldRotation();   // ← 캐싱됨
    const worldScale = this._transform.getWorldScale();   // ← 캐싱됨

    ctx.translate(worldPos.x, worldPos.y);
    ctx.rotate(worldRot);
    ctx.scale(worldScale.x, worldScale.y);
  }

  // 서브클래스의 커스텀 렌더링
  this.onRender(ctx);

  // 컴포넌트 render
  for (const component of this._components) {
    if (component.enabled) {
      component.render(ctx);
    }
  }

  // 자식 render (재귀)
  for (const child of this._children) {
    if (child.active) {
      child.render(ctx, true);  // 자식에게는 parentTransformed=true 전달
    }
  }

  ctx.restore();
}
```

**Transform 캐싱의 중요성:**

매 프레임 `getWorldPosition()` 등을 호출하지만, Transform이 변경되지 않았다면 캐싱된 값을 반환합니다:

```typescript
// Transform.ts
getWorldPosition(): Vector2 {
  if (this._isDirty || this._worldPosition === null) {
    this.updateWorldTransform();  // 비싼 계산 (부모 체인 탐색)
  }
  return this._worldPosition!.clone();  // 캐시 반환 (빠름)
}
```

**성능 차이:**

```
시나리오: 100개의 GameObject, 10개만 움직임, 60 FPS

프레임당 호출:
- getWorldPosition() 호출: 100번
- 실제 재계산: 10번 (움직인 것만, dirty)
- 캐시 반환: 90번 (정적인 것, clean)

1초당 (60 프레임):
- ❌ 캐싱 없이: 6,000번 재계산
- ✅ 캐싱 사용: 600번 재계산 + 5,400번 캐시 반환
- 성능 향상: 약 10배!
```

**렌더링 순서:**
```
Scene.render(ctx)
  → GameObject A.render(ctx)
      → ctx.save()
      → Transform A 적용
      → Component 1.render(ctx)
      → Component 2.render(ctx)
      → Child A-1.render(ctx)
          → ctx.save()
          → Transform A-1 적용 (부모 기준 로컬)
          → Component 3.render(ctx)
          → ctx.restore()
      → ctx.restore()
  → GameObject B.render(ctx)
      → ...
```

### 5.6. Camera 복원

```typescript
this._ctx.restore();
```

## 라이프사이클 메서드

GameObject의 라이프사이클 메서드 호출 순서:

```
GameObject 생성
    ↓
awake()  ← 생성 직후 (씬에 추가될 때 또는 load 시)
    ↓
[첫 update 시]
    ↓
start()  ← 첫 업데이트 전에 한 번만
    ↓
update(deltaTime)  ← 매 프레임
    ↓
render(ctx)  ← 매 프레임
    ↓
destroy()  ← 파괴 시
```

**예시:**
```typescript
class Player extends GameObject {
  awake(): void {
    console.log('Player 초기화');
    // 리소스 로드, 초기 설정 등
  }

  start(): void {
    console.log('Player 시작');
    // 게임 시작 시 필요한 초기화
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    // 매 프레임 로직 (이동, 충돌 감지 등)
  }

  render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);
    // 추가 렌더링 (디버그 정보 등)
  }

  destroy(): void {
    console.log('Player 파괴');
    super.destroy();
  }
}
```

## 타이밍 다이어그램

```
Frame N-1         Frame N          Frame N+1
────────────────────────────────────────────>
  │                 │                 │
  │ render()        │ render()        │
  │                 │                 │
  └─ deltaTime ─────┘                 │
     (16.67ms)      │                 │
                    └─ deltaTime ──────┘
                       (16.67ms)

Update는 이전 프레임과 현재 프레임 사이의
시간 차이를 사용하여 게임 로직 계산
```

## 성능 최적화

### 1. Early Return

활성화되지 않은 오브젝트는 즉시 리턴:
```typescript
if (!this._active) return;
```

### 2. Culling (향후 추가 예정)

화면 밖 오브젝트 렌더링 스킵:
```typescript
if (!camera.isInViewport(this.transform.getWorldPosition())) {
  return; // 렌더링 스킵
}
```

### 3. Transform 캐싱 (Dirty Flag 패턴)

**개념:**
World transform 계산은 비용이 크므로 (부모 체인 재귀 탐색), 결과를 캐싱하고 변경이 있을 때만 재계산합니다.

**동작 방식:**
```typescript
// Transform.ts
getWorldPosition(): Vector2 {
  // dirty가 아니면 캐시 반환
  if (this._isDirty || this._worldPosition === null) {
    this.updateWorldTransform();  // 비싼 계산
  }
  return this._worldPosition!.clone();  // 캐시 반환
}
```

**언제 dirty가 설정되나?**
```typescript
// setter 호출 시
set position(value: Vector2) {
  this._position = value;
  this.markDirty();  // 자신과 모든 자식 dirty
}

// 메서드 호출 시
translate(delta: Vector2): void {
  this._position = this._position.add(delta);
  this.markDirty();  // 자신과 모든 자식 dirty
}
```

**성능 효과:**
```
100개의 GameObject, 10개만 움직임, 60 FPS

매 프레임:
- getWorldPosition() 호출: 100번
- 실제 재계산: 10번 (dirty)
- 캐시 반환: 90번 (clean)

1초당:
- ❌ 캐싱 없이: 6,000번 복잡한 계산
- ✅ 캐싱 사용: 600번 계산 + 5,400번 메모리 읽기
- 약 10배 성능 향상!
```

**주의사항:**
```typescript
// ❌ 잘못된 방법 - dirty flag가 설정되지 않음
this.transform.position.x += 10;

// ✅ 올바른 방법 - markDirty() 호출됨
this.transform.translate(new Vector2(10, 0));
```

## 디버깅

### FPS 모니터링

```typescript
// 화면에 FPS 표시
engine.drawFPS(10, 20, '#00ff00');

// 콘솔에 FPS 출력
setInterval(() => {
  console.log(`FPS: ${engine.fps}`);
}, 1000);
```

### Delta Time 확인

```typescript
class DebugInfo extends GameObject {
  update(deltaTime: number): void {
    console.log(`Delta Time: ${deltaTime.toFixed(4)}초`);
  }
}
```

### 오브젝트 개수 확인

```typescript
console.log(`Total objects: ${scene.getTotalObjectCount()}`);
```

## 일반적인 패턴

### 1. 일정한 속도로 이동

```typescript
update(deltaTime: number): void {
  const speed = 200; // pixels per second
  this.transform.position.x += speed * deltaTime;
}
```

### 2. 초당 회전

```typescript
update(deltaTime: number): void {
  const rotationSpeed = Math.PI; // 180도/초
  this.transform.rotation += rotationSpeed * deltaTime;
}
```

### 3. 타이머

```typescript
class TimerComponent extends Component {
  private elapsed: number = 0;
  private duration: number = 3; // 3초

  update(deltaTime: number): void {
    this.elapsed += deltaTime;
    if (this.elapsed >= this.duration) {
      console.log('타이머 완료!');
      this.elapsed = 0;
    }
  }
}
```

### 4. 보간 (Lerp)

```typescript
update(deltaTime: number): void {
  const target = new Vector2(400, 300);
  const smoothing = 5 * deltaTime; // 초당 5배 속도로 접근
  this.transform.position = Vector2.lerp(
    this.transform.position,
    target,
    smoothing
  );
}
```

## 주의사항

### 1. Delta Time 사용

❌ **잘못된 예:**
```typescript
// 프레임 레이트에 따라 속도가 달라짐
this.transform.position.x += 5;
```

✅ **올바른 예:**
```typescript
// 항상 일정한 속도
const speed = 200; // pixels per second
this.transform.position.x += speed * deltaTime;
```

### 2. 렌더링에서 상태 변경 금지

❌ **잘못된 예:**
```typescript
render(ctx: CanvasRenderingContext2D): void {
  // 렌더링 중에 상태 변경하지 말 것!
  this.transform.position.x += 10;
}
```

✅ **올바른 예:**
```typescript
update(deltaTime: number): void {
  // 상태 변경은 update에서!
  this.transform.position.x += 10 * deltaTime;
}
```

### 3. 무한 루프 주의

❌ **잘못된 예:**
```typescript
update(deltaTime: number): void {
  while (true) {
    // 게임 루프가 멈춤!
  }
}
```

## 다음 단계

- [아키텍처](architecture.md) - 전체 구조 이해
- [API 문서](api.md) - 상세한 API 레퍼런스
- [튜토리얼](tutorial.md) - 실전 예제
