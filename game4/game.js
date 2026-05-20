// ==========================================
// HIP HOCKEY - Full Body & Input Guard Edition
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false; 

// --- ゲームの状態管理 ---
let gameState = 'TITLE'; 
let gameMode = 'CPU'; 
let gameTime = 60; 
let timerInterval = null;
let resultTimer = 0; // リザルト画面の誤操作防止タイマー（ミリ秒）

// --- キー入力管理 ---
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });

// --- 矩形描画ヘルパー ---
function drawPixelRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// --- オブジェクト定義 ---
class Player {
    constructor(x, y, isLeft, controls) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.width = 64;  
        this.height = 64;
        this.speed = 5;
        this.isLeft = isLeft;
        this.controls = controls;
        this.score = 0;
        
        // スタミナ
        this.maxStamina = 100;
        this.stamina = 100;
        
        // おならゲージ（タイミングバー）
        this.gaugeValue = 0;
        this.gaugeDirection = 1;
        this.gaugeSpeed = 0.06; 
        this.isFarting = false;
        this.fartAnimFrame = 0;
        this.fartCount = 0;
    }

    resetPosition() {
        this.x = this.startX;
        this.y = this.startY;
        this.stamina = this.maxStamina;
        this.isFarting = false;
    }

    update() {
        if (this.stamina < this.maxStamina) {
            this.stamina = Math.min(this.maxStamina, this.stamina + 0.4);
        }

        this.gaugeValue += this.gaugeSpeed * this.gaugeDirection;
        if (this.gaugeValue > 1 || this.gaugeValue < 0) {
            this.gaugeDirection *= -1;
        }

        if (this.isFarting) {
            this.fartAnimFrame--;
            if (this.fartAnimFrame <= 0) this.isFarting = false;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (!this.isLeft) ctx.scale(-1, 1);

        // カラーパレット
        const skinShadow = '#C07040';    // 深い影（割れ目・下部）
        const skinBase   = '#E09860';    // 肌ベース
        const skinLight  = '#F8C898';    // 明るい肌
        const skinHighlight = '#FFF0D0'; // ハイライト
        const hairColor  = '#402010';    // 髪の毛（茶髪）
        const shirtColor = this.isLeft ? '#F85878' : '#68A0F8'; // 服（赤 / 青）

        // おなら中のアニメーション：お尻と体がブルブル震える
        let vibeX = 0;
        let vibeY = 0;
        let buttSpread = 0; 
        if (this.isFarting) {
            vibeX = (Math.random() - 0.5) * 6;
            vibeY = (Math.random() - 0.5) * 6;
            buttSpread = Math.sin(this.fartAnimFrame) * 4 + 4; 
        }

        // --- 1. 頭（前屈みでこちらに背中を向けているので、やや下寄りに配置） ---
        let headX = -44 + vibeX;
        let headY = -8 + vibeY;
        drawPixelRect(headX, headY, 16, 16, skinBase);      // 顔の後ろ側
        drawPixelRect(headX - 2, headY - 4, 20, 8, hairColor); // 髪の毛（トップ）
        drawPixelRect(headX - 4, headY, 6, 12, hairColor);   // 後頭部

        // --- 2. 上半身 / 胴体（前屈みで背中が見えている状態） ---
        let bodyX = -36 + vibeX;
        let bodyY = -16 + vibeY;
        drawPixelRect(bodyX, bodyY, 22, 28, shirtColor); // 背中

        // --- 3. 手（床に手をついてお尻を突き出すポーズ） ---
        drawPixelRect(headX + 4, headY + 24, 6, 14, shirtColor); // 腕
        drawPixelRect(headX + 2, headY + 36, 8, 6, skinShadow);  // 手

        // --- 4. パンツ（お尻に食い込むライン） ---
        const pantsColor = this.isLeft ? '#D02000' : '#0040D0';
        const pantsShadow = this.isLeft ? '#800000' : '#002080';
        drawPixelRect(-18 + vibeX, -24, 6, 48, pantsColor);
        drawPixelRect(-18 + vibeX, -12, 8, 24, pantsShadow); 
        drawPixelRect(-18 + vibeX, -4, 10, 8, pantsColor);

        // --- 5. 左半分の頬（上側のお尻） ---
        let topButtY = -24 + vibeY - (buttSpread / 2);
        drawPixelRect(-14 + vibeX, topButtY, 30, 24, skinShadow); 
        drawPixelRect(-10 + vibeX, topButtY + 2, 24, 20, skinBase);  
        drawPixelRect(-6 + vibeX,  topButtY + 4, 18, 14, skinLight); 
        drawPixelRect(0 + vibeX,   topButtY + 6, 10, 8,  skinHighlight); 

        // --- 6. 右半分の頬（下側のお尻） ---
        let bottomButtY = 0 + vibeY + (buttSpread / 2);
        drawPixelRect(-14 + vibeX, bottomButtY, 30, 24, skinShadow); 
        drawPixelRect(-10 + vibeX, bottomButtY + 2, 24, 20, skinBase);  
        drawPixelRect(-6 + vibeX,  bottomButtY + 4, 18, 14, skinLight); 
        drawPixelRect(0 + vibeX,   bottomButtY + 6, 10, 8,  skinHighlight); 

        // --- 7. 割れ目の深い陰影 ---
        drawPixelRect(-12 + vibeX, -4 + vibeY, 16, 8, skinShadow);
        drawPixelRect(-6 + vibeX, -2 + vibeY, 12, 4, '#803010'); 

        // --- おならエフェクト ---
        if (this.isFarting) {
            const gasColor1 = '#98E018'; 
            const gasColor2 = '#D8F878'; 
            const flash = (this.fartAnimFrame % 4 < 2);
            
            drawPixelRect(16 + vibeX, -14, 16, 16, flash ? gasColor1 : gasColor2);
            drawPixelRect(28 + vibeX, -22, 20, 20, flash ? gasColor2 : gasColor1);
            drawPixelRect(36 + vibeX, -2, 24, 16, gasColor1);
            drawPixelRect(48 + vibeX, -10, 12, 12, gasColor2);
        }
        ctx.restore();

        this.drawUI();
    }

    drawUI() {
        const barW = 60;
        const barH = 6;
        const bx = this.x - barW / 2;
        const by = this.y - 42;

        // スタミナ
        drawPixelRect(bx, by + 8, barW, barH, '#000000');
        const stColor = this.stamina < 25 ? '#F83800' : '#00A800';
        drawPixelRect(bx, by + 8, barW * (this.stamina / this.maxStamina), barH, stColor);

        // おならタイミング
        drawPixelRect(bx, by, barW, barH, '#505050');
        drawPixelRect(bx + barW * 0.4, by, barW * 0.2, barH, '#F8F800');
        drawPixelRect(bx + (barW * this.gaugeValue) - 2, by - 2, 4, barH + 4, '#F8F8F8');
    }

    triggerFart() {
        if (this.stamina < 25 || this.isFarting) return null;

        this.stamina -= 25;
        this.isFarting = true;
        this.fartAnimFrame = 20; 
        this.fartCount++;

        const accuracy = Math.abs(this.gaugeValue - 0.5);
        let power = 4; 
        if (accuracy < 0.08) {
            power = 15; 
        } else if (accuracy < 0.2) {
            power = 9;  
        }

        let spawnNewPoop = false;
        if (this.fartCount % 5 === 0) {
            spawnNewPoop = true;
        }

        return { power, spawnNewPoop };
    }
}

class Poop {
    constructor(x, y, isBonus = false) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.size = isBonus ? 20 : 28;
        this.isBonus = isBonus;
        this.isDead = false; 
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        this.vx *= 0.996;
        this.vy *= 0.996;

        const half = this.size / 2;

        if (this.y - half < 50) {
            this.y = 50 + half;
            this.vy *= -1;
        }
        if (this.y + half > canvas.height) {
            this.y = canvas.height - half;
            this.vy *= -1;
        }

        if (this.y < 150 || this.y > 350) {
            if (this.x - half < 0) {
                this.x = half;
                this.vx *= -1;
            }
            if (this.x + half > canvas.width) {
                this.x = canvas.width - half;
                this.vx *= -1;
            }
        }
    }

    draw() {
        const h = this.size / 2;
        const mainColor = this.isBonus ? '#F8B800' : '#B85800';
        const darkColor = this.isBonus ? '#AC7C00' : '#682800';

        drawPixelRect(this.x - h, this.y + h - 8, this.size, 8, darkColor);
        drawPixelRect(this.x - h + 2, this.y + h - 10, this.size - 4, 4, mainColor);
        drawPixelRect(this.x - h + 4, this.y - 4, this.size - 8, 8, darkColor);
        drawPixelRect(this.x - h + 6, this.y - 6, this.size - 12, 4, mainColor);
        drawPixelRect(this.x - 4, this.y - h, 8, 6, mainColor);
    }
}

// --- 初期化 ---
const p1 = new Player(160, 250, true, { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', fart: 'Enter' });
const p2 = new Player(640, 250, false, { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', fart: 'Space' });
let poops = [];
let flashGoalLeft = false;
let flashGoalRight = false;
let flashTimerLeft = 0;
let flashTimerRight = 0;

function initGame() {
    p1.score = 0;
    p2.score = 0;
    p1.resetPosition();
    p2.resetPosition();
    poops = [new Poop(canvas.width / 2, (canvas.height + 50) / 2)];
    gameTime = 60;
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameState === 'GAME') {
            gameTime--;
            if (gameTime <= 0) {
                gameState = 'RESULT';
                resultTimer = Date.now(); // リザルト開始時間を記録
                clearInterval(timerInterval);
            }
        }
    }, 1000);
}

function applyFartWind(player, fResult) {
    if (!fResult) return;
    
    poops.forEach(poop => {
        const dx = poop.x - player.x;
        const dy = poop.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 170) {
            const angle = Math.atan2(dy, dx);
            const force = (170 - distance) / 170 * fResult.power;
            poop.vx += Math.cos(angle) * force;
            poop.vy += Math.sin(angle) * force;
        }
    });

    if (fResult.spawnNewPoop) {
        const spawnX = player.x + (player.isLeft ? 35 : -35);
        const newPoop = new Poop(spawnX, player.y, true);
        newPoop.vx = player.isLeft ? 6 : -6;
        poops.push(newPoop);
    }
}

function handleCollisions() {
    const pdx = p2.x - p1.x;
    const pdy = p2.y - p1.y;
    const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
    if (pDist < 54) { 
        const overlap = 54 - pDist;
        const angle = Math.atan2(pdy, pdx);
        p1.x -= Math.cos(angle) * overlap / 2;
        p1.y -= Math.sin(angle) * overlap / 2;
        p2.x += Math.cos(angle) * overlap / 2;
        p2.y += Math.sin(angle) * overlap / 2;
    }

    [p1, p2].forEach(p => {
        poops.forEach(poop => {
            const dx = poop.x - p.x;
            const dy = poop.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = 26 + (poop.size / 2);
            if (dist < minDist) {
                const angle = Math.atan2(dy, dx);
                const overlap = minDist - dist;
                poop.x += Math.cos(angle) * overlap;
                poop.y += Math.sin(angle) * overlap;
                poop.vx = Math.cos(angle) * (Math.abs(poop.vx) + 2.5);
                poop.vy = Math.sin(angle) * (Math.abs(poop.vy) + 2.5);
            }
        });
    });
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

function update() {
    if (gameState === 'TITLE') {
        if (keys['ArrowUp'] || keys['KeyW']) gameMode = 'CPU';
        if (keys['ArrowDown'] || keys['KeyS']) gameMode = '2P';
        if (keys['Enter'] || keys['Space']) {
            gameState = 'GAME';
            initGame();
            keys['Enter'] = false; keys['Space'] = false;
        }
    } 
    else if (gameState === 'GAME') {
        if (keys[p1.controls.up]) p1.y -= p1.speed;
        if (keys[p1.controls.down]) p1.y += p1.speed;
        if (keys[p1.controls.left]) p1.x -= p1.speed;
        if (keys[p1.controls.right]) p1.x += p1.speed;
        if (keys[p1.controls.fart]) applyFartWind(p1, p1.triggerFart());

        if (gameMode === '2P') {
            if (keys[p2.controls.up]) p2.y -= p2.speed;
            if (keys[p2.controls.down]) p2.y += p2.speed;
            if (keys[p2.controls.left]) p2.x -= p2.speed;
            if (keys[p2.controls.right]) p2.x += p2.speed;
            if (keys[p2.controls.fart]) applyFartWind(p2, p2.triggerFart());
        } else {
            if (poops.length > 0) {
                let targetPoop = poops[0];
                let minDist = 9999;
                poops.forEach(poop => {
                    let d = Math.sqrt((poop.x - p2.x)**2 + (poop.y - p2.y)**2);
                    if (d < minDist) { minDist = d; targetPoop = poop; }
                });

                if (p2.y < targetPoop.y - 12) p2.y += p2.speed * 0.75;
                if (p2.y > targetPoop.y + 12) p2.y -= p2.speed * 0.75;
                if (p2.x < targetPoop.x + 90 && p2.x > 480) p2.x -= p2.speed * 0.7;
                if (p2.x < 660 && p2.x < targetPoop.x + 60) p2.x += p2.speed * 0.7;

                if (minDist < 140 && Math.random() < 0.06) {
                    applyFartWind(p2, p2.triggerFart());
                }
            }
        }

        p1.x = Math.max(32, Math.min(canvas.width / 2 - 30, p1.x));
        p1.y = Math.max(50 + 32, Math.min(canvas.height - 32, p1.y));
        p2.x = Math.max(canvas.width / 2 + 30, Math.min(canvas.width - 32, p2.x));
        p2.y = Math.max(50 + 32, Math.min(canvas.height - 32, p2.y));

        p1.update();
        p2.update();

        if (flashTimerLeft > 0) flashTimerLeft--; else flashGoalLeft = false;
        if (flashTimerRight > 0) flashTimerRight--; else flashGoalRight = false;

        for (let i = poops.length - 1; i >= 0; i--) {
            let poop = poops[i];
            poop.update();

            if (poop.y > 150 && poop.y < 350) {
                if (poop.x < 0) {
                    p2.score++;
                    poop.isDead = true;
                    flashGoalLeft = true;
                    flashTimerLeft = 30;
                }
                else if (poop.x > canvas.width) {
                    p1.score++;
                    poop.isDead = true;
                    flashGoalRight = true;
                    flashTimerRight = 30;
                }
            }
        }

        poops = poops.filter(p => !p.isDead);

        const currentBasePoopCount = poops.filter(p => !p.isBonus).length;
        if (currentBasePoopCount === 0) {
            poops.push(new Poop(canvas.width / 2, (canvas.height + 50) / 2));
        }

        handleCollisions();
    } 
    else if (gameState === 'RESULT') {
        // 終了直後の誤操作防止：1500ミリ秒（1.5秒）経過するまでは入力を完全に無視する
        if (Date.now() - resultTimer > 1500) {
            if (keys['Enter'] || keys['Space']) {
                gameState = 'TITLE';
                keys['Enter'] = false; keys['Space'] = false;
            }
        } else {
            // タイマー時間内は、その間に押されたEnterやSpaceのフラグをリセットしておく（先行入力リセット）
            keys['Enter'] = false;
            keys['Space'] = false;
        }
    }
}

function draw() {
    drawPixelRect(0, 0, canvas.width, canvas.height, '#000000');
    drawPixelRect(0, 50, canvas.width, canvas.height - 50, '#00A800');

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.moveTo(canvas.width / 2, 50); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.arc(canvas.width / 2, (canvas.height + 50)/2, 60, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);

    const frameCount = Math.floor(Date.now() / 150);
    
    let leftGoalColor = (frameCount % 2 === 0) ? '#F83800' : '#F8B800';
    if (flashGoalLeft) leftGoalColor = (flashTimerLeft % 2 === 0) ? '#F8F8F8' : '#F83800';
    drawPixelRect(0, 150, 12, 200, leftGoalColor);
    
    let rightGoalColor = (frameCount % 2 === 0) ? '#0058F8' : '#3CBCFC';
    if (flashGoalRight) rightGoalColor = (flashTimerRight % 2 === 0) ? '#F8F8F8' : '#0058F8';
    drawPixelRect(canvas.width - 12, 150, 12, 200, rightGoalColor);

    ctx.font = 'bold 16px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillStyle = leftGoalColor;
    ctx.fillText("G", 22, 210); ctx.fillText("O", 22, 240); ctx.fillText("A", 22, 270); ctx.fillText("L", 22, 300);
    ctx.fillStyle = rightGoalColor;
    ctx.fillText("G", canvas.width - 22, 210); ctx.fillText("O", canvas.width - 22, 240); ctx.fillText("A", canvas.width - 22, 270); ctx.fillText("L", canvas.width - 22, 300);

    if (gameState === 'GAME') {
        p1.draw();
        p2.draw();
        poops.forEach(poop => poop.draw());

        drawPixelRect(0, 0, canvas.width, 50, '#000000');
        ctx.fillStyle = '#F8F8F8';
        ctx.font = '24px "Courier New"';
        
        ctx.textAlign = 'left';
        ctx.fillText(`P1:${p1.score.toString().padStart(2, '0')}`, 30, 35);
        
        ctx.textAlign = 'right';
        ctx.fillText(`P2:${p2.score.toString().padStart(2, '0')}`, canvas.width - 30, 35);

        ctx.textAlign = 'center';
        ctx.fillStyle = gameTime <= 10 ? '#F83800' : '#F8F8F8';
        ctx.fillText(`TIME:${gameTime.toString().padStart(2, '0')}`, canvas.width / 2, 35);
    } 
    else if (gameState === 'TITLE') {
        drawPixelRect(0, 0, canvas.width, canvas.height, '#000000');

        ctx.textAlign = 'center';
        ctx.fillStyle = '#F8B800';
        ctx.font = 'bold 44px "Courier New"';
        ctx.fillText('HIP HOCKEY 8-BIT', canvas.width / 2, 160);
        
        ctx.font = '16px "Courier New"';
        ctx.fillStyle = '#F8F8F8';
        ctx.fillText('~ FART & POOP BATTLE ~', canvas.width / 2, 205);

        ctx.font = '24px "Courier New"';
        ctx.fillStyle = (gameMode === 'CPU') ? '#F8F8F8' : '#808080';
        ctx.fillText((gameMode === 'CPU' ? '-> ' : '   ') + '1P VS CPU', canvas.width / 2, 300);
        
        ctx.fillStyle = (gameMode === '2P') ? '#F8F8F8' : '#808080';
        ctx.fillText((gameMode === '2P' ? '-> ' : '   ') + '2P VS 2P', canvas.width / 2, 350);

        ctx.font = '14px "Courier New"';
        ctx.fillStyle = '#BCBCBC';
        ctx.fillText('SELECT: UP/DOWN KEYS | START: ENTER or SPACE', canvas.width / 2, 440);
    } 
    else if (gameState === 'RESULT') {
        drawPixelRect(0, 0, canvas.width, canvas.height, 'rgba(0,0,0,0.85)');

        ctx.textAlign = 'center';
        ctx.fillStyle = '#F83800';
        ctx.font = 'bold 40px "Courier New"';
        ctx.fillText('TIME UP!', canvas.width / 2, 150);

        let winText = 'DRAW GAME';
        if (p1.score > p2.score) winText = '1P PLAYER WIN!';
        else if (p2.score > p1.score) winText = (gameMode === 'CPU') ? 'CPU WIN!' : '2P PLAYER WIN!';

        ctx.fillStyle = '#F8B800';
        ctx.font = '28px "Courier New"';
        ctx.fillText(winText, canvas.width / 2, 240);

        ctx.fillStyle = '#F8F8F8';
        ctx.font = '22px "Courier New"';
        ctx.fillText(`TOTAL SCORE: ${p1.score} - ${p2.score}`, canvas.width / 2, 300);

        ctx.font = '16px "Courier New"';
        ctx.fillStyle = '#BCBCBC';
        
        // 1.5秒経過するまでは案内テキストを変える演出
        if (Date.now() - resultTimer > 1500) {
            ctx.fillText('PRESS ENTER OR SPACE TO TITLE', canvas.width / 2, 400);
        } else {
            ctx.fillText('--- PLEASE WAIT ---', canvas.width / 2, 400);
        }
    }
}

loop();