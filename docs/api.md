# API 레퍼런스

## 목차

- [Engine](#engine)
- [Scene](#scene)
- [GameObject](#gameobject)
- [Transform](#transform)
- [Component](#component)
- [Sprite](#sprite)
- [AnimatedSprite](#animatedsprite)
- [Camera](#camera)
- [InputManager](#inputmanager)
- [AssetLoader](#assetloader)
- [Vector2](#vector2)
- [MathUtils](#mathutils)

---

## Engine

게임 루프 및 전체 엔진을 관리합니다.

### 생성자

```typescript
constructor(canvasId: string, width: number, height: number)
```

**Parameters:**
- `canvasId`: Canvas 요소의 ID
- `width`: Canvas 너비
- `height`: Canvas 높이

**Example:**
```typescript
const engine = new Engine('gameCanvas', 800, 600);
```

### 속성

#### canvas
```typescript
get canvas(): HTMLCanvasElement
```
Canvas 요소를 반환합니다.

#### ctx
```typescript
get ctx(): CanvasRenderingContext2D
```
Canvas 2D 렌더링 컨텍스트를 반환합니다.

#### currentScene
```typescript
get currentScene(): Scene | null
```
현재 활성화된 씬을 반환합니다.

#### isRunning
```typescript
get isRunning(): boolean
```
엔진 실행 중 여부를 반환합니다.

#### targetFPS
```typescript
get targetFPS(): number
set targetFPS(value: number)
```
목표 FPS를 가져오거나 설정합니다 (기본값: 60).

#### deltaTime
```typescript
get deltaTime(): number
```
프레임 간 시간 차이 (초 단위)를 반환합니다.

#### fps
```typescript
get fps(): number
```
현재 FPS를 반환합니다.

#### inputManager
```typescript
get inputManager(): InputManager
```
InputManager 인스턴스를 반환합니다.

#### assetLoader
```typescript
get assetLoader(): AssetLoader
```
AssetLoader 인스턴스를 반환합니다.

### 메서드

#### start()
```typescript
start(): void
```
게임 루프를 시작합니다.

#### stop()
```typescript
stop(): void
```
게임 루프를 중지합니다.

#### loadScene()
```typescript
async loadScene(scene: Scene): Promise<void>
```
새 씬을 로드합니다.

**Parameters:**
- `scene`: 로드할 Scene

#### resizeCanvas()
```typescript
resizeCanvas(width: number, height: number): void
```
Canvas 크기를 변경합니다.

#### drawFPS()
```typescript
drawFPS(x?: number, y?: number, color?: string): void
```
화면에 FPS를 표시합니다.

**Parameters:**
- `x`: X 좌표 (기본값: 10)
- `y`: Y 좌표 (기본값: 20)
- `color`: 텍스트 색상 (기본값: '#00ff00')

#### destroy()
```typescript
destroy(): void
```
엔진을 정리하고 모든 리소스를 해제합니다.

---

## Scene

게임 씬을 관리합니다.

### 생성자

```typescript
constructor(name: string, viewportWidth: number, viewportHeight: number)
```

**Example:**
```typescript
const scene = new Scene('MainScene', 800, 600);
```

### 속성

#### name
```typescript
get name(): string
```
씬 이름을 반환합니다.

#### rootObjects
```typescript
get rootObjects(): readonly GameObject[]
```
루트 레벨 GameObject 목록을 반환합니다.

#### camera
```typescript
get camera(): Camera
```
씬의 카메라를 반환합니다.

#### engine
```typescript
get engine(): Engine | null
```
씬이 속한 Engine을 반환합니다.

#### isLoaded
```typescript
get isLoaded(): boolean
```
씬 로드 완료 여부를 반환합니다.

#### backgroundColor
```typescript
get backgroundColor(): string
set backgroundColor(value: string)
```
배경색을 가져오거나 설정합니다.

### 메서드

#### load()
```typescript
async load(): Promise<void>
```
씬을 로드합니다.

#### unload()
```typescript
unload(): void
```
씬을 언로드하고 모든 GameObject를 파괴합니다.

#### addGameObject()
```typescript
addGameObject(obj: GameObject): void
```
루트 레벨에 GameObject를 추가합니다.

#### removeGameObject()
```typescript
removeGameObject(obj: GameObject): void
```
GameObject를 제거합니다.

#### findGameObject()
```typescript
findGameObject(name: string): GameObject | null
```
이름으로 GameObject를 찾습니다 (루트 레벨만).

#### findGameObjectRecursive()
```typescript
findGameObjectRecursive(name: string): GameObject | null
```
이름으로 GameObject를 재귀 검색합니다 (모든 자식 포함).

#### findGameObjectsOfType()
```typescript
findGameObjectsOfType<T extends GameObject>(
  type: new (...args: any[]) => T
): T[]
```
특정 타입의 모든 GameObject를 찾습니다.

#### getTotalObjectCount()
```typescript
getTotalObjectCount(): number
```
씬에 있는 모든 GameObject 개수를 반환합니다 (자식 포함).

---

## GameObject

모든 게임 오브젝트의 베이스 클래스입니다.

### 생성자

```typescript
constructor(name?: string)
```

**Example:**
```typescript
const obj = new GameObject('Player');
```

### 속성

#### name
```typescript
get name(): string
set name(value: string)
```
GameObject 이름.

#### transform
```typescript
get transform(): Transform
```
Transform 컴포넌트.

#### active
```typescript
get active(): boolean
set active(value: boolean)
```
활성화 상태.

#### scene
```typescript
get scene(): Scene | null
```
소속된 씬.

#### components
```typescript
get components(): readonly Component[]
```
컴포넌트 목록.

#### children
```typescript
get children(): readonly GameObject[]
```
자식 GameObject 목록.

#### parent
```typescript
get parent(): GameObject | null
```
부모 GameObject.

### 라이프사이클 메서드

#### awake()
```typescript
awake(): void
```
초기화 (생성 시 또는 씬에 추가될 때 호출).

#### start()
```typescript
start(): void
```
시작 (첫 업데이트 전에 한 번 호출).

#### onUpdate()
```typescript
onUpdate(deltaTime: number): void
```
커스텀 업데이트 (서브클래스에서 오버라이드).

이 메서드는 컴포넌트와 자식 업데이트 전에 호출됩니다.

**Example:**
```typescript
class Player extends GameObject {
  private speed: number = 200;

  onUpdate(deltaTime: number): void {
    const input = this.scene?.engine?.inputManager;
    if (input?.isKeyDown(Keys.ArrowRight)) {
      this.transform.translate(new Vector2(this.speed * deltaTime, 0));
    }
  }
}
```

**주의:** `update()` 메서드를 직접 오버라이드하지 마세요. 커스텀 업데이트는 반드시 `onUpdate()`에서 구현하세요.

#### update()
```typescript
update(deltaTime: number): void
```
매 프레임 업데이트 (내부적으로 사용, 일반적으로 오버라이드하지 않음).

이 메서드는 onUpdate() 호출, 컴포넌트 업데이트, 자식 업데이트를 담당합니다.

#### onRender()
```typescript
onRender(ctx: CanvasRenderingContext2D): void
```
커스텀 렌더링 (서브클래스에서 오버라이드).

이 메서드는 Transform이 이미 적용된 로컬 좌표계에서 호출됩니다.

**Example:**
```typescript
class ColorBox extends GameObject {
  onRender(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(-25, -25, 50, 50); // 중앙이 (0, 0)
  }
}
```

**주의:** `render()` 메서드를 직접 오버라이드하지 마세요. 커스텀 렌더링은 반드시 `onRender()`에서 구현하세요.

#### render()
```typescript
render(ctx: CanvasRenderingContext2D, parentTransformed?: boolean): void
```
렌더링 (내부적으로 사용, 일반적으로 오버라이드하지 않음).

**Parameters:**
- `ctx`: Canvas 렌더링 컨텍스트
- `parentTransformed`: 부모의 Transform이 이미 적용되었는지 여부 (기본값: false)

이 메서드는 Transform 적용, onRender() 호출, 컴포넌트 렌더링, 자식 렌더링을 담당합니다.

#### destroy()
```typescript
destroy(): void
```
GameObject 파괴.

### 계층 구조 메서드

#### addChild()
```typescript
addChild(child: GameObject): void
```
자식 GameObject 추가.

#### removeChild()
```typescript
removeChild(child: GameObject): void
```
자식 GameObject 제거.

#### removeAllChildren()
```typescript
removeAllChildren(): void
```
모든 자식 제거.

#### findChild()
```typescript
findChild(name: string): GameObject | null
```
이름으로 자식 찾기 (직접 자식만).

#### findChildRecursive()
```typescript
findChildRecursive(name: string): GameObject | null
```
이름으로 자식 재귀 검색.

### 컴포넌트 메서드

#### addComponent()
```typescript
addComponent<T extends Component>(component: T): T
```
컴포넌트 추가.

#### getComponent()
```typescript
getComponent<T extends Component>(
  type: new (...args: any[]) => T
): T | null
```
타입으로 컴포넌트 가져오기.

#### getComponents()
```typescript
getComponents<T extends Component>(
  type: new (...args: any[]) => T
): T[]
```
타입으로 모든 컴포넌트 가져오기.

#### removeComponent()
```typescript
removeComponent<T extends Component>(component: T): void
```
컴포넌트 제거.

---

## Transform

GameObject의 위치, 회전, 스케일을 관리합니다.

### 생성자

```typescript
constructor(position?: Vector2, rotation?: number, scale?: Vector2)
```

### 속성

#### position
```typescript
get position(): Vector2
set position(value: Vector2)
```
로컬 위치.

**⚠️ 중요:** position을 수정할 때는 반드시 setter를 통해야 합니다:
```typescript
// ❌ 잘못된 방법 - dirty flag가 설정되지 않음
this.transform.position.x += 10;

// ✅ 올바른 방법
this.transform.translate(new Vector2(10, 0));
```

#### rotation
```typescript
get rotation(): number
set rotation(value: number)
```
로컬 회전 (라디안).

**⚠️ 중요:** rotation을 수정할 때는 `rotate()` 메서드를 사용하세요:
```typescript
// ❌ 잘못된 방법
this.transform.rotation += 0.1;

// ✅ 올바른 방법
this.transform.rotate(0.1);
```

#### scale
```typescript
get scale(): Vector2
set scale(value: Vector2)
```
로컬 스케일.

#### parent
```typescript
get parent(): Transform | null
```
부모 Transform.

#### children
```typescript
get children(): readonly Transform[]
```
자식 Transform 목록.

### 메서드

#### getWorldPosition()
```typescript
getWorldPosition(): Vector2
```
월드 좌표 반환.

#### getWorldRotation()
```typescript
getWorldRotation(): number
```
월드 회전 반환 (라디안).

#### getWorldScale()
```typescript
getWorldScale(): Vector2
```
월드 스케일 반환.

#### addChild()
```typescript
addChild(child: Transform): void
```
자식 Transform 추가.

#### removeChild()
```typescript
removeChild(child: Transform): void
```
자식 Transform 제거.

#### lookAt()
```typescript
lookAt(target: Vector2): void
```
특정 위치를 바라보도록 회전.

#### translate()
```typescript
translate(delta: Vector2): void
```
로컬 위치 이동 (권장).

이 메서드는 자동으로 dirty flag를 설정하므로 world transform이 올바르게 업데이트됩니다.

**Example:**
```typescript
// 오른쪽으로 10픽셀 이동
this.transform.translate(new Vector2(10, 0));

// 대각선 이동
this.transform.translate(new Vector2(5, 5));
```

#### rotate()
```typescript
rotate(deltaRadians: number): void
```
로컬 회전 증가 (권장).

이 메서드는 자동으로 dirty flag를 설정하므로 world transform이 올바르게 업데이트됩니다.

**Example:**
```typescript
// 45도 회전
this.transform.rotate(Math.PI / 4);

// 매 프레임 회전
this.transform.rotate(2 * deltaTime);
```

---

## Component

GameObject에 추가 기능을 제공하는 베이스 클래스입니다.

### 속성

#### gameObject
```typescript
get gameObject(): GameObject | null
```
이 컴포넌트가 속한 GameObject.

#### enabled
```typescript
get enabled(): boolean
set enabled(value: boolean)
```
컴포넌트 활성화 상태.

### 라이프사이클 메서드

```typescript
awake(): void
start(): void
update(deltaTime: number): void
render(ctx: CanvasRenderingContext2D): void
onDestroy(): void
```

### 사용 예시

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
```

---

## Sprite

2D 이미지를 렌더링하는 GameObject입니다.

### 생성자

```typescript
constructor(name?: string)
```

**Example:**
```typescript
const sprite = new Sprite('PlayerSprite');
```

### 속성

#### image
```typescript
get image(): HTMLImageElement | null
```
이미지 요소.

#### width / height
```typescript
get width(): number
set width(value: number)
get height(): number
set height(value: number)
```
렌더링 크기.

#### anchor
```typescript
get anchor(): Vector2
set anchor(value: Vector2)
```
앵커 포인트 (0~1, 0.5는 중앙).

#### flipX / flipY
```typescript
get flipX(): boolean
set flipX(value: boolean)
get flipY(): boolean
set flipY(value: boolean)
```
X/Y축 플립.

#### opacity
```typescript
get opacity(): number
set opacity(value: number)
```
투명도 (0~1).

#### tint
```typescript
get tint(): string | null
set tint(value: string | null)
```
틴트 색상.

#### sourceRect
```typescript
get sourceRect(): { x, y, width, height } | null
set sourceRect(value: { x, y, width, height } | null)
```
스프라이트시트 영역.

### 메서드

#### setImage()
```typescript
async setImage(path: string): Promise<void>
```
이미지 로드 및 설정.

#### setImageDirect()
```typescript
setImageDirect(image: HTMLImageElement): void
```
이미지를 직접 설정.

#### setSourceRect()
```typescript
setSourceRect(x: number, y: number, width: number, height: number): void
```
스프라이트시트 영역 설정.

---

## AnimatedSprite

스프라이트 시트 기반 애니메이션을 지원하는 Sprite입니다. Sprite를 상속합니다.

### 생성자

```typescript
constructor(name?: string)
```

**Example:**
```typescript
const animSprite = new AnimatedSprite('PlayerAnim');
```

### 속성

#### currentFrame
```typescript
get currentFrame(): number
set currentFrame(value: number)
```
현재 프레임 인덱스.

#### frameCount
```typescript
get frameCount(): number
```
총 프레임 수.

#### frameDuration
```typescript
get frameDuration(): number
set frameDuration(value: number)
```
프레임 당 지속 시간 (초).

#### isPlaying
```typescript
get isPlaying(): boolean
```
애니메이션 재생 중 여부.

#### loop
```typescript
get loop(): boolean
set loop(value: boolean)
```
루프 여부.

### 메서드

#### setFrameSize()
```typescript
setFrameSize(width: number, height: number, scale?: number): void
```
프레임 크기 설정.

**Parameters:**
- `width`: 프레임 너비
- `height`: 프레임 높이
- `scale`: 렌더링 스케일 (기본값 1)

**Example:**
```typescript
// 96x64 프레임을 2배 크기로 렌더링
animSprite.setFrameSize(96, 64, 2);
```

#### setAnimation()
```typescript
setAnimation(frameCount: number, frameDuration?: number): void
```
애니메이션 설정.

**Parameters:**
- `frameCount`: 총 프레임 수
- `frameDuration`: 프레임 당 지속 시간 (초, 기본값 0.1)

**Example:**
```typescript
// 9프레임, 0.12초 간격
animSprite.setAnimation(9, 0.12);
```

#### play()
```typescript
play(): void
```
애니메이션 재생.

#### pause()
```typescript
pause(): void
```
애니메이션 일시정지.

#### stop()
```typescript
stop(): void
```
애니메이션 정지 및 첫 프레임으로 이동.

#### gotoFrame()
```typescript
gotoFrame(frame: number): void
```
특정 프레임으로 이동.

### 사용 예시

```typescript
// 스프라이트 시트 애니메이션 설정
const player = new AnimatedSprite('Player');
player.setImageDirect(await assetLoader.loadImage('walk', 'walk_strip8.png'));
player.setFrameSize(96, 64, 2);  // 96x64 프레임, 2배 확대
player.setAnimation(8, 0.1);     // 8프레임, 0.1초 간격

// 애니메이션 제어
player.play();
player.pause();
player.stop();
player.gotoFrame(3);
```

---

## Camera

카메라 및 뷰포트를 관리합니다.

### 생성자

```typescript
constructor(
  viewportWidth: number,
  viewportHeight: number,
  position?: Vector2
)
```

### 속성

#### position
```typescript
get position(): Vector2
set position(value: Vector2)
```
카메라 위치.

#### zoom
```typescript
get zoom(): number
set zoom(value: number)
```
줌 레벨 (1.0이 기본).

#### rotation
```typescript
get rotation(): number
set rotation(value: number)
```
카메라 회전 (라디안).

### 메서드

#### worldToScreen()
```typescript
worldToScreen(worldPos: Vector2): Vector2
```
월드 좌표를 스크린 좌표로 변환.

#### screenToWorld()
```typescript
screenToWorld(screenPos: Vector2): Vector2
```
스크린 좌표를 월드 좌표로 변환.

#### follow()
```typescript
follow(target: Vector2, smoothing?: number): void
```
특정 GameObject를 따라가기 (smoothing: 0~1).

#### isInViewport()
```typescript
isInViewport(worldPos: Vector2, margin?: number): boolean
```
특정 지점이 뷰포트 내에 있는지 확인.

---

## InputManager

키보드와 마우스 입력을 관리합니다.

### 메서드

#### isKeyDown()
```typescript
isKeyDown(key: string): boolean
```
키가 현재 눌려있는지 확인.

#### isKeyPressed()
```typescript
isKeyPressed(key: string): boolean
```
키가 이번 프레임에 막 눌렸는지 확인.

#### isKeyReleased()
```typescript
isKeyReleased(key: string): boolean
```
키가 이번 프레임에 막 떼어졌는지 확인.

#### getMousePosition()
```typescript
getMousePosition(): Vector2
```
마우스 위치 반환 (Canvas 좌표).

#### isMouseButtonDown()
```typescript
isMouseButtonDown(button: number): boolean
```
마우스 버튼이 눌려있는지 확인 (0: 왼쪽, 1: 중간, 2: 오른쪽).

#### isLeftMouseDown() / isRightMouseDown()
```typescript
isLeftMouseDown(): boolean
isRightMouseDown(): boolean
```
왼쪽/오른쪽 마우스 버튼 확인.

### Keys 상수

```typescript
export const Keys = {
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  W: 'w',
  A: 'a',
  S: 's',
  D: 'd',
  Space: ' ',
  Enter: 'Enter',
  // ...
};
```

---

## AssetLoader

리소스를 비동기로 로드하고 캐싱합니다.

### 메서드

#### loadImage()
```typescript
async loadImage(key: string, path: string): Promise<HTMLImageElement>
```
이미지 로드.

#### loadImages()
```typescript
async loadImages(assets: { key: string; path: string }[]): Promise<void>
```
여러 이미지 한 번에 로드.

#### getImage()
```typescript
getImage(key: string): HTMLImageElement | null
```
로드된 이미지 가져오기.

#### hasImage()
```typescript
hasImage(key: string): boolean
```
이미지가 로드되었는지 확인.

#### unloadImage()
```typescript
unloadImage(key: string): void
```
특정 이미지 캐시 제거.

#### loadJSON()
```typescript
async loadJSON<T>(path: string): Promise<T>
```
JSON 파일 로드.

---

## Vector2

2D 벡터 클래스입니다.

### 생성자

```typescript
constructor(x?: number, y?: number)
```

### 속성

```typescript
x: number
y: number
```

### 메서드

```typescript
add(v: Vector2): Vector2
subtract(v: Vector2): Vector2
multiply(scalar: number): Vector2
divide(scalar: number): Vector2
length(): number
lengthSquared(): number
normalize(): Vector2
dot(v: Vector2): number
distance(v: Vector2): number
clone(): Vector2
rotate(angle: number): Vector2
```

### 정적 메서드

```typescript
static zero(): Vector2
static one(): Vector2
static up(): Vector2
static down(): Vector2
static left(): Vector2
static right(): Vector2
static lerp(a: Vector2, b: Vector2, t: number): Vector2
```

---

## MathUtils

수학 유틸리티 함수들입니다.

### 메서드

```typescript
static degToRad(degrees: number): number
static radToDeg(radians: number): number
static clamp(value: number, min: number, max: number): number
static lerp(a: number, b: number, t: number): number
static random(min?: number, max?: number): number
static randomInt(min: number, max: number): number
```

그 외 다양한 수학 함수들이 제공됩니다.
