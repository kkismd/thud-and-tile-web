// Web版の統一アーキテクチャ対応JavaScript
// CLI版と同じイベント駆動型ゲームループを実装

import init, { 
    create_unified_game,
    get_version, 
    get_board_dimensions 
} from '../pkg/thud_and_tile.js';

// 統一ゲームコントローラー
let unifiedController = null;
let canvas;
let ctx;
let animationId;

// 統一ゲームループ（CLI版と同じ原理）
function unifiedGameLoop() {
    if (!unifiedController) {
        animationId = requestAnimationFrame(unifiedGameLoop);
        return;
    }
    
    // ゲーム状態更新（CLI版のcontroller.update()と同等）
    const needsRender = unifiedController.update();
    
    // 描画処理（必要時のみ）
    if (needsRender) {
        drawGame();
        unifiedController.render_complete();
    }
    
    // 次フレーム
    animationId = requestAnimationFrame(unifiedGameLoop);
}

// 初期化関数
async function initUnifiedGame() {
    try {
        console.log('統一アーキテクチャでWASMモジュールを初期化中...');
        
        await init();
        
        console.log('WASM初期化完了:', get_version());
        console.log('ボード寸法:', get_board_dimensions());
        
        // Canvas設定
        canvas = document.getElementById('game-canvas');
        if (!canvas) {
            throw new Error('Canvas要素が見つかりません');
        }
        
        ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('2Dコンテキストの取得に失敗しました');
        }
        
        setupCanvas();
        
        // 統一コントローラー作成
        unifiedController = create_unified_game();
        
        // イベントリスナー設定
        setupUnifiedEventListeners();
        
        // 統一ゲームループ開始
        unifiedGameLoop();
        
        console.log('統一アーキテクチャでの初期化が完了しました！');
        
    } catch (error) {
        console.error('統一ゲーム初期化エラー:', error);
        alert('ゲームの初期化に失敗しました。ページを再読み込みしてください。');
    }
}

// イベントリスナー設定（統一版）
function setupUnifiedEventListeners() {
    // キーボード入力（CLI版と同じマッピング）
    document.addEventListener('keydown', handleUnifiedKeyPress);
    
    // ウィンドウリサイズ
    window.addEventListener('resize', setupCanvas);
    
    // タッチ操作
    setupUnifiedTouchControls();
    
    // UIボタン
    const startButton = document.getElementById('start-game');
    if (startButton) {
        startButton.addEventListener('click', () => {
            if (unifiedController) {
                unifiedController.start_game();
                updateGameUI();
            }
        });
    }
}

// 統一入力処理
function handleUnifiedKeyPress(event) {
    if (!unifiedController) return;
    
    const key = event.key;
    let inputCode = -1;
    
    // CLI版と同じ入力マッピング
    switch (key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            inputCode = 0; // MoveLeft
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            inputCode = 1; // MoveRight
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            inputCode = 2; // SoftDrop
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case 'x':
        case 'X':
            inputCode = 3; // RotateClockwise
            break;
        case 'z':
        case 'Z':
            inputCode = 4; // RotateCounterClockwise
            break;
        case ' ':
            inputCode = 5; // HardDrop
            break;
        case 'r':
        case 'R':
            inputCode = 6; // Restart
            break;
        case 'q':
        case 'Q':
        case 'Escape':
            inputCode = 7; // Quit
            break;
    }
    
    if (inputCode !== -1) {
        event.preventDefault();
        const handled = unifiedController.handle_input(inputCode);
        if (handled) {
            updateGameUI();
        }
    }
}

// 統一タッチ操作
function setupUnifiedTouchControls() {
    if (!canvas) return;
    
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (!unifiedController) return;
        
        const touch = e.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        const touchEndTime = Date.now();
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const deltaTime = touchEndTime - touchStartTime;
        
        const minSwipeDistance = 30;
        const maxTapTime = 200;
        
        let inputCode = -1;
        
        if (deltaTime < maxTapTime && Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
            // タップ = 回転
            inputCode = 3; // RotateClockwise
        } else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            // 横スワイプ
            inputCode = deltaX > 0 ? 1 : 0; // MoveRight : MoveLeft
        } else if (Math.abs(deltaY) > minSwipeDistance) {
            // 縦スワイプ
            inputCode = deltaY > 0 ? 2 : 5; // SoftDrop : HardDrop
        }
        
        if (inputCode !== -1) {
            unifiedController.handle_input(inputCode);
            updateGameUI();
        }
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    });
}

// ゲーム描画（統一版）
function drawGame() {
    if (!unifiedController || !ctx) return;
    
    // 背景クリア
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // ボード状態取得
    const boardState = unifiedController.get_board_state();
    const [BOARD_WIDTH, BOARD_HEIGHT] = get_board_dimensions();
    
    // セルサイズ計算
    const cellWidth = canvas.width / BOARD_WIDTH;
    const cellHeight = canvas.height / BOARD_HEIGHT;
    
    // ボード描画
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const cellValue = boardState[y * BOARD_WIDTH + x];
            
            if (cellValue > 0) {
                ctx.fillStyle = getCellColor(cellValue);
                const pixelX = x * cellWidth;
                const pixelY = y * cellHeight;
                ctx.fillRect(pixelX, pixelY, cellWidth - 1, cellHeight - 1);
            }
        }
    }
    
    // グリッド描画
    drawGrid();
}

// UI更新
function updateGameUI() {
    if (!unifiedController) return;
    
    // ゲームモード表示
    const gameMode = unifiedController.get_game_mode();
    const gameModeElement = document.getElementById('game-mode');
    if (gameModeElement) {
        const modeText = gameMode === 0 ? 'Title' : gameMode === 1 ? 'Playing' : 'Game Over';
        gameModeElement.textContent = modeText;
    }
    
    // スコア表示
    const score = unifiedController.get_score();
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = score.toString();
    }
}

// Canvas設定（既存と同じ）
function setupCanvas() {
    const container = canvas.parentElement;
    const isMobile = window.innerWidth <= 768;
    
    if (container) {
        const boardAspect = 10 / 20;
        let displayWidth, displayHeight;
        
        if (isMobile) {
            displayWidth = Math.min(container.clientWidth * 0.85, 320);
            displayHeight = Math.min(displayWidth / boardAspect, window.innerHeight * 0.6);
        } else {
            if (container.clientWidth / container.clientHeight > boardAspect) {
                displayHeight = container.clientHeight * 0.8;
                displayWidth = displayHeight * boardAspect;
            } else {
                displayWidth = container.clientWidth * 0.8;
                displayHeight = displayWidth / boardAspect;
            }
        }
        
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
}

// セル色取得（既存と同じ）
function getCellColor(cellValue) {
    switch (cellValue) {
        case 1: return '#00ffff'; // Cyan
        case 2: return '#ff00ff'; // Magenta  
        case 3: return '#ffff00'; // Yellow
        default: return '#222222';
    }
}

// グリッド描画（簡易版）
function drawGrid() {
    const [BOARD_WIDTH, BOARD_HEIGHT] = get_board_dimensions();
    const cellWidth = canvas.width / BOARD_WIDTH;
    const cellHeight = canvas.height / BOARD_HEIGHT;
    
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    
    // 縦線
    for (let x = 0; x <= BOARD_WIDTH; x++) {
        const pixelX = x * cellWidth;
        ctx.beginPath();
        ctx.moveTo(pixelX, 0);
        ctx.lineTo(pixelX, canvas.height);
        ctx.stroke();
    }
    
    // 横線
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
        const pixelY = y * cellHeight;
        ctx.beginPath();
        ctx.moveTo(0, pixelY);
        ctx.lineTo(canvas.width, pixelY);
        ctx.stroke();
    }
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', initUnifiedGame);

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
});

export { initUnifiedGame, unifiedGameLoop };