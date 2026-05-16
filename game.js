const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// We don't want any anti-aliasing for the pixel look
ctx.imageSmoothingEnabled = false;

// Game state
let lastTime = 0;
const gravity = 0.6;
const friction = 0.8;
const playerSpeed = 5;
const jumpForce = -12;

// Player
const player = {
    x: 50,
    y: 200,
    width: 32,
    height: 32,
    vx: 0,
    vy: 0,
    isJumping: true,
    facingRight: true,
    isAttacking: false,
    attackTimer: 0,
    score: 0
};

// Platforms (ground and blocks)
const platforms = [
    { x: 0, y: 368, width: 800, height: 32, type: 'ground' },
    { x: 200, y: 280, width: 96, height: 32, type: 'block' },
    { x: 400, y: 200, width: 96, height: 32, type: 'block' },
    { x: 600, y: 280, width: 96, height: 32, type: 'block' }
];

// Enemies
let enemies = [
    { x: 300, y: 336, width: 32, height: 32, vx: -1.5, isDead: false },
    { x: 650, y: 336, width: 32, height: 32, vx: 1.5, isDead: false },
    { x: 420, y: 168, width: 32, height: 32, vx: -1, isDead: false }
];

// Input state
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
    z: false
};

const fullscreenBtn = document.getElementById('fullscreenBtn');
const gameWrapper = document.getElementById('gameWrapper');

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        if (gameWrapper.requestFullscreen) {
            gameWrapper.requestFullscreen();
        } else if (gameWrapper.webkitRequestFullscreen) { /* Safari */
            gameWrapper.webkitRequestFullscreen();
        } else if (gameWrapper.msRequestFullscreen) { /* IE11 */
            gameWrapper.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    }
});

// Update button text based on fullscreen state
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        fullscreenBtn.textContent = '元に戻す';
    } else {
        fullscreenBtn.textContent = '全画面表示';
    }
});

// Event listeners for keyboard fallback
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key) || e.key === ' ') {
        if(e.key === ' ') keys.Space = true;
        else if(e.key.toLowerCase() === 'z') keys.z = true;
        else keys[e.key] = true;
        if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)){
            e.preventDefault(); // Prevent scrolling when playing
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key) || e.key === ' ') {
        if(e.key === ' ') keys.Space = false;
        else if(e.key.toLowerCase() === 'z') keys.z = false;
        else keys[e.key] = false;
    }
});

let prevGamepadState = { A: false, X: false };

function getGamepadInput() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
    if (!gamepads) {
      return;
    }

    const gp = gamepads[0];
    if (gp) {
        // Stick or D-pad
        const leftRight = gp.axes[0]; // -1 to 1
        const dpadLeft = gp.buttons[14] && gp.buttons[14].pressed;
        const dpadRight = gp.buttons[15] && gp.buttons[15].pressed;

        keys.ArrowLeft = leftRight < -0.5 || dpadLeft;
        keys.ArrowRight = leftRight > 0.5 || dpadRight;

        // Jump (A button, usually index 0)
        const aPressed = gp.buttons[0] && gp.buttons[0].pressed;
        if(aPressed && !prevGamepadState.A && !player.isJumping) {
            player.vy = jumpForce;
            player.isJumping = true;
        }
        prevGamepadState.A = aPressed;

        // Attack (X or B button, usually index 2 or 1)
        const xPressed = (gp.buttons[2] && gp.buttons[2].pressed) || (gp.buttons[1] && gp.buttons[1].pressed);
        if(xPressed && !prevGamepadState.X && !player.isAttacking) {
            player.isAttacking = true;
            player.attackTimer = 15; // Attack lasts for 15 frames
        }
        prevGamepadState.X = xPressed;
    }
}

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function update() {
    getGamepadInput();

    // Horizontal movement
    if (keys.ArrowLeft) {
        player.vx -= 1.5;
        player.facingRight = false;
    }
    if (keys.ArrowRight) {
        player.vx += 1.5;
        player.facingRight = true;
    }

    // Keyboard Jump
    if (keys.Space && !player.isJumping) {
        player.vy = jumpForce;
        player.isJumping = true;
    }
    
    // Keyboard Attack
    if (keys.z && !player.isAttacking) {
        player.isAttacking = true;
        player.attackTimer = 15;
    }

    // Apply physics
    player.vx *= friction;
    player.vy += gravity;

    // Limit speed
    if (player.vx > playerSpeed) player.vx = playerSpeed;
    if (player.vx < -playerSpeed) player.vx = -playerSpeed;

    player.x += player.vx;
    
    // X collision with platforms
    platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            if (player.vx > 0) { // Moving right
                player.x = platform.x - player.width;
                player.vx = 0;
            } else if (player.vx < 0) { // Moving left
                player.x = platform.x + platform.width;
                player.vx = 0;
            }
        }
    });

    player.y += player.vy;
    player.isJumping = true; // Assume jumping until hit floor

    // Y collision with platforms
    platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            if (player.vy > 0) { // Falling
                player.y = platform.y - player.height;
                player.vy = 0;
                player.isJumping = false;
            } else if (player.vy < 0) { // Jumping up hitting ceiling
                player.y = platform.y + platform.height;
                player.vy = 0;
            }
        }
    });

    // Screen bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Pit fall
    if (player.y > canvas.height) {
        resetPlayer();
    }

    // Attack logic
    if (player.isAttacking) {
        player.attackTimer--;
        if (player.attackTimer <= 0) {
            player.isAttacking = false;
        }
        
        // Check enemy hit
        const attackBox = {
            x: player.facingRight ? player.x + player.width : player.x - 24,
            y: player.y + 8,
            width: 24,
            height: 16
        };

        enemies.forEach(enemy => {
            if (!enemy.isDead && checkCollision(attackBox, enemy)) {
                enemy.isDead = true;
                player.score += 100;
            }
        });
    }

    // Update enemies
    enemies.forEach(enemy => {
        if (enemy.isDead) return;
        
        enemy.x += enemy.vx;
        // Simple enemy patrol
        if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
            enemy.vx *= -1;
        }
        
        // Enemy platform collision reverse (simple edge detection)
        let onPlatform = false;
        platforms.forEach(platform => {
            if(enemy.y + enemy.height === platform.y && enemy.x + enemy.width > platform.x && enemy.x < platform.x + platform.width) {
               onPlatform = true;
            }
        });
        
        // Reverse if hitting a wall (block)
        platforms.forEach(platform => {
            if (platform.type === 'block') {
                if (checkCollision(enemy, platform)) {
                    enemy.vx *= -1;
                }
            }
        });
        
        // Player collision with enemy
        if (checkCollision(player, enemy)) {
            // Player gets hit
            resetPlayer();
        }
    });

    // Respawn enemies if all dead
    if (enemies.every(e => e.isDead)) {
        enemies = [
            { x: 300, y: 336, width: 32, height: 32, vx: -1.5, isDead: false },
            { x: 650, y: 336, width: 32, height: 32, vx: 1.5, isDead: false },
            { x: 420, y: 168, width: 32, height: 32, vx: -1, isDead: false }
        ];
    }
}

function resetPlayer() {
    player.x = 50;
    player.y = 200;
    player.vx = 0;
    player.vy = 0;
    player.score = Math.max(0, player.score - 50); // Penalty
}

function drawPixelHero(ctx, x, y, width, height, isAttacking, facingRight) {
    ctx.save();
    ctx.translate(x, y);
    if (!facingRight) {
        ctx.scale(-1, 1);
        ctx.translate(-width, 0);
    }
    
    // Scale up pixel art by 2
    ctx.scale(2, 2);

    // Body (red overalls)
    ctx.fillStyle = '#f00';
    ctx.fillRect(4, 8, 8, 6);
    
    // Shirt (blue)
    ctx.fillStyle = '#00f';
    ctx.fillRect(5, 5, 6, 3);
    
    // Head (skin)
    ctx.fillStyle = '#fca';
    ctx.fillRect(4, 0, 8, 5);
    
    // Hat (red)
    ctx.fillStyle = '#f00';
    ctx.fillRect(3, -1, 9, 2);
    
    // Eye
    ctx.fillStyle = '#000';
    ctx.fillRect(9, 1, 1, 1);

    // Legs
    ctx.fillStyle = '#00f';
    ctx.fillRect(4, 14, 3, 2);
    ctx.fillRect(9, 14, 3, 2);
    
    // Shoes
    ctx.fillStyle = '#840';
    ctx.fillRect(3, 15, 4, 1);
    ctx.fillRect(9, 15, 4, 1);

    // Attack punch effect
    if (isAttacking) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(12, 6, 6, 4);
        ctx.fillStyle = '#ff0';
        ctx.fillRect(13, 7, 4, 2);
    }

    ctx.restore();
}

function drawEnemy(ctx, x, y, width, height) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(2, 2);

    // Goomba-like Mushroom
    ctx.fillStyle = '#840'; // Brown
    ctx.fillRect(2, 8, 12, 8); // Body
    
    // Head
    ctx.fillRect(0, 3, 16, 5);
    
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(3, 5, 2, 2);
    ctx.fillRect(11, 5, 2, 2);
    
    ctx.fillStyle = '#000';
    ctx.fillRect(4, 6, 1, 1);
    ctx.fillRect(11, 6, 1, 1);
    
    // Feet
    ctx.fillStyle = '#000';
    ctx.fillRect(1, 15, 4, 1);
    ctx.fillRect(11, 15, 4, 1);

    ctx.restore();
}

function draw() {
    // Clear canvas (Sky)
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds/decorations
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(100, 50, 60, 20);
    ctx.fillRect(120, 30, 40, 20);
    
    ctx.fillRect(400, 80, 80, 25);
    ctx.fillRect(420, 60, 50, 20);
    
    ctx.fillRect(650, 40, 50, 15);

    // Draw platforms
    platforms.forEach(platform => {
        if (platform.type === 'ground') {
            ctx.fillStyle = '#c84c0c'; // Brick red
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            // Draw brick pattern
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            for(let i = platform.x; i < platform.x + platform.width; i+= 32) {
                ctx.strokeRect(i, platform.y, 32, 32);
            }
        } else {
            ctx.fillStyle = '#e89040'; // Block color
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            // block rivets
            ctx.fillStyle = '#000000';
            ctx.fillRect(platform.x + 4, platform.y + 4, 4, 4);
            ctx.fillRect(platform.x + platform.width - 8, platform.y + 4, 4, 4);
            ctx.fillRect(platform.x + 4, platform.y + platform.height - 8, 4, 4);
            ctx.fillRect(platform.x + platform.width - 8, platform.y + platform.height - 8, 4, 4);
        }
    });

    // Draw enemies
    enemies.forEach(enemy => {
        if (!enemy.isDead) {
            drawEnemy(ctx, enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });

    // Draw player
    drawPixelHero(ctx, player.x, player.y, player.width, player.height, player.isAttacking, player.facingRight);
    
    // Draw UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText("SCORE:" + player.score.toString().padStart(4, '0'), 20, 40);

    // Draw gamepad connection status
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
    const isGamepadConnected = gamepads[0] !== null && gamepads[0] !== undefined;
    
    ctx.font = '16px "DotGothic16", monospace';
    ctx.textAlign = 'right';
    if (isGamepadConnected) {
        ctx.fillStyle = '#0f0';
        ctx.fillText("🎮 Gamepad: Connected", canvas.width - 20, 30);
    } else {
        ctx.fillStyle = '#ff0';
        ctx.fillText("⌨️ Keyboard Mode", canvas.width - 20, 30);
    }
    ctx.textAlign = 'left';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function gameLoop(timestamp) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
requestAnimationFrame(gameLoop);
