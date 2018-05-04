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

        // draw setup
        this.ctx.fillStyle = 'rgb(0,0,0)';

        // update setup
        // @test entity
        let e = new Entity(new THREE.Vector2(this.width / 2, this.height / 2), 
            20, 40, new THREE.Vector2(0, 0));
        this.entities = [e];
        this.gravity = new THREE.Vector2(0, 9.8);
    }

    update(delta_t) {
        this.entities.forEach(entity => {
            if (entity.dynamic === true) {
                // these two calls are very parallelizable. Multithreaded?
                entity.applyForce(this.gravity, delta_t);
                entity.updatePosition(delta_t);
                // this needs to be sequential to avoid race conditions
                this.resolveCollision(entity);
            }
        });
    }

    // need to use a good detection scheme, ideally one that has better than
    // n^2 runtime
    resolveCollision(entity) {

    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        // this is very parallelizable. Multithreaded?
        this.entities.forEach(entity => {
            this.ctx.fillRect(entity.pos.x - (entity.width / 2), 
                entity.pos.y - (entity.height / 2), 
                entity.width, entity.height);
        });
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

    updatePosition(delta_t) {
        this.pos.add(this.vel.clone().multiplyScalar(delta_t));
    }

    applyForce(force, delta_t) {
        this.vel.add(force.clone().multiplyScalar(delta_t));
    }
}


function animate() {
    game_g.draw();     
    requestAnimationFrame(animate);
}


window.onload = function() {
    game_g = new Game(document.getElementById('canvas'));
    // setTimeout code taken from: https://javascript.info/settimeout-setinterval
    setTimeout(function run() {
        game_g.update(1 / UPDATE_TICK_RATE);
        setTimeout(run, UPDATE_TICK_RATE);
    }, UPDATE_TICK_RATE);
    requestAnimationFrame(animate);
};