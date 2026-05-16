// daisuketchi.js
const dCanvas = document.getElementById('daisuketchiCanvas');
const dCtx = dCanvas.getContext('2d');
dCtx.imageSmoothingEnabled = false;

let ojisan = {
    hunger: 50,
    happiness: 50,
    state: 'idle', // idle, eating, playing
    stateTimer: 0,
    frame: 0,
    x: 100,
    y: 120
};

// UI Buttons (Touch and Click)
document.getElementById('btnFeed').addEventListener('click', (e) => {
    e.preventDefault();
    ojisan.hunger = Math.min(100, ojisan.hunger + 20);
    ojisan.state = 'eating';
    ojisan.stateTimer = 60; // frames
});

document.getElementById('btnPlay').addEventListener('click', (e) => {
    e.preventDefault();
    ojisan.happiness = Math.min(100, ojisan.happiness + 20);
    ojisan.state = 'playing';
    ojisan.stateTimer = 60;
});

// decrease stats over time (every 3 seconds)
setInterval(() => {
    if (ojisan.hunger > 0) ojisan.hunger -= 2;
    if (ojisan.happiness > 0) ojisan.happiness -= 2;
}, 3000);

function drawOjisan(x, y) {
    dCtx.save();
    dCtx.translate(x, y);
    dCtx.scale(6, 6); // pixel scale for 200x200 canvas
    
    // Animate
    if (ojisan.state === 'idle') {
        ojisan.frame = Math.floor(Date.now() / 600) % 2;
    } else {
        ojisan.frame = Math.floor(Date.now() / 200) % 2;
    }
    
    const yOffset = ojisan.frame === 0 ? 0 : 1;
    dCtx.translate(-8, -12 + yOffset);
    
    // Shadow
    dCtx.fillStyle = 'rgba(17, 51, 17, 0.2)'; // Dark LCD green shadow
    dCtx.fillRect(2, 20 - yOffset, 12, 2);

    // Head/Skin (Using LCD monochrome palette: darkest #113311, dark #306230, light #8bac0f, lightest #9bcc9b is bg)
    dCtx.fillStyle = '#306230'; // Mid-tone for skin
    dCtx.fillRect(4, 0, 8, 8);
    
    // Hair (comb-over)
    dCtx.fillStyle = '#113311';
    dCtx.fillRect(4, 0, 8, 1);
    dCtx.fillRect(3, 1, 1, 3);
    dCtx.fillRect(12, 1, 1, 3);
    dCtx.fillRect(4, 1, 2, 1); // some strands
    
    // Mustache
    dCtx.fillRect(5, 5, 6, 1);
    
    // Eyes
    dCtx.fillStyle = '#113311';
    if (ojisan.hunger < 30 || ojisan.happiness < 30) {
        // sad eyes
        dCtx.fillRect(4, 2, 2, 1);
        dCtx.fillRect(10, 2, 2, 1);
    } else if (ojisan.state === 'playing' || ojisan.state === 'eating') {
        // happy eyes (closed)
        dCtx.fillRect(5, 3, 2, 1);
        dCtx.fillRect(9, 3, 2, 1);
    } else {
        // normal eyes
        dCtx.fillRect(5, 3, 1, 1);
        dCtx.fillRect(10, 3, 1, 1);
    }

    // Body (Shirt & Tie)
    dCtx.fillStyle = '#8bac0f'; // Light-tone for shirt
    dCtx.fillRect(4, 8, 8, 6);
    
    // Tie
    dCtx.fillStyle = '#113311';
    dCtx.fillRect(7, 8, 2, 5);
    
    // Pants
    dCtx.fillStyle = '#306230';
    dCtx.fillRect(4, 14, 8, 3);
    
    // Shoes
    dCtx.fillStyle = '#113311';
    dCtx.fillRect(3, 17, 3, 1);
    dCtx.fillRect(10, 17, 3, 1);
    
    // Arms
    dCtx.fillStyle = '#306230'; // Skin mid-tone
    if (ojisan.state === 'eating') {
        // Hand to mouth
        dCtx.fillRect(3, 9, 2, 2);
        dCtx.fillRect(11, 9, 2, 2);
        
        // Rice bowl / Drink
        dCtx.fillStyle = '#113311'; // Dark
        dCtx.fillRect(1, 7, 3, 4);
        dCtx.fillStyle = '#8bac0f'; // Foam/Rice
        dCtx.fillRect(1, 6, 3, 1);
    } else if (ojisan.state === 'playing') {
        // Arms up
        dCtx.fillRect(2, 6, 2, 4);
        dCtx.fillRect(12, 6, 2, 4);
    } else {
        // Arms down
        dCtx.fillRect(2, 8, 2, 4);
        dCtx.fillRect(12, 8, 2, 4);
    }

    dCtx.restore();
}

function dUpdate() {
    if (ojisan.stateTimer > 0) {
        ojisan.stateTimer--;
        if (ojisan.stateTimer <= 0) {
            ojisan.state = 'idle';
        }
    }
    
    // Keep stats within 0-100
    ojisan.hunger = Math.max(0, Math.min(100, ojisan.hunger));
    ojisan.happiness = Math.max(0, Math.min(100, ojisan.happiness));
}

function dDraw() {
    // Clear canvas - LCD Green Background
    dCtx.fillStyle = '#9bcc9b';
    dCtx.fillRect(0, 0, dCanvas.width, dCanvas.height);
    
    // LCD grid effect (optional)
    dCtx.fillStyle = 'rgba(17, 51, 17, 0.05)';
    for(let i=0; i<dCanvas.width; i+=4) {
        dCtx.fillRect(i, 0, 1, dCanvas.height);
    }
    for(let i=0; i<dCanvas.height; i+=4) {
        dCtx.fillRect(0, i, dCanvas.width, 1);
    }

    // UI Meters
    dCtx.fillStyle = '#113311';
    dCtx.font = '14px "DotGothic16", monospace';
    dCtx.fillText('ハラ:', 10, 20);
    dCtx.fillText('キゲン:', 10, 40);
    
    // Meter outlines
    dCtx.strokeStyle = '#113311';
    dCtx.lineWidth = 2;
    dCtx.strokeRect(60, 8, 60, 12);
    dCtx.strokeRect(60, 28, 60, 12);
    
    // Meter fill
    const hFill = Math.floor((ojisan.hunger / 100) * 56);
    dCtx.fillRect(62, 10, hFill, 8);
    
    const pFill = Math.floor((ojisan.happiness / 100) * 56);
    dCtx.fillRect(62, 30, pFill, 8);
    
    // Alert icon if low stats
    if (ojisan.hunger < 30 || ojisan.happiness < 30) {
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            dCtx.fillText('⚠️', 170, 30);
        }
    }

    // Draw Character
    drawOjisan(ojisan.x, ojisan.y);
}

function dLoop() {
    dUpdate();
    dDraw();
    requestAnimationFrame(dLoop);
}

// Start Daisuketchi Loop
dLoop();
