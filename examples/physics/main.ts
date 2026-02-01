/**
 * 물리 시스템 테스트 예제
 * 다양한 물리 기능을 테스트합니다.
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
  PhysicsManager,
} from '../../src/index';

// 엔진 초기화
const engine = new Engine('gameCanvas', 800, 600);
const scene = new Scene('PhysicsTestScene', 800, 600);

// 바닥 (Static)
function createGround(): GameObject {
  const ground = new GameObject('Ground');
  ground.transform.position = new Vector2(400, 550);

  const rb = new RigidBody();
  rb.bodyType = BodyType.STATIC;
  ground.addComponent(rb);

  const collider = new BoxCollider();
  collider.size = new Vector2(800, 100);
  ground.addComponent(collider);

  // 렌더링
  ground.onRender = function (ctx: CanvasRenderingContext2D) {
    const col = this.getComponent(BoxCollider);
    if (!col) return;

    ctx.save();
    ctx.fillStyle = '#2c3e50';
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 2;
    ctx.fillRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);
    ctx.strokeRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);
    ctx.restore();
  };

  return ground;
}

// 화면 경계 벽 생성
function createWall(x: number, y: number, width: number, height: number, name: string): GameObject {
  const wall = new GameObject(name);
  wall.transform.position = new Vector2(x, y);

  const rb = new RigidBody();
  rb.bodyType = BodyType.STATIC;
  wall.addComponent(rb);

  const collider = new BoxCollider();
  collider.size = new Vector2(width, height);
  wall.addComponent(collider);

  // 렌더링 (반투명 회색)
  wall.onRender = function (ctx: CanvasRenderingContext2D) {
    const col = this.getComponent(BoxCollider);
    if (!col) return;

    ctx.save();
    ctx.fillStyle = 'rgba(52, 73, 94, 0.3)';
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 2;
    ctx.fillRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);
    ctx.strokeRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);
    ctx.restore();
  };

  return wall;
}

// 떨어지는 박스 (중력 테스트)
function createFallingBox(x: number, y: number): GameObject {
  const box = new GameObject('Box');
  box.transform.position = new Vector2(x, y);

  const rb = new RigidBody();
  rb.mass = 1.0;
  rb.useGravity = true;
  rb.drag = 0.1;
  box.addComponent(rb);

  const collider = new BoxCollider();
  collider.size = new Vector2(50, 50);
  collider.material = PhysicsMaterial.default;
  box.addComponent(collider);

  // 렌더링
  box.onRender = function (ctx: CanvasRenderingContext2D) {
    const col = this.getComponent(BoxCollider);
    const rb = this.getComponent(RigidBody);
    if (!col) return;

    ctx.save();
    ctx.fillStyle = '#e74c3c';
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.fillRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);
    ctx.strokeRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);

    // 무게 표시
    if (rb) {
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${rb.mass}kg`, 0, 0);
    }

    ctx.restore();
  };

  return box;
}

// 튀는 공 (반발 테스트)
function createBouncyBall(x: number, y: number): GameObject {
  const ball = new GameObject('Ball');
  ball.transform.position = new Vector2(x, y);

  const rb = new RigidBody();
  rb.mass = 0.5;
  rb.useGravity = true;
  rb.drag = 0.05;
  ball.addComponent(rb);

  const collider = new CircleCollider();
  collider.radius = 25;
  collider.material = PhysicsMaterial.bouncy; // 높은 반발
  ball.addComponent(collider);

  // 렌더링
  ball.onRender = function (ctx: CanvasRenderingContext2D) {
    const col = this.getComponent(CircleCollider);
    const rb = this.getComponent(RigidBody);
    if (!col) return;

    ctx.save();
    ctx.fillStyle = '#3498db';
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, col.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 무게 표시
    if (rb) {
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${rb.mass}kg`, 0, 0);
    }

    ctx.restore();
  };

  return ball;
}

// 미끄러운 박스 (마찰 테스트)
function createIceBox(x: number, y: number): GameObject {
  const box = new GameObject('IceBox');
  box.transform.position = new Vector2(x, y);

  const rb = new RigidBody();
  rb.mass = 1.0;
  rb.useGravity = true;
  rb.drag = 0.01; // 낮은 저항
  box.addComponent(rb);

  const collider = new BoxCollider();
  collider.size = new Vector2(40, 40);
  collider.material = PhysicsMaterial.ice; // 낮은 마찰
  box.addComponent(collider);

  // 초기 속도 추가 (미끄러짐 테스트)
  rb.setVelocity(new Vector2(200, 0));

  // 렌더링
  box.onRender = function (ctx: CanvasRenderingContext2D) {
    const col = this.getComponent(BoxCollider);
    const rb = this.getComponent(RigidBody);
    if (!col) return;

    ctx.save();
    ctx.fillStyle = '#9b59b6';
    ctx.strokeStyle = '#8e44ad';
    ctx.lineWidth = 2;
    ctx.fillRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);
    ctx.strokeRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);

    // 무게 표시
    if (rb) {
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${rb.mass}kg`, 0, 0);
    }

    ctx.restore();
  };

  return box;
}

// Trigger 영역
function createTriggerZone(x: number, y: number): GameObject {
  const trigger = new GameObject('TriggerZone');
  trigger.transform.position = new Vector2(x, y);

  const collider = new BoxCollider();
  collider.size = new Vector2(150, 150);
  collider.isTrigger = true; // Trigger 모드
  trigger.addComponent(collider);

  // Trigger 이벤트 처리
  trigger.onTriggerEnter = (other) => {
    console.log(`[Trigger] ${other.gameObject?.name}이(가) 진입했습니다!`);
  };

  trigger.onTriggerExit = (other) => {
    console.log(`[Trigger] ${other.gameObject?.name}이(가) 나갔습니다!`);
  };

  // 렌더링 (반투명)
  trigger.onRender = function (ctx: CanvasRenderingContext2D) {
    const col = this.getComponent(BoxCollider);
    if (!col) return;

    ctx.save();
    ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.fillRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);
    ctx.strokeRect(-col.size.x / 2, -col.size.y / 2, col.size.x, col.size.y);
    ctx.restore();
  };

  return trigger;
}

// Raycast 테스터 (마우스 클릭으로 Ray 발사)
class RaycastTester extends GameObject {
  private rightMouseWasPressed: boolean = false;

  onUpdate(_deltaTime: number): void {
    const input = this.scene?.engine?.inputManager;
    if (!input || !this.scene) return;

    // 왼쪽 클릭: Raycast 발사
    if (input.isMouseButtonPressed(0)) {
      const mousePos = input.getMousePosition();
      const origin = new Vector2(400, 50); // 화면 상단 중앙
      const direction = mousePos.subtract(origin).normalize();

      const hit = PhysicsManager.getInstance().raycast(origin, direction, 1000);

      if (hit) {
        console.log(`[Raycast] 명중! ${hit.collider.gameObject?.name}`);
        console.log(`  거리: ${hit.distance.toFixed(2)}`);
        console.log(`  위치: (${hit.point.x.toFixed(1)}, ${hit.point.y.toFixed(1)})`);

        // 명중한 물체에 충격 주기 (질량에 비례)
        const rb = hit.collider.gameObject?.getComponent(RigidBody);
        if (rb && rb.bodyType === BodyType.DYNAMIC) {
          // 질량에 비례하여 충격량 조정 (모든 물체가 비슷한 속도로 날아감)
          const impulseStrength = 800 * rb.mass; // 질량 비례
          rb.addImpulse(direction.multiply(impulseStrength));
        }
      } else {
        console.log('[Raycast] 빗나감!');
      }
    }

    // 오른쪽 클릭: 새 오브젝트 생성 (클릭 다운 시 한 번만)
    const rightMousePressed = input.isMouseButtonPressed(2);

    if (rightMousePressed && !this.rightMouseWasPressed) {
      const mousePos = input.getMousePosition();

      // 랜덤으로 박스 또는 공 생성
      const random = Math.random();
      let newObject: GameObject;

      if (random < 0.5) {
        // 박스 생성
        newObject = createFallingBox(mousePos.x, mousePos.y);
        console.log(`[생성] 박스 생성 at (${mousePos.x.toFixed(0)}, ${mousePos.y.toFixed(0)})`);
      } else {
        // 공 생성
        newObject = createBouncyBall(mousePos.x, mousePos.y);
        console.log(`[생성] 공 생성 at (${mousePos.x.toFixed(0)}, ${mousePos.y.toFixed(0)})`);
      }

      this.scene.addGameObject(newObject);

      // 씬이 이미 로드되어 있으므로 awake 수동 호출
      newObject.awake();
    }

    // 마우스 상태 업데이트
    this.rightMouseWasPressed = rightMousePressed;
  }
}

// 씬 구성
async function setupScene() {
  // Camera 위치 설정 (화면 중앙을 월드 좌표 (400, 300)에 맞춤)
  scene.camera.position.set(400, 300);

  // 화면 경계 벽
  scene.addGameObject(createWall(0, 300, 20, 600, 'LeftWall'));      // 좌측 벽
  scene.addGameObject(createWall(800, 300, 20, 600, 'RightWall'));   // 우측 벽
  scene.addGameObject(createWall(400, 0, 800, 20, 'TopWall'));       // 상단 벽

  // 바닥
  scene.addGameObject(createGround());

  // 떨어지는 박스 여러 개
  scene.addGameObject(createFallingBox(200, 100));
  scene.addGameObject(createFallingBox(300, 150));
  scene.addGameObject(createFallingBox(400, 200));

  // 튀는 공
  scene.addGameObject(createBouncyBall(500, 100));
  scene.addGameObject(createBouncyBall(550, 150));

  // 미끄러운 박스 (마찰 테스트)
  scene.addGameObject(createIceBox(100, 300));

  // Trigger 영역
  scene.addGameObject(createTriggerZone(650, 400));

  // Raycast 테스터
  const raycastTester = new RaycastTester('RaycastTester');
  scene.addGameObject(raycastTester);

  console.log('=== 물리 시스템 테스트 예제 ===');
  console.log('- 박스들이 중력으로 떨어집니다');
  console.log('- 공들은 높게 튕깁니다 (높은 restitution)');
  console.log('- 왼쪽 박스는 미끄러집니다 (낮은 friction)');
  console.log('- 오른쪽 하단은 Trigger 영역입니다');
  console.log('- 마우스 클릭으로 Raycast를 발사하세요!');
  console.log('===============================');
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
}

main();
