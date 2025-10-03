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

// 自動落下タイマー
let autoFallInterval: number | null = null;
// アニメーション更新タイマー
let animationInterval: number | null = null;

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
        
        // ゲームUIを表示
        updateGameUI();
        
        // イベントリスナーを設定
        setupEventListeners();
        
        // アニメーション更新タイマーを開始
        startAnimationUpdates();
        
        // 自動落下機能を開始
        startAutoFall();
        
        // ゲームループを開始
        gameLoop();
        
        console.log('Thud & Tile Web版の初期化が完了しました！');
        
    } catch (error) {
        console.error('ゲーム初期化エラー:', error);
        alert('ゲームの初期化に失敗しました。ページを再読み込みしてください。');
    }
}

function updateGameUI() {
    if (!gameState) return;
    
    // デバッグ情報を更新
    updateDebugInfo();

    // スコア表示を更新
    updateScoreDisplay();
}

function updateDebugInfo() {
    if (!gameState) return;
    
    const debugElement = document.getElementById('debug-info');
    if (debugElement) {
        // アニメーション状態を取得
        const animationInfo = gameState.get_animation_info();
        const animationStatus = animationInfo && animationInfo.length > 0 
            ? `Animation: ${animationInfo.length} items` 
            : 'No Animation';
            
        debugElement.innerHTML = `
            <strong>Debug情報:</strong><br>
            WASM Version: ${get_version()}<br>
            Game Mode: ${gameState.get_game_mode()}<br>
            Total Score: ${gameState.get_score()}<br>
            Fall Speed: ${gameState.get_fall_speed_ms()}ms<br>
            ${animationStatus}
        `;
    }
}

function updateScoreDisplay() {
    if (!gameState) return;

    // 総合スコア
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = gameState.get_score().toString();
    }

    // 3色別スコアを取得 [cyan, magenta, yellow]
    const colorScores = gameState.get_color_scores();
    
    const cyanElement = document.getElementById('cyan-score');
    if (cyanElement && colorScores.length >= 3) {
        cyanElement.textContent = colorScores[0].toString(); // Cyan score
    }

    const magentaElement = document.getElementById('magenta-score');
    if (magentaElement && colorScores.length >= 3) {
        magentaElement.textContent = colorScores[1].toString(); // Magenta score
    }

    const yellowElement = document.getElementById('yellow-score');
    if (yellowElement && colorScores.length >= 3) {
        yellowElement.textContent = colorScores[2].toString(); // Yellow score
    }

    // Max-chain表示を更新
    const maxChains = gameState.get_max_chains(); // [cyan, magenta, yellow]
    
    // 全体のmax-chain
    const overallMaxChain = Math.max(...maxChains);
    const maxChainOverallElement = document.getElementById('max-chain-overall');
    if (maxChainOverallElement) {
        maxChainOverallElement.textContent = overallMaxChain.toString();
    }

    // 色別max-chain
    const cyanMaxChainElement = document.getElementById('cyan-max-chain');
    if (cyanMaxChainElement && maxChains.length >= 3) {
        cyanMaxChainElement.textContent = maxChains[0].toString(); // Cyan max-chain
    }

    const magentaMaxChainElement = document.getElementById('magenta-max-chain');
    if (magentaMaxChainElement && maxChains.length >= 3) {
        magentaMaxChainElement.textContent = maxChains[1].toString(); // Magenta max-chain
    }

    const yellowMaxChainElement = document.getElementById('yellow-max-chain');
    if (yellowMaxChainElement && maxChains.length >= 3) {
        yellowMaxChainElement.textContent = maxChains[2].toString(); // Yellow max-chain
    }
}

function setupCanvas() {
    // モバイル対応のレスポンシブデザイン
    const container = canvas.parentElement;
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // アスペクト比を維持しながらサイズ調整
        const boardAspect = 10 / 20; // BOARD_WIDTH / BOARD_HEIGHT
        
        let displayWidth, displayHeight;
        
        if (isMobile) {
            // モバイル用の高さ制限
            const maxMobileHeight = window.innerHeight * 0.6; // ビューポートの60%まで
            
            if (isSmallMobile) {
                // 小さい画面: 縦向きレイアウト
                displayWidth = Math.min(containerWidth * 0.85, 320);
                displayHeight = Math.min(displayWidth / boardAspect, maxMobileHeight);
            } else {
                // タブレット・中間サイズ: 横向きレイアウト、フィールド縮小
                displayWidth = Math.min(window.innerWidth * 0.6, 280);
                displayHeight = Math.min(displayWidth / boardAspect, maxMobileHeight);
            }
            
            // 高さ制限により幅を再調整（アスペクト比を保持）
            if (displayHeight === maxMobileHeight) {
                displayWidth = displayHeight * boardAspect;
            }
        } else {
            // デスクトップ: 元のロジック
            if (containerWidth / containerHeight > boardAspect) {
                displayHeight = containerHeight * 0.8;
                displayWidth = displayHeight * boardAspect;
            } else {
                displayWidth = containerWidth * 0.8;
                displayHeight = displayWidth / boardAspect;
            }
        }
        
        // 表示サイズを設定
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        
        // 内部解像度は表示サイズと同じにしてピクセル比を1:1に保つ
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    } else {
        // デフォルトサイズ
        const defaultDisplayHeight = isMobile ? Math.min(window.innerHeight * 0.6, 400) : 600;
        const defaultDisplayWidth = isMobile ? 280 : 300;
        
        const finalHeight = Math.min(defaultDisplayWidth / (10 / 20), defaultDisplayHeight);
        const finalWidth = finalHeight * (10 / 20);
        
        canvas.style.width = finalWidth + 'px';
        canvas.style.height = finalHeight + 'px';
        canvas.width = finalWidth;
        canvas.height = finalHeight;
    }
    
    // Canvas属性とCSSの同期
    canvas.setAttribute('width', canvas.width.toString());
    canvas.setAttribute('height', canvas.height.toString());
    
    // ネクストピースキャンバスのサイズも調整
    setupNextPieceCanvas(isMobile, isSmallMobile);
}

function setupNextPieceCanvas(isMobile: boolean, isSmallMobile: boolean) {
    const nextCanvas = document.getElementById('next-piece-canvas') as HTMLCanvasElement;
    if (!nextCanvas) return;
    
    let size: number;
    if (isSmallMobile) {
        size = 80;
    } else if (isMobile) {
        size = 80;
    } else {
        size = 120;
    }
    
    // 表示サイズと内部解像度を同じにする
    nextCanvas.style.width = size + 'px';
    nextCanvas.style.height = size + 'px';
    nextCanvas.width = size;
    nextCanvas.height = size;
    nextCanvas.setAttribute('width', size.toString());
    nextCanvas.setAttribute('height', size.toString());
}

function setupEventListeners() {
    // キーボード入力
    document.addEventListener('keydown', handleKeyPress);
    
    // ウィンドウリサイズ
    window.addEventListener('resize', setupCanvas);
    
    // モバイル用タッチ操作
    setupTouchControls();
    
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

function setupTouchControls() {
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
        if (!gameState) return;
        
        const touch = e.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        const touchEndTime = Date.now();
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const deltaTime = touchEndTime - touchStartTime;
        
        const minSwipeDistance = 30;
        const maxTapTime = 200;
        
        // タップ（短時間で小さい移動）
        if (deltaTime < maxTapTime && Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
            // タップで回転
            try {
                gameState.handle_input(3); // RotateClockwise
            } catch (error) {
                console.error('Rotation failed:', error);
            }
        }
        // スワイプ
        else if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 横スワイプ
            if (Math.abs(deltaX) > minSwipeDistance) {
                try {
                    if (deltaX > 0) {
                        gameState.handle_input(1); // MoveRight
                    } else {
                        gameState.handle_input(0); // MoveLeft
                    }
                } catch (error) {
                    console.error('Move failed:', error);
                }
            }
        } else {
            // 縦スワイプ
            if (Math.abs(deltaY) > minSwipeDistance) {
                try {
                    if (deltaY > 0) {
                        gameState.handle_input(2); // SoftDrop
                    } else {
                        gameState.handle_input(5); // HardDrop
                    }
                } catch (error) {
                    console.error('Drop failed:', error);
                }
            }
        }
    });
    
    // タッチスクロールを防ぐ
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    });
}

function startGame() {
    if (!gameState) return;
    
    console.log('ゲーム開始');
    gameState.start_game();
    
    // 自動落下タイマーを開始
    startAutoFall();
    
    updateGameUI();
}

function startAnimationUpdates() {
    if (!gameState) return;
    
    // アニメーション更新タイマーを設定（16ms = 60FPS相当）
    if (animationInterval !== null) {
        clearInterval(animationInterval);
    }
    
    animationInterval = window.setInterval(() => {
        if (gameState) {
            gameState.update_animation();
            // アニメーション更新の場合はUIも更新
            updateGameUI();
        }
    }, 16);
    
    console.log('アニメーション更新タイマー開始: 16ms間隔');
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
    autoFallInterval = window.setInterval(() => {
        if (gameState && gameState.get_game_mode() === 1) { // Playing mode
            const didFall = gameState.auto_fall();
            if (didFall) {
                console.log('自動落下実行');
                updateGameUI();
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
            updateGameUI();
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
            updateGameUI();
            console.log(`入力処理完了: ${inputCode}`);
        }
    }
}

function updateUI() {
    updateGameUI();
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
    
    // Connected cellsの詳細情報を取得して数字を描画
    const connectedCellsInfo = gameState.get_connected_cells_info();
    if (connectedCellsInfo && connectedCellsInfo.length > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.min(cellWidth, cellHeight) * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let i = 0; i < connectedCellsInfo.length; i += 3) {
            const x = connectedCellsInfo[i];
            const y = connectedCellsInfo[i + 1];
            const count = connectedCellsInfo[i + 2];
            
            const pixelX = x * cellWidth;
            const pixelY = y * cellHeight;
            
            // 連結数を表示
            ctx.fillText(count.toString(), pixelX + cellWidth / 2, pixelY + cellHeight / 2);
        }
    }
    
    // アニメーション効果を描画（ボードの上に重ねる）
    drawLineAnimation();
    
    // ゴーストピースを描画（現在のピースより下に）
    drawGhostPiece();
    
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
    
    // 次ピースを描画
    drawNextPiece();
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
    // CLI版3色システムに対応したカラーマッピング
    switch (cellValue) {
        // 3色システム（CLI版準拠）
        case 1: return '#00ffff'; // Cyan (色値0+1)
        case 2: return '#ff00ff'; // Magenta (色値1+1)
        case 3: return '#ffff00'; // Yellow (色値2+1)
        
        // 後方互換性のため旧色も保持
        case 4: return '#ff0000'; // Red
        case 5: return '#00ff00'; // Green
        case 6: return '#0000ff'; // Blue
        case 7: return '#ffffff'; // White
        case 8: return '#000000'; // Black
        case 9: return '#808080'; // Dark Grey
        
        // Connected cells (10+) - CLI版の3色スコアリング用
        case 10: return '#00cccc'; // Connected Cyan (0+10)
        case 11: return '#cc00cc'; // Connected Magenta (1+10)
        case 12: return '#cccc00'; // Connected Yellow (2+10)
        
        // その他のConnected cells（後方互換性）
        case 13: return '#cc0000'; // Connected Red
        case 14: return '#00cc00'; // Connected Green
        case 15: return '#0000cc'; // Connected Blue
        
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

// 次ピース描画関数
function drawNextPiece() {
    const nextCanvas = document.getElementById('next-piece-canvas') as HTMLCanvasElement;
    if (!nextCanvas || !gameState) return;
    
    const nextCtx = nextCanvas.getContext('2d');
    if (!nextCtx) return;
    
    // 背景クリア
    nextCtx.fillStyle = '#000000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // 次ピースのブロック座標を取得
    const nextPieceBlocks = gameState.get_next_piece_blocks();
    if (nextPieceBlocks && nextPieceBlocks.length > 0) {
        // ブロックサイズ（キャンバスサイズに応じて調整）
        const blockSize = Math.floor(nextCanvas.width / 5); // 5分割でゆったり表示
        
        // 描画オフセット（中央寄せ）
        const offsetX = (nextCanvas.width - blockSize * 4) / 2;
        const offsetY = (nextCanvas.height - blockSize * 4) / 2;
        
        // get_next_piece_blocks() は [x, y, color, x, y, color, ...] 形式で返す
        for (let i = 0; i < nextPieceBlocks.length; i += 3) {
            const blockX = nextPieceBlocks[i];
            const blockY = nextPieceBlocks[i + 1];
            const blockColor = nextPieceBlocks[i + 2];
            
            // 次ピース用の色設定
            nextCtx.fillStyle = getCellColor(blockColor + 1);
            
            const pixelX = offsetX + blockX * blockSize;
            const pixelY = offsetY + blockY * blockSize;
            
            nextCtx.fillRect(pixelX, pixelY, blockSize - 1, blockSize - 1);
        }
    }
}

// ゴーストピース描画関数
function drawGhostPiece() {
    if (!gameState) return;
    
    // ゴーストピースのブロック座標を取得
    const ghostPieceBlocks = gameState.get_ghost_piece_blocks();
    if (ghostPieceBlocks && ghostPieceBlocks.length > 0) {
        const [BOARD_WIDTH, BOARD_HEIGHT] = get_board_dimensions();
        const cellWidth = canvas.width / BOARD_WIDTH;
        const cellHeight = canvas.height / BOARD_HEIGHT;
        
        // 半透明設定
        const previousAlpha = ctx.globalAlpha;
        ctx.globalAlpha = 0.3; // 30% 透明度
        
        // get_ghost_piece_blocks() は [x, y, color, x, y, color, ...] 形式で返す
        for (let i = 0; i < ghostPieceBlocks.length; i += 3) {
            const blockX = ghostPieceBlocks[i];
            const blockY = ghostPieceBlocks[i + 1];
            const blockColor = ghostPieceBlocks[i + 2];
            
            if (blockX >= 0 && blockX < BOARD_WIDTH && 
                blockY >= 0 && blockY < BOARD_HEIGHT) {
                
                // ゴーストピース用の色設定（薄い色で表示）
                ctx.fillStyle = getCellColor(blockColor + 1);
                
                const pixelX = blockX * cellWidth;
                const pixelY = blockY * cellHeight;
                
                ctx.fillRect(pixelX, pixelY, cellWidth - 1, cellHeight - 1);
            }
        }
        
        // 透明度を元に戻す
        ctx.globalAlpha = previousAlpha;
    }
}

// ラインアニメーション描画関数（CLI版互換Animation System対応）
function drawLineAnimation() {
    if (!gameState || !ctx) return;
    
    // アニメーション情報を取得
    const animationInfo = gameState.get_animation_info();
    if (!animationInfo || animationInfo.length === 0) {
        return; // アニメーション中でない
    }
    
    // 新しい形式: [type_id, elapsed_ms, ...additional_data]
    let index = 0;
    while (index < animationInfo.length) {
        const animationType = animationInfo[index];
        const elapsedMs = animationInfo[index + 1];
        
        if (animationType === 1) { // LineBlink animation
            const count = animationInfo[index + 2];
            const lineCount = animationInfo[index + 3];
            const lines: number[] = [];
            for (let i = 0; i < lineCount; i++) {
                lines.push(animationInfo[index + 4 + i]);
            }
            
            // CLI版と同じ点滅パターン（120msごとに切り替え、countベース）
            const blinkCycle = count % 2;
            if (blinkCycle === 1) { // 点滅の"オン"状態
                const [, BOARD_HEIGHT] = get_board_dimensions();
                const cellHeight = canvas.height / BOARD_HEIGHT;
                
                // 点滅ラインを白でハイライト
                ctx.fillStyle = '#FFFFFF';
                const previousAlpha = ctx.globalAlpha;
                ctx.globalAlpha = 0.7; // 70%透明度
                
                for (const lineY of lines) {
                    const pixelY = lineY * cellHeight;
                    ctx.fillRect(0, pixelY, canvas.width, cellHeight - 1);
                }
                
                ctx.globalAlpha = previousAlpha;
            }
            
            index += 4 + lineCount; // 次のアニメーションデータにスキップ
            
        } else if (animationType === 2) { // PushDown animation
            const grayLineY = animationInfo[index + 2];
            
            // PushDownアニメーション表示（将来実装）
            console.log(`PushDown animation at line ${grayLineY}, elapsed: ${elapsedMs}ms`);
            
            index += 3; // 次のアニメーションデータにスキップ
            
        } else {
            // 不明なアニメーションタイプ
            console.warn(`Unknown animation type: ${animationType}`);
            break;
        }
    }
}

export { initGame };
