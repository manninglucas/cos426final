// main.js
// Lucas Manning

class Game {
    constructor(canvas) {
        this.ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.ctx.fillStyle = 'rgb(0,0,0)';
        this.ctx.fillRect(this.width/2, this.height/2, 20, 20);
    }

    update() {

    }

    draw() {

    }

    
}

let game;

function run() {
    game.update();
    game.draw();     
    requestAnimationFrame(run);
}

window.onload = function() {
    game = new Game(document.getElementById('canvas'));
    requestAnimationFrame(run);
};