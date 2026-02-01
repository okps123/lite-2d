import {
  Engine,
  Scene,
  GameObject,
  Vector2,
  Keys,
} from '../../src/index';

/**
 * 플레이어 클래스
 * GameObject를 상속받아 키보드 입력으로 움직이는 오브젝트를 만듭니다.
 */
class Player extends GameObject {
  private speed: number = 200; // pixels per second
  private rotationSpeed: number = 3; // radians per second

  onUpdate(deltaTime: number): void {
    const input = this.scene?.engine?.inputManager;
    if (!input) return;

    // 이동
    if (input.isKeyDown(Keys.ArrowLeft) || input.isKeyDown(Keys.A)) {
      this.transform.translate(new Vector2(-this.speed * deltaTime, 0));
    }
    if (input.isKeyDown(Keys.ArrowRight) || input.isKeyDown(Keys.D)) {
      this.transform.translate(new Vector2(this.speed * deltaTime, 0));
    }
    if (input.isKeyDown(Keys.ArrowUp) || input.isKeyDown(Keys.W)) {
      this.transform.translate(new Vector2(0, -this.speed * deltaTime));
    }
    if (input.isKeyDown(Keys.ArrowDown) || input.isKeyDown(Keys.S)) {
      this.transform.translate(new Vector2(0, this.speed * deltaTime));
    }

    // 회전
    if (input.isKeyDown(Keys.Space)) {
      this.transform.rotate(this.rotationSpeed * deltaTime);
    }
  }
}

/**
 * 간단한 박스 렌더링 GameObject
 */
class ColorBox extends GameObject {
  private width: number;
  private height: number;
  private color: string;

  constructor(name: string, width: number, height: number, color: string) {
    super(name);
    this.width = width;
    this.height = height;
    this.color = color;
  }

  onRender(ctx: CanvasRenderingContext2D): void {
    // 로컬 좌표계에서 박스 그리기 (GameObject.render가 이미 Transform을 적용함)
    // 박스 그리기 (중앙이 앵커)
    ctx.fillStyle = this.color;
    ctx.fillRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );

    // 테두리
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
  }
}

/**
 * 메인 함수
 */
async function main() {
  console.log('Growth Game Engine - Basic Example 시작');

  // 윈도우 크기 가져오기
  const width = window.innerWidth;
  const height = window.innerHeight;

  // 엔진 초기화
  const engine = new Engine('gameCanvas', width, height);

  // 씬 생성
  const mainScene = new Scene('MainScene', width, height);
  mainScene.backgroundColor = '#1a1a2e';

  // 플레이어 생성 (빨간 박스)
  const player = new Player('Player');
  const playerBox = new ColorBox('PlayerBox', 50, 50, '#e74c3c');
  player.addChild(playerBox);
  player.transform.position = new Vector2(width / 2, height / 2);
  player.sortingOrder = 10; // 플레이어가 가장 위에 표시됨

  // 자식 오브젝트 추가 (플레이어에 붙은 작은 박스)
  const childBox = new ColorBox('ChildBox', 20, 20, '#3498db');
  childBox.transform.position = new Vector2(40, 0); // 플레이어 로컬 좌표
  player.addChild(childBox);

  // 또 다른 자식 (반대편)
  const childBox2 = new ColorBox('ChildBox2', 20, 20, '#2ecc71');
  childBox2.transform.position = new Vector2(-40, 0);
  player.addChild(childBox2);

  // 배경 오브젝트들 (움직이지 않음)
  for (let i = 0; i < 5; i++) {
    const bgBox = new ColorBox(
      `BgBox${i}`,
      60,
      60,
      `hsl(${i * 60}, 70%, 50%)`
    );
    bgBox.transform.position = new Vector2(100 + i * 150, 100);
    bgBox.sortingOrder = i - 2; // -2, -1, 0, 1, 2
    mainScene.addGameObject(bgBox);
  }

  // sortingOrder 테스트용 겹치는 박스들
  const overlapBox1 = new ColorBox('Overlap1', 80, 80, 'rgba(255, 0, 0, 0.7)');
  overlapBox1.transform.position = new Vector2(200, 300);
  overlapBox1.sortingOrder = 1;
  mainScene.addGameObject(overlapBox1);

  const overlapBox2 = new ColorBox('Overlap2', 80, 80, 'rgba(0, 255, 0, 0.7)');
  overlapBox2.transform.position = new Vector2(240, 320);
  overlapBox2.sortingOrder = 2;
  mainScene.addGameObject(overlapBox2);

  const overlapBox3 = new ColorBox('Overlap3', 80, 80, 'rgba(0, 0, 255, 0.7)');
  overlapBox3.transform.position = new Vector2(220, 340);
  overlapBox3.sortingOrder = 3;
  mainScene.addGameObject(overlapBox3);

  // 씬에 플레이어 추가
  mainScene.addGameObject(player);

  // 정보 텍스트 GameObject
  class InfoText extends GameObject {
    render(ctx: CanvasRenderingContext2D): void {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // 카메라 변환 무시

      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText('Growth Game Engine v0.1.0', 10, 20);
      ctx.fillText(
        `Objects: ${this.scene?.getTotalObjectCount() || 0}`,
        10,
        40
      );
      ctx.fillText(
        `Player: (${Math.round(player.transform.position.x)}, ${Math.round(
          player.transform.position.y
        )})`,
        10,
        60
      );
      ctx.fillText('화살표 키 또는 WASD로 이동, Space로 회전', 10, 80);

      ctx.restore();
    }
  }

  const infoText = new InfoText('InfoText');
  mainScene.addGameObject(infoText);

  // 씬 로드 및 시작
  await engine.loadScene(mainScene);
  engine.start();

  // FPS 표시 (매 프레임마다 그리기)
  const originalRender = engine['render'].bind(engine);
  engine['render'] = function () {
    originalRender();
    this.drawFPS(10, height - 20, '#00ff00');
  };

  console.log('게임이 시작되었습니다!');
  console.log('화살표 키 또는 WASD로 이동, Space로 회전');
}

// DOM 로드 완료 후 시작
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
