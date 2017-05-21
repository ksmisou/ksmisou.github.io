/*
ペンギン佐藤LIBRE Version 1.0 
自由ソフトウェアとして再リリースしたバージョン

@licstart  The following is the entire license notice for the
JavaScript code in this page.

Copyright 2015, 2017 Kasumi-sou <jiyugi@yahoo.com>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

@licend  The above is the entire license notice
for the JavaScript code in this page.
*/
var Joya = (function() {
	'use strict';
	
	// メソッド郡
	// プログラムの内部・外部どこからでも扱える
	var Joya = {};
	
	Joya.canvasId = 'joya-canvas';
	Joya.inputValue = 0;
	Joya.keyMap = [];
	Joya.keyMap[37] = 1;
	Joya.keyMap[38] = 2;
	Joya.keyMap[39] = 4;
	Joya.keyMap[40] = 8;
	Joya.keyMap[90] =
	Joya.keyMap[32] =
	Joya.keyMap[13] = 16;
	
	// 起動
	Joya.startUp = function() {
		Joya._main = new Main();
		Joya._view = new View();
		Joya._interval();
	};
	
	// 仮
	Joya.keyEvent = function(e) {
		var kc = e.keyCode;
		var map = Joya.keyMap;
		var hit = 0;
		
		if (kc in map) {
			hit = map[kc];
			e.preventDefault();
		}
		
		if (e.type === 'keydown') {
			Joya.inputValue |= hit;
		}
		else if (e.type === 'keyup') {
			Joya.inputValue &= ~hit;
		}
	};
	
	// 定期処理開始
	Joya._interval = function() {
		var call;
		var start;
		var last;
		var self = this;
		
		if ('requestAnimationFrame' in window) {
			start = new Date - 0;
			last = 0;
			
			call = function() {
				var f = ((new Date).getTime() - start) / 50 ^0;
				
				if (f !== last) {
					last = f;
					self._inFrame();
				}
				
				requestAnimationFrame(call);
			};
		}
		else {
			call = function() {
				var prev = new Date - 0;
				self._inFrame();
				setTimeout(call, 50 - (new Date - prev));
			};
		}
		
		call();
	};
	
	// 各フレーム毎の処理
	Joya._inFrame = function() {
		this._main.state.update();
		this._view.update(Joya._main);
	};
	
	Joya.isLoadComplete = function() {
		return (this._view.title.complete && this._view.background.complete && this._view.pattern.complete);
	};

	// ゲーム中のキャラクター全般を示すクラス
	var Thing = function(x, y) {
		this.active = false;
		this.x = x;
		this.y = y;
		this.vx = 0;
		this.vy = 0;
		this.angle = 0;
		this.vel = 0;
		
		this.count = 0;
		this.bc = 0;
	};
	
	Thing.prototype.update = function() {
		this.x += this.vx;
		this.y += this.vy;
	};
	
	Thing.prototype.bomb = function() {
		var res = false;
		
		if (this.bc !== 0) {
			if (this.bc < 20) {
				this.bc++;
			}
			else {
				this.active = false;
			}
			
			res = true;
		}
		
		return res;
	};
	
	Thing.prototype.velByAngle = function() {
		var m = Math;
		var rad = (this.angle / 180 * 3.14);
		this.vx = m.cos(rad) * this.vel;
		this.vy = m.sin(rad) * this.vel;
	};
	
	Thing.prototype.collisionOtherThing = function(tg) {
		var x = (this.x + 14 > tg.x - 2 && this.x - 2 < tg.x + 14);
		var y = (this.y + 14 > tg.y - 2 && this.y - 2 < tg.y + 14);
		return (tg.bc === 0 && x && y);
	};

	// ゲームの主な流れを管理するクラス
	var Main = function() {
		this.state = null;
		this.player = null;
		this.changeState('NowLoad');
	};
	
	// フレーム毎の処理
	Main.prototype.update = function() {
		this.state.update();
	};
	
	// 現在のモードを廃棄し、切り替え
	Main.prototype.changeState = function(name) {
		this.state = new (Mode[name]);
		this.state.setMain(this);
		this.state.start();
	};

	var View = function() {
		var id = Joya.canvasId;
		var cv = document.getElementById(id);
		this.context2d = cv.getContext('2d');
		
		// Joyaに移行？
		var img = new Image;
		img.src = ['title.png', new Date - 0].join('?');
		
		this.title = img;
		
		img = new Image;
		img.src = ['bg.png', new Date - 0].join('?');
		
		this.background = img;
		
		img = new Image;
		img.src = ['pt.png', new Date - 0].join('?');
		
		this.pattern = img;
	};
	
	View.prototype.update = function(dtg) {
		dtg.state.draw(this.context2d, this);
	};
	
	View.prototype.drawChip = function(ctx, code, x, y) {
		var sx = (code % 16) * 16;
		var sy = (code / 16 ^0) * 16;
		
		ctx.drawImage(this.pattern, sx, sy, 16, 16, x, y, 16, 16);
	};
	
	View.prototype.drawChar = function(ctx, c, x, y) {
		ctx.drawImage(this.pattern, c * 8, 0, 8, 8, x, y, 8, 8);
	};
	
	View.prototype.drawScore = function(ctx, n) {
		ctx.drawImage(this.pattern, 0, 8, 48, 8, 0, 0, 48, 8);
		this.drawChar(ctx, (n/1e3^0) % 10, 48, 0);
		this.drawChar(ctx, (n/100^0) % 10, 56, 0);
		this.drawChar(ctx, (n/10^0) % 10, 64, 0);
		this.drawChar(ctx, n%10, 72, 0);
	};
	

	// 各モードの動き、固有メソッド
	var Mode = function() {};
	
	Mode.add = function(name) {
		this[name] = function() {};
		this[name].prototype = new this;
	};
	
	// インターフェースのような物
	Mode.prototype = {
		start: function() {},
		update: function() {},
		draw: function(ctx, view) {}
	};
	
	// メインオブジェクト組付
	Mode.prototype.setMain = function(main) {
		this.main = main;
	};

	// ロード中
	Mode.add('NowLoad');
	
	Mode.NowLoad.prototype.update = function() {
		if (Joya.isLoadComplete()) {
			this.main.changeState('Title');
		}
	};
	

	// タイトル画面
	Mode.add('Title');
	
	Mode.Title.prototype.start = function() {
		this.time = 0;
	};
	
	Mode.Title.prototype.update = function() {
		if (this.time < 28) {
			this.time++;
		}
		else if (this.time === 28){
			if (Joya.inputValue & 16) {
				this.time++;
			}
		}
		else {
			this.time++;
			
			if (this.time > 48) {
				this.main.changeState('Main');
			}
		}
	};
	
	Mode.Title.prototype.draw = function(ctx, view) {
		var logoY = 80;
		
		if (this.time < 28) {
			logoY = this.time * 4 - 32;
		}
		else if (this.time > 28) {
			logoY = -33;
		}
		
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, 256, 256);
		
		if (logoY >= -32) {
			ctx.drawImage(view.title, 32, logoY);
		}
	};
	

	// メイン画面
	Mode.add('Main');
	Mode.Main.prototype.start = function() {
		this.main.score = 0;
		
		this.time = 0;
		
		this.player = new Thing(120, 106);
		this.player.angle = 90;
		this.player.active = true;
		
		this.ball;
		this.setUpBall();
		
		this.enemys = [];
		
		var i;
		for (i = 0; i < 32; i++) {
			this.enemys[i] = new Thing(0, 0);
		}
	};
	
	Mode.Main.prototype.update = function() {
		this.time++;
		this.movePlayer();
		
		if (!this.player.active) {
			this.main.changeState('Gameover');
		}
		
		if (this.ball.active) {
			this.moveBall();
		}
		else {
			this.setUpBall();
		}
		
		this.moveEnemys();
		
		if (this.time % 10 === 0) {
			this.addRandomEnemy();
		}
	};
	
	// プレイキャラを動かす
	Mode.Main.prototype.movePlayer = function() {
		var th = this.player;
		var m = Math;
		var iv = Joya.inputValue;
		var l = ((iv & 1) !== 0);
		var r = ((iv & 4) !== 0);
		var u = ((iv & 2) !== 0);
		var d = ((iv & 8) !== 0);
		
		if (!th.bomb()) {
			if (l) {
				th.angle = u? 225: d? 135: 180;
			}
			else if (r) {
				th.angle = u? 315: d? 45: 0;
			}
			else {
				th.angle = u? 270: d? 90: th.angle;
			}
			
			if (l || r || u || d) {
				if (th.vel < 5) {
					th.vel ++;
				}
				
				th.count ++;
				th.count = th.count % 4;
			}
			else if (th.vel > 0) {
				th.vel --;
			}
			
			th.velByAngle();
			th.update();
			
			th.x = m.max(th.x, 16);
			th.x = m.min(th.x, 224);
			th.y = m.max(th.y, 8);
			th.y = m.min(th.y, 192);
		}
	};
	
	// ボールをランダムな位置に設置する
	Mode.Main.prototype.setUpBall = function() {
		var th = new Thing;
		var m = Math;
		var x = m.random() * 12 ^0;
		var y = m.random() * 9 ^0;
		
		th.active = true;
		th.x = 32 + x * 16;
		th.y = 32 + y * 16;
		
		if (th.y/16^0 === this.player.y/16^0) {
			th.y += 16;
		}
		
		this.ball = th;
	};
	
	Mode.Main.prototype.moveBall = function() {
		var th = this.ball;
		var r;
		var pl = this.player;
		
		if (th.collisionOtherThing(pl)) {
			r = Math.atan2(pl.y - th.y, pl.x - th.x);
			th.angle = r * 180 / Math.PI;
			th.vel -= 3;
			th.velByAngle();
			th.vx = (th.vx + pl.vx) / 2;
			th.vy = (th.vy + pl.vy) / 2;
		}
		
		th.update();
		
		if (th.x < -64 || th.x > 256 + 64 || th.y < -64 || th.y > 224 + 64) {
			th.active = false;
		}
	};
	
	Mode.Main.prototype.addEnemy = function(x, y, vel, a) {
		var i;
		var th;
		for (i = 0; i < 32; i++) {
			if (!this.enemys[i].active) {
				break;
			}
		}
		
		if (i < 32) {
			th = new Thing(x, y);
			th.active = true;
			th.angle = a;
			th.vel = 3;
			th.velByAngle();
			this.enemys[i] = th;
		}
	};
	
	Mode.Main.prototype.addRandomEnemy = function() {
		var m = Math;
		var x = 128 - 8;
		var y = 112 - 8;
		var a = m.random() * 360 ^0;
		var r = (a / 180 * 3.14);
		
		x += 160 * m.cos(r);
		y += 160 * m.sin(r);
		
		this.addEnemy(~~x, ~~y, 3, (a - 180) % 360);
	};
	
	Mode.Main.prototype.moveEnemys = function() {
		var i;
		for (i = 0; i < 32; i++) {
			if (this.enemys[i].active) {
				this.moveEnemy(this.enemys[i]);
			}
		}
	};
	
	Mode.Main.prototype.moveEnemy = function(th) {
		if (!th.bomb()) {
			th.update();
			
			if (th.collisionOtherThing(this.ball) && this.ball.vel !== 0) {
				th.bc = 1;
				this.ball.count ++;
				
				if (this.ball.count > 9) {
					this.ball.count = 9;
				}
				
				this.main.score += this.ball.count;
			}
			
			if (th.collisionOtherThing(this.player)) {
				this.player.bc = 1;
			}
			
			if (th.x < -32 || th.x > 256 + 32 || th.y < -32 || th.y > 224 + 32) {
				th.active = false;
			}
		}
	};
	
	Mode.Main.prototype.draw = function(ctx, view) {
		ctx.drawImage(view.background, 0, 0);
		
		this.drawBall(ctx, view, this.ball);
		
		this.drawEnemys(ctx, view);
		
		if (this.player.bc === 0) {
			this.drawPlayer(ctx, view, this.player);
		}
		else {
			this.drawBomb(ctx, view, this.player)
		}
		
		view.drawScore(ctx, this.main.score);
	};
	
	Mode.Main.prototype.drawBomb = function(ctx, view, tg) {
		view.drawChip(ctx, 6 + (tg.bc / 4 ^0), tg.x ^0, tg.y ^0);
	};
	
	Mode.Main.prototype.drawPlayer = function(ctx, view, tg) {
		var code = 16 + (tg.angle / 45 ^0) * 2;
		
		if (tg.count % 4 > 1) {
			code += 1;
		}
		
		view.drawChip(ctx, code, tg.x ^0, tg.y ^0);
	};
	
	Mode.Main.prototype.drawBall = function(ctx, view, tg) {
		view.drawChip(ctx, 35, (tg.x - tg.vx) ^0, (tg.y - tg.vy) ^0);
		view.drawChip(ctx, 34, tg.x ^0, tg.y ^0);
		
		if (tg.count > 0) {
			view.drawChar(ctx, tg.count, tg.x + 4, tg.y - 8);
		}
	};
	
	Mode.Main.prototype.drawEnemy = function(ctx, view, tg) {
		view.drawChip(ctx, 33, tg.x ^0, tg.y ^0);
		view.drawChip(ctx, 32, (tg.x + tg.vx) ^0, (tg.y + tg.vy) ^0);
	};
	
	Mode.Main.prototype.drawEnemys = function(ctx, view) {
		var i;
		for (i = 0; i < 32; i++) {
			if (!this.enemys[i].active) {
				continue;
			}
			
			if (this.enemys[i].bc === 0) {
				this.drawEnemy(ctx, view, this.enemys[i]);
			}
			else {
				this.drawBomb(ctx, view, this.enemys[i]);
			}
		}
	};
	

	// ゲームオーバー画面
	Mode.add('Gameover');
	
	Mode.Gameover.prototype.update = function() {
		if (Joya.inputValue & 16) {
			this.main.changeState('Title');
		}
	};
	
	Mode.Gameover.prototype.draw = function(ctx, view) {
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, 256, 244);
		view.drawScore(ctx, this.main.score);
		
		ctx.drawImage(view.pattern, 192, 0, 64, 16, 96, 96, 64, 16);
	};
	
	
	return Joya;
}).call(this);

(function() {
	function onload() {
		Joya.startUp();
	}
	
	function key(e) {
		Joya.keyEvent(e);
	}
	
	addEventListener('load', onload);
	addEventListener('keydown', key);
	addEventListener('keyup', key);
}).call(this);

