
/*
 * マインドスイーパ
 */
var mineGame = (function() {
    "use strict";

    function bind(fn, me) {
        return function() {
            fn.apply(me, arguments);
        };
    }

    // フィールド オブジェクト
    function Field() {
        this.height = 9; // タテの数
        this.width = 9; // ヨコの数
        this.mineQt = 10; // 地雷の数

        this.mine = null; // 地雷が格納される二次元配列 0: 普通 1: 地雷
        this.flag = null; // 印が格納される二次元配列 0: 無し 1: 開いた 2: 印
    }

    Field.prototype.pick = function(x, y) {

        // 指定座標と周りのマスが地雷でなければ開ける
        if (x >= 0 && y >= 0 && x < this.width && y < this.height) {

            if (!this.isMine(x, y) && this.flag[y][x] !== 1) {
                this.flag[y][x] = 1;

                if (this.getMineAround(x, y) === 0) {
                    this.pick(x - 1, y - 1);
                    this.pick(x, y - 1);
                    this.pick(x + 1, y - 1);
                    this.pick(x - 1, y);
                    this.pick(x + 1, y);
                    this.pick(x - 1, y + 1);
                    this.pick(x, y + 1);
                    this.pick(x + 1, y + 1);
                }
            }
        }
    };

    Field.prototype.showAll = function() {
        var i,
            j;

        for (i = 0; i < this.height; i++) {

            for (j = 0; j < this.width; j++) {
                this.flag[i][j] = 1;
            }
        }
   };

    Field.prototype.initArray = function() { // 地雷などの配列を初期化
        var i,
            j;

        this.mine = [];
        this.flag = [];

        for (i = 0; i < this.height; i++) {
            this.mine[i] = [];
            this.flag[i] = [];

            for (j = 0; j < this.width; j++) {
                this.mine[i][j] = 0;
                this.flag[i][j] = 0;
            }
        }
    };

    Field.prototype.deployMine = function() { // 地雷を配置する
        var qt = this.mineQt, // 置きたい地雷の数
            n = 0, // 置いた地雷の数
            i,
            j;

        while (n < qt) {
            i = Math.random() * this.height ^ 0;
            j = Math.random() * this.width ^ 0;

            if (! this.mine[j][i]) { // 地雷が空いている
                this.mine[j][i] = 1;
                n++; // 地雷を置いた
            }
        }
    };

    Field.prototype.prepare = function() { // 準備
        this.initArray();
        this.deployMine();
    };

    Field.prototype.isMine = function(x, y) { // 指定位置に地雷があるか
        var b = false;

        if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
            b = this.mine[y][x];
        }

        return b;
    };

    Field.prototype.getMineAround = function(x, y) {
        var num = 0;

        if (this.isMine(x - 1, y - 1)) {
            num++;
        }

        if (this.isMine(x, y - 1)) {
            num++;
        }

        if (this.isMine(x + 1, y - 1)) {
            num++;
        }

        if (this.isMine(x - 1, y)) {
            num++;
        }

        if (this.isMine(x + 1, y)) {
            num++;
        }

        if (this.isMine(x - 1, y + 1)) {
            num++;
        }

        if (this.isMine(x, y + 1)) {
            num++;
        }

        if (this.isMine(x + 1, y + 1)) {
            num++;
        }

        return num;
    };

    // 画面表示 オブジェクト
    function Display() {
        this.canvas = null;
        this.context2d = null;
    }

    Display.prototype.prepare = function(boxId, field, img) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = 24 * field.width + 48;
        this.canvas.height = 24 * field.height + 96;

        this.context2d = this.canvas.getContext("2d");
        this.context2d.fillStyle = "#999999";
        this.context2d.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.sprite = img;

        document.getElementById(boxId).appendChild(this.canvas);
    };

    // 画像を描画
    Display.prototype.drawSprite = function(x, y, a) {
        var ctx = this.context2d;

        ctx.drawImage(this.sprite, 24 * (a % 10), 24 * (a / 10 ^ 0), 24, 24,
            x, y, 24, 24);
    };

    // フィールドを描画
    Display.prototype.drawField = function(field) {
        var ctx = this.context2d,
            i,
            j,
            n;

        ctx.fillStyle = "#999999";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height - 72);

        for (i = 0; i < field.width; i++) {

            for (j = 0; j < field.height; j++) {

                if (field.flag[i][j] === 1) {

                    if (field.mine[i][j] === 1) {
                        n = 19;
                    } else {
                        n = 10 + field.getMineAround(j, i);
                    }
                } else if (field.flag[i][j] === 2) {
                    n = 1;
                } else {
                    n = 0;
                }

                this.drawSprite(j * 24 + 24, i * 24 + 24, n);
            }
        }
    };

    // ゲーム オブジェクト
    function Game() {
        this.field = null;
        this.display = null;

        this.image = null;

        this.imageLoaded = false; // 画像のロードが終わったことを示す
        this.sec = 0;
    }

    Game.prototype.init = function() { // 初期化

        // 画像を準備
        this.image = new Image();
        this.image.src = "sprite.png";

        // フィールドを準備
        this.field = new Field();
        this.field.prepare();

        // canvasを準備
        this.display = new Display();
        this.display.prepare("mine", this.field, this.image);

        // 各データを準備
        this.sec = 0;

        // イベントを登録
        this.display.canvas.
                addEventListener("click", bind(this.doClick, this));

        // タイマを登録
        setInterval(bind(this.doTimer, this), 1000);
    };

    Game.prototype.doTimer = function() { // 1秒間隔で呼び出される

        // 画像の読み込みを待つ
        if (!this.imageLoaded && this.image.complete) {
            this.imageLoaded = true;
        }

        if (this.imageLoaded) {

            // 時間を進める
            // this.sec++;

            // 残り時間、地雷数を表示

            this.display.drawField(this.field);
        } 
    };

    Game.prototype.doClick = function(e) { // クリックされた時に呼び出される
        var cx = 0,
            cy = 0;

        // 入力: カーソル位置
        cx = e.clientX - e.target.offsetLeft;
        cy = e.clientY - e.target.offsetTop;

        // マス単位の位置に変換
        cx = (cx - 24) / 24 ^ 0;
        cy = (cy - 24) / 24 ^ 0;

        if (cx >= 0 && cy >= 0 &&
                cx < this.field.width && cy < this.field.height) {

            // カーソルが画面内にある
            if (!e.ctrlKey) { // マスを開く

                if (this.field.isMine(cx, cy)) { // クリック位置が地雷

                    // ゲームオーバー
                    this.field.showAll();
                } else {

                    // 普通に開く
                    this.field.pick(cx, cy);
                }
            } else { // 印をつける

                if (this.field.flag[cy][cx] === 0) {
                    this.field.flag[cy][cx] = 2;
                } else if (this.field.flag[cy][cx] === 2) {
                    this.field.flag[cy][cx] = 0;
                }
            }

            // フィールドを再描画
            this.display.drawField(this.field);

            e.preventDefault();
        }
    };

    // 公開メソッド
    return {
        Field: Field,
        Game: Game
    };
}());
