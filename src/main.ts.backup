// Thud & Tile Web版メインエントリーポイント
import init, { 
    WasmGameState, 
    get_version, 
    get_board_dimensions,
    main as wasm_main 
} from '../pkg/thud_and_tile.js';

// ゲーム状態
let gameState: WasmGameState | null = null;
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let animationId: number;

// 入力マッピング
const INPUT_MAPPING = {
    // 移動
    'ArrowLeft': 0,   // MoveLeft
    'a': 0,
    'A': 0,
    
    'ArrowRight': 1,  // MoveRight
    'd': 1,
    'D': 1,
    
    'ArrowDown': 2,   // SoftDrop
    's': 2,
    'S': 2,
    
    // 回転
    'ArrowUp': 3,     // RotateClockwise
    'w': 3,
    'W': 3,
    
    'z': 4,           // RotateCounterClockwise
    'Z': 4,
    
    // ドロップ
    ' ': 5,           // HardDrop (Space)
    
    // ゲーム制御
    'r': 6,           // Restart
    'R': 6,
    
    'q': 7,           // Quit
    'Q': 7,
    
    'Enter': 6,       // Restart (Enter key)
} as const;

// グローバル関数（HTMLから呼び出し用）
declare global {
    interface Window {
        startGame: () => void;
        restartGame: () => void;
    }
}

async function initGame() {
    console.log('Thud & Tile Web版を初期化しています...');
    
    try {
        // WASMモジュールを初期化
        await init();
        
        // WASMメイン関数を呼び出し
        wasm_main();
        
        // キャンバスを取得
        canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        ctx = canvas.getContext('2d')!;
        
        // ゲーム状態を作成
        gameState = new WasmGameState();
        
        // デバッグ情報を表示
        updateDebugInfo();
        
        // イベントリスナーを設定
        setupEventListeners();
        
        // ゲームループを開始
        gameLoop();
        
        console.log('Thud & Tile Web版の初期化が完了しました！');
        
    } catch (error) {
        console.error('ゲーム初期化エラー:', error);
        alert('ゲームの初期化に失敗しました。ページを再読み込みしてください。');
    }
}

function updateDebugInfo() {
    const versionElement = document.getElementById('wasm-version');
    const dimensionsElement = document.getElementById('board-dimensions');
    
    if (versionElement) {
        versionElement.textContent = get_version();
    }
    
    if (dimensionsElement) {
        const dimensions = get_board_dimensions();
        dimensionsElement.textContent = `${dimensions[0]} x ${dimensions[1]}`;
    }
}

function setupEventListeners() {
    // キーボードイベント
    document.addEventListener('keydown', handleKeyDown);
    
    // グローバル関数を設定
    window.startGame = startGame;
    window.restartGame = restartGame;
    
    // フォーカス管理
    canvas.tabIndex = 0;
    canvas.focus();
}

function handleKeyDown(event: KeyboardEvent) {
    if (!gameState) return;
    
    const inputCode = INPUT_MAPPING[event.key as keyof typeof INPUT_MAPPING];
    
    if (inputCode !== undefined) {
        event.preventDefault();
        
        const handled = gameState.handle_input(inputCode);
        
        if (handled) {
            console.log(`入力処理: ${event.key} -> ${inputCode}`);
            updateUI();
        }
    }
}

function startGame() {
    if (!gameState) return;
    
    console.log('ゲームを開始します');
    gameState.start_game();
    updateUI();
}

function restartGame() {
    if (!gameState) return;
    
    console.log('ゲームをリスタートします');
    gameState.start_game();
    updateUI();
}

function updateUI() {
    if (!gameState) return;
    
    // スコア更新
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = gameState.get_score().toString();
    }
    
    // ゲームモード更新
    const modeElement = document.getElementById('game-mode');
    if (modeElement) {
        const mode = gameState.get_game_mode();
        const modeText = mode === 0 ? 'タイトル' : mode === 1 ? 'プレイ中' : 'ゲームオーバー';
        modeElement.textContent = modeText;
    }
}

function drawGame() {
    if (!gameState || !ctx) return;
    
    // キャンバスをクリア
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // ボード状態を取得
    const boardState = gameState.get_board_state();
    const dimensions = get_board_dimensions();
    const boardWidth = dimensions[0];
    const boardHeight = dimensions[1];
    
    // セルサイズを計算
    const cellWidth = canvas.width / boardWidth;
    const cellHeight = canvas.height / boardHeight;
    
    // ボードを描画
    for (let y = 0; y < boardHeight; y++) {
        for (let x = 0; x < boardWidth; x++) {
            const cellValue = boardState[y * boardWidth + x];
            
            if (cellValue > 0) {
                // セルに色を付ける
                ctx.fillStyle = getCellColor(cellValue);
                ctx.fillRect(
                    x * cellWidth, 
                    y * cellHeight, 
                    cellWidth - 1, 
                    cellHeight - 1
                );
            }
        }
    }
    
    // 現在の落下中ピースを描画
    const currentPiece = gameState.get_current_piece_info();
    if (currentPiece && currentPiece.length >= 4) {
        const [x, y, rotation, shape] = currentPiece;
        const blocks = getTetrominoBlocks(shape, rotation);
        
        ctx.fillStyle = getTetrominoColor(shape);
        for (const [dx, dy] of blocks) {
            const boardX = x + dx;
            const boardY = y + dy;
            
            if (boardX >= 0 && boardX < boardWidth && 
                boardY >= 0 && boardY < boardHeight) {
                ctx.fillRect(
                    boardX * cellWidth,
                    boardY * cellHeight,
                    cellWidth - 2,
                    cellHeight - 2
                );
            }
        }
    }
    
    // グリッド線を描画
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    
    // 縦線
    for (let x = 0; x <= boardWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellWidth, 0);
        ctx.lineTo(x * cellWidth, canvas.height);
        ctx.stroke();
    }
    
    // 横線
    for (let y = 0; y <= boardHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellHeight);
        ctx.lineTo(canvas.width, y * cellHeight);
        ctx.stroke();
    }
}

function getTetrominoBlocks(shape: number, rotation: number): [number, number][] {
    const shapes = [
        [[0, 0], [1, 0], [2, 0], [3, 0]], // I piece
        [[0, 0], [1, 0], [0, 1], [1, 1]], // O piece
        [[1, 0], [0, 1], [1, 1], [2, 1]], // T piece
        [[0, 0], [0, 1], [0, 2], [1, 2]], // L piece
        [[1, 0], [1, 1], [1, 2], [0, 2]], // J piece
        [[1, 0], [2, 0], [0, 1], [1, 1]], // S piece
        [[0, 0], [1, 0], [1, 1], [2, 1]], // Z piece
    ];
    
    if (shape < 0 || shape >= shapes.length) return [[0, 0]];
    
    let blocks = shapes[shape];
    
    // 簡単な回転実装
    if (rotation === 0 || shape === 1) { // O piece doesn't rotate
        return blocks as [number, number][];
    }
    
    return blocks.map(([x, y]) => {
        switch (rotation) {
            case 1: return [-y, x] as [number, number];
            case 2: return [-x, -y] as [number, number];
            case 3: return [y, -x] as [number, number];
            default: return [x, y] as [number, number];
        }
    });
}

function getTetrominoColor(shape: number): string {
    const colors = [
        '#00ffff', // I piece - Cyan
        '#ffff00', // O piece - Yellow
        '#ff00ff', // T piece - Magenta
        '#ff8000', // L piece - Orange
        '#0000ff', // J piece - Blue
        '#00ff00', // S piece - Green
        '#ff0000', // Z piece - Red
    ];
    
    return colors[shape] || '#ffffff';
}

function getCellColor(cellValue: number): string {
    // cellValueに基づいて色を決定
    switch (cellValue) {
        case 1: return '#ff0000'; // Red
        case 2: return '#00ff00'; // Green  
        case 3: return '#0000ff'; // Blue
        case 4: return '#ffff00'; // Yellow
        case 5: return '#ff00ff'; // Magenta
        case 6: return '#00ffff'; // Cyan
        case 7: return '#ffffff'; // White
        case 8: return '#000000'; // Black
        case 9: return '#808080'; // Dark Grey
        
        // Connected cells (10+)
        case 11: return '#cc0000'; // Connected Red
        case 12: return '#00cc00'; // Connected Green
        case 13: return '#0000cc'; // Connected Blue
        case 14: return '#cccc00'; // Connected Yellow
        case 15: return '#cc00cc'; // Connected Magenta
        case 16: return '#00cccc'; // Connected Cyan
        
        // Special cells
        case 20: return '#666666'; // Gray
        case 21: return '#444444'; // Solid
        
        default: return '#222222'; // Default
    }
}

function gameLoop() {
    updateUI();
    drawGame();
    animationId = requestAnimationFrame(gameLoop);
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', initGame);

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    if (gameState) {
        gameState.free();
    }
});

export { initGame };