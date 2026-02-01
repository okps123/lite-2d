import {
  Engine,
  Scene,
  UIManager,
  Label,
  Button,
  InputBox,
  Dialog,
} from '../../src/index';

/**
 * UI 컴포넌트 종합 예제
 * Label, Button, InputBox, Dialog를 모두 사용합니다.
 */

let score = 0;
let playerName = '';

async function main() {
  console.log('Growth Game Engine - UI Components Example');

  // 윈도우 크기
  const width = window.innerWidth;
  const height = window.innerHeight;

  // 엔진 초기화
  const engine = new Engine('gameCanvas', width, height);

  // 씬 생성
  const mainScene = new Scene('UIScene', width, height);
  mainScene.backgroundColor = '#1a1a2e';

  // UIManager 생성
  const uiManager = new UIManager(engine.inputManager, mainScene.camera);

  // === 1. Title Label (화면 상단 중앙) ===
  const titleLabel = new Label('TitleLabel');
  titleLabel.setText('UI Components Example');
  titleLabel.setFont(32, 'Arial');
  titleLabel.textColor = '#3498db';
  titleLabel.textAlign = 'center';
  titleLabel.verticalAlign = 'middle';
  titleLabel.width = 500;
  titleLabel.height = 50;
  titleLabel.transform.position.set(width / 2, 50);
  titleLabel.screenSpace = true;
  titleLabel.sortingOrder = 100;
  mainScene.addGameObject(titleLabel);
  uiManager.register(titleLabel);

  // === 2. Score Label (우상단) ===
  const scoreLabel = new Label('ScoreLabel');
  scoreLabel.setText(`Score: ${score}`);
  scoreLabel.setFont(20, 'Arial');
  scoreLabel.textColor = '#2ecc71';
  scoreLabel.textAlign = 'right';
  scoreLabel.width = 150;
  scoreLabel.height = 40;
  scoreLabel.transform.position.set(width - 100, 30);
  scoreLabel.screenSpace = true;
  scoreLabel.sortingOrder = 100;
  mainScene.addGameObject(scoreLabel);
  uiManager.register(scoreLabel);

  // === 3. Name InputBox (중앙 상단) ===
  const nameLabel = new Label('NameLabel');
  nameLabel.setText('Enter your name:');
  nameLabel.setFont(18, 'Arial');
  nameLabel.textColor = '#ecf0f1';
  nameLabel.textAlign = 'left';
  nameLabel.width = 200;
  nameLabel.height = 30;
  nameLabel.transform.position.set(width / 2 - 200, height / 2 - 100);
  nameLabel.screenSpace = true;
  nameLabel.sortingOrder = 100;
  mainScene.addGameObject(nameLabel);
  uiManager.register(nameLabel);

  const nameInput = new InputBox('NameInput');
  nameInput.setPlaceholder('Player name...');
  nameInput.width = 300;
  nameInput.height = 40;
  nameInput.transform.position.set(width / 2, height / 2 - 60);
  nameInput.screenSpace = true;
  nameInput.sortingOrder = 100;
  nameInput.onChange = (text) => {
    playerName = text;
    console.log('Name changed:', text);
  };
  nameInput.onSubmit = (text) => {
    console.log('Name submitted:', text);
    playerName = text;
  };
  mainScene.addGameObject(nameInput);
  uiManager.register(nameInput);

  // === 4. Buttons (중앙) ===
  const increaseButton = new Button('IncreaseButton');
  increaseButton.setText('+ Score');
  increaseButton.width = 120;
  increaseButton.height = 50;
  increaseButton.transform.position.set(width / 2 - 80, height / 2 + 30);
  increaseButton.screenSpace = true;
  increaseButton.sortingOrder = 100;
  increaseButton.setOnClick(() => {
    score += 10;
    scoreLabel.setText(`Score: ${score}`);
    console.log('Score increased:', score);
  });
  mainScene.addGameObject(increaseButton);
  uiManager.register(increaseButton);

  const decreaseButton = new Button('DecreaseButton');
  decreaseButton.setText('- Score');
  decreaseButton.width = 120;
  decreaseButton.height = 50;
  decreaseButton.transform.position.set(width / 2 + 80, height / 2 + 30);
  decreaseButton.screenSpace = true;
  decreaseButton.sortingOrder = 100;
  decreaseButton.normalStyle = {
    backgroundColor: '#e74c3c',
    borderColor: '#c0392b',
    borderWidth: 2,
    textColor: '#ffffff',
    scale: 1.0,
  };
  decreaseButton.hoverStyle = {
    backgroundColor: '#ff6b6b',
    borderColor: '#e74c3c',
    borderWidth: 2,
    textColor: '#ffffff',
    scale: 1.05,
  };
  decreaseButton.setOnClick(() => {
    score = Math.max(0, score - 10);
    scoreLabel.setText(`Score: ${score}`);
    console.log('Score decreased:', score);
  });
  mainScene.addGameObject(decreaseButton);
  uiManager.register(decreaseButton);

  // === 5. Show Dialog Button ===
  const dialogButton = new Button('DialogButton');
  dialogButton.setText('Show Dialog');
  dialogButton.width = 200;
  dialogButton.height = 50;
  dialogButton.transform.position.set(width / 2, height / 2 + 120);
  dialogButton.screenSpace = true;
  dialogButton.sortingOrder = 100;
  dialogButton.normalStyle = {
    backgroundColor: '#9b59b6',
    borderColor: '#8e44ad',
    borderWidth: 2,
    textColor: '#ffffff',
    scale: 1.0,
  };
  dialogButton.hoverStyle = {
    backgroundColor: '#af7ac5',
    borderColor: '#9b59b6',
    borderWidth: 2,
    textColor: '#ffffff',
    scale: 1.05,
  };
  dialogButton.setOnClick(() => {
    showDialog(mainScene, uiManager);
  });
  mainScene.addGameObject(dialogButton);
  uiManager.register(dialogButton);

  // === 6. Instructions Label (하단) ===
  const instructionsLabel = new Label('InstructionsLabel');
  instructionsLabel.setText(
    'Click buttons to change score | Enter your name and press Enter | Click "Show Dialog" to see a modal'
  );
  instructionsLabel.setFont(14, 'Arial');
  instructionsLabel.textColor = '#95a5a6';
  instructionsLabel.textAlign = 'center';
  instructionsLabel.width = width - 40;
  instructionsLabel.height = 30;
  instructionsLabel.maxWidth = width - 40;
  instructionsLabel.transform.position.set(width / 2, height - 30);
  instructionsLabel.screenSpace = true;
  instructionsLabel.sortingOrder = 100;
  mainScene.addGameObject(instructionsLabel);
  uiManager.register(instructionsLabel);

  // === Scene 업데이트에 UIManager 통합 ===
  const originalUpdate = mainScene.update.bind(mainScene);
  mainScene.update = function (deltaTime: number) {
    originalUpdate(deltaTime);
    uiManager.update(deltaTime);
  };

  // === 씬 로드 및 시작 ===
  await engine.loadScene(mainScene);
  engine.start();

  console.log('UI Example started!');
}

/**
 * Dialog 표시 함수
 */
function showDialog(scene: Scene, uiManager: UIManager) {
  const dialog = new Dialog('ConfirmDialog');
  dialog.sortingOrder = 200; // 다른 UI보다 위에 표시

  dialog.setTitle('Confirmation');
  dialog.setMessage(
    `Hello, ${playerName || 'Player'}!\nYour current score is ${score}.\n\nDo you want to reset the score?`
  );

  // 확인 버튼
  dialog.addButton(
    'Yes, Reset',
    () => {
      score = 0;
      const scoreLabel = scene.findGameObject('ScoreLabel') as Label;
      if (scoreLabel) {
        scoreLabel.setText(`Score: ${score}`);
      }
      console.log('Score reset!');
    },
    true // 클릭 시 다이얼로그 자동 닫기
  );

  // 취소 버튼
  dialog.addButton(
    'No, Cancel',
    () => {
      console.log('Dialog cancelled');
    },
    true
  );

  dialog.onClose = () => {
    console.log('Dialog closed');
    // Dialog와 관련된 UI 요소들 UIManager에서 제거
    uiManager.unregister(dialog);
  };

  // Scene에 추가 및 표시
  scene.addGameObject(dialog);
  uiManager.register(dialog);
  dialog.show(uiManager); // UIManager 전달
}

// DOM 로드 완료 후 시작
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
