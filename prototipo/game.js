/*var, const, functions, procedimentos*/

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

//variavel para guardar a proxima peça
let nextPiece = randomPiece();

//cria a matrix do tabuleiro vazia
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}
//gera uma peça aleatória clonando a matriz original
function randomPiece() {
    const types = Object.keys(PIECES);
    const type = types[Math.floor(Math.random() * types.length)];
    return PIECES[type].map(row => [...row]);
}
//desenha a matriz (tanto o tabuleiro quanto a peça ativa)
function drawMatrix(matrix, offset, ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                //borda dos blocos (estilo retro)
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 0.08;
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}
//renderiza o jogo inteiro
function draw() {
    //limpa e desenha a tela principal
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#0d1a0d';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 }, context);
    if (player.matrix) {
        drawMatrix(player.matrix, player.pos, context);
    }
    //limpa e desenha a tela da proxima peça
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextContext.fillStyle = '#0d1a0d';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    drawMatrix(nextPiece, { x: 0, y: 0 }, nextContext);
}
//mescla a peça ativa no tabuleiro permanente
function merge() {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}
//verifica colisão nas bordas e outras peças
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
//rotaciona a matriz matemática da peça
function rotate(matrix, dir){
    for(let y = 0; y < matrix.length; ++y){
        for (let x = 0; x < y; ++x){
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}
//tenta rotacionar o jogador e empurra para o lado se colidir com a parede
function playerRotate(dir){
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena,player)){
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length){
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

//faz a peça descer verticalmente
function playerDrop(){
    player.pos.y++
    if (collide(arena, player)){
        player.pos.y--;
        merge();
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

//move o bloco para os lados
function playerMove(dir){
    player.pos.x +=dir;
    if (collide(arena,player)){
        player.pos.x -= dir;
    }
}
// traz a proxima peça para o jogo e gera uma nova futura
function playerReset(){
    player.matrix = nextPiece;
    player.pos.y = 0;
    player.pos.x =(arena[0].length / 2 |0) - (player.matrix[0].length /2 |0);
    nextPiece = randomPiece();
    if (collide(arena, player)) {
        //se colidir no topo:fim de jogo!
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
}
//limpa as linhas completas do tabuleiro
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y >= 0; y -= 1) {
        for (let x = 0; x < arena[y].length; x += 1) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        y++;
        player.score += 100;

        //aumenta a velocidade a cada linha destruída
        increaseSpeed();
    }
}

let dropCounter = 0;
let dropInterval = 1000 ; /*tempo inicial*/
let lastTime = 0;
//o loop principal do jogo
function update(time = 0){
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval){
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}
//para aumentar a velocidade dinamicamente, basta mudar 'dropInterval'
function increaseSpeed(){
    //reduz o tempo em 15% a cada linha limpa
    //o math.max evita que fique abaixo de 80ms 
    dropInterval <= Math.max(80, dropInterval *0.70)
}

//atualiza o placar no html
function updateScore(){
    document.getElementById('score').innerText = String(player.score).padStart(6, '0');
}


//controles do teclado
document.addEventListener('keydown', event =>{
    if(event.key === 'ArrowLeft'){
        playerMove(-1);
    } else if(event.key === 'ArrowRight'){
        playerMove(1);
    } else if(event.key === 'ArrowDown'){
        playerDrop();
    } else if(event.key === 'z' || event.key === 'Z'){
        playerRotate(-1);
    } else if(event.key === 'x' || event.key === 'X'){
        playerRotate(1);
    }
});

//toca o áudio na primeira interação do jogador
document.addEventListener('keydown', () => {
    const audio = document.querySelector('audio');
    if (audio && audio.paused){
        audio.play();
    }
}, { once: true}); //o once true faz rodar só uma vez

//inicialização
playerReset();
updateScore();
update();