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

class Game {
    constructor(canvas) {
        // canvas setup
        this.ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        this.width = canvas.width;
        this.height = canvas.height;
        this.upPressed = false;
        this.downPressed = false;
        this.rightPressed = false;
        this.leftPressed = false;
        this.lives = 3;
        this.startTime=new Date();
        this.camera = new THREE.Vector3(this.width / 2, this.height / 2);
        // draw setup
        this.ctx.fillStyle = 'rgb(0,0,0)';

        // update setup
        // @test entity
        let e = new Entity(new THREE.Vector3(this.width / 2, this.height / 2), 
            20, 40, new THREE.Vector3(0, 0));
        let ground = new Entity(new THREE.Vector3(this.width / 2, this.height - 100), 
            300, 50, new THREE.Vector3(0, 0), false);
        let ground1 = new Entity(new THREE.Vector3(this.width, this.height - 100), 
            300, 50, new THREE.Vector3(0, 0), false);
        let ground2 = new Entity(new THREE.Vector3(this.width / 2, this.height - 100), 
            300, 50, new THREE.Vector3(0, 0), false);
        this.entities = [ground, ground1];
        this.player = new Player(new THREE.Vector3(this.width / 2, 50), 
            20, 40, new THREE.Vector3(0, 0));
        this.gravity = new THREE.Vector3(0, 9.8);
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


        var playerMovement = new THREE.Vector3(0, 0);
        if(this.rightPressed == true) {
            if(this.player.pos.y >= this.height - this.player.height/2) {
                playerMovement.setComponent(0, playerMovement.x + 50);
            }
                playerMovement.setComponent(0, playerMovement.x + 25);
        }

        if(this.leftPressed == true)
            {
            if(this.player.pos.y >= this.height - this.player.height/2){
                playerMovement.setComponent(0, playerMovement.x - 50);
            }
            else
                playerMovement.setComponent(0, playerMovement.x - 25);
        }

        if(this.upPressed == true) {
            this.player.jump();
        }

        if(this.downPressed == true) {
            playerMovement.setComponent(1, playerMovement.y+75);
        }

        // friction
        if(!this.player.isJumping() && !this.player.isFalling()){
            if (this.rightPressed == false && this.leftPressed == false) {
                if(this.player.vel.x > 0)
                    playerMovement.setComponent(0, playerMovement.x - 20);
                else if(this.player.vel.x < 0)
                    playerMovement.setComponent(0, playerMovement.x + 20);
            }
            if (this.downPressed == true) {
                if(this.player.vel.x > 0)
                    playerMovement.setComponent(0, playerMovement.x - 100);
                else if(this.player.vel.x < 0)
                    playerMovement.setComponent(0, playerMovement.x + 100);
            }
        }

        force.add(playerMovement);
        this.entities.forEach(entity => {
            if (entity.dynamic === true) {
                // these two calls are very parallelizable. Multithreaded?
                entity.applyForce(this.gravity, delta_t);
                entity.updatePosition(this.width, this.height, delta_t);

                // this needs to be sequential to avoid race conditions
            }
            this.resolveCollision(entity, delta_t);
        });

        this.player.applyForce(force, delta_t);
        this.player.updatePosition(this.width, this.height, delta_t);
        this.updateCamera();
    }

    // need to use a good detection scheme, ideally one that has better than
    // n^2 runtime
    resolveCollision(entity, delta_t) {
        this.entities.forEach(e => {
            let normal = this.player.detectCollison(e, delta_t);
            if (normal !== undefined) this.player.resolveCollision(e, delta_t, normal);
        });       
    }

    keyPressedHandler(e) {
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

    draw() {
        //this.ctx.clearRect(0, 0, this.width, this.height);
        var img = new Image();
        img.src = "flower.png";
        this.ctx.drawImage(img, 0, 0, this.width, this.height);
        this.ctx.fillStyle = "#0095DD";
        this.entities.forEach(entity => {
            this.ctx.fillRect(entity.left() - (this.camera.x) + (this.width / 2) , 
                entity.pos.y - (entity.height / 2), 
                entity.width, entity.height);
        });
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(this.player.left() - this.camera.x + (this.width / 2), 
                this.player.top(),
                this.player.width, this.player.height);

        // friction bubbles
        if(((this.rightPressed == false && this.leftPressed == false) || this.downPressed == true) && !this.player.isFalling() && !this.player.isJumping()) {
            if(Math.abs(this.player.vel.x) > 10 && Math.abs(this.player.vel.x) < 80) {
                for(var i = 0; i < 25; i++) {
                    this.ctx.beginPath();
                    var angle = Math.random()*Math.PI/4;
                    if(this.player.vel.x > 0) {
                        this.ctx.arc(this.player.pos.x - this.camera.x + (this.width / 2) + 30*Math.random()*Math.cos(angle), this.player.pos.y + this.player.height/2 - 30*Math.random()*Math.sin(angle), Math.random() * 2, 0, 2 * Math.PI);
                    }
                    else if(this.player.vel.x < 0) {
                        this.ctx.arc(this.player.pos.x - this.camera.x + (this.width / 2) - 30*Math.random()*Math.cos(angle), this.player.pos.y + this.player.height/2 - 30*Math.random()*Math.sin(angle), Math.random() * 2, 0, 2 * Math.PI);
                    }
                    this.ctx.fill();
                    this.ctx.stroke();
                }
            }
        }

        //Draw score
        this.ctx.font = "16px Arial";
        this.ctx.fillText("Late Days: "+this.lives, 8, 20);

        //Timer
        var seconds = Math.floor((new Date() - this.startTime)/1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        if(seconds > 59)
            seconds = seconds%60;
        if(minutes > 59)
            minutes = mintes%60;
        // this line taken from https://jsfiddle.net/Daniel_Hug/pvk6p/
        var stopwatch = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds);
        this.ctx.fillText(stopwatch, canvas.width-65, 20);
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
        // does the entity move? false for static platforms 
        this.dynamic = dynamic;
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
        return Math.round(this.pos.y) - (this.height / 2);
    }

    bottom() {
        return Math.round(this.pos.y) + (this.height / 2);
    }

    right() {
        return Math.round(this.pos.x) + (this.width / 2);
    }

    left() {
        return Math.round(this.pos.x) - (this.width / 2);
    }

    updatePosition(width, height, delta_t) {
        this.pos.add(this.vel.clone().multiplyScalar(delta_t));
        if(this.pos.y >= height-this.height/2) this.pos.setComponent(1, height-this.height/2);
        if(this.pos.x >= width - this.width/2 && this.vel.x>0) {
            this.pos.setComponent(0, width-this.width/2);
            this.vel.setComponent(0,0);
        }
        if(this.pos.x < this.width/2 && this.vel.x<0) {
            this.pos.setComponent(0, this.width/2);
            this.vel.setComponent(0,0);
        }
        
    }

    applyForce(force, delta_t) {
        this.vel.add(force.clone().multiplyScalar(delta_t));
        if(this.vel.x > 100) this.vel.setComponent(0, 100);
        if(this.vel.x < -100) this.vel.setComponent(0, -100)
    }
}

class Player extends Entity {
    constructor(pos, width, height, vel, dynamic = true) {
        super(pos, width, height, vel, dynamic);
        this._isJumping = false;
    }

    updatePosition(width, height, delta_t) {
        super.updatePosition(width, height, delta_t);
    }

    isFalling() {
        return !this._isJumping && Math.abs(this.vel.y) > 1;
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

        super.applyForce(force, delta_t);
    }
}


function animate() {
    game_g.draw();     
    requestAnimationFrame(animate);
}


window.onload = function() {
    let levels = JSON.parse(levels);
    game_g = new Game(document.getElementById('canvas')); 
    document.addEventListener("keydown", (e) => game_g.keyPressedHandler(e), false);
    document.addEventListener("keyup", (e) => game_g.keyNeutral(e), false);
    //document.addEventListener("mousemove", (e) => game_g.mouseMoveHandler(e), false);
    // setTimeout code taken from: https://javascript.info/settimeout-setinterval
    setTimeout(function run() {
        game_g.update(1 / UPDATE_TICK_RATE);
        setTimeout(run, UPDATE_TICK_RATE);
    }, UPDATE_TICK_RATE);
    requestAnimationFrame(animate);
};