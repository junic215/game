const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'MOVE'; // MOVE, DROP, CLOSE, LIFT, RETRACT, RELEASE, CLEAR
let clearedCount = 0;
let uiMessage = "3人の おじさんを 全員ゲットせよ！";
let msgTimer = 0;

// クレーンの物理パラメータ
const claw = {
    x: 250,
    y: 60,
    minY: 60,
    maxY: 440, 
    speedX: 3.5,
    speedY: 4,
    angle: 0.4, 
    holding: null
};

// リアルなおじさんクラス
class Ojisan {
    constructor(name, x, y, color, type) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.width = 45; 
        this.height = 55;
        this.color = color;
        this.type = type; 
        this.vx = 0;
        this.vy = 0;
        this.isCaught = false;
        this.isScored = false; 
        this.timer = Math.random() * 100;
        this.isSleeping = false;
        this.walkDirection = 1;
    }

    update() {
        if (this.isCaught || this.isScored) return;

        this.vy += 0.4; 
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.85;

        // 床の高さ判定
        if (this.y > 450 - this.height) {
            this.y = 450 - this.height;
            this.vy = 0;
        }

        if (this.x < 90) { this.x = 90; this.vx *= -0.5; }
        if (this.x > 450) { this.x = 450; this.vx *= -0.5; }

        this.timer++;

        // --- マイルドなお邪魔AI ---
        if (this.type === 'shiraishi') {
            if (Math.sin(this.timer * 0.03) > 0.7) {
                this.isSleeping = true;
            } else {
                if (this.isSleeping) {
                    this.vy = -3; 
                }
                this.isSleeping = false;
            }
        }

        if (this.type === 'hajime') {
            if (Math.floor(this.timer) % 80 === 0) {
                this.walkDirection = Math.random() > 0.5 ? 1 : -1;
            }
            this.x += this.walkDirection * 0.8;
        }
    }

    draw() {
        if (this.isScored) return; 

        ctx.save();
        
        // 1. 体（スーツ）
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y + 30, this.width, this.height - 30);
        
        // ネクタイ
        ctx.fillStyle = "#ff2222";
        ctx.fillRect(this.x + this.width/2 - 3, this.y + 30, 6, 15);

        // 2. リアルな顔（グラデーション）
        let headX = this.x + 2;
        let headY = this.y;
        let headW = this.width - 4;
        let headH = 32;

        let skinGrad = ctx.createLinearGradient(headX, headY, headX + headW, headY + headH);
        skinGrad.addColorStop(0, "#fff0e5");
        skinGrad.addColorStop(0.5, "#ffcc99");
        skinGrad.addColorStop(1, "#dca470");
        ctx.fillStyle = skinGrad;
        ctx.fillRect(headX, headY, headW, headH);

        // 髪の毛の描写
        if (this.type === 'shiraishi') {
            ctx.fillStyle = "#555555";
            ctx.fillRect(headX, headY, 4, 20);
            ctx.fillRect(headX + headW - 4, headY, 4, 20);
            ctx.strokeStyle = "#666";
            ctx.lineWidth = 1;
            for(let i=0; i<5; i++) {
                ctx.beginPath();
                ctx.moveTo(headX + 4, headY + 2 + i*2);
                ctx.lineTo(headX + headW - 4, headY + 4 + i*1);
                ctx.stroke();
            }
        } else if (this.type === 'hajime') {
            let hairGrad = ctx.createLinearGradient(headX, headY, headX, headY + 8);
            hairGrad.addColorStop(0, "#bbb");
            hairGrad.addColorStop(1, "#444");
            ctx.fillStyle = hairGrad;
            ctx.fillRect(headX, headY, headW, 8);
        } else if (this.type === 'junichi') {
            ctx.fillStyle = "#111111";
            ctx.fillRect(headX - 2, headY - 6, headW + 4, 10);
            ctx.beginPath();
            ctx.moveTo(headX, headY + 4); ctx.lineTo(headX + headW/2, headY + 9); ctx.lineTo(headX + headW, headY + 4);
            ctx.fill();
        }

        // 目元・鼻・口のリアル表現
        let eyeY = headY + 14;
        ctx.fillStyle = "#fff";
        ctx.fillRect(headX + 8, eyeY, 6, 4);
        ctx.fillRect(headX + headW - 14, eyeY, 6, 4);
        
        ctx.fillStyle = "#221100";
        ctx.fillRect(headX + 9, eyeY + 1, 3, 3);
        ctx.fillRect(headX + headW - 12, eyeY + 1, 3, 3);

        // ほうれい線としわ
        ctx.strokeStyle = "#ba8058";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(headX + headW/2 - 8, headY + 18); ctx.lineTo(headX + headW/2 - 10, headY + 26);
        ctx.moveTo(headX + headW/2 + 8, headY + 18); ctx.lineTo(headX + headW/2 + 10, headY + 26);
        ctx.stroke();

        // 髭（じゅんいちのみ）
        if (this.type === 'junichi') {
            ctx.fillStyle = "#222";
            ctx.fillRect(headX + headW/2 - 12, headY + 23, 24, 5);
        }

        // 外枠
        ctx.strokeStyle = "#5a3a25";
        ctx.strokeRect(headX, headY, headW, headH);

        // 名前
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(this.name, this.x + this.width/2, this.y - 8);

        ctx.restore();
    }
}

const ojisans = [
    new Ojisan("白石", 140, 400, "#2255cc", 'shiraishi'),
    new Ojisan("はじめ", 250, 400, "#118833", 'hajime'),
    new Ojisan("じゅんいち", 360, 400, "#778811", 'junichi')
];

const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && gameState === 'MOVE') {
        gameState = 'DROP'; 
    }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function triggerMessage(text) {
    uiMessage = text;
    msgTimer = 90;
}

function update() {
    if (gameState === 'CLEAR') return;

    if (msgTimer > 0) {
        msgTimer--;
        if (msgTimer === 0) uiMessage = "狙いを定めてスペースキー！";
    }

    ojisans.forEach(o => o.update());

    if (clearedCount === 3) {
        gameState = 'CLEAR';
        uiMessage = "🎉 ゲームクリア！全員ゲット！ 🎉";
        return;
    }

    switch (gameState) {
        case 'MOVE':
            if (keys['ArrowLeft'] && claw.x > 100) claw.x -= claw.speedX;
            if (keys['ArrowRight'] && claw.x < 460) claw.x += claw.speedX;
            claw.angle = 0.4; 
            break;

        case 'DROP':
            claw.y += claw.speedY;
            let isHit = false;
            
            ojisans.forEach(o => {
                if (o.isScored) return;
                let diffX = Math.abs(claw.x - (o.x + o.width/2));
                let diffY = Math.abs((claw.y + 35) - o.y);
                if (diffX < 30 && diffY < 15) isHit = true;
            });

            if (claw.y >= claw.maxY || isHit) {
                gameState = 'CLOSE';
            }
            break;

        case 'CLOSE':
            claw.angle -= 0.05; 
            if (claw.angle <= -0.2) {
                ojisans.forEach(o => {
                    if (o.isScored) return;
                    let diffX = Math.abs(claw.x - (o.x + o.width/2));
                    let diffY = Math.abs((claw.y + 35) - (o.y + o.height/2));
                    
                    if (diffX < 45 && diffY < 45 && !claw.holding) {
                        claw.holding = o;
                        o.isCaught = true;
                        triggerMessage(`${o.name}おじさん をホールド！`);
                    }
                });
                gameState = 'LIFT';
            }
            break;

        case 'LIFT':
            let liftSpeed = (claw.holding && claw.holding.type === 'junichi') ? claw.speedY * 0.6 : claw.speedY;
            claw.y -= liftSpeed;
            
            if (claw.holding) {
                claw.holding.x = claw.x - claw.holding.width / 2;
                claw.holding.y = claw.y + 25; 
            }

            if (claw.y <= claw.minY) {
                claw.y = claw.minY;
                gameState = 'RETRACT';
            }
            break;

        case 'RETRACT':
            if (claw.x > 45) {
                claw.x -= claw.speedX;
                if (claw.holding) {
                    claw.holding.x = claw.x - claw.holding.width / 2;
                    claw.holding.y = claw.y + 25;
                }
            } else {
                gameState = 'RELEASE';
            }
            break;

        case 'RELEASE':
            claw.angle += 0.05; 
            if (claw.holding) {
                clearedCount++;
                claw.holding.isCaught = false;
                claw.holding.isScored = true; 
                triggerMessage(`${claw.holding.name}を 穴に落とした！残り ${3 - clearedCount}人`);
                claw.holding = null;
            }

            if (claw.angle >= 0.4) {
                gameState = 'MOVE';
            }
            break;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 落とし口
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 420, 80, 80);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 420, 80, 80);
    ctx.fillStyle = '#888';
    ctx.fillRect(78, 380, 6, 70);

    // 地面
    ctx.fillStyle = '#444';
    ctx.fillRect(84, 450, 416, 50);

    // おじさんたち
    ojisans.forEach(o => o.draw());

    // アーム
    ctx.save();
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 45, 500, 15);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(claw.x, 55);
    ctx.lineTo(claw.x, claw.y);
    ctx.stroke();

    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(claw.x - 16, claw.y - 12, 32, 16);

    // 爪
    ctx.save(); ctx.translate(claw.x - 10, claw.y + 4); ctx.rotate(claw.angle);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-18, 22); ctx.lineTo(4, 36); ctx.stroke(); ctx.restore();

    ctx.save(); ctx.translate(claw.x + 10, claw.y + 4); ctx.rotate(-claw.angle);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 22); ctx.lineTo(-4, 36); ctx.stroke(); ctx.restore();
    ctx.restore();

    // UI
    ctx.fillStyle = '#5f5';
    ctx.font = "bold 18px monospace";
    ctx.fillText(`GET: ${clearedCount} / 3`, 15, 30);

    ctx.fillStyle = '#fff';
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(uiMessage, 280, 28);

    // クリア画面表示
    if (gameState === 'CLEAR') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ff0';
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME CLEAR!!", 250, 230);
        
        ctx.fillStyle = '#fff';
        ctx.font = "18px sans-serif";
        ctx.fillText("おじさんたちを コンプリートした！", 250, 280);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();