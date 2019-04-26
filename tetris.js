const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(20, 20);

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length-1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if(arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y<m.length; y++) {
        for(let x = 0; x<m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y+o.y] && arena[y+o.y][x+o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while(h--){
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === 'L') {
        return [
            [0, 0, 3],
            [3, 3, 3],
            [0, 0, 0],
        ];
    } else if (type === 'J') {
        return [
            [4, 0, 0],
            [4, 4, 4],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 0, 0, 0],
            [7, 7, 7, 7],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ];
    }
}

const colors = [null, 'purple', 'yellow', 'orange', 'blue', 'red', 'green', 'aqua'];
const pieces = ['I', 'L', 'J', 'O', 'T', 'S', 'Z'];


function draw() {
    context.fillStyle = '#000';
    context.fillRect(0,0,canvas.width, canvas.height);

    drawMatrix(arena, {x:0, y:0});
    drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function merge (arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value !== 0) {
                arena[y+player.pos.y][x+player.pos.x]= value;
            }
        })
    } )
}

function playerMove(dir) {
    player.pos.x += dir;
    if(collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    if(player.nextPieceID === null) {
        player.nextPieceID = pieces[sevenBagGen()];
    }
    player.matrix = createPiece(player.nextPieceID);
    player.nextPieceID = pieces[sevenBagGen()];
    console.log(player.nextPieceID);
    console.log(player.pieceCounter);
    player.pos.y = 0;
    player.pos.x = (arena[0].length/2 | 0 ) - (player.matrix[0].length/2 | 0);
    if (collide(arena, player)) {
        console.log("lose");
        arena.forEach(row => row.fill(0));
        player.score = 0;
        player.pieceCounter.fill(0);
        player.nextPieceID = pieces[sevenBagGen()];
        player.matrix = createPiece(player.nextPieceID);
        player.nextPieceID = pieces[sevenBagGen()];
        console.log(player.nextPieceID);
        console.log(player.pieceCounter);
        updateScore();
    }
}

function sevenBagGen() {
    if (pieceCounterChecker()) {
        player.pieceCounter.fill(0);
    }
    let output = player.pieceCounter.length * Math.random() | 0;
    while(player.pieceCounter[output] > 1) {
        output = player.pieceCounter.length * Math.random() | 0;
    }
    player.pieceCounter[output]++;
    return output;
}

function pieceCounterChecker() {
    for(let x = 0; x<player.pieceCounter.length; x++) {
        if(player.pieceCounter[x] < 2) {
            return false;
        }
    }
    return true;
}

function playerRotate (dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    dropCounter -= 100;
    while(collide(arena, player)) {
        player.pos.x += offset;
        offset = -( offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate (matrix, dir) {
    for (let y = 0; y<matrix.length; ++y) {
        for (let x = 0; x<y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    }
    else {
        matrix.reverse();
    }

}

let dropCounter = 0;
let dropInterval = 1000;

let lastTime=0;

function playerDrop() {
    player.pos.y++;
    if(collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        updateNextPiece();
    }
    dropCounter = 0;
}

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter >= dropInterval) {
        playerDrop();
    }
    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
}

function updateNextPiece() {
    document.getElementById('nextPiece').innerText = player.nextPieceID;
}

const arena = createMatrix(12,20);
console.log(arena);
console.table(arena);

const player = {
    pos : {x:0, y:0},
    matrix: null,
    holdPiece: null,
    score: 0,
    pieceCounter: new Array(7).fill(0),
    nextPieceID: null,
};

document.addEventListener('keydown', event => {
    if(event.key === "ArrowLeft"){
        playerMove(-1);
    }
    else if (event.key === "ArrowRight"){
        playerMove(+1);
    }
    else if (event.key === "ArrowDown"){
        playerDrop()
    }
    else if(event.key === "q" || event.key === "Q") {
        playerRotate(-1);
    }
    else if (event.key === "w" || event.key === "W") {
        playerRotate(+1);
    }
});

playerReset();
updateScore();
updateNextPiece();
update();
//does it work?