// main.js
// Lucas Manning
// globals =====================================================================

let game_g;
// constants ===================================================================

// keep updates separate from rendering, update 60 times per sec
const UPDATE_TICK_RATE = 1000 / 60;

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
        // draw setup
        this.ctx.fillStyle = 'rgb(0,0,0)';

        // update setup
        // @test entity
        let e = new Entity(new THREE.Vector2(this.width / 2, this.height / 2), 
            20, 40, new THREE.Vector2(0, 0));
        this.entities = [e];
        let player = new Player(new THREE.Vector2(10, 10), 
            20, 40, new THREE.Vector2(0, 0));
        this.player = player;
        this.gravity = new THREE.Vector2(0, 9.8);
    }

    update(delta_t) {
        var force = new THREE.Vector2(0, 0);
        force.add(this.gravity);


        var playerMovement = new THREE.Vector2(0, 0);
        if(this.rightPressed == true) {
            if(this.player.pos.getComponent(1) >= this.height - this.player.height/2) {
                playerMovement.setComponent(0, playerMovement.getComponent(0) + 50);
            }
                playerMovement.setComponent(0, playerMovement.getComponent(0) + 25);
        }

        if(this.leftPressed == true)
            {
            if(this.player.pos.getComponent(1) >= this.height - this.player.height/2){
                playerMovement.setComponent(0, playerMovement.getComponent(0) - 50);
            }
            else
                playerMovement.setComponent(0, playerMovement.getComponent(0) - 25);
        }

        if(this.upPressed == true && this.player.pos.getComponent(1) >= this.height - this.player.height/2) {
            this.player.vel.setComponent(1, -50);
        }

        if(this.downPressed == true) {
            playerMovement.setComponent(1, playerMovement.getComponent(1)+75);
        }

        // friction
        if(this.player.pos.getComponent(1) >= this.height - this.player.height/2){
            if (this.rightPressed == false && this.leftPressed == false) {
                if(this.player.vel.getComponent(0) > 0)
                    playerMovement.setComponent(0, playerMovement.getComponent(0) - 20);
                else if(this.player.vel.getComponent(0) < 0)
                    playerMovement.setComponent(0, playerMovement.getComponent(0) + 20);
            }
            else if (this.downPressed == true) {
                if(this.player.vel.getComponent(0) > 0)
                    playerMovement.setComponent(0, playerMovement.getComponent(0) - 100);
                else if(this.player.vel.getComponent(0) < 0)
                    playerMovement.setComponent(0, playerMovement.getComponent(0) + 100);
            }
        }

        force.add(playerMovement);
        //console.log(force);
        this.entities.forEach(entity => {
            if (entity.dynamic === true) {
                // these two calls are very parallelizable. Multithreaded?
                entity.applyForce(this.gravity, delta_t);
                entity.updatePosition(this.width, this.height, delta_t);

                // this needs to be sequential to avoid race conditions
                this.resolveCollision(entity);
            }
        });

        this.player.applyForce(force, delta_t);
        this.player.updatePosition(this.width, this.height, delta_t);
    }

    // need to use a good detection scheme, ideally one that has better than
    // n^2 runtime
    resolveCollision(entity) {

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
        this.ctx.clearRect(0, 0, this.width, this.height);
        // this is very parallelizable. Multithreaded?

        this.entities.forEach(entity => {
            this.ctx.fillRect(entity.pos.x - (entity.width / 2), 
                entity.pos.y - (entity.height / 2), 
                entity.width, entity.height);
        });
        this.ctx.fillRect(this.player.pos.x - (this.player.width / 2), 
                this.player.pos.y - (this.player.height / 2), 
                this.player.width, this.player.height);

        // friction bubbles
        if(((this.rightPressed == false && this.leftPressed == false) || this.downPressed == true) && this.player.pos.getComponent(1) >= this.height - this.player.height/2) {
            if(Math.abs(this.player.vel.x) > 10 && Math.abs(this.player.vel.x) < 80) {
                for(var i = 0; i < 10; i++) {
                    this.ctx.beginPath();
                    if(this.player.vel.x > 0) {
                        this.ctx.arc(this.player.pos.x - Math.floor(30*Math.random()), this.player.pos.y + this.player.height/2 - Math.floor(10*Math.random()), Math.random() * 2, 0, 2 * Math.PI);
                    }
                    else if(this.player.vel.x < 0) {
                        this.ctx.arc(this.player.pos.x + Math.floor(30*Math.random()), this.player.pos.y + this.player.height/2 - Math.floor(10*Math.random()), Math.random() * 2, 0, 2 * Math.PI);
                    }
                    this.ctx.fill();
                    this.ctx.stroke();
                }
            }
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
        // does the entity move? false for static platforms 
        this.dynamic = dynamic;
    }

    updatePosition(width, height, delta_t) {
        this.pos.add(this.vel.clone().multiplyScalar(delta_t));
        if(this.pos.getComponent(1) >= height-this.height/2) this.pos.setComponent(1, height-this.height/2);
        if(this.pos.getComponent(0) >= width - this.width/2 && this.vel.getComponent(0)>0) {
            this.pos.setComponent(0, width-this.width/2);
            this.vel.setComponent(0,0);
        }
        if(this.pos.getComponent(0) < this.width/2 && this.vel.getComponent(0)<0) {
            this.pos.setComponent(0, this.width/2);
            this.vel.setComponent(0,0);
        }
        
    }

    applyForce(force, delta_t) {
        this.vel.add(force.clone().multiplyScalar(delta_t));
        if(this.vel.getComponent(0) > 100) this.vel.setComponent(0, 100);
        if(this.vel.getComponent(0) < -100) this.vel.setComponent(0, -100)
    }
}

class Player extends Entity {
    constructor(pos, width, height, vel, dynamic = true) {
        super(pos, width, height, vel, dynamic);
    }

    updatePosition(width, height, delta_t) {
        super.updatePosition(width, height, delta_t);
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