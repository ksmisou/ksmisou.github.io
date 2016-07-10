
/**
 * プログラム名 Antares
 * 作者: かすみ草
 */

// TODO: 画面サイズを定数にしたい
(function() {
    "use strict";

    var mapdata = null;

    // Function@bindの代用
    function bind(fn, self) {
        return function() {
            fn.apply(self, arguments);
        };
    }

    // Object@createの代用
    function create(object) {
        function C() {}

        C.prototype = object;
        return new C();
    }

    // フィールド
    function Field() {
        var i,
            k;

        this.mapchip = [];

        for (i = 0; i < 27; i++) { // タテ27
            this.mapchip[i] = [];

            for (k = 0; k < 60; k++) { // ヨコ60
                this.mapchip[i][k] = 0;
            }
        }
    }

    Field.prototype.getMapchip = function(x, y) {

        // 指定座標のマップチップを返す
        var a = -1;

        if (x >= 0 && y >= 0 && x < 60 && y < 27) {
            a = this.mapchip[y][x];
        }

        return a;
    };

    Field.prototype.setMapchip = function(x, y, a) {

        // 指定座標にマップチップを置く
        if (x >= 0 && y >= 0 && x < 60 && y < 27) {
            this.mapchip[y][x] = a;
        }
    };

    Field.prototype.isBlock = function(x, y) { // 指定座標がブロックなら真
        var a = this.getMapchip(x, y);

        return (a !== 0 && a !== 34); // 空白または柱を除く
    };

    // 壊せるブロック・落ちるブロックの判定はメソッド化したい

    Field.prototype.hitBlock = function(x, y) {
        var a = this.getMapchip(x, y);

        if (a === 31 || a === 33) {
            this.setMapchip(x, y, 0);
            this.fallBlockLine(x, y);
        }
    };

    Field.prototype.fallBlockLine = function(x, y) {
        var btmY = 27,
            falled = 0,
            i,
            a;

        for (i = 27; i >= 0; i--) {
            a = this.getMapchip(x, i);

            if (i < y && (a === 32 || a === 33)) {
                this.setMapchip(x, i, 0);
                this.setMapchip(x, btmY, a);
                btmY = btmY - 1;
                falled = 1;
            } else if (a > 0) {
                btmY = i - 1;
            } else if (falled && i !== y) {
                i = -1;
            }
        }
    };

    // 操作キャラの弾
    function Bullet() {
        this.x = 0;
        this.y = 0;
        this.frame = 0;
        this.active = 1;
        this.direction = 1;
    }

    Bullet.prototype.update = function(field) {
        this.frame++;
        this.updatePos();

        if (field.isBlock((this.x + 15) / 32 ^ 0, (this.y + 15) / 32 ^ 0)) {
            this.frame = 0;
            this.active = 0;
            field.hitBlock((this.x + 15) / 32 ^ 0, (this.y + 15) / 32 ^ 0);
        }

        if (this.frame > 8) {
            this.frame = 0;
            this.active = 0;
        }
    };

    Bullet.prototype.updatePos = function() {
        this.x += (18 * (this.direction === 1 ? 1: -1));
    };

    Bullet.prototype.view = function(graphic, vwx, vwy) {
        graphic.addImage(this.x - vwx, this.y - vwy, 15, this.direction);
    };

    // 上撃ち弾
    function UpperBullet() {
        Bullet.apply(this);
    }

    UpperBullet.prototype = create(Bullet.prototype);

    UpperBullet.prototype.updatePos = function() {
        this.y -= 18;
    };

    UpperBullet.prototype.view = function(graphic, vwx, vwy) {
        graphic.addImage(this.x - vwx, this.y - vwy, 16, this.direction);
    };

    // 操作キャラ
    function Player() {
        this.x = 0;
        this.y = 0;
        this.prevX = this.x;
        this.prevY = this.y;
        this.vx = 0;
        this.vy = 0;
        this.direction = 1;
        this.ground = 1;
        this.state = 0;
        this.frame = 0;
        this.box = [6, 26, 12, 31];
        this.upper = 0;
    }

    Player.prototype.update = function(input, field) {
        var arrow;

        if (this.ground === 1 && input.trgA) {
            this.jumping = 6;
            this.ground = 0;
        }

        if (input.right) {
            arrow = 1;
        } else if (input.left) {
            arrow = -1;
        } else {
            arrow = 0;
        }

        if (input.top && !input.trgB) {

            if (this.ground === 1) {
                arrow = 0;
            }

            this.upper = 1;
        } else {
            this.upper = 0;
        }

        if (arrow !== 0) { // 歩く

            if (this.vx * arrow > 0) {
                this.vx += arrow * 1;
            } else {
                this.vx += arrow * 2;
            }

            if (Math.abs(this.vx) > 6) {
                this.vx = arrow * 6;
            }

            this.direction = (arrow === 1 ? 1: 0);
        } else if (this.vy >= 0) { // 摩擦

            if (this.vx > 0) {
                this.vx -= 1;
            } else if (this.vx < 0) {
                this.vx += 1;
            } else {
            }
        }

        if (this.jumping > 0) {
            this.jumping--;
            this.vy = -10;
        } else if (this.ground === 0) {
            this.vy += 2;

            if (this.vy > 10) {
                this.vy = 10;
            }
        } else {
            this.vy = 0;
        }

        if (this.state === 0) {

            if (!this.ground) {
                this.state = 2;
            } else if (arrow !== 0) {
                this.frame = 0;
                this.state = 1;
            } 
        } else if (this.state === 1) {
            this.frame++;

            if (!this.ground) {
                this.state = 2;
            } else if (arrow === 0) {
                this.state = 0;
            }
        } else if (this.state === 2) {

            if (this.ground) {
                this.state = (arrow !== 0 ? 1: 0);
            }
        }

        this.prevX = this.x;
        this.prevY = this.y;
        this.x += this.vx;
        this.y += this.vy;

        this.ground = 0;

        if (this.bullet) {
            this.bullet.update(field);

            if (this.bullet.active === 0) {
                this.bullet = null;
            }
        }

        if (input.trgB === 1 && !this.bullet) {
            this.bullet = new Bullet();
            this.bullet.active = 1;
            this.bullet.x = this.x + (16 * (this.direction === 1 ? 1: -1));
            this.bullet.y = this.y;
            this.bullet.direction = this.direction;
        }

        if (input.top === 1 && !this.bullet) {
            this.bullet = new UpperBullet();
            this.bullet.active = 1;
            this.bullet.x = this.x;
            this.bullet.y = this.y - 16;
            this.bullet.direction = this.direction;
        }
    };

    Player.prototype.view = function(graphic, vwx, vwy) { // 表示
        var code = 1;

        if (this.state === 0) {

            if (this.upper) {
                code = 2;
            }
        } else if (this.state === 1) {
            code = 3 + this.frame % 2;
        } else if (this.state === 2) {
            code = 5;

            if (this.upper) {
                code = 6;
            }
        }

        graphic.addImage(this.x - vwx, this.y - vwy, code, this.direction);

        if (this.bullet) {
            this.bullet.view(graphic, vwx, vwy);
        }
    };

    // ゲームループ オブジェクト
    function GameLoop() {
        this.scene = 0;
        this.nextScene = this.scene; // ここが変わるとシーンが切り替わる

        this.viewX = 0;
        this.viewY = 0;
        this.viewC = 0;
        this.player = null;
        this.field = null;

        this.initGameStart();
    }

    GameLoop.prototype.getBlockByChar = function(c) {

        // 文字情報をブロック番号に変換
        var block = 0;

        if (c >= 97 && c <= 107) { // a ~ j
            block = (20 + c - 97); // 装飾ブロックA~J
        } else if (c >= 49 && c <= 53) { // 1 ~ 5
            block = (30 + c - 49); // パズル関連のブロックなど
        }

        return block;
    };

    GameLoop.prototype.getEnemyByChar = function(c) {
        return 0;
    };

    GameLoop.prototype.setMapchar = function(x, y, c) {

        // 指定位置にキャラクタを設置する
        var block = this.getBlockByChar(c),
            enemy = this.getEnemyByChar(c);

        if (c === 64) {
            this.player.x = x * 32;
            this.player.y = y * 32 + 32 - this.player.box[3];
            this.player.prevX = this.player.x;
            this.player.prevY = this.player.y;
        }

        if (block > 0) {
            this.field.setMapchip(x, y, block);
        }

        if (enemy > 0) {
            // this.field.setEnemy(x, y, enemy);
        }
    };

    GameLoop.prototype.initGameStart = function() { // ゲーム開始時の初期化
        var i,
            k;

        this.player = new Player();
        this.field = new Field();

        for (i = 0; i < 27; i++) {

            for (k = 0; k < 60; k++) {
                this.setMapchar(k, i, mapdata[i].charCodeAt(k));
            }
        }
    };

    GameLoop.prototype.viewMapchips = function(graphic) { // マップチップを表示

        // (Fieldオブジェクトに担当させるべき)
        var vwx     = this.viewX,
            vwy     = this.viewY,
            left    = (vwx / 32 ^ 0),
            right   = (left + 10 + 1),
            top     = (vwy / 32 ^ 0),
            bottom  = (top + 9 + 1),
            i,
            k,
            n;

        for (i = top; i < bottom; i++) {

            for (k = left; k < right; k++) {
                n = this.field.getMapchip(k, i);

                if (n > 0) {
                    graphic.addImage(k * 32 - vwx, i * 32 - vwy, n, 0);
                }
            }
        }
    };

    GameLoop.prototype.update = function(graphic, input) { // 更新処理
        this.player.update(input, this.field);
        this.collision(this.player);
        this.doScroll();

        this.viewMapchips(graphic);
        this.player.view(graphic, this.viewX, this.viewY);

        if (input.title === 1) {
            this.initGameStart();
        }
    };

    GameLoop.prototype.doScroll = function() { // スクロールを更新
        var vwx = this.viewX,
            vwy = this.viewY,
            cx  = 160 - 16,
            cy  = 144 - 16;

        if (this.player.prevX !== this.player.x) {

            if (this.player.direction === 1) {
                this.viewC -= 2;
            } else {
                this.viewC += 2;
            }

            if (this.viewC > 32) {
                this.viewC = 32;
            }

            if (this.viewC < -32){
                this.viewC = -32;
            }
        }

        cx += this.viewC;

        vwx = Math.min(vwx, this.player.x - cx + 32); // X軸
        vwx = Math.max(vwx, this.player.x - cx - 32);
        vwx = Math.max(vwx, 0);
        this.viewX = Math.min(vwx, 1600);

        vwy = Math.min(vwy, this.player.y - cy + 64); // Y軸
        vwy = Math.max(vwy, this.player.y - cy - 32);
        vwy = Math.max(vwy, 0);
        this.viewY = Math.min(vwy, 576);
    };

    GameLoop.prototype.collision = function(player) {
        var field   = this.field,
            l       = ((player.x + player.box[0]) / 32 ^ 0),
            t       = ((player.prevY + player.box[2] + 1) / 32 ^ 0),
            r       = ((player.x + player.box[1]) / 32 ^ 0),
            d       = ((player.prevY + player.box[3] - 1) / 32 ^ 0);

        if (player.prevX + player.box[1] <= r * 32 + 1) {

            if (field.isBlock(r, t) || field.isBlock(r, d)) {
                player.x = (r * 32 - player.box[1]);
                player.vx = Math.min(player.vx, 2);
            }
        }

        if (player.prevX + player.box[0] >= l * 32 + 31) {

            if (field.isBlock(l, t) || field.isBlock(l, d)) {
                player.x = (l * 32 + 32 - player.box[0]);
                player.vx = Math.max(player.vx, -2);
            }
        }

        if (player.x + player.box[0] <= 0) {
            player.x = -player.box[0];
            player.vx = 0;
        }

        l = ((player.x + player.box[0] + 1) / 32 ^ 0);
        t = ((player.y + player.box[2]) / 32 ^ 0);
        r = ((player.x + player.box[1] - 1) / 32 ^ 0);
        d = ((player.y + player.box[3]) / 32 ^ 0);

        if (player.prevY + player.box[3] <= d * 32 + 1) {

            if (field.isBlock(l, d) || field.isBlock(r, d)) {
                player.ground = 1;
                player.y = (d * 32 - player.box[3]);
            }
        }

        if (player.prevY + player.box[2] >= t * 32 + 31) {

            if (field.isBlock(l, t) || field.isBlock(r, t)) {
                player.y = (t * 32 + 32 - player.box[2]);
                player.vy = 0;
                player.jumping = 0;
            }
        }
    };

    // グラフィック オブジェクト
    function Graphic() {
        this.data = [];
    }

    Graphic.prototype.addImage = function(x, y, idx, n) {

        if (x > -32 && y > -32 && x < 320 && y < 288) {
            this.data[this.data.length] = {
                x: x,
                y: y,
                idx: idx,
                n: Number(n)
            };
        }
    };

    Graphic.prototype.shiftImage = function() {
        return this.data.shift();
    };

    // キーキャプチャ オブジェクト
    function KeyCaptcha() {
        this.keyTable = {
            37: 0, // ←
            38: 1, // ↑
            39: 2, // →
            40: 3, // ↓
            90: 4, // Z
            88: 5, // X
            67: 6, // C
            65: 7, // A
            83: 8, // S
            84: 9,  // T
            82: 9  // R
        };

        this.buttons = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    KeyCaptcha.prototype.start = function() { // 動作を開始
        var ev = bind(this.doKeyEvent, this);

        addEventListener("keydown", ev, false);
        addEventListener("keyup", ev, false);
    };

    KeyCaptcha.prototype.doKeyEvent = function(e) { // キーイベントがあった
        var i = this.keyTable[e.keyCode];

        if (i >= 0) {
            e.preventDefault();

            if (e.type === "keydown") {
                this.buttons[i] = 1;
            } else { // keyupとみなす
                this.buttons[i] = 0;
            }
        }
    };

    KeyCaptcha.prototype.createHash = function() { // ボタン情報を作成
        var bts = this.buttons;

        return {
            left: bts[0],
            top: bts[1],
            right: bts[2],
            bottom: bts[3],
            trgA: bts[4],
            trgB: bts[5],
            trgC: bts[6],
            select: bts[7],
            start: bts[8],
            title: bts[9]
        };
    };

    // ゲーム本体 オブジェクト
    function Game() { // 準備

        // TODO: 画像とcanvasは違う方法で管理する
        this.pattern = new Image();
        this.pattern.src = "pattern.png";
        this.canvas = document.getElementById("antares");
        this.ctx = this.canvas.getContext("2d");

        this.graphic = new Graphic();
        this.keyCaptcha = new KeyCaptcha();
        this.gameLoop = new GameLoop();
    }

    Game.prototype.drawPattern = function(x, y, idx, n) { // パターン画像を描画
        var sx = ((idx % 10 * 32)),
            sy = ((idx / 10 ^ 0) * 32);

        // TODO: あらかじめ反転した物をバッファリングしておきたい
        if (n === 1) { // 左右反転
            this.ctx.scale(-1, 1);
            x = -x - 32; // 座標も反転されるため、補正をかける
        }

        this.ctx.drawImage(this.pattern, sx, sy, 32, 32, x, y, 32, 32);

        if (n === 1) { // 反転の後始末
            this.ctx.scale(-1, 1);
        }
    };

    Game.prototype.update = function() {

        if (!this.pattern.complete) {return;}

        // 1回ぶんのゲームループを呼び出す
        this.gameLoop.update(this.graphic, this.keyCaptcha.createHash());

        // 背景を描画
        this.ctx.fillStyle = "#ffcccc"; // TODO: このままではだめだ
        this.ctx.fillRect(0, 0, 320, 288);

        this.showImages();
    };

    Game.prototype.showImages = function() { // 画像を一括描画
        var img = this.graphic.shiftImage();

        while (img) {
            this.drawPattern(img.x, img.y, img.idx, img.n);
            img = this.graphic.shiftImage();
        }
    };

    Game.prototype.start = function() { // ループを開始
        var callback = bind(function () {
            var wait = (new Date().getTime() + 50);

            this.update();
            setTimeout(callback, wait - new Date().getTime());
        }, this);

        this.keyCaptcha.start();
        setTimeout(callback, 4);
    };

    // マップデータ
    mapdata = [
        "......1.....................................................",
        "......1............................5........................",
        "......1.....5.......3..............5........................",
        "......1...5.5.1.....3..............1........................",
        "......1..111111.....3...3..........1........................",
        ".....31..22..11...1.3...2..........1........................",
        ".....21111.1211...112111.22211111111........................",
        "3.....2....1........511............1........................",
        "3.....111111111111111111111111113..1........................",
        "4.....1........................12..1........................",
        "4.....1........................1..11........................",
        "11..111...3....................1..11........................",
        "...31.....3....................1..31........................",
        "...41.....4....................15.21........................",
        "2..11222224...21...............111.1........................",
        "1...1..2224..1...........bbb.......1........................",
        "1...22222.4..1...........bbb....11.1........................",
        "11111111111111111........bbb....2.52.......................",
        "...................111...bbbbbbbbbbb.......................",
        "...............3.........bbbbbbbbbbb...................1...",
        "...............4.......bbbbbbbbbbbbbbbb........3.......1...",
        ".5.5...........4.....3.bbbbbbbbbbbbbbbb........4.......1...",
        ".5.5..........11.....4.bbbbbbbbbbbbbbbbbbb.....4......j1...",
        ".5@5..........1......5.bbbbbbbbbbbbbbbbbbb.....5..111111...",
        "221122....11..1..33..5.bbbbbbbbbbbbbbbbbbbbbb..5..11.......",
        "11221122..22122..55..5.bbbbbbbbbbbbbbbbbbbbbb..5..11.......",
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    ];

    new Game().start();
}());
