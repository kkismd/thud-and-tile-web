// Thud & Tile Web版メインエントリーポイント（自動落下機能付き）
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

// 自動落下用タイマー
let autoFallInterval: ReturnType<typeof setInterval> | null = null;

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
    'x': 3,
    'X': 3,
    
    'z': 4,           // RotateCounterClockwise
    'Z': 4,
    
    // ハードドロップ
    ' ': 5,           // Space - HardDrop
    
    // コントロール
    'r': 6,           // Restart
    'R': 6,
    'q': 7,           // Quit
    'Q': 7,
    'Escape': 7
} as const;

// WASMモジュールの初期化
async function initGame() {
    try {
        console.log('WASMモジュールを初期化中...');
        
        // WASMバイナリを初期化
        await init();
        
        // WASM側のmain関数を呼び出し
        wasm_main();
        
        console.log('WASMモジュールの初期化完了:', get_version());
        console.log('ボード寸法:', get_board_dimensions());
        
        // Canvas要素を取得
        canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        if (!canvas) {
            throw new Error('Canvas要素が見つかりません');
        }
        
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('2Dコンテキストの取得に失敗しました');
        }
        ctx = context;
        
        // Canvasサイズを設定
        setupCanvas();
        
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
    if (!gameState) return;
    
    const debugElement = document.getElementById('debug-info');
    if (debugElement) {
        debugElement.innerHTML = `
            <strong>Debug情報:</strong><br>
            WASM Version: ${get_version()}<br>
            Game Mode: ${gameState.get_game_mode()}<br>
            Score: ${gameState.get_score()}<br>
            Fall Speed: ${gameState.get_fall_speed_ms()}ms
        `;
    }
}

function setupCanvas() {
    // レスポンシブデザイン
    const container = canvas.parentElement;
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // アスペクト比を維持しながらサイズ調整
        const boardAspect = 10 / 20; // BOARD_WIDTH / BOARD_HEIGHT
        
        if (containerWidth / containerHeight > boardAspect) {
            canvas.height = containerHeight * 0.8;
            canvas.width = canvas.height * boardAspect;
        } else {
            canvas.width = containerWidth * 0.8;
            canvas.height = canvas.width / boardAspect;
        }
    } else {
        // デフォルトサイズ
        canvas.width = 300;
        canvas.height = 600;
    }
}

function setupEventListeners() {
    // キーボード入力
    document.addEventListener('keydown', handleKeyPress);
    
    // ウィンドウリサイズ
    window.addEventListener('resize', setupCanvas);
    
    // ゲーム開始ボタン
    const startButton = document.getElementById('start-game');
    if (startButton) {
        startButton.addEventListener('click', startGame);
    }
    
    // ポーズボタン（将来の実装用）
    const pauseButton = document.getElementById('pause-game');
    if (pauseButton) {
        pauseButton.addEventListener('click', togglePause);
    }
}

function startGame() {
    if (!gameState) return;
    
    console.log('ゲーム開始');
    gameState.start_game();
    
    // 自動落下タイマーを開始
    startAutoFall();
    
    updateDebugInfo();
}

function startAutoFall() {
    if (!gameState) return;
    
    // 既存のタイマーをクリア
    if (autoFallInterval !== null) {
        clearInterval(autoFallInterval);
    }
    
    // 自動落下の間隔を取得（WASMから）
    const fallSpeedMs = gameState.get_fall_speed_ms();
    
    console.log(`自動落下タイマー開始: ${fallSpeedMs}ms間隔`);
    
    // 自動落下タイマーを設定
    autoFallInterval = setInterval(() => {
        if (gameState && gameState.get_game_mode() === 1) { // Playing mode
            const didFall = gameState.auto_fall();
            if (didFall) {
                console.log('自動落下実行');
                updateDebugInfo();
            }
        }
    }, fallSpeedMs);
}

function stopAutoFall() {
    if (autoFallInterval !== null) {
        clearInterval(autoFallInterval);
        autoFallInterval = null;
        console.log('自動落下タイマー停止');
    }
}

function togglePause() {
    // 将来の実装: ポーズ機能
    console.log('ポーズ機能は未実装');
}

function handleKeyPress(event: KeyboardEvent) {
    if (!gameState) return;
    
    const key = event.key;
    const inputCode = INPUT_MAPPING[key as keyof typeof INPUT_MAPPING];
    
    if (inputCode !== undefined) {
        event.preventDefault();
        
        console.log(`キー入力: ${key} -> ${inputCode}`);
        
        // 特別なキー処理
        if (inputCode === 6) { // Restart
            console.log('ゲーム再開始');
            gameState.start_game();
            startAutoFall(); // 自動落下も再開始
            updateDebugInfo();
            return;
        }
        
        if (inputCode === 7) { // Quit
            console.log('ゲーム終了');
            stopAutoFall();
            // ゲーム状態をリセット（将来の実装）
            return;
        }
        
        // 通常の入力を処理
        const handled = gameState.handle_input(inputCode);
        
        if (handled) {
            updateDebugInfo();
            console.log(`入力処理完了: ${inputCode}`);
        }
    }
}

function updateUI() {
    updateDebugInfo();
}

function drawGame() {
    if (!gameState || !ctx) return;
    
    // 背景をクリア
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // ボード寸法を取得
    const [BOARD_WIDTH, BOARD_HEIGHT] = get_board_dimensions();
    
    // セルサイズを計算
    const cellWidth = canvas.width / BOARD_WIDTH;
    const cellHeight = canvas.height / BOARD_HEIGHT;
    
    // ボードの状態を取得
    const boardState = gameState.get_board_state();
    
    // ボードを描画
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const cellValue = boardState[y * BOARD_WIDTH + x];
            
            if (cellValue > 0) {
                // セルの色を決定
                ctx.fillStyle = getCellColor(cellValue);
                
                // セルを描画
                const pixelX = x * cellWidth;
                const pixelY = y * cellHeight;
                
                ctx.fillRect(pixelX, pixelY, cellWidth - 1, cellHeight - 1);
            }
        }
    }
    
    // 現在のピースを描画
    const currentPieceBlocks = gameState.get_current_piece_blocks();
    if (currentPieceBlocks && currentPieceBlocks.length > 0) {
        // get_current_piece_blocks() は [x, y, color, x, y, color, ...] 形式で返す
        for (let i = 0; i < currentPieceBlocks.length; i += 3) {
            const blockX = currentPieceBlocks[i];
            const blockY = currentPieceBlocks[i + 1];
            const blockColor = currentPieceBlocks[i + 2];
            
            if (blockX >= 0 && blockX < get_board_dimensions()[0] && 
                blockY >= 0 && blockY < get_board_dimensions()[1]) {
                
                // テトロミノブロックの色
                ctx.fillStyle = getCellColor(blockColor + 1); // color値を調整
                
                const pixelX = blockX * cellWidth;
                const pixelY = blockY * cellHeight;
                
                ctx.fillRect(pixelX, pixelY, cellWidth - 1, cellHeight - 1);
            }
        }
    }
    
    // グリッドを描画
    drawGrid();
}

function drawGrid() {
    const [BOARD_WIDTH, BOARD_HEIGHT] = get_board_dimensions();
    const cellWidth = canvas.width / BOARD_WIDTH;
    const cellHeight = canvas.height / BOARD_HEIGHT;
    
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.5;
    
    // 縦線
    for (let x = 0; x <= BOARD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellWidth, 0);
        ctx.lineTo(x * cellWidth, canvas.height);
        ctx.stroke();
    }
    
    // 横線
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellHeight);
        ctx.lineTo(canvas.width, y * cellHeight);
        ctx.stroke();
    }
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
    
    // 自動落下タイマーをクリーンアップ
    stopAutoFall();
    
    if (gameState) {
        gameState.free();
    }
});

export { initGame };
