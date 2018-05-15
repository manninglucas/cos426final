// main.js
// Lucas Manning
// globals =====================================================================

let game_g;
// constants ===================================================================

// keep updates separate from rendering, update 60 times per sec
const UPDATE_TICK_RATE = 1000 / 60;
const collisionSide = {
    top : 0,
    bottom : 1,
    left : 2,
    right : 3,
    none : 4
};

// =============================================================================
//The rectangle should have x,y,width,height properties

class Game {
    constructor(canvas, levels) {
        // canvas setup
        this.ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        this.width = canvas.width;
        this.height = canvas.height;
        this.rect = {
            x:this.width/2-50,
            y:this.height/2+10,
            width:100,
            height:50
        };
        this.mouseCoords = {
            x: 0,
            y: 0
        }
        this.upPressed = false;
        this.downPressed = false;
        this.rightPressed = false;
        this.leftPressed = false;
        this.currentTime = new Date();
        this.lives = 3;
        this.level = 0;
        this.levels = levels;
        this.submitted = false;
        this.startTime=new Date();
        this.camera = new THREE.Vector3(this.width / 2, this.height / 2);
        this.backgroundImage = new Image();
        this.spike = new Image();
        this.spike.src = 'spikes.png';
        // draw setup
        this.ctx.fillStyle = 'rgb(0,0,0)';
        const levelData = this.levels[this.level];
        this.entities = [];
        this.spikes = [];
        this.goalImg = new Image();
        this.goalImg.src = 'submit.png';
        let goalpos = new THREE.Vector3(levelData.submitLocation.x * this.width, levelData.submitLocation.y * this.height);
        this.submitButton = new Entity(goalpos,
            380, 48, new THREE.Vector3, false);

        this.backgroundImage.src = levelData.backgroundImage;

        levelData.platforms.forEach(p => {
            let pos = new THREE.Vector3(p.x * this.width, p.y * this.height);
            let platform = new Entity(pos, Math.round(p.width * this.width), Math.round(p.height * this.height), 
                new THREE.Vector3(0,0), false);
            this.entities.push(platform);
        });

        levelData.spikes.forEach(p => {
            let pos = new THREE.Vector3(p.x * this.width, p.y * this.height);
            let spike = new Entity(pos, Math.round(p.width * this.width), Math.round(p.height * this.height), 
                new THREE.Vector3(0,0), false);
            this.spikes.push(spike);
        });

        levelData.enemies.forEach(e => {
            let pos = new THREE.Vector3(e.x * this.width, e.y * this.height);
            let enemy = new Enemy(pos, 64, 64, 
                new THREE.Vector3(0,0));
            this.entities.push(enemy);
        });

        let pos = new THREE.Vector3(levelData.playerStart.x * this.width, 
            levelData.playerStart.y * this.height);
        this.player = new Player(pos, 64, 64, new THREE.Vector3());
        this.gravity = new THREE.Vector3(0, 20);
    }

    loadLevel() {
        const levelData = this.levels[this.level];

        this.backgroundImage.src = levelData.backgroundImage;
        this.entities = [];
        levelData.platforms.forEach(p => {
            let pos = new THREE.Vector3(p.x * this.width, p.y * this.height);
            let platform = new Entity(pos, Math.round(p.width * this.width), Math.round(p.height * this.height), 
                new THREE.Vector3(0,0), false);
            this.entities.push(platform);
        });

        this.enemies = [];
        levelData.enemies.forEach(e => {
            let pos = new THREE.Vector3(e.x * this.width, e.y * this.height);
            let enemy = new Enemy(pos, 64, 64, 
                new THREE.Vector3(0,0));
            this.entities.push(enemy);
        });

        this.spikes = [];
        levelData.spikes.forEach(p => {
            let pos = new THREE.Vector3(p.x * this.width, p.y * this.height);
            let spike = new Entity(pos, Math.round(p.width * this.width), Math.round(p.height * this.height), 
                new THREE.Vector3(0,0), false);
            this.spikes.push(spike);
        });

        let pos = new THREE.Vector3(levelData.playerStart.x * this.width, 
            levelData.playerStart.y * this.height);
        this.player = new Player(pos, 64, 64, new THREE.Vector3());
    }

    updateCamera() {
        if (this.player.pos.x > this.camera.x + (this.width / 4)) {
            let offset = this.player.pos.x - (this.camera.x + (this.width / 4));
            this.camera.setX(this.camera.x + offset);
        } else if (this.player.pos.x < this.camera.x - (this.width / 4)) {
            let offset = this.player.pos.x - (this.camera.x - (this.width / 4));
            this.camera.setX(this.camera.x + offset);
        }
    }

    update(delta_t) {
        var force = new THREE.Vector3(0, 0);
        force.add(this.gravity);

        if (this.player.top() < 0) {
            let pos = new THREE.Vector3(levelData.playerStart.x * this.width, 
                levelData.playerStart.y * this.height);
            this.player = new Player(pos, 20, 40, new THREE.Vector3());
        }

        var playerMovement = new THREE.Vector3(0, 0);
        if(this.rightPressed == true) {
            if(this.player.pos.y >= this.height - this.player.height/2) {
                playerMovement.setComponent(0, playerMovement.x + 50);
            }
                playerMovement.setComponent(0, playerMovement.x + 25);
            this.player.faceRight();
        }

        if(this.leftPressed == true) {
            if(this.player.isJumping()){
                playerMovement.setComponent(0, playerMovement.x - 50);
            }
            else
                playerMovement.setComponent(0, playerMovement.x - 25);
            this.player.faceLeft();
        }

        if(this.upPressed == true) {
            this.player.jump();
        }

        if(this.downPressed == true) {
            playerMovement.setComponent(1, playerMovement.y+75);
        }

        // friction
        if (Math.abs(this.player.vel.x) > 1) {
            if(!this.player.isJumping() && !this.player.isFalling()){
                if (this.rightPressed == false && this.leftPressed == false) {
                    if(this.player.vel.x > 0)
                        playerMovement.setComponent(0, playerMovement.x - 20);
                    else if(this.player.vel.x < 0)
                        playerMovement.setComponent(0, playerMovement.x + 20);
                }
                if (this.downPressed == true) {
                    if(this.player.vel.x > 0)
                        playerMovement.setComponent(0, playerMovement.x - 40);
                    else if(this.player.vel.x < 0)
                        playerMovement.setComponent(0, playerMovement.x + 40);
                } else {
                }
            }
        } else {
            this.player.vel.setX(this.player.vel.x * 0.3);
        }

        if (this.downPressed)
            this.player.stopping = true;
        else
            this.player.stopping = false;

        force.add(playerMovement);
        this.entities.forEach(entity => {
            if (entity instanceof Enemy) {
                entity.update(this.player, this.entities);
            }

            if (entity.dynamic === true) {
                // these two calls are very parallelizable. Multithreaded?
                entity.applyForce(this.gravity, delta_t);

                // this needs to be sequential to avoid race conditions
            }
            entity.updatePosition(this.width, this.height, delta_t);

            this.entities.forEach(e => {
                let normal = this.player.detectCollison(e, delta_t);
                if (normal !== undefined) this.player.resolveCollision(e, delta_t, normal);

                if (entity.dynamic == true) {
                    if (e._id != entity._id) {
                        let normal = entity.detectCollison(e, delta_t);
                        if (normal !== undefined) entity.resolveCollision(e, delta_t, normal);
                    }
                }
            });
        });

        this.spikes.forEach(spike => {
            if (spike.dynamic === true) {
                // these two calls are very parallelizable. Multithreaded?
                spike.applyForce(this.gravity, delta_t);
                spike.updatePosition(this.width, this.height, delta_t);

                // this needs to be sequential to avoid race conditions
            }
            if(this.resolveCollision(spike, delta_t)) this.takesDamage();
        });

        if (this.player.detectCollison(this.submitButton, delta_t) !== undefined) {
            if(this.level < this.levels.length) {
                this.level++;
            if(this.level !== this.levels.length) {
                this.loadLevel();
                }
            }
        }

        if(this.player.pos.y > this.height+this.player.height/2 && this.lives !==0) {
            this.takesDamage();
        }

        this.player.applyForce(force, delta_t);
        this.player.updatePosition(this.width, this.height, delta_t);
        this.updateCamera();
    }

    takesDamage (){
        this.lives--;
        if(this.lives!==0)
            if(this.level !== this.levels.length)
                this.loadLevel();
    }

    // need to use a good detection scheme, ideally one that has better than
    // n^2 runtime
    resolveCollision(entity, delta_t) {
        //this.entities.forEach(e => {
            // Could only check collision if entity is within camera to save time
        let normal = this.player.detectCollison(entity, delta_t);
        if (normal !== undefined){
            this.player.resolveCollision(entity, delta_t, normal);
            return true;
        }
        return false;
        //});       
    }


    keyPressedHandler(e) {
      if(this.lives == 0 || this.level == this.levels.length) return false;
      if(e.keyCode == 87) {
        this.upPressed = true;
      }
      if(e.keyCode == 83) {
        this.downPressed = true;
      }
      if(e.keyCode == 68) {
        this.rightPressed = true;
      }
      if(e.keyCode == 65) {
        this.leftPressed = true;
      }
    }

    keyNeutral(e) {
        
      if(e.keyCode == 87) {
        this.upPressed = false;
      }
      if(e.keyCode == 83) {
        this.downPressed = false;
      }
      if(e.keyCode == 68) {
        this.rightPressed = false;
      }
      if(e.keyCode == 65) {
        this.leftPressed = false;
      }
    }

    //Function to get the mouse position
 getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}
//Function to check whether a point is inside a rectangle
isInside(pos, rect){
    return pos.x > rect.x && pos.x < rect.x+rect.width && pos.y < rect.y+rect.height && pos.y > rect.y && (this.lives==0 || this.level == this.levels.length)
}




    draw() {
        //this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(this.backgroundImage, 0, 0, this.width, this.height);

        const levelData = this.levels[this.level];
        this.ctx.drawImage(this.goalImg, Math.round(this.submitButton.left() - (this.camera.x) + (this.width / 2)),
             this.submitButton.top());
        
        this.ctx.fillStyle = "#0095DD";
        this.entities.forEach(entity => {
            if (entity.hasSprite) {
                this.ctx.drawImage(entity.getSprite(), Math.round(entity.left() - (this.camera.x) + (this.width / 2)),
                    entity.top(), entity.width, entity.height);
            } else {
                this.ctx.fillRect(Math.round(entity.left() - (this.camera.x) + (this.width / 2)), 
                    entity.top(), 
                    entity.width, entity.height);
            }
        });

        this.spikes.forEach(spike => {
            this.ctx.drawImage(this.spike, Math.round(spike.left() - (this.camera.x) + (this.width / 2)), 
                spike.top(), 
                spike.width, spike.height);
        });

        this.ctx.fillStyle = "#000000";
        let playerImg = this.player.getSprite();


        if (!this.player.facingRight) {
            this.ctx.save();
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(playerImg, -Math.round(this.player.left() - this.camera.x + (this.width / 2)), 
                this.player.top(),
                -this.player.width, this.player.height);
            this.ctx.restore();
        } else {
            this.ctx.drawImage(playerImg, Math.round(this.player.left() - this.camera.x + (this.width / 2)), 
                this.player.top(),
                this.player.width, this.player.height);
        }


        var angle = Math.atan2(this.player.pos.y-this.mouseCoords.y, this.player.pos.x- this.camera.x + (this.width / 2)-this.mouseCoords.x)*Math.PI/180.0;//(this.player.pos.x - this.camera.x + (this.width / 2))-this.mouseCoords.x);
        var direction = new THREE.Vector2(this.mouseCoords.x- (this.player.pos.x - this.camera.x + (this.width / 2)), this.mouseCoords.y-this.player.pos.y).normalize();
        var xCord = direction.x*30 + this.player.pos.x - this.camera.x + (this.width / 2) + 10;
         var yCord = direction.y*40 + this.player.pos.y+10;
         var originX = this.player.pos.x - this.camera.x + (this.width / 2) + 10;
         this.ctx.beginPath();
            this.ctx.save();
            this.ctx.translate(Math.cos(angle) * (xCord-originX) - Math.sin(angle) * (yCord-this.player.pos.y) + originX, Math.sin(angle) * (xCord-originX) + Math.cos(angle) * (yCord-this.player.pos.y) + this.player.pos.y);
            this.ctx.rotate(angle/(Math.PI/180.0));
            this.ctx.fillRect(0,0,7, this.player.height/4);
            this.ctx.stroke();
            this.ctx.restore();

        // friction bubbles
        if(!this.player.isFalling() && !this.player.isJumping()) {
                for(var i = 0; i < 25; i++) {
                    this.ctx.beginPath();
                    var angle = Math.random()*Math.PI/4;
                    if(this.player.vel.x > 0 && this.leftPressed) {
                        this.ctx.arc(this.player.pos.x - this.camera.x + (this.width / 2) 
                        + 30*Math.random()*Math.cos(angle), this.player.bottom() - 30*Math.random()*Math.sin(angle),
                         Math.random() * 2, 0, 2 * Math.PI);
                    }
                    else if(this.player.vel.x < 0 && this.rightPressed) {
                        this.ctx.arc(this.player.pos.x - this.camera.x + (this.width / 2) 
                        - 30*Math.random()*Math.cos(angle), this.player.bottom() - 30*Math.random()*Math.sin(angle), 
                        Math.random() * 2, 0, 2 * Math.PI);
                    } else if (this.downPressed && Math.abs(this.player.vel.x) > 5) {
                        if (this.player.vel.x < 0) {
                            this.ctx.arc(this.player.pos.x - this.camera.x + (this.width / 2) 
                            + 30*Math.random()*Math.cos(angle), this.player.bottom() - 30*Math.random()*Math.sin(angle),
                            Math.random() * 2, 0, 2 * Math.PI);
                        } else if (this.player.vel.x > 0) {
                            this.ctx.arc(this.player.pos.x - this.camera.x + (this.width / 2) 
                            - 30*Math.random()*Math.cos(angle), this.player.bottom() - 30*Math.random()*Math.sin(angle), 
                            Math.random() * 2, 0, 2 * Math.PI);
                        }
                    }
                    this.ctx.fill();
                    this.ctx.stroke();
                }
        }

        //Draw score
        this.ctx.font = "16px Arial";
        this.ctx.fillText("Late Days: "+this.lives, 8, 20);

        //Timer
        if(this.lives!==0 && this.level < this.levels.length)
            this.currentTime = new Date();
        var seconds = Math.floor((this.currentTime - this.startTime)/1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        if(seconds > 59)
            seconds = seconds%60;
        if(minutes > 59)
            minutes = mintes%60;
        // this line taken from https://jsfiddle.net/Daniel_Hug/pvk6p/
        var stopwatch = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds);
        this.ctx.fillText(stopwatch, canvas.width-65, 20);

        if(this.lives == 0 || this.level == this.levels.length) {
            this.player.vel = new THREE.Vector3(0, 0);
            this.ctx.beginPath();
            this.ctx.rect(this.width/2-150, this.height/2-75, 300, 150);
            this.ctx.fillStyle = 'rgb(255,255,255)';
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.font = "30px Arial";

            if(this.level == this.levels.length) {
            this.ctx.fillStyle = 'rgb(0,125,0)';
            this.ctx.fillText("CONGRATULATIONS", this.width/2-147, this.height/2-25);
            }

            else {
            this.ctx.fillStyle = 'rgb(125,0,0)';
            this.ctx.fillText("YOU DIED", this.width/2-70, this.height/2-25);
            
            }

            this.ctx.font = "12px Arial";
            this.ctx.fillStyle = 'rgb(0,0,0)';
            this.ctx.fillText(stopwatch, this.width/2-25, this.height/2);

            this.ctx.beginPath();
            this.ctx.rect(this.width/2-50, this.height/2+10, 100, 50);
            this.ctx.fillStyle = 'rgb(125,125,125)';
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.fillStyle = 'rgb(0,0,0)';
            this.ctx.fillText("Play Again", this.width/2-25, this.height/2+35);
        }
    }

    randn_bm() {
        var u = 0, v = 0;
        while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    }
    
}

class Entity {
    constructor(pos, width, height, vel, dynamic = true) {
        // pos is center of the entity
        this.pos = pos;
        this.vel = vel;
        this.width = width;
        this.height = height;
        this.hasSprite = false;
        // does the entity move? false for static platforms 
        this.dynamic = dynamic;
        this.hostile = false;
        this.laser = false;
        this._id = Math.floor(Math.random() * 10000000);
    }

    // returns side and point
    detectCollison(e, delta_t) {
        let next = this.vel.clone().multiplyScalar(delta_t);
        if (this.right() + next.x > e.left() && this.left() + next.x < e.right()
            && this.bottom() > e.top() && this.top() < e.bottom())
        {
            if (next.x > 0){
                return new THREE.Vector3(-1, 0);
            } else{
                return new THREE.Vector3(1, 0);
            }
        }
        if (this.right() > e.left() && this.left() < e.right()) {
            if( this.bottom() + next.y > e.top() && this.top() + next.y < e.bottom())
            {
                if (next.y > 0) {
                    this._isJumping = false;
                    return new THREE.Vector3(0, 1);
                } else { 
                   return new THREE.Vector3(0, -1);
                }
            }
        }
        return undefined;
    }

    resolveCollision(e, delta_t, normal) {
        this.falling = false;
        this.vel.projectOnPlane(normal);
        let offsets = new THREE.Vector3( 
            normal.x > 0 ? (this.left() - e.right()) : (this.right() - e.left()),
            normal.y > 0 ? (this.bottom() - e.top()) : (this.top() - e.bottom()) 
        );
        offsets.multiply(normal);
        this.pos.sub(offsets);
        if (Math.abs(normal.x) > Math.abs(normal.y)) this.pos.setX(Math.round(this.pos.x));
        else this.pos.setY(Math.round(this.pos.y));
    }

    top() {
        return Math.round(this.pos.y - (this.height / 2));
    }

    bottom() {
        return Math.round(this.pos.y + (this.height / 2));
    }

    right() {
        return Math.round(this.pos.x + (this.width / 2)-10);
    }

    left() {
        return Math.round(this.pos.x - (this.width / 2)+10);
    }

    updatePosition(width, height, delta_t) {
        this.pos.add(this.vel.clone().multiplyScalar(delta_t));
    }

    applyForce(force, delta_t) {
        this.vel.add(force.clone().multiplyScalar(delta_t));
        if(this.vel.x > 100) this.vel.setComponent(0, 100);
        if(this.vel.x < -100) this.vel.setComponent(0, -100)
    }
}

class Sprite {
    constructor(name, count) {
        this.currentFrame = 0;
        this.frames = [];
        // 1/6 of the draw speed
        this.updateRate = 1/6;

        for (let i = 0; i < count; i++) {
            let frame = new Image();
            frame.src = `${name}_${i}.png`;

            this.frames.push(frame);
        }
    }

    getCurrentFrame() {
        if (this.currentFrame >= (1 / this.updateRate) * this.frames.length)
            this.currentFrame = 0;
        let f = this.frames[Math.floor(this.currentFrame * this.updateRate)];
        this.currentFrame++;
        return f;
    }
}

class Enemy extends Entity {
    constructor(pos, width, height, vel, dynamic = true) {
        super(pos, width, height, vel, true);
        this.facingRight = true;
        this.laserCooldown = 100;
        this.idleAnimation = new Sprite('enemy/finkle_idle', 2);
        this.hasSprite = true;
        this.hostile = true;
    }

    getSprite() {
        return this.idleAnimation.getCurrentFrame();
    }

    // direction: vector pointing from enemy to player
    createLaser(direction) {
        let pos = this.pos.clone().add(direction.clone().multiplyScalar(2.5 + (this.width / 2)));

        let laser = new Entity(pos, 5, 5, direction.clone().multiplyScalar(5), false)
        laser.hostile = true;
        
        return laser;
    }

    update(player, entities) {
        let direction = player.pos.clone().sub(this.pos).normalize();

        if (direction.x >= 0) 
            this.facingRight = true;
        else
            this.facingRight = false;

        if (this.laserCooldown == 0) {
            entities.push(this.createLaser(direction));
            this.laserCooldown = 100;
        }

        this.laserCooldown--;
    }

}

class Player extends Entity {
    constructor(pos, width, height, vel, dynamic = true) {
        super(pos, width, height, vel, dynamic);
        this._isJumping = false;
        this.facingRight = true;
        this.idleAnimation = new Sprite('player/idle', 4);
        this.runningAnimation = new Sprite('player/run', 6);
        this.jumpAnimation = new Sprite('player/jump', 1);
        this.fallAnimation = new Sprite('player/fall', 1);
        this.falling = true;
        this.stopping = false;
    }

   getSprite(ctx) {
        if (this._isJumping)  {
            let anim = this.vel.y < 0 ? this.jumpAnimation : this.fallAnimation;
            return anim.getCurrentFrame();
        }

        if (this.isFalling() || this.stopping) {
            return this.fallAnimation.getCurrentFrame();
        }

        if (Math.abs(this.vel.x) < 0.5) {
            return this.idleAnimation.getCurrentFrame();
        } else {
            return this.runningAnimation.getCurrentFrame();
        }

    }

    faceRight() { this.facingRight = true; }
    faceLeft() { this.facingRight = false; }

    updatePosition(width, height, delta_t) {
        super.updatePosition(width, height, delta_t);
    }

    isFalling() {
        return !this._isJumping && this.falling;
    }
    
    isJumping() { return this._isJumping; }

    jump() {
        if (this._isJumping) return;
        
        this._isJumping = true;
        this.vel.setY(-50);
    }

    detectCollison(e, delta_t) {
        return super.detectCollison(e, delta_t);
    }

    applyForce(force, delta_t) {
        if (this.vel.y < 0)this.falling = true;
        super.applyForce(force, delta_t);
    }
}


function animate() {
    game_g.draw();     
    requestAnimationFrame(animate);
}

function loadGame(levels) {
    var tracker = 0;
    var lives = 3
    game_g = new Game(document.getElementById('canvas'), levels); 
    document.addEventListener("keydown", (e) => game_g.keyPressedHandler(e), false);
    document.addEventListener("keyup", (e) => game_g.keyNeutral(e), false);
    document.addEventListener("keyup", (e) => {
        if (e.keyCode == 82) game_g = new Game(document.getElementById('canvas'), levels)
    }); 
    //Binding the click event on the canvas
    document.addEventListener("click", function(evt) {
    var mousePos = game_g.getMousePos(canvas, evt);
    if (game_g.isInside(mousePos,game_g.rect)) {
        game_g.lives = 3;
        game_g.level = 0;
        game_g.startTime = new Date();
        game_g.currentTime = new Date();
        game_g.loadLevel();
    }  
}, false);
    document.addEventListener("mousemove", (e) => 
        {var mousePos =game_g.getMousePos(canvas, e)
            game_g.mouseCoords = mousePos;
        });
    setTimeout(function run() {
        game_g.update(1 / UPDATE_TICK_RATE);
        setTimeout(run, UPDATE_TICK_RATE);
    }, UPDATE_TICK_RATE);
    requestAnimationFrame(animate);
}


window.onload = function() {
    console.log('loading');
    //fetch('src/levels.json').then(resp => resp.json()).then((response) => loadGame(response));
    loadGame(levels);
};