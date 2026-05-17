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
let poops;
let goals;
let qBlocks;
let salarymenGroup;
let pipes;
let jumpMarkers = [];

let gameOver = false;
let isGoal = false;
let score = 0;
let scoreText;
let nextPoopTime = 0;

// 新規追加フラグ
let isPoopWorld = false;
let isEnteringPipe = false;

// バーチャルパッド入力用
let vInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false
};

function setupVirtualPad() {
    const bindBtn = (id, key) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const press = (e) => { if(e.cancelable) e.preventDefault(); vInput[key] = true; };
        const release = (e) => { if(e.cancelable) e.preventDefault(); vInput[key] = false; };
        btn.addEventListener('touchstart', press, {passive: false});
        btn.addEventListener('touchend', release, {passive: false});
        btn.addEventListener('mousedown', press);
        btn.addEventListener('mouseup', release);
        btn.addEventListener('mouseleave', release);
    };
    bindBtn('btn-up', 'up');
    bindBtn('btn-down', 'down');
    bindBtn('btn-left', 'left');
    bindBtn('btn-right', 'right');
    bindBtn('btn-a', 'a');
    bindBtn('btn-b', 'b');
}

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
        '1322413222224111',
        '1322413222224111',
        '1322413222224111',
        '1322413222224111',
        '1111111111111111',
        '1444444444444441',
        '1111111111111111'
    ];
    this.textures.generate('block', { data: blockData, pixelWidth: 2, palette: blockPalette });

    // うんこ
    const poopPalette = {
        '1': '#5C3A21', // 濃い茶色
        '2': '#8B5A2B', // 茶色
    };
    const poopData = [
        '......22......',
        '.....2222.....',
        '....221122....',
        '...22222222...',
        '..2221111222..',
        '..2222222222..',
        '.222111111222.',
        '.222222222222.'
    ];
    this.textures.generate('poop', { data: poopData, pixelWidth: 2, palette: poopPalette });

    // ゴール(旗)
    const flagPalette = {
        '1': '#ffffff', // 棒
        '2': '#00ff00', // 旗
    };
    const flagData = [
        '112222222222',
        '112222222222',
        '112222222222',
        '112222222222',
        '112222222222',
        '11..........',
        '11..........',
        '11..........',
        '11..........',
        '11..........',
        '11..........',
        '11..........',
        '11..........',
        '11..........',
        '11..........',
        '11..........'
    ];
    this.textures.generate('flag', { data: flagData, pixelWidth: 2, palette: flagPalette });

    // ハテナブロック
    const qBlockPalette = { '1': '#000000', '2': '#ffcc00', '3': '#ff9900' };
    const qBlockData = [
        '1111111111111111',
        '1222222222222221',
        '1222211112222221',
        '1222122221222221',
        '1222122221222221',
        '1222222221222221',
        '1222222212222221',
        '1222222122222221',
        '1222222122222221',
        '1222222222222221',
        '1222222122222221',
        '1222222122222221',
        '1222222222222221',
        '1222222222222221',
        '1333333333333331',
        '1111111111111111'
    ];
    this.textures.generate('qBlock', { data: qBlockData, pixelWidth: 2, palette: qBlockPalette });

    // 空ブロック
    const emptyBlockPalette = { '1': '#000000', '2': '#8b4513' };
    const emptyBlockData = [
        '1111111111111111',
        '1222222222222221',
        '1222222222222221',
        '1222222222222221',
        '1222222222222221',
        '1222222222222221',
        '1222222222222221',
        '1222222222222221',
        '1222222222222221',
        '1222222222222221',
        '1222222222222221',
        '1222222222222221',
        '1222222222222221',
        '1222222222222221',
        '1222222222222221',
        '1111111111111111'
    ];
    this.textures.generate('emptyBlock', { data: emptyBlockData, pixelWidth: 2, palette: emptyBlockPalette });

    // サラリーマン
    const salarymanPalette = {
        '1': '#000000', // スーツ、髪
        '2': '#ffcc99', // 肌
        '3': '#ffffff', // シャツ、メガネ
        '4': '#00ffff'  // メガネレンズ
    };
    const salarymanData = [
        '.....11111......',
        '....11111111....',
        '....2222222.....',
        '...214121412....', // メガネ
        '...214121412....',
        '...222222222....',
        '......2222......',
        '....1133311.....',
        '...111313111....',
        '..11111111111...',
        '..221111111122..',
        '..221111111122..',
        '....11....11....',
        '...111....111...',
        '..1111....1111..'
    ];
    this.textures.generate('salaryman', { data: salarymanData, pixelWidth: 2, palette: salarymanPalette });

    // 土管
    const pipePalette = { '1': '#000000', '2': '#00cc00', '3': '#00ff00', '4': '#006600' };
    const pipeData = [
        '1111111111111111',
        '1333333333333331',
        '1322222222222241',
        '1322222222222241',
        '1322222222222241',
        '1111111111111111',
        '.13222222222241.',
        '.13222222222241.',
        '.13222222222241.',
        '.13222222222241.',
        '.13222222222241.',
        '.13222222222241.',
        '.13222222222241.',
        '.13222222222241.',
        '.13222222222241.',
        '.13222222222241.'
    ];
    this.textures.generate('pipe', { data: pipeData, pixelWidth: 2, palette: pipePalette });

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
    isGoal = false;
    gameOver = false;
    isEnteringPipe = false;
    nextPoopTime = this.time.now + 15000;
    jumpMarkers = [];

    // バーチャルパッドのセットアップ
    setupVirtualPad();

    // フェードイン (真っ暗から明るくなる)
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // 背景
    let bg = this.add.image(400, 300, 'bg').setScrollFactor(0); // スクロールしない背景
    
    if (isPoopWorld) {
        this.cameras.main.setBackgroundColor('#5C3A21'); // 背景色を茶色に
        bg.setTint(0x8B5A2B); // 画像全体を茶色っぽく染める
    }

    // プラットフォーム（地面）
    platforms = this.physics.add.staticGroup();

    // 地面を敷き詰める (コースを長くして落とし穴を追加)
    for (let i = 0; i < 150; i++) {
        // 落とし穴
        if (i > 20 && i < 23) continue;
        if (i > 50 && i < 55) continue;
        if (i > 80 && i < 84) continue;
        if (i > 110 && i < 116) continue;
        platforms.create(i * 32 + 16, 584, 'block');
    }
    
    // 足場を追加
    platforms.create(300, 450, 'block');
    platforms.create(332, 450, 'block');
    platforms.create(364, 450, 'block');
    
    platforms.create(600, 350, 'block');
    platforms.create(632, 350, 'block');
    platforms.create(664, 350, 'block');

    platforms.create(1000, 450, 'block');
    platforms.create(1100, 350, 'block');
    platforms.create(1200, 250, 'block');

    platforms.create(2000, 450, 'block');
    platforms.create(2032, 450, 'block');
    platforms.create(2064, 450, 'block');
    
    platforms.create(2800, 400, 'block');
    platforms.create(2900, 300, 'block');
    platforms.create(3000, 200, 'block');

    platforms.create(3500, 450, 'block');
    platforms.create(3532, 450, 'block');
    platforms.create(3564, 450, 'block');

    platforms.create(4000, 350, 'block');
    platforms.create(4032, 350, 'block');
    platforms.create(4064, 350, 'block');

    // ウンコ世界なら、地面と足場をすべてウンコテクスチャに変更
    if (isPoopWorld) {
        platforms.children.iterate(function(child) {
            child.setTexture('poop');
        });
    }

    // ハテナブロック
    qBlocks = this.physics.add.staticGroup();
    let q1 = qBlocks.create(800, 400, 'qBlock');
    q1.setData('used', false);
    let q2 = qBlocks.create(1600, 400, 'qBlock');
    q2.setData('used', false);
    let q3 = qBlocks.create(2400, 400, 'qBlock');
    q3.setData('used', false);

    // 土管
    pipes = this.physics.add.staticGroup();
    pipes.create(1200, 552, 'pipe').setScale(2).refreshBody();
    pipes.create(2200, 552, 'pipe').setScale(2).refreshBody();
    pipes.create(3200, 552, 'pipe').setScale(2).refreshBody();

    if (isPoopWorld) {
        pipes.children.iterate(function(child) {
            child.setTint(0x8B5A2B); // 土管もうんこ色に
        });
        qBlocks.children.iterate(function(child) {
            child.setTint(0x8B5A2B); 
        });
    }

    // プレイヤー設定
    player = this.physics.add.sprite(100, 450, 'player');
    player.setBounce(0.1);
    player.setCollideWorldBounds(false); // 世界の果てはないようにする（落ちたらミス）

    // カメラがプレイヤーを追従
    this.cameras.main.setBounds(0, 0, 4800, 600); // ステージの長さを4800pxに
    this.cameras.main.startFollow(player);

    // 敵グループ
    enemies = this.physics.add.group();
    
    // 敵を適度に配置
    let enemyXPositions = [500, 800, 1200, 1500, 1800, 2200, 2500, 2900, 3300, 3800, 4200, 4400];
    enemyXPositions.forEach(x => {
        let enemy = enemies.create(x, 500, 'enemy');
        enemy.setVelocityX(-50);
        if (isPoopWorld) enemy.setTint(0x8B5A2B); // 敵もうんこ色に
    });

    // ファイアボールグループ
    fireballs = this.physics.add.group();

    // うんこグループ
    poops = this.physics.add.group();

    // サラリーマングループ
    salarymenGroup = this.physics.add.group();

    // ゴール
    goals = this.physics.add.staticGroup();
    let flag = goals.create(4600, 536, 'flag');

    // 当たり判定
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(enemies, platforms);
    this.physics.add.collider(fireballs, platforms, fireballHitWall, null, this);
    this.physics.add.collider(poops, platforms);
    
    this.physics.add.collider(player, qBlocks, hitQBlock, null, this);
    this.physics.add.collider(salarymenGroup, platforms);
    this.physics.add.collider(salarymenGroup, qBlocks);
    
    this.physics.add.collider(player, pipes, enterPipe, null, this); // プレイヤーと土管の衝突判定にコールバックを追加

    // プレイヤーと敵の判定
    this.physics.add.overlap(player, enemies, hitEnemy, null, this);
    // ファイアボールと敵の判定
    this.physics.add.overlap(fireballs, enemies, fireballHitEnemy, null, this);
    // プレイヤーとゴールの判定
    this.physics.add.overlap(player, goals, goalHandler, null, this);

    // 入力設定
    cursors = this.input.keyboard.createCursorKeys();
    fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    // スコアテキスト
    let worldName = isPoopWorld ? "POOP WORLD" : "NORMAL WORLD";
    scoreText = this.add.text(16, 16, `SCORE: 0  |  ${worldName}\n[Arrow] Move [UP] Jump [DOWN] Enter Pipe [Z] Fire`, { fontSize: '24px', fill: '#fff', fontFamily: 'sans-serif' }).setScrollFactor(0);
}

let lastFired = 0;
let playerFacing = 1; // 1:右, -1:左

function hitQBlock(player, block) {
    // 下から叩いたかを判定 (Phaserの衝突フラグを使用)
    if (player.body.touching.up) {
        if (!block.getData('used')) {
            block.setData('used', true);
            block.setTexture('emptyBlock');
            spawnSalaryman(block.x, block.y - 32, player.scene);
        }
    }
}

function spawnSalaryman(x, y, scene) {
    let sm = salarymenGroup.create(x, y, 'salaryman');
    sm.setBounce(0.1);
    sm.setData('nextPoopTime', scene.time.now + 15000);

    // 吹き出しを追加
    let text = scene.add.text(x, y - 20, 'オレは、ダイヤモンドしらいし！', {
        fontSize: '14px',
        fill: '#000',
        backgroundColor: '#fff',
        padding: { x: 5, y: 3 },
        fontFamily: 'sans-serif'
    }).setOrigin(0.5, 1);
    
    sm.setData('speechText', text);

    // 3秒後にフェードアウト
    scene.tweens.add({
        targets: text,
        alpha: 0,
        delay: 3000,
        duration: 1000,
        onComplete: () => {
            if (text) text.destroy();
            sm.setData('speechText', null);
        }
    });
}

function enterPipe(player, pipe) {
    if (isEnteringPipe) return;

    let pad = player.scene.input.gamepad.pad1;
    let downPressed = cursors.down.isDown || (pad && pad.down) || vInput.down;
    
    // 土管の上に乗っていて、下キーを押したとき (判定を緩くしました)
    if (downPressed && player.body.touching.down && player.y < pipe.y) {
        isEnteringPipe = true;
        
        // プレイヤーの物理演算を無効化
        player.setVelocity(0, 0);
        player.body.enable = false;
        
        // ズボッと沈むアニメーション
        player.scene.tweens.add({
            targets: player,
            y: pipe.y, // 土管の中心付近まで沈む
            duration: 1000,
            onComplete: function() {
                // フェードアウト
                player.scene.cameras.main.fadeOut(500, 0, 0, 0);
                player.scene.cameras.main.once('camerafadeoutcomplete', function () {
                    // うんこ世界フラグを反転してシーン再起動
                    isPoopWorld = !isPoopWorld;
                    player.scene.scene.restart();
                });
            }
        });
    }
}

function update(time, delta) {
    if (gameOver || isGoal || isEnteringPipe) {
        return;
    }

    // 15秒に1回うんこ(プレイヤー)
    if (time > nextPoopTime) {
        let poop = poops.create(player.x, player.y, 'poop');
        poop.setBounce(0.5);
        // 軽くジャンプ
        player.setVelocityY(-200);
        
        nextPoopTime = time + 15000;
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
    if (cursors.left.isDown || padLeft || vInput.left) {
        player.setVelocityX(-160);
        playerFacing = -1;
        player.flipX = true;
    }
    else if (cursors.right.isDown || padRight || vInput.right) {
        player.setVelocityX(160);
        playerFacing = 1;
        player.flipX = false;
    }
    else {
        player.setVelocityX(0);
    }

    // ジャンプ
    if ((cursors.up.isDown || cursors.space.isDown || padJump || vInput.up || vInput.a) && player.body.touching.down) {
        player.setVelocityY(-500);
        // ジャンプマーカーを記録（サラリーマンの追従用）
        jumpMarkers.push({ x: player.x, time: time });
    }

    // 古いジャンプマーカーを削除 (5秒以内のものだけ保持)
    jumpMarkers = jumpMarkers.filter(m => time - m.time < 5000);

    // サラリーマンの追従とウンコ処理
    let smIndex = 0;
    salarymenGroup.children.iterate(function (sm) {
        if (!sm) return;
        
        // 穴に落ちたら消滅
        if (sm.y > 600) {
            let text = sm.getData('speechText');
            if (text) text.destroy();
            sm.destroy();
            return;
        }

        // 吹き出しを追従させる
        let text = sm.getData('speechText');
        if (text && text.active) {
            text.setPosition(sm.x, sm.y - 20);
        }

        smIndex++;
        // 目標位置：マリオの背後
        let targetX = player.x - playerFacing * (40 + smIndex * 30);

        if (sm.x < targetX - 5) {
            sm.setVelocityX(140);
            sm.flipX = false;
        } else if (sm.x > targetX + 5) {
            sm.setVelocityX(-140);
            sm.flipX = true;
        } else {
            sm.setVelocityX(0);
        }

        let shouldJump = false;
        // マリオがジャンプした場所付近にいて、地面にいるならジャンプ
        for (let m of jumpMarkers) {
            if (Math.abs(sm.x - m.x) < 15 && sm.body.touching.down) {
                shouldJump = true;
                break;
            }
        }
        
        // 壁にぶつかっている場合もジャンプ
        if ((sm.body.blocked.right || sm.body.blocked.left) && sm.body.touching.down) {
            shouldJump = true;
        }

        if (shouldJump && sm.body.touching.down) {
            sm.setVelocityY(-500);
        }

        // サラリーマンのウンコ
        let nextPoop = sm.getData('nextPoopTime');
        if (time > nextPoop) {
            let poop = poops.create(sm.x, sm.y, 'poop');
            poop.setBounce(0.5);
            sm.setVelocityY(-200); // 軽くジャンプ
            sm.setData('nextPoopTime', time + 15000);
        }
    });

    // ファイアボール発射
    if ((fireKey.isDown || padFire || vInput.b) && time > lastFired) {
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
        // 左上のテキスト更新だが、worldNameなどは省略してもよい
        scoreText.setText('SCORE: ' + score);
    } else {
        // 横から当たったらダメージ（ゲームオーバー）
        gameOverHandler(player.scene);
    }
}

function fireballHitEnemy(fireball, enemy) {
    fireball.destroy();
    enemy.destroy();
    score += 100;
    scoreText.setText('SCORE: ' + score);
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
    scene.input.once('pointerdown', function () {
        gameOver = false;
        score = 0;
        isPoopWorld = false; // リスタート時は元に戻す
        scene.scene.restart();
    });
}

function goalHandler(player, goal) {
    if (isGoal) return;
    isGoal = true;
    let scene = player.scene;
    scene.physics.pause();
    player.setTint(0x00ff00); // ゴール時は緑に
    
    let text = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerX, 'STAGE CLEAR!\nClick to Restart', { 
        fontSize: '48px', 
        fill: '#0f0', 
        align: 'center',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        stroke: '#fff',
        strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0);

    scene.input.once('pointerdown', function () {
        isGoal = false;
        score = 0;
        isPoopWorld = false;
        scene.scene.restart();
    });
}
