/*
 *  微信： tornodo
 *  博客：https://www.jianshu.com/u/1b05a5363c32
 *  微信公众号： 工匠前沿
 */

var game = new Phaser.Game(1000, 600, Phaser.AUTO, 'game');

game.states = {};
// 引导
game.states.boot = function() {
    this.preload = function() {
        this.load.image('loading', 'assets/image/progress.png');
    },
    this.create = function() {
        this.state.start('preloader');
    }
}
// 用来显示资源加载进度
game.states.preloader = function() {
    this.preload = function() {
        var loadingSprite = this.add.sprite((this.world.width - 311) / 2, this.world.height / 2, 'loading');
        this.load.setPreloadSprite(loadingSprite, 0);
        this.load.tilemap('level1', 'assets/image/level1.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.spritesheet('player', 'assets/image/player.png', 32, 42);//加载序列图，每一个图像都是32X48
        this.load.atlasJSONHash('enemy', 'assets/image/enemy.png', 'assets/image/enemy.json');
        this.load.image('tiles', 'assets/image/Tileset.png');
        this.load.image('star', 'assets/image/star.png');
        this.load.image('heart', 'assets/image/heart.png');
		this.load.bitmapFont('font', 'assets/font/font_0.png', 'assets/font/font.fnt');
    },
    this.create = function() {
        this.state.start('start');
    }
}
//游戏界面
game.states.start = function() {
    this.preload = function() {
        //初始化状态
        this.gravityDown = 2300;//下落速度
        this.gravityUp = -750;//跳跃高度
        this.gravityLeft = -150;//左行走速度
        this.gravityRight = 150;//右行走速度
        this.climbSpeed = 150;
        this.coinSpeed = 1500;
        this.enemySpeed = 5000;

        this.hertSpeed = 1500;

        this.score = 0;

        this.Player_state_stand = 1; // 主角状态
        this.Player_state_jump = 2;
        this.Player_state_walk = 3;
        this.Player_state_climb = 4;

        this.enemyNames = ['boar_walk ', 'kong_walk ', 'shroom_walk ', 'turtle_walk ', 'boar_walk '];

        this.canClimb = false; // 是否可以爬行
        
        game.physics.startSystem(Phaser.Physics.ARCADE);
        this.input.maxPointers = 1;
        
    },
    this.create = function() {
		this.day = '#6888FF';
    	game.stage.backgroundColor = this.day;

        this.map = this.add.tilemap('level1');
        this.map.addTilesetImage("Tileset", "tiles");
    	this.map.setCollisionBetween(0, 1115); // 地块、石头
    	// this.map.setCollision([1242, 1243, 1244, 1245, 1246, 1247]); 
    	// this.map.setCollisionBetween(1179, 1181); // 梯子 
        this.land = this.map.createLayer('land');
        this.dingzi = this.map.createLayer('dingzi');
        
        this.land.resizeWorld();

        this.tipStar = this.add.sprite(20, 20, 'star');
        this.tipStar.anchor.set(0.5, 0.5);
        this.tip = game.add.bitmapText(40, 20, 'font', "0", this.tipStar.height);
        this.tip.anchor.set(0.5, 0.5);
        this.tip.x = this.tipStar.x + this.tipStar.width + 20;
        this.tipHeart = this.add.sprite(80, 20, 'heart');
        this.tipHeart.anchor.set(0.5, 0.5);
        this.tipHeart.x = this.tip.x + 120;
        this.healthText = game.add.bitmapText(80, 20, 'font', "100", this.tipStar.height);
        this.healthText.anchor.set(0.5, 0.5);
        this.healthText.x = this.tipHeart.x + this.tipHeart.width + 20;

        this.tipStar.fixedToCamera = true;
        this.tip.fixedToCamera = true;
        this.tipHeart.fixedToCamera = true;
        this.healthText.fixedToCamera = true;
        this.tipStar.shineTween = game.add.tween(this.tipStar).to({
            angle: 360
        },3000 , Phaser.Easing.Bounce.Out, false);

        this.tipHeart.shineTween = game.add.tween(this.tipHeart).to({
            angle: 360
        },1500 , Phaser.Easing.Bounce.InOut, false);

        game.physics.arcade.enable(this.land);// 开启物理引擎
        game.physics.arcade.enable(this.dingzi);// 开启物理引擎
        this.map.setTileIndexCallback([1242, 1243, 1244, 1245, 1246, 1247], this.overlapDingzi, this, this.dingzi);
        this.land.body.allowGravity = false;// 不用重力
        this.land.body.immovable = true;// 不可移动的，别的物体碰到后会反弹

        // this.map.setTileIndexCallback([1179, 1180, 1181, 1206, 1207, 1208, 1233, 1234, 1235, 1260, 1261, 1262, 1287, 1288, 1289, 1314, 1315, 1316, 1341, 1342, 1343], this.climb, this, this.land);// 梯子

        console.log(this.map.objects);

        this.coinGroup = game.add.group();
        this.coinGroup.enableBody = true;
        this.initCoins();

        this.tiziGroup = game.add.group();
        this.tiziGroup.enableBody = true;
        this.initTiZis();

        this.initPlayer();

        this.enemyGroup = game.add.group();
        this.enemyGroup.enableBody = true;
        this.initEnemys();

        this.cursors = game.input.keyboard.createCursorKeys();//上下左右四个键
        
    },
    this.update = function() {
        if (this.player.blood == 0) {
            this.gameover();
            return;
        }
        game.physics.arcade.collide(this.player, this.land);//碰撞检测
        game.physics.arcade.collide(this.player, this.dingzi);//碰撞检测
        game.physics.arcade.collide(this.land, this.enemyGroup);//碰撞检测
        game.physics.arcade.collide(this.land, this.coinGroup);//碰撞检测

        game.physics.arcade.overlap(this.player, this.tiziGroup, this.overlapTiZi, null, this);
        game.physics.arcade.overlap(this.player, this.enemyGroup, this.overlapEnemy, null, this);
        game.physics.arcade.overlap(this.player, this.coinGroup, this.overlapCoin, null, this);
        
        if (this.cursors.up.isDown) {
            if(this.player.playerState != this.Player_state_climb && this.player.body.onFloor()) {
                this.player.body.velocity.y = this.gravityUp;
                this.player.playerState = this.Player_state_jump;
            }
        }
	
	    if (this.cursors.left.isDown) {//向左跑
	        this.player.body.velocity.x = this.gravityLeft;
	        this.player.animations.play('left');
            this.player.playerState = this.Player_state_walk;
	    } else if (this.cursors.right.isDown) {//向右跑
	        this.player.body.velocity.x = this.gravityRight;
	        this.player.animations.play('right');
            this.player.playerState = this.Player_state_walk;
	    }
        // 静止
        if (this.player.body.onFloor() && !this.cursors.left.isDown && !this.cursors.right.isDown && !this.cursors.up.isDown && !this.cursors.down.isDown) {
            this.stand();
        }
    },
    this.initPlayer = function() {
        var mapPalyer = this.map.objects.player[0];
        this.player = this.add.sprite(0, 0, 'player');
	    game.physics.arcade.enable(this.player);//开启物理引擎
	    this.player.animations.add('left', [0, 1, 2, 3], 10, true);//左跑动画
	    this.player.animations.add('right', [5, 6, 7, 8], 10, true);//右跑动画
	    this.player.frame = 4;//默认显示第5张图片
        this.player.anchor.set(0.5, 1);
        this.player.x = mapPalyer.x + mapPalyer.width / 2;
        this.player.y = mapPalyer.y + mapPalyer.height;
	    this.player.body.gravity.y = this.gravityDown;
        this.player.body.collideWorldBounds = true;//检测边界，碰撞后反弹（需设置反弹参数）
        this.player.body.bounce.y = 0.2;
        this.player.playerState = this.Player_state_stand;
        this.player.blood = 100;
        this.player.canHeart = true;
        game.camera.follow(this.player);//摄像机跟随主角

        this.player.heartTween = game.add.tween(this.player).to({
            alpha: 0.1
        },this.hertSpeed , Phaser.Easing.Linear.None, false);
        this.player.heartTween.yoyo(true, 0);
        this.player.heartTween.onComplete.add(function(player) {
            player.canHeart = true;
            player.alpha = 1;
        }, this, 0, this.player);
    },
    this.initTiZis = function() {
        for(var i = 0; i < this.map.objects.tizi.length; ++i) {
            var rect = this.map.objects.tizi[i];
            var tizi = this.add.sprite(rect.x, rect.y);
            tizi.width = rect.width;
            tizi.height = rect.height;
            tizi.alive = true;
            tizi.alpha = true;
            game.physics.arcade.enable(tizi);
            tizi.body.allowGravity = false;
            tizi.body.immovable = true;
            this.tiziGroup.add(tizi);
        }
    },
    this.initCoins = function() {
        for(var i = 0; i < this.map.objects.coin.length; ++i) {
            var rect = this.map.objects.coin[i];
            var coin = this.add.sprite(rect.x, rect.y, 'star');
            coin.anchor.set(0.5, 0.5);
            coin.x = rect.x + rect.width / 2;
            coin.y = rect.y + rect.height / 2;
            game.physics.arcade.enable(coin);
            this.coinGroup.add(coin);
            coin.moveTween = game.add.tween(coin).to({
                y: coin.y - coin.height / 2,
                angle: 360
            }, this.coinSpeed, Phaser.Easing.Bounce.Out, true);
            coin.moveTween.yoyo(true, 0);
            coin.moveTween.repeat(500, 0);

            
            coin.finishTween = game.add.tween(coin).to({
                x: this.tipStar.x,
                y: this.tipStar.y,
                angle: -360
            },2000 , Phaser.Easing.Cubic.InOut, false);
            coin.finishTween.onComplete.add(function(coin) {
                coin.destroy();
                this.score++;
                this.tipStar.shineTween.start();
                this.tip.text = "" + this.score;
            }, this, 0, coin);
        }
    },
    this.initEnemys = function() {
        var len = this.enemyNames.length;
        for(var i = 0; i < this.map.objects.enemy.length; ++i) {
            var index = i % len;
            var name = this.enemyNames[index];
            var rect = this.map.objects.enemy[i];
            var enemy = this.add.sprite(rect.x, rect.y, 'enemy', name + '(1).png');
            enemy.y = rect.y + rect.height;
            game.physics.arcade.enable(enemy);
            enemy.body.setCircle((enemy.height - 10) / 2);
            enemy.anchor.set(0.5, 1);
            enemy.scale.set(0.5, 0.5);
            enemy.blood = 20;
            enemy.walkAnimation = enemy.animations.add("walk", Phaser.Animation.generateFrameNames(name + "(", 1, 8, ").png", 0), 12, true);
            
            enemy.body.collideWorldBounds = true;
            enemy.body.gravity.y = this.gravityDown;
            this.enemyGroup.add(enemy);
            enemy.walkAnimation.play(10, true);
            
            enemy.moveTweenRight = game.add.tween(enemy).to({
                x: rect.x + rect.width - enemy.width / 2
            }, this.enemySpeed, Phaser.Easing.Linear.None, true);
            enemy.moveTweenLeft = game.add.tween(enemy).to({
                x: rect.x
            }, this.enemySpeed, Phaser.Easing.Linear.None, false);
            enemy.moveTweenRight.onComplete.add(function(enemy) {
                enemy.scale.x = -enemy.scale.x;
                enemy.moveTweenLeft.start();
            }, this, 0, enemy);
            enemy.moveTweenLeft.onComplete.add(function(enemy) {
                enemy.scale.x = -enemy.scale.x;
                enemy.moveTweenRight.start();
            }, this, 0, enemy);

            enemy.finishTween = game.add.tween(enemy).to({
                alpha: 0
            },this.hertSpeed , Phaser.Easing.Linear.None, false);
            enemy.finishTween.onComplete.add(function(enemy) {
                enemy.destroy();
            }, this, 0, enemy);
        }
    },
    this.overlapTiZi = function(player, tizi) {
        if (!this.cursors.up.isDown && !this.cursors.down.isDown && this.isStandOnTiZi(tizi)) {
            game.physics.arcade.collide(this.player, tizi);
            this.stand();
        } else if (this.cursors.up.isDown && this.player.playerState != this.Player_state_jump) {
            if (this.isStandOnTiZi(tizi)) {
                this.player.body.velocity.y = this.gravityUp;
                this.player.playerState = this.Player_state_jump;
            } else {
                this.player.body.velocity.y = -this.climbSpeed;
                this.player.playerState = this.Player_state_climb;
            }
        } else if (this.cursors.down.isDown && this.player.playerState != this.Player_state_jump) {
            this.player.body.velocity.y = this.climbSpeed;
            this.player.playerState = this.Player_state_climb;
        }
    },
    this.overlapEnemy = function(player, enemy) {
        if (!this.player.canHeart) {
            return;
        }
        if ((player.y - (enemy.y - enemy.height) > 30)) {
            player.blood -= 10;
            this.healthText.text = '' + player.blood;
            this.player.canHeart = false;
            this.player.body.velocity.y = -300;
            var x = 0;
            if (this.player.x >= enemy.x) {
                x = 300;
            } else {
                x = -300;
            }
            this.player.body.velocity.x = x;
            this.player.heartTween.start();
            this.tipHeart.shineTween.start();
        } else {
            this.player.body.velocity.y = -300;
        }
        enemy.blood -= 10;
        if (enemy.blood == 0) {
            enemy.alive = false;
            enemy.walkAnimation.stop();
            enemy.moveTweenRight.stop();
            enemy.moveTweenLeft.stop();
            enemy.finishTween.start();
        }
    },
    this.overlapDingzi = function() {
        if (!this.player.canHeart) {
            return;
        }
        this.player.blood -= 10;
        this.healthText.text = '' + this.player.blood;
        this.player.canHeart = false;
        this.player.body.velocity.y = -300;
        this.player.heartTween.start();
        this.tipHeart.shineTween.start();
    },
    this.overlapCoin = function(player, coin) {
        coin.moveTween.stop();
        coin.finishTween.start();
    },
    this.isStandOnTiZi = function (tizi) {
        return this.player.y - tizi.y < 10;
    },
    this.stand = function() {
        this.player.body.velocity.x = 0;
	    this.player.body.gravity.y = this.gravityDown;
        this.player.animations.stop();
        this.player.frame = 4;
        this.player.playerState = this.Player_state_stand;
    },
    this.gameover = function() {
        this.player.destroy();
        this.coinGroup.destroy();
        this.enemyGroup.destroy();
        this.tipStar.destroy();
        this.tip.destroy();
        this.tipHeart.destroy();
        this.healthText.destroy();
        console.log(game.tweens);
        game.tweens.destroy();
    },
    this.startGame = function() {
        this.state.start('start');
    },
    this.render = function() {
        // game.debug.body(this.player);
        // this.enemyGroup.forEach(function(item){
        //     // game.debug.body(item);
        //     game.debug.rectangle(item);
        // });
    }
}

game.state.add('boot', game.states.boot);
game.state.add('preloader', game.states.preloader);
game.state.add('start', game.states.start);
game.state.start('boot');