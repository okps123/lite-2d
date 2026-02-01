# Lite2D 튜토리얼

## 시작하기

이 튜토리얼에서는 Lite2D를 사용하여 간단한 2D 게임을 만드는 방법을 배웁니다.

## 1. 프로젝트 설정

### 의존성 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:8080`을 엽니다.

## 2. Hello World

가장 간단한 예제부터 시작하겠습니다.

### HTML 파일 생성

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>My Game</title>
</head>
<body>
  <canvas id="gameCanvas"></canvas>
  <script src="main.js"></script>
</body>
</html>
```

### TypeScript 파일 생성

```typescript
import { Engine, Scene, GameObject, Vector2 } from 'lite2d';

async function main() {
  // 엔진 초기화
  const engine = new Engine('gameCanvas', 800, 600);

  // 씬 생성
  const scene = new Scene('MainScene', 800, 600);
  scene.backgroundColor = '#1a1a2e';

  // GameObject 생성
  const obj = new GameObject('MyObject');
  obj.transform.position = new Vector2(400, 300);

  // 씬에 추가
  scene.addGameObject(obj);

  // 씬 로드 및 시작
  await engine.loadScene(scene);
  engine.start();
}

main();
```

## 3. Sprite 렌더링

이미지를 화면에 표시해봅시다.

```typescript
import { Engine, Scene, Sprite, Vector2 } from 'lite2d';

async function main() {
  const engine = new Engine('gameCanvas', 800, 600);
  const scene = new Scene('MainScene', 800, 600);

  // Sprite 생성
  const sprite = new Sprite('Player');
  sprite.transform.position = new Vector2(400, 300);

  // 이미지 로드 (AssetLoader 사용)
  await engine.assetLoader.loadImage('player', '/assets/player.png');
  const playerImage = engine.assetLoader.getImage('player');
  if (playerImage) {
    sprite.setImageDirect(playerImage);
    sprite.width = 64;
    sprite.height = 64;
  }

  scene.addGameObject(sprite);

  await engine.loadScene(scene);
  engine.start();
}

main();
```

## 4. 키보드 입력

플레이어를 키보드로 움직여봅시다.

```typescript
import {
  Engine,
  Scene,
  GameObject,
  Vector2,
  Keys,
} from 'lite2d';

class Player extends GameObject {
  private speed: number = 200; // pixels per second

  onUpdate(deltaTime: number): void {
    const input = this.scene?.engine?.inputManager;
    if (!input) return;

    // 이동 - translate() 메서드 사용 (권장)
    if (input.isKeyDown(Keys.ArrowLeft)) {
      this.transform.translate(new Vector2(-this.speed * deltaTime, 0));
    }
    if (input.isKeyDown(Keys.ArrowRight)) {
      this.transform.translate(new Vector2(this.speed * deltaTime, 0));
    }
    if (input.isKeyDown(Keys.ArrowUp)) {
      this.transform.translate(new Vector2(0, -this.speed * deltaTime));
    }
    if (input.isKeyDown(Keys.ArrowDown)) {
      this.transform.translate(new Vector2(0, this.speed * deltaTime));
    }
  }
}

// ⚠️ 주의: update()가 아닌 onUpdate()를 사용하세요!
// ❌ update(deltaTime) { super.update(deltaTime); ... }  // 비권장
// ✅ onUpdate(deltaTime) { ... }  // 권장 (super 호출 불필요)

// ⚠️ 주의: position.x를 직접 수정하지 마세요!
// ❌ this.transform.position.x += speed * deltaTime;  // dirty flag 문제
// ✅ this.transform.translate(new Vector2(speed * deltaTime, 0));  // 올바른 방법

async function main() {
  const engine = new Engine('gameCanvas', 800, 600);
  const scene = new Scene('MainScene', 800, 600);

  const player = new Player('Player');
  player.transform.position = new Vector2(400, 300);

  scene.addGameObject(player);

  await engine.loadScene(scene);
  engine.start();
}

main();
```

## 5. 커스텀 렌더링

직접 렌더링 로직을 작성할 수 있습니다.

**중요:** `render()` 메서드를 직접 오버라이드하지 마세요. 대신 `onRender()` 메서드를 사용하세요.

```typescript
class ColorBox extends GameObject {
  private width: number = 50;
  private height: number = 50;
  private color: string = '#e74c3c';

  onRender(ctx: CanvasRenderingContext2D): void {
    // Transform은 이미 적용된 상태입니다.
    // (0, 0)을 중심으로 로컬 좌표계에서 렌더링하세요.

    ctx.fillStyle = this.color;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // 테두리 (선택사항)
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
  }
}
```

**왜 onRender()를 사용하나요?**
- `render()` 메서드는 Transform 적용과 계층 구조 관리를 담당합니다.
- `onRender()`는 이미 Transform이 적용된 로컬 좌표계에서 호출됩니다.
- 자식 렌더링도 자동으로 처리됩니다.

## 6. 부모-자식 관계

GameObject 계층 구조를 만들어봅시다.

```typescript
// 부모 오브젝트
const parent = new ColorBox('Parent', 100, 100, '#3498db');
parent.transform.position = new Vector2(400, 300);

// 자식 오브젝트 1
const child1 = new ColorBox('Child1', 30, 30, '#e74c3c');
child1.transform.position = new Vector2(60, 0); // 부모 기준 로컬 좌표

// 자식 오브젝트 2
const child2 = new ColorBox('Child2', 30, 30, '#2ecc71');
child2.transform.position = new Vector2(-60, 0);

// 계층 구조 설정
parent.addChild(child1);
parent.addChild(child2);

scene.addGameObject(parent);

// 부모를 회전시키면 자식들도 함께 회전합니다
setInterval(() => {
  parent.transform.rotation += 0.01;
}, 16);
```

## 7. Component 시스템

재사용 가능한 컴포넌트를 만들어봅시다.

```typescript
import { Component, Vector2 } from 'lite2d';

class RotateComponent extends Component {
  private rotationSpeed: number = 2; // radians per second

  update(deltaTime: number): void {
    if (this.gameObject) {
      this.gameObject.transform.rotation +=
        this.rotationSpeed * deltaTime;
    }
  }
}

class PhysicsComponent extends Component {
  velocity: Vector2 = Vector2.zero();
  gravity: number = 980; // pixels per second^2

  update(deltaTime: number): void {
    if (!this.gameObject) return;

    // 중력 적용
    this.velocity.y += this.gravity * deltaTime;

    // 위치 업데이트
    this.gameObject.transform.position =
      this.gameObject.transform.position.add(
        this.velocity.multiply(deltaTime)
      );

    // 바닥 충돌
    if (this.gameObject.transform.position.y > 550) {
      this.gameObject.transform.position.y = 550;
      this.velocity.y = -this.velocity.y * 0.8; // 반발
    }
  }
}

// 사용
const obj = new GameObject('Bouncing Ball');
obj.addComponent(new RotateComponent());
const physics = obj.addComponent(new PhysicsComponent());
physics.velocity = new Vector2(100, -500);
```

## 8. Camera 사용

카메라를 움직여봅시다.

```typescript
// 플레이어를 따라가는 카메라
class Player extends GameObject {
  update(deltaTime: number): void {
    super.update(deltaTime);

    // ... 이동 로직 ...

    // 카메라가 플레이어를 부드럽게 따라감
    if (this.scene) {
      this.scene.camera.follow(
        this.transform.position,
        3 * deltaTime // 부드러움 정도
      );
    }
  }
}
```

## 9. Asset 로딩

여러 리소스를 한 번에 로드하기:

```typescript
async function loadAssets(engine: Engine): Promise<void> {
  await engine.assetLoader.loadImages([
    { key: 'player', path: '/assets/player.png' },
    { key: 'enemy', path: '/assets/enemy.png' },
    { key: 'background', path: '/assets/bg.png' },
  ]);

  console.log('모든 리소스 로드 완료!');
}

async function main() {
  const engine = new Engine('gameCanvas', 800, 600);

  // 리소스 로드
  await loadAssets(engine);

  // 이후 게임 로직...
}
```

## 10. 실전 예제: 간단한 플랫포머

모든 것을 조합한 완전한 예제입니다.

```typescript
import {
  Engine,
  Scene,
  GameObject,
  Sprite,
  Vector2,
  Keys,
  Component,
} from 'lite2d';

// 중력 컴포넌트
class GravityComponent extends Component {
  velocity: Vector2 = Vector2.zero();
  gravity: number = 980;
  onGround: boolean = false;

  update(deltaTime: number): void {
    if (!this.gameObject) return;

    // 중력 적용
    this.velocity.y += this.gravity * deltaTime;

    // 위치 업데이트
    this.gameObject.transform.position.y += this.velocity.y * deltaTime;

    // 바닥 충돌 (y = 550)
    if (this.gameObject.transform.position.y >= 550) {
      this.gameObject.transform.position.y = 550;
      this.velocity.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
  }

  jump(force: number): void {
    if (this.onGround) {
      this.velocity.y = -force;
    }
  }
}

// 플레이어 클래스
class Player extends GameObject {
  private speed: number = 300;
  private jumpForce: number = 600;
  private gravityComponent: GravityComponent;

  constructor(name: string) {
    super(name);
    this.gravityComponent = this.addComponent(new GravityComponent());
  }

  update(deltaTime: number): void {
    super.update(deltaTime);

    const input = this.scene?.engine?.inputManager;
    if (!input) return;

    // 좌우 이동
    if (input.isKeyDown(Keys.A) || input.isKeyDown(Keys.ArrowLeft)) {
      this.transform.position.x -= this.speed * deltaTime;
    }
    if (input.isKeyDown(Keys.D) || input.isKeyDown(Keys.ArrowRight)) {
      this.transform.position.x += this.speed * deltaTime;
    }

    // 점프
    if (input.isKeyPressed(Keys.Space) || input.isKeyPressed(Keys.W)) {
      this.gravityComponent.jump(this.jumpForce);
    }

    // 카메라 따라가기
    if (this.scene) {
      this.scene.camera.follow(this.transform.position, 5 * deltaTime);
    }
  }
}

// 플랫폼 클래스
class Platform extends GameObject {
  private width: number;
  private height: number;
  private color: string;

  constructor(
    name: string,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string = '#34495e'
  ) {
    super(name);
    this.transform.position = new Vector2(x, y);
    this.width = width;
    this.height = height;
    this.color = color;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();

    const worldPos = this.transform.getWorldPosition();
    ctx.fillStyle = this.color;
    ctx.fillRect(
      worldPos.x - this.width / 2,
      worldPos.y - this.height / 2,
      this.width,
      this.height
    );

    ctx.restore();
  }
}

// 메인
async function main() {
  const engine = new Engine('gameCanvas', 800, 600);
  const scene = new Scene('GameScene', 800, 600);
  scene.backgroundColor = '#87ceeb'; // 하늘색

  // 플레이어 생성
  const player = new Player('Player');
  player.transform.position = new Vector2(400, 300);

  // 플레이어 스프라이트 (간단히 박스로 표현)
  const playerBox = new Platform('PlayerBox', 0, 0, 40, 60, '#e74c3c');
  player.addChild(playerBox);

  // 플랫폼들 생성
  const ground = new Platform('Ground', 400, 570, 800, 60);
  const platform1 = new Platform('Platform1', 200, 450, 150, 20);
  const platform2 = new Platform('Platform2', 500, 350, 150, 20);
  const platform3 = new Platform('Platform3', 300, 250, 150, 20);

  // 씬에 추가
  scene.addGameObject(ground);
  scene.addGameObject(platform1);
  scene.addGameObject(platform2);
  scene.addGameObject(platform3);
  scene.addGameObject(player);

  // UI 텍스트
  class UIText extends GameObject {
    render(ctx: CanvasRenderingContext2D): void {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.fillText('A/D: 이동, Space: 점프', 10, 30);
      ctx.fillText(
        `FPS: ${this.scene?.engine?.fps || 0}`,
        10,
        60
      );

      ctx.restore();
    }
  }

  scene.addGameObject(new UIText('UI'));

  // 시작
  await engine.loadScene(scene);
  engine.start();
}

main();
```

## 11. 디버깅 팁

### FPS 표시

```typescript
// 화면에 FPS 표시
const originalRender = engine['render'].bind(engine);
engine['render'] = function () {
  originalRender();
  this.drawFPS(10, 20, '#00ff00');
};
```

### 콘솔 로그

```typescript
class DebugObject extends GameObject {
  update(deltaTime: number): void {
    console.log(`Delta Time: ${deltaTime.toFixed(4)}`);
    console.log(`Position: ${this.transform.position.toString()}`);
  }
}
```

### GameObject 개수 확인

```typescript
console.log(`Total objects: ${scene.getTotalObjectCount()}`);
```

## 12. 다음 단계

더 고급 기능을 구현하고 싶다면:

1. **충돌 감지**: Collider 컴포넌트 만들기
2. **애니메이션**: 스프라이트 애니메이션 시스템
3. **파티클**: 파티클 이펙트 시스템
4. **사운드**: AudioSource 컴포넌트
5. **타일맵**: 타일 기반 맵 렌더링

## 참고 자료

- [아키텍처](architecture.md) - 프레임워크 구조
- [API 문서](api.md) - 상세한 API 레퍼런스
- [게임 루프](gameloop.md) - 게임 루프 동작 방식

## 문제 해결

### 이미지가 표시되지 않음
- 이미지 경로가 올바른지 확인
- 이미지가 로드된 후 setImageDirect 호출
- Sprite의 width/height 설정 확인

### 입력이 작동하지 않음
- InputManager.update()가 매 프레임 호출되는지 확인
- 키 이름이 정확한지 확인 (Keys 상수 사용 권장)

### 프레임 레이트가 낮음
- 불필요한 렌더링 줄이기
- Culling 구현 (화면 밖 오브젝트 스킵)
- console.log 제거

즐거운 게임 개발 되세요! 🎮
