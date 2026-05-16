const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game-container',
        width: 800,
        height: 600
    },
    pixelArt: true, // ドット絵をくっきり表示
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    input: {
        gamepad: true // ゲームパッド入力を有効化
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let platforms;
let cursors;
let fireKey;
let enemies;
let fireballs;
let gameOver = false;
let score = 0;
let scoreText;

function preload() {
    // マリオ風キャラクター
    const marioPalette = {
        '1': '#e60012', // 赤
        '2': '#ffcc99', // 肌色
        '3': '#8b4513', // 茶色
        '4': '#004d9f', // 青
        '5': '#ffff00', // 黄
    };
    const marioData = [
        '.....11111......',
        '....111111111...',
        '....3332232.....',
        '...3232223222...',
        '...32332223222..',
        '...3322223333...',
        '......2222222...',
        '....114111......',
        '...1114114111...',
        '..111144441111..',
        '..221454454122..',
        '..222444444222..',
        '..224444444422..',
        '....444..444....',
        '...333....333...',
        '..3333....3333..'
    ];
    this.textures.generate('player', { data: marioData, pixelWidth: 2, palette: marioPalette });

    // クリボー風敵キャラクター
    const goombaPalette = {
        '1': '#8b4513', // 茶色
        '2': '#d2b48c', // 薄茶
        '3': '#000000', // 黒
        '4': '#ffffff', // 白
    };
    const goombaData = [
        '.......11.......',
        '......1111......',
        '.....111111.....',
        '....11111111....',
        '...1111111111...',
        '..113111111311..',
        '..114311113411..',
        '..111111111111..',
        '..111311113111..',
        '...1113333111...',
        '...1122222211...',
        '....22222222....',
        '....22222222....',
        '...33.2222.33...',
        '..3333....3333..',
        '.333333..333333.'
    ];
    this.textures.generate('enemy', { data: goombaData, pixelWidth: 2, palette: goombaPalette });

    // レンガブロック
    const blockPalette = {
        '1': '#000000', // 黒線
        '2': '#c84c0c', // オレンジ
        '3': '#ff9966', // ハイライト
        '4': '#8b2200', // シャドウ
    };
    const blockData = [
        '1111111111111111',
        '1333333333333331',
        '1322222213222241',
        '1322222213222241',
        '1322222213222241',
        '1322222213222241',
        '1322222213222241',
        '1111111111111111',
        '1322413222222411',
        '1322413222222411',
        '1322413222222411',
        '1322413222222411',
        '1322413222222411',
        '1111111111111111',
        '1444444444444441',
        '1111111111111111'
    ];
    this.textures.generate('block', { data: blockData, pixelWidth: 2, palette: blockPalette });

    // 背景(空)
    let graphics = this.add.graphics();
    graphics.fillStyle(0x5c94fc, 1);
    graphics.fillRect(0, 0, 800, 600);
    graphics.fillStyle(0xffffff, 0.8);
    // 雲
    graphics.fillCircle(200, 150, 30);
    graphics.fillCircle(230, 140, 40);
    graphics.fillCircle(260, 150, 30);
    graphics.fillCircle(600, 200, 40);
    graphics.fillCircle(640, 190, 50);
    graphics.fillCircle(680, 200, 40);
    // 山
    graphics.fillStyle(0x00a800, 1);
    graphics.fillTriangle(100, 600, 300, 300, 500, 600);
    graphics.fillTriangle(400, 600, 600, 400, 800, 600);
    graphics.generateTexture('bg', 800, 600);
    graphics.clear();

    // ファイアボール
    const firePalette = { '1': '#ffcc00', '2': '#ff0000' };
    const fireData = [
        '..11..',
        '.1221.',
        '121121',
        '121121',
        '.1221.',
        '..11..'
    ];
    this.textures.generate('fireball', { data: fireData, pixelWidth: 2, palette: firePalette });
}

function create() {
    // 背景
    this.add.image(400, 300, 'bg').setScrollFactor(0); // スクロールしない背景

    // プラットフォーム（地面）
    platforms = this.physics.add.staticGroup();

    // 地面を敷き詰める (2画面分くらい)
    for (let i = 0; i < 50; i++) {
        platforms.create(i * 32 + 16, 584, 'block');
    }
    // 足場を追加
    platforms.create(300, 450, 'block');
    platforms.create(332, 450, 'block');
    platforms.create(364, 450, 'block');
    
    platforms.create(600, 350, 'block');
    platforms.create(632, 350, 'block');
    platforms.create(664, 350, 'block');

    // プレイヤー設定
    player = this.physics.add.sprite(100, 450, 'player');
    player.setBounce(0.1);
    player.setCollideWorldBounds(false); // 世界の果てはないようにする（落ちたらミス）

    // カメラがプレイヤーを追従
    this.cameras.main.setBounds(0, 0, 1600, 600); // 1600px幅のステージ
    this.cameras.main.startFollow(player);

    // 敵グループ
    enemies = this.physics.add.group();
    
    // 敵を配置
    let enemy1 = enemies.create(500, 500, 'enemy');
    enemy1.setVelocityX(-50); // 左に歩く
    
    let enemy2 = enemies.create(800, 500, 'enemy');
    enemy2.setVelocityX(-50);

    // ファイアボールグループ
    fireballs = this.physics.add.group();

    // 当たり判定
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(enemies, platforms);
    this.physics.add.collider(fireballs, platforms, fireballHitWall, null, this);
    
    // プレイヤーと敵の判定
    this.physics.add.overlap(player, enemies, hitEnemy, null, this);
    // ファイアボールと敵の判定
    this.physics.add.overlap(fireballs, enemies, fireballHitEnemy, null, this);

    // 入力設定
    cursors = this.input.keyboard.createCursorKeys();
    fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    // スコアテキスト
    scoreText = this.add.text(16, 16, 'SCORE: 0\n[Arrow] Move [UP] Jump [Z] Fire', { fontSize: '24px', fill: '#fff', fontFamily: 'sans-serif' }).setScrollFactor(0);
}

let lastFired = 0;
let playerFacing = 1; // 1:右, -1:左

function update(time, delta) {
    if (gameOver) {
        return;
    }

    // ゲームパッドの入力取得
    let pad = this.input.gamepad.pad1;
    let padLeft = false;
    let padRight = false;
    let padJump = false;
    let padFire = false;

    if (pad) {
        padLeft = pad.left;
        padRight = pad.right;
        padJump = pad.A;
        padFire = pad.B || pad.X || pad.Y; // 複数のボタンで攻撃できるように
    }

    // プレイヤーの移動
    if (cursors.left.isDown || padLeft) {
        player.setVelocityX(-160);
        playerFacing = -1;
    }
    else if (cursors.right.isDown || padRight) {
        player.setVelocityX(160);
        playerFacing = 1;
    }
    else {
        player.setVelocityX(0);
    }

    // ジャンプ
    if ((cursors.up.isDown || cursors.space.isDown || padJump) && player.body.touching.down) {
        player.setVelocityY(-500);
    }

    // ファイアボール発射
    if ((fireKey.isDown || padFire) && time > lastFired) {
        let fireball = fireballs.create(player.x, player.y, 'fireball');
        fireball.setVelocityX(300 * playerFacing);
        fireball.setVelocityY(-150); // 少し上に跳ねるように
        fireball.setBounce(1); // バウンドする
        fireball.setCollideWorldBounds(false);
        lastFired = time + 300; // 連射ディレイ(ms)
    }

    // ファイアボールの生存管理（画面外に出たら消す）
    fireballs.children.iterate(function (fb) {
        if (fb && (fb.y > 600 || fb.x < player.x - 800 || fb.x > player.x + 800)) {
            fb.destroy();
        }
    });

    // 落下したらゲームオーバー
    if (player.y > 600) {
        gameOverHandler(this);
    }
}

function hitEnemy(player, enemy) {
    // プレイヤーが落下中で、敵の上半分に当たっている場合（踏んだ）
    if (player.body.velocity.y > 0 && player.y < enemy.y - 16) {
        enemy.destroy();
        player.setVelocityY(-300); // 踏んだら跳ねる
        score += 100;
        scoreText.setText('SCORE: ' + score + '\n[Arrow] Move [UP] Jump [Z] Fire');
    } else {
        // 横から当たったらダメージ（ゲームオーバー）
        gameOverHandler(player.scene);
    }
}

function fireballHitEnemy(fireball, enemy) {
    fireball.destroy();
    enemy.destroy();
    score += 100;
    scoreText.setText('SCORE: ' + score + '\n[Arrow] Move [UP] Jump [Z] Fire');
}

function fireballHitWall(fireball, platform) {
    // 壁に当たったら反射するが、一定の高さまでしか跳ねないようになど調整も可能
}

function gameOverHandler(scene) {
    gameOver = true;
    scene.physics.pause();
    player.setTint(0xff0000);
    
    // ゲームオーバーテキスト
    let text = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY, 'GAME OVER\nClick to Restart', { 
        fontSize: '48px', 
        fill: '#f00', 
        align: 'center',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        stroke: '#fff',
        strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0);

    // クリックでリスタート
    scene.input.on('pointerdown', function () {
        gameOver = false;
        score = 0;
        scene.scene.restart();
    });
}
