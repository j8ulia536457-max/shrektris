const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(24, 24);

// Cores temáticas: tons de verde, lama, colete do shrek, etc.
const COLORS = [
    null,
    '#c0d838', // Verde shrek (I)
    '#5c3a21', // Marrom lama (O)
    '#e5c158', // Amarelo colete (T)
    '#8b5a2b', // Marrom tronco (S)
    '#709c34', // Verde musgo (Z)
    '#d2b48c',  // Bege (J)
    '#4b5320'  // Verde militar (L)
];

//matrizes das peças
const PIECES = {
    'I': [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
    'O': [[2,2],[2,2]],
    'T': [[0,3,0],[3,3,3],[0,0,0]],
    'S': [[0,4,4],[4,4,0],[0,0,0]],
    'Z': [[5,5,0],[0,5,5],[0,0,0]],
    'J': [[6,0,0],[6,6,6],[0,0,0]],
    'L': [[0,0,7],[7,7,7],[0,0,0]]
};

const arena = createMatrix(10, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0
};

//cria a matriz do tabuleiro vazia
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

//desenha a matriz (tanto o tabuleiro quanto a peça ativa)
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0){
                context.fillStyle = COLORS[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                
                //borda interna estilo pixel art (efeito 3d clássico do snes)
                context.strokeStyle = '#000';
                context.lineWidth = 0.08;
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#0d1a0d';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x:0, y: 0});
    drawMatrix(player.matrix, player.pos);
};

// junta a peça assentada ao trabuleiro permanente
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0){
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

//verifica colisão nas ordas e outras peças
function collide(arena, player){
    const[m,o] = [player.matrix, player.pos];
    for (let y = 0; y <m.length; ++y){
        for (let x = 0; x < m[y].length; ++x){
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0
                ){
                    return true;
                }
            }
        }
        return false;
    }
