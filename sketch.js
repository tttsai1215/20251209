let charImageDefault, charImageActive; // 角色1的預設與活動圖片
let spriteSheet3; // NPC 的 sprite sheet
let spriteSheet4; // NPC 微笑動畫的 sprite sheet
let frames3 = []; // NPC 的幀
let frames4 = []; // NPC 微笑動畫的幀

// NPC 角色 3 的設定
const FRAME3_W = Math.floor(699 / 8); // 圖片寬度 699 / 8 幀，使用 floor 確保為整數
const FRAME3_H = 190;     // 圖片高度 190
const TOTAL_FRAMES3 = 8;
let currentFrame3 = 0;
let animTimer3 = 0;

// NPC 角色 3 微笑動畫的設定
const FRAME4_W = Math.floor(585 / 5); // 圖片寬度 585 / 5 幀
const FRAME4_H = 183;     // 圖片高度 183
const TOTAL_FRAMES4 = 5;
let currentFrame4 = 0;
let animTimer4 = 0;
let char3Pos; // 新角色的位置

// 角色位置與跳躍狀態
let charPos;
let isJumping = false;
let jumpProgress = 0;
const JUMP_HEIGHT = 200; // 跳躍高度
const JUMP_SPEED = 0.05; // 跳躍動畫速度
const MOVE_SPEED = 5; // 左右移動速度
const PROXIMITY_THRESHOLD = 150; // 判定為「靠近」的距離閾值

// 煙火特效
let fireworks = [];

// --- 新增：問答遊戲相關變數 ---
let quizTable;
let quiz = []; // 儲存所有問題
let currentQuestion = null; // 當前顯示的問題物件
let quizState = 'idle'; // 遊戲狀態: idle, asking, answered
let feedbackText = ''; // 回答後顯示的回饋文字
const FEEDBACK_DISPLAY_TIME = 3000; // 回饋顯示時間 (3秒)
let feedbackTimer = 0;

const ANIM_FPS = 2; // 動畫幀率 (每秒2幀，即每0.5秒換一張)

function preload() {
  // 為了瀏覽器相容性，使用相對路徑
  charImageDefault = loadImage('1/0.png');
  charImageActive = loadImage('2/0.png');
  spriteSheet3 = loadImage('5/stop/all.png'); // 載入NPC的圖片
  spriteSheet4 = loadImage('5/smile/all.png'); // 載入NPC微笑動畫圖片
  
  // 載入題庫CSV檔案
  quizTable = loadTable('quiz_mc.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // 初始化主要角色位置
  charPos = { x: width / 2, y: height / 2 };
  // 初始化NPC的固定位置
  char3Pos = { x: width / 2 - 260 - 50, y: height / 2 }; // 使用一個大概的寬度值

  // --- 處理載入的題庫資料 ---
  if (quizTable) {
    for (const row of quizTable.getRows()) {
      quiz.push({
        question: row.getString('題目'),
        options: {
          a: row.getString('選項A'),
          b: row.getString('選項B'),
          c: row.getString('選項C'),
          d: row.getString('選項D'),
        },
        answer: row.getString('答案').toUpperCase(),
        correctFeedback: row.getString('答對回饋'),
        wrongFeedback: row.getString('答錯回饋'),
        hint: row.getString('提示'),
      });
    }
  } else {
    console.error("題庫檔案 'quiz.csv' 載入失敗。");
  }

  // 裁切NPC的 Sprite Sheet (水平)
  if (spriteSheet3 && spriteSheet3.width > 0) {
    for (let i = 0; i < TOTAL_FRAMES3; i++) {
      const x = i * FRAME3_W;
      frames3.push(spriteSheet3.get(x, 0, FRAME3_W, FRAME3_H));
    }
  } else {
    console.error("角色3的圖片 '5/stop/all.png' 載入失敗或為空。請檢查檔案路徑和檔案是否損毀。");
  }

  // 裁切NPC微笑動畫的 Sprite Sheet (水平)
  if (spriteSheet4 && spriteSheet4.width > 0) {
    for (let i = 0; i < TOTAL_FRAMES4; i++) {
      const x = i * FRAME4_W;
      frames4.push(spriteSheet4.get(x, 0, FRAME4_W, FRAME4_H));
    }
  } else {
    console.error("角色3微笑動畫的圖片 '5/smile/all.png' 載入失敗或為空。");
  }

  // 確保幀索引在範圍內
  if (frames3.length > 0) currentFrame3 = currentFrame3 % frames3.length;
  if (frames4.length > 0) currentFrame4 = currentFrame4 % frames4.length;
  // 如果NPC圖片陣列是空的，就發出警告
  if (frames3.length === 0) {
    console.warn("警告：NPC的動畫幀陣列是空的，角色將不會被繪製。");
  }
}

let isInteracting = false; // 新增：互動狀態鎖

function draw() {
  background(173, 216, 230);

  imageMode(CENTER);

  let currentImage;
  let isFlipped = false;

  // 優先處理跳躍狀態
  if (keyIsDown(UP_ARROW) && !isJumping) {
    isJumping = true;
    jumpProgress = 0;
  }

  // 根據狀態決定主要角色使用的圖片和位置
  if (isJumping) {
    currentImage = charImageActive; // 使用活動圖片
    jumpProgress += JUMP_SPEED;
    charPos.y = (height / 2) - JUMP_HEIGHT * sin(jumpProgress * PI);
    if (jumpProgress >= 1) {
      isJumping = false;
      jumpProgress = 0;
      charPos.y = height / 2;
    }
  } else if (keyIsDown(LEFT_ARROW)) {
    currentImage = charImageActive; // 使用活動圖片
    charPos.x -= MOVE_SPEED;
    charPos.x = max(currentImage.width / 2, charPos.x);
    charPos.x = min(width - currentImage.width / 2, charPos.x);
    isFlipped = true;
  } else if (keyIsDown(RIGHT_ARROW)) {
    currentImage = charImageActive; // 使用活動圖片
    charPos.x += MOVE_SPEED;
    charPos.x = min(width - currentImage.width / 2, charPos.x);
  } else {
    currentImage = charImageDefault; // 使用預設圖片
  }

  // --- 繪製主要角色 (如果圖片已載入) ---
  if (currentImage) {
      push();
      translate(charPos.x, charPos.y);
      if (isFlipped) {
        scale(-1, 1);
      }
      image(currentImage, 0, 0);
      pop();
  }

  // --- 繪製新角色 (NPC) ---
  if (frames3.length > 0) {
      let newCharImage;
      let isChar3Flipped = false;

      const distance = dist(charPos.x, charPos.y, char3Pos.x, char3Pos.y);
      if (distance < PROXIMITY_THRESHOLD && !isInteracting && quiz.length > 0) {
        isInteracting = true;
        quizState = 'asking';
        currentQuestion = random(quiz);
        charPos.x = width / 2;
        charPos.y = height / 2;
      }

      if (isInteracting) {
        newCharImage = frames4[currentFrame4];
        if (quizState === 'asking') {
          drawSpeechBubble(char3Pos, currentQuestion, FRAME3_H);
          drawAnswerPrompt(); // 新增：呼叫繪製「請回答」提示框的函式
        } else if (quizState === 'answered') {
          drawSpeechBubble(char3Pos, feedbackText, FRAME3_H);
          if (millis() - feedbackTimer > FEEDBACK_DISPLAY_TIME) {
            quizState = 'idle';
            currentQuestion = null;
            isInteracting = false; 
          }
        }
      } else {
        newCharImage = frames3[currentFrame3];
      }

      // 如果主要角色在角色三的右邊，則翻轉角色三
      if (charPos.x > char3Pos.x) {
          isChar3Flipped = true;
      }

      // 使用 push/pop 獨立繪製，避免座標系互相影響
      push();
      translate(char3Pos.x, char3Pos.y);
      if (isChar3Flipped) {
          scale(-1, 1);
      }
      image(newCharImage, 0, 0);
      pop();
  }

  // --- 更新所有角色的動畫幀 ---
  updateAnimationFrames();

  // --- 更新並繪製煙火 ---
  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].show();
    if (fireworks[i].done()) {
      fireworks.splice(i, 1);
    }
  }
}

/**
 * 在主要角色頭上繪製「請回答」提示框
 */
function drawAnswerPrompt() {
  push();
  const promptText = "請回答 (A,B,C,D)";
  const textS = 14;
  textSize(textS);
  textFont('Arial');
  const textW = textWidth(promptText);
  
  const bubbleW = textW + 20;
  const bubbleH = 30;
  const bubbleX = charPos.x - bubbleW / 2;
  const bubbleY = charPos.y - (charImageDefault.height / 2) - 50;

  // 繪製對話框
  fill(255, 255, 224); // 淡黃色
  stroke(180);
  strokeWeight(1);
  rect(bubbleX, bubbleY, bubbleW, bubbleH, 5);

  // 繪製文字
  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);
  text(promptText, bubbleX + bubbleW / 2, bubbleY + bubbleH / 2);
  
  pop();
}

function updateAnimationFrames() {
  const frameDuration = 1000 / ANIM_FPS;

  // 只更新 NPC 的動畫
  if (isInteracting) {
      animTimer4 += deltaTime;
      if (animTimer4 >= frameDuration) {
          currentFrame4 = (currentFrame4 + 1) % frames4.length;
          animTimer4 = 0;
      }
  } else {
      animTimer3 += deltaTime;
      if (animTimer3 >= frameDuration) {
          currentFrame3 = (currentFrame3 + 1) % frames3.length;
          animTimer3 = 0;
      }
  }
}

function handleAnswerSubmit(playerChoice) {
  if (quizState !== 'asking' || !currentQuestion) {
    return; // 如果不是在問問題狀態，就直接返回
  }
  
  console.log(`Player chose: ${playerChoice}, Correct answer: ${currentQuestion.answer}`);

  if (playerChoice === currentQuestion.answer) {
    console.log('Correct answer!');
    feedbackText = currentQuestion.correctFeedback;
    // 新增：答對時放煙火
    let yPos = random(height * 0.2, height * 0.7);
    console.log(`Fireworks array length before push: ${fireworks.length}`);
    fireworks.push(new Firework(width * 0.2, yPos));
    fireworks.push(new Firework(width * 0.8, yPos));
    console.log(`Fireworks array length after push: ${fireworks.length}`);
  } else {
    console.log('Wrong answer.');
    feedbackText = currentQuestion.wrongFeedback;
  }
  
  quizState = 'answered'; // 設定狀態為已回答
  feedbackTimer = millis(); // 開始計時
}

function drawSpeechBubble(charPosition, content, charHeight) {
  push();
  
  // --- 對話框樣式設定 ---
  const bubblePadding = 20;
  const arrowHeight = 10;
  const arrowWidth = 12;
  const bubbleYOffset = - (charHeight / 2) - 60; // 向上偏移量，留出更多空間
  let bubbleW, bubbleH;

  // --- 繪製文字 ---
  textSize(16);
  textFont('Arial');
  textAlign(LEFT, TOP); // 文字對齊方式改為左上角

  let textContent = '';
  // 根據 content 的類型（是問題物件還是單純的回饋文字）來決定顯示內容
  if (typeof content === 'object' && content !== null && content.question) {
    // 如果是問題物件，格式化問題和選項
    textContent = `Q: ${content.question}\n\n`;
    textContent += `(A) ${content.options.a}\n`;
    textContent += `(B) ${content.options.b}\n`;
    textContent += `(C) ${content.options.c}\n`;
    textContent += `(D) ${content.options.d}`;
    
    // 手動計算包含換行符的文字寬高
    const lines = textContent.split('\n');
    let maxWidth = 0;
    for (const line of lines) {
      maxWidth = max(maxWidth, textWidth(line));
    }
    bubbleW = maxWidth + bubblePadding * 2;
    bubbleH = lines.length * 20 + bubblePadding * 2; // 假設行高為20
  } else {
    // 如果只是普通文字（回饋）
    textContent = content;
    bubbleW = textWidth(textContent) + bubblePadding * 2;
    bubbleH = 40 + bubblePadding;
  }
  
  // --- 計算對話框位置 ---
  const bubbleX = charPosition.x - bubbleW / 2;
  const bubbleY = charPosition.y + bubbleYOffset - bubbleH;

  // --- 繪製對話框 ---
  fill(255);
  stroke(0);
  strokeWeight(2);
  rect(bubbleX, bubbleY, bubbleW, bubbleH, 10); // 圓角矩形
  triangle(charPosition.x - arrowWidth / 2, bubbleY + bubbleH,
           charPosition.x + arrowWidth / 2, bubbleY + bubbleH,
           charPosition.x, bubbleY + bubbleH + arrowHeight);

  // --- 繪製文字 ---
  noStroke();
  fill(0);
  text(textContent, bubbleX + bubblePadding, bubbleY + bubblePadding);

  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 視窗大小改變時，重設角色位置
  charPos = { x: width / 2, y: height / 2 };
  // 重設新角色的固定位置
  char3Pos = { x: width / 2 - FRAME1_W - 50, y: height / 2 };
}

function keyPressed() {
  // 當按下空白鍵時
  if (key === ' ') {
    // 在螢幕最左邊和最右邊各產生一個煙火
    // 煙火的垂直位置隨機，使其更有趣
    let yPos = random(height * 0.2, height * 0.7); // 調整垂直位置範圍
    fireworks.push(new Firework(width * 0.2, yPos)); // 離左邊界 20% 寬度
    fireworks.push(new Firework(width * 0.8, yPos)); // 離右邊界 20% 寬度
  }

  // --- 新增：處理A,B,C,D答題 ---
  const choice = key.toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(choice)) {
    handleAnswerSubmit(choice);
  }
}

// ==================================
//  煙火特效的 Class (類別)
// ==================================

/**
 * 代表單一煙火爆炸的 Class
 */
class Firework {
  constructor(x, y) {
    this.particles = [];
    // 隨機產生一個鮮豔的顏色
    this.color = color(random(180, 255), random(180, 255), random(180, 255));
    this.explode(x, y);
  }

  // 在指定位置產生 120 個粒子來模擬爆炸
  explode(x, y) {
    for (let i = 0; i < 120; i++) {
      this.particles.push(new Particle(x, y, this.color));
    }
  }

  // 更新所有粒子的狀態
  update() {
    for (let particle of this.particles) {
      particle.update();
    }
  }

  // 繪製所有粒子
  show() {
    for (let particle of this.particles) {
      particle.show();
    }
  }

  // 如果所有粒子都消失了，則回傳 true
  done() {
    return this.particles.every(p => p.isDone());
  }
}

/**
 * 代表單一粒子的 Class
 */
class Particle {
  constructor(x, y, fireworkColor) {
    this.pos = createVector(x, y);
    // 讓粒子朝隨機方向以不同速度散開
    this.vel = p5.Vector.random2D().mult(random(1, 7));
    this.lifespan = 255; // 生命值，用來控制透明度
    this.color = fireworkColor;
    this.acc = createVector(0, 0.08); // 模擬重力
  }

  // 更新粒子的位置和生命值
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.lifespan -= 4;
  }

  // 繪製粒子
  show() {
    // 生命值越低，粒子越透明
    noStroke();
    fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.lifespan);
    ellipse(this.pos.x, this.pos.y, 6, 6); // 讓粒子更大更明顯
  }

  // 如果生命值耗盡，則回傳 true
  isDone() {
    return this.lifespan < 0;
  }
}