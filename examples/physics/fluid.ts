/**
 * 유체 시뮬레이션 예제
 * 작은 입자들로 유체처럼 보이는 효과를 만듭니다.
 */

import {
  Engine,
  Scene,
  GameObject,
  Vector2,
  RigidBody,
  BoxCollider,
  CircleCollider,
  PhysicsMaterial,
  BodyType,
} from '../../src/index';

// 엔진 초기화
const engine = new Engine('gameCanvas', 800, 600);
const scene = new Scene('FluidSimulation', 800, 600);

// 유체 입자 재질 (낮은 반발, 약간의 마찰)
const fluidMaterial = new PhysicsMaterial();
fluidMaterial.restitution = 0.2;  // 낮은 반발
fluidMaterial.friction = 0.3;     // 약간의 마찰
fluidMaterial.density = 1.0;

// 컨테이너 벽 생성
function createWall(x: number, y: number, width: number, height: number, name: string): GameObject {
  const wall = new GameObject(name);
  wall.transform.position = new Vector2(x, y);

  const rb = new RigidBody();
  rb.bodyType = BodyType.STATIC;
  wall.addComponent(rb);

  const collider = new BoxCollider();
  collider.size = new Vector2(width, height);
  wall.addComponent(collider);

  // 렌더링
  wall.onRender = function (ctx: CanvasRenderingContext2D) {
    const col = this.getComponent(BoxCollider);
    if (!col) return;

    ctx.save();
    ctx.fillStyle = '#2c3e50';
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 3;
    ctx.fillRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);
    ctx.strokeRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);
    ctx.restore();
  };

  return wall;
}

// 유체 입자 생성
function createFluidParticle(x: number, y: number, color: string = '#3498db'): GameObject {
  const particle = new GameObject('Particle');
  particle.transform.position = new Vector2(x, y);

  const rb = new RigidBody();
  rb.mass = 0.1;           // 가벼운 입자
  rb.useGravity = true;
  rb.drag = 0.3;           // 점성 효과
  rb.bodyType = BodyType.DYNAMIC;
  particle.addComponent(rb);

  const collider = new CircleCollider();
  collider.radius = 6;     // 작은 입자
  collider.material = fluidMaterial;
  particle.addComponent(collider);

  // 렌더링 (반투명)
  particle.onRender = function (ctx: CanvasRenderingContext2D) {
    const col = this.getComponent(CircleCollider);
    if (!col) return;

    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.8;  // 반투명
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, col.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  return particle;
}

// 입자 그룹 생성 (여러 입자를 한 번에)
function createFluidBlob(centerX: number, centerY: number, count: number, color: string): void {
  const radius = 40; // 생성 영역 반지름

  for (let i = 0; i < count; i++) {
    // 원형 영역에 랜덤 배치
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * radius;
    const x = centerX + Math.cos(angle) * dist;
    const y = centerY + Math.sin(angle) * dist;

    const particle = createFluidParticle(x, y, color);

    // 약간의 초기 속도 추가 (확산 효과)
    const rb = particle.getComponent(RigidBody);
    if (rb) {
      const spreadVel = new Vector2(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
      );
      rb.setVelocity(spreadVel);
    }

    scene.addGameObject(particle);
    particle.awake();
  }
}

// 장애물 (경사로) 생성
function createRamp(x: number, y: number, width: number, height: number, angle: number): GameObject {
  const ramp = new GameObject('Ramp');
  ramp.transform.position = new Vector2(x, y);
  ramp.transform.rotation = angle;

  const rb = new RigidBody();
  rb.bodyType = BodyType.STATIC;
  ramp.addComponent(rb);

  const collider = new BoxCollider();
  collider.size = new Vector2(width, height);
  ramp.addComponent(collider);

  // 렌더링
  ramp.onRender = function (ctx: CanvasRenderingContext2D) {
    const col = this.getComponent(BoxCollider);
    if (!col) return;

    ctx.save();
    ctx.fillStyle = '#95a5a6';
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 2;
    ctx.fillRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);
    ctx.strokeRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);
    ctx.restore();
  };

  return ramp;
}

// 마우스 상호작용 (클릭으로 입자 생성)
class FluidSpawner extends GameObject {
  private mouseWasPressed: boolean = false;
  private rightMouseWasPressed: boolean = false;

  onUpdate(_deltaTime: number): void {
    const input = this.scene?.engine?.inputManager;
    if (!input || !this.scene) return;

    // 왼쪽 클릭: 파란 입자 생성
    const leftPressed = input.isMouseButtonPressed(0);
    if (leftPressed && !this.mouseWasPressed) {
      const mousePos = input.getMousePosition();
      createFluidBlob(mousePos.x, mousePos.y, 20, '#3498db');
      console.log(`[생성] 파란 유체 at (${mousePos.x.toFixed(0)}, ${mousePos.y.toFixed(0)})`);
    }
    this.mouseWasPressed = leftPressed;

    // 오른쪽 클릭: 빨간 입자 생성
    const rightPressed = input.isMouseButtonPressed(2);
    if (rightPressed && !this.rightMouseWasPressed) {
      const mousePos = input.getMousePosition();
      createFluidBlob(mousePos.x, mousePos.y, 20, '#e74c3c');
      console.log(`[생성] 빨간 유체 at (${mousePos.x.toFixed(0)}, ${mousePos.y.toFixed(0)})`);
    }
    this.rightMouseWasPressed = rightPressed;
  }
}

// 씬 구성
async function setupScene() {
  // Camera 위치
  scene.camera.position.set(400, 300);

  // 컨테이너 (U자형)
  const containerWidth = 600;
  const containerHeight = 500;
  const wallThickness = 20;

  // 바닥
  scene.addGameObject(createWall(400, 580, containerWidth, wallThickness, 'Bottom'));

  // 좌측 벽
  scene.addGameObject(createWall(100, 300, wallThickness, containerHeight, 'LeftWall'));

  // 우측 벽
  scene.addGameObject(createWall(700, 300, wallThickness, containerHeight, 'RightWall'));

  // 경사로 (입자가 흘러내리도록)
  scene.addGameObject(createRamp(250, 200, 150, 15, Math.PI / 6));    // 30도
  scene.addGameObject(createRamp(550, 300, 150, 15, -Math.PI / 6));   // -30도

  // 초기 입자 생성
  console.log('=== 유체 시뮬레이션 ===');
  console.log('- 왼쪽 클릭: 파란 유체 생성');
  console.log('- 오른쪽 클릭: 빨간 유체 생성');
  console.log('- 입자들이 유체처럼 흘러내립니다');
  console.log('======================');

  // 초기 파란 유체
  createFluidBlob(200, 100, 30, '#3498db');

  // 초기 빨간 유체
  createFluidBlob(600, 100, 30, '#e74c3c');

  // 스포너 추가
  const spawner = new FluidSpawner('FluidSpawner');
  scene.addGameObject(spawner);
}

// 게임 시작
async function main() {
  await engine.loadScene(scene);
  await setupScene();
  engine.start();

  // FPS 표시
  setInterval(() => {
    if (engine.isRunning) {
      engine.drawFPS();
    }
  }, 16);

  // 입자 개수 표시
  setInterval(() => {
    const particleCount = scene.rootObjects.filter(obj => obj.name === 'Particle').length;
    console.log(`입자 개수: ${particleCount}`);
  }, 5000);
}

main();
