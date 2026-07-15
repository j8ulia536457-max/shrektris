const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

context.scale(24, 24);
nextContext.scale(24, 24);

const COLORS = [
    null,
    '#c0d838',
    '#5c3a21',
    '#e5c158',
    '#8b5a2b',
    '#709c34',
    '#d2b48c',
    '#4b5320'
];

const PIECES = {
    I: [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
    O: [[2, 2], [2, 2]],
    T: [[0, 3, 0], [3, 3, 3], [0, 0, 0]],
    S: [[0, 4, 4], [4, 4, 0], [0, 0, 0]],
    Z: [[5, 5, 0], [0, 5, 5], [0, 0, 0]],
    J: [[6, 0, 0], [6, 6, 6], [0, 0, 0]],
    L: [[0, 0, 7], [7, 7, 7], [0, 0, 0]]
};

const arena = createMatrix(10, 20);
const player = {
    pos: { x: 3, y: 0 },
    matrix: null,
    score: 0
};
let dropCounter = 0;
let lastTime = 0;
let gameOver = false;
let nextPiece = randomPiece();

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function randomPiece() {
    const types = Object.keys(PIECES);
    const type = types[Math.floor(Math.random() * types.length)];
    return PIECES[type].map(row => [...row]);
}

function drawMatrix(matrix, offset, ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 0.08;
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#0d1a0d';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 }, context);
    if (player.matrix) {
        drawMatrix(player.matrix, player.pos, context);
    }

    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextContext.fillStyle = '#0d1a0d';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    drawMatrix(nextPiece, { x: 0, y: 0 }, nextContext);
}

function merge() {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function collide(arena, player) {
    const matrix = player.matrix;
    const pos = player.pos;
    for (let y = 0; y < matrix.length; y += 1) {
        for (let x = 0; x < matrix[y].length; x += 1) {
            if (matrix[y][x] !== 0 &&
                (arena[y + pos.y] && arena[y + pos.y][x + pos.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function rotate(matrix) {
    return matrix[0].map((_, index) => matrix.map(row => row[index]).reverse());
}

function playerRotate() {
    const matrix = rotate(player.matrix);
    const pos = { ...player.pos };
    if (!collide(arena, { ...player, matrix, pos })) {
        player.matrix = matrix;
    }
}

function playerDrop() {
    player.pos.y += 1;
    if (collide(arena, player)) {
        player.pos.y -= 1;
        merge();
        resetPlayer();
    }
}

function resetPlayer() {
    player.matrix = nextPiece;
    player.pos.y = 0;
    player.pos.x = 3;
    nextPiece = randomPiece();
    if (collide(arena, player)) {
        gameOver = true;
    }
}

function arenaSweep() {
    outer: for (let y = arena.length - 1; y >= 0; y -= 1) {
        for (let x = 0; x < arena[y].length; x += 1) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        player.score += 100;
    }
}

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > 600) {
        playerDrop();
        dropCounter = 0;
    }
    draw();
    if (!gameOver) {
        requestAnimationFrame(update);
    }
}

function keydown(event) {
    if (gameOver) return;
    if (event.key === 'ArrowLeft') {
        player.pos.x -= 1;
        if (collide(arena, player)) player.pos.x += 1;
    } else if (event.key === 'ArrowRight') {
        player.pos.x += 1;
        if (collide(arena, player)) player.pos.x -= 1;
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'ArrowUp') {
        playerRotate();
    }
}

function startGame() {
    player.matrix = randomPiece();
    nextPiece = randomPiece();
    document.addEventListener('keydown', keydown);
    update();
}

startGame();