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

// アニメーション更新用タイムスタンプ
let lastAnimationUpdate: number = 0;

// ゲームオーバー状態
let currentGameMode: number = 0; // 前回のゲームモード
let gameOverShown: boolean = false; // ゲームオーバー画面が表示されているか

// デバッグ情報更新用（60FPS→10FPSに間引き）
let lastDebugUpdate: number = 0;
const DEBUG_UPDATE_INTERVAL = 100; // 100ms = 10FPS

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
        
        // 初期ゲームモードを設定
        currentGameMode = gameState.get_game_mode();
        
        // ゲームUIを表示
        updateGameUI();
        
        // イベントリスナーを設定
        setupEventListeners();
        
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
    
    // ゲームモード変化をチェック
    checkGameModeChange();

    // スコア表示を更新
    updateScoreDisplay();
}

function updateDebugInfo(currentTime: number) {
    if (!gameState) return;
    
    // デバッグ情報は10FPSに間引き（100ms間隔）
    if (currentTime - lastDebugUpdate < DEBUG_UPDATE_INTERVAL) {
        return;
    }
    lastDebugUpdate = currentTime;
    
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
            Chain Bonus: ${gameState.get_chain_bonus()}<br>
            Fall Speed: ${gameState.get_fall_speed_ms()}ms<br>
            ${animationStatus}
        `;
    }
}

function updateScoreDisplay() {
    if (!gameState) return;

    const chainBonusElement = document.getElementById('chain-bonus-value');
    if (chainBonusElement) {
        chainBonusElement.textContent = gameState.get_chain_bonus().toString();
    }

    // 総合スコア
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = gameState.get_score().toString();
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
    
    // ゲームオーバーのリスタートボタン
    const restartGameOverButton = document.getElementById('restart-game-over');
    if (restartGameOverButton) {
        restartGameOverButton.addEventListener('click', () => {
            restartGameFromGameOver();
        });
    }
    
    // ゲームオーバーの閉じるボタン
    const closeGameOverButton = document.getElementById('close-game-over');
    if (closeGameOverButton) {
        closeGameOverButton.addEventListener('click', () => {
            hideGameOver();
        });
    }
}

function setupTouchControls() {
    if (!canvas) return;
    
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastDirection = 0; // 前回の移動方向 (1: 右, -1: 左, 0: なし)
    let accumulatedMoves = 0; // 累積移動回数
    let isProportionalMoving = false; // 比例移動中かどうか
    let lastTouchX = 0; // 前回のタッチX座標
    let moveStartX = 0; // 現在の移動シーケンスの開始X座標
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
        lastDirection = 0;
        accumulatedMoves = 0;
        isProportionalMoving = false;
        lastTouchX = touch.clientX;
        moveStartX = touch.clientX;
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
        
        // 比例移動していない場合のみ従来の操作を実行
        if (!isProportionalMoving) {
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
        }
        
        // 状態をリセット
        lastDirection = 0;
        accumulatedMoves = 0;
        isProportionalMoving = false;
        lastTouchX = 0;
        moveStartX = 0;
    });
    
    // 比例移動機能付きtouchmoveハンドラ
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!gameState) return;
        
        const touch = e.touches[0];
        const currentX = touch.clientX;
        const currentY = touch.clientY;
        
        // 開始点からの総移動量
        const totalDeltaX = currentX - touchStartX;
        const totalDeltaY = currentY - touchStartY;
        
        // 前回位置からの移動量（方向転換検出用）
        const deltaFromLast = currentX - lastTouchX;
        
        // セルサイズを計算（ボードの幅に基づく）
        const [BOARD_WIDTH] = get_board_dimensions();
        const cellSize = canvas.width / BOARD_WIDTH;
        
        // 比例移動の最小閾値（セルサイズの半分）
        const minProportionalThreshold = cellSize * 0.5;
        
        // 水平移動が主要で、かつ十分な距離を移動した場合のみ比例移動
        if (Math.abs(totalDeltaX) > Math.abs(totalDeltaY) && Math.abs(totalDeltaX) > minProportionalThreshold) {
            isProportionalMoving = true;
            
            // 前回位置からの移動方向を取得
            const instantDirection = deltaFromLast > 0 ? 1 : deltaFromLast < 0 ? -1 : lastDirection;
            
            // 方向転換の検出：前回位置から逆方向に一定距離以上移動した場合
            if (lastDirection === 0) {
                // 初回の方向設定
                lastDirection = instantDirection;
                moveStartX = currentX;
            } else if (lastDirection !== instantDirection && Math.abs(deltaFromLast) > cellSize * 0.2) {
                // 方向転換検出：前回位置から逆方向に移動した場合
                accumulatedMoves = 0;
                lastDirection = instantDirection;
                moveStartX = currentX; // 現在位置を新しい移動開始点に設定
            }
            
            // 移動開始点からの移動距離で計算
            const effectiveDeltaX = currentX - moveStartX;
            const targetMoves = Math.floor(Math.abs(effectiveDeltaX) / cellSize);
            
            // まだ移動していない分を実行
            const movesToExecute = targetMoves - accumulatedMoves;
            
            if (movesToExecute > 0) {
                try {
                    for (let i = 0; i < movesToExecute; i++) {
                        if (lastDirection > 0) {
                            gameState.handle_input(1); // MoveRight
                        } else {
                            gameState.handle_input(0); // MoveLeft
                        }
                        accumulatedMoves++;
                    }
                } catch (error) {
                    console.error('Proportional move failed:', error);
                }
            }
        }
        
        // 前回位置を更新
        lastTouchX = currentX;
    });
}

function startGame() {
    if (!gameState) return;
    
    gameState.start_game();
    
    // 自動落下タイマーを開始
    startAutoFall();
    
    updateGameUI();
}

function startAutoFall() {
    if (!gameState) return;
    
    // 既存のタイマーをクリア
    if (autoFallInterval !== null) {
        clearInterval(autoFallInterval);
    }
    
    // 自動落下の間隔を取得（WASMから）
    const fallSpeedMs = gameState.get_fall_speed_ms();
    
    // 自動落下タイマーを設定
    autoFallInterval = window.setInterval(() => {
        if (gameState && gameState.get_game_mode() === 1) { // Playing mode
            gameState.auto_fall();
            updateGameUI();
        }
    }, fallSpeedMs);
}

function stopAutoFall() {
    if (autoFallInterval !== null) {
        clearInterval(autoFallInterval);
        autoFallInterval = null;
    }
}

function togglePause() {
    // 将来の実装: ポーズ機能
}

function handleKeyPress(event: KeyboardEvent) {
    if (!gameState) return;
    
    const key = event.key;
    const inputCode = INPUT_MAPPING[key as keyof typeof INPUT_MAPPING];
    
    if (inputCode !== undefined) {
        event.preventDefault();
        
        // 特別なキー処理
        if (inputCode === 6) { // Restart
            gameState.start_game();
            startAutoFall(); // 自動落下も再開始
            updateGameUI();
            return;
        }
        
        if (inputCode === 7) { // Quit
            stopAutoFall();
            // ゲーム状態をリセット（将来の実装）
            return;
        }
        
        // 通常の入力を処理
        const handled = gameState.handle_input(inputCode);
        
        if (handled) {
            updateGameUI();
        }
    }
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
        // フォントサイズを大幅に拡大 - ブロックいっぱいまで大きく
        ctx.font = `bold ${Math.min(cellWidth, cellHeight) * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let i = 0; i < connectedCellsInfo.length; i += 3) {
            const x = connectedCellsInfo[i];
            const y = connectedCellsInfo[i + 1];
            const count = connectedCellsInfo[i + 2];
            
            const pixelX = x * cellWidth;
            const pixelY = y * cellHeight;
            const centerX = pixelX + cellWidth / 2;
            const centerY = pixelY + cellHeight / 2;
            const text = count.toString();
            
            // 方法2: 黒いふちどりを先に描画（プロフェッショナルな見た目）
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = Math.max(3, Math.min(cellWidth, cellHeight) * 0.12); // ふちどりを太く調整
            ctx.strokeText(text, centerX, centerY);
            
            // 白い文字を上に描画（華やかさと特別感を演出）
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, centerX, centerY);
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
        
        // Connected cells (10+) - より明るく目立つ色に変更
        case 10: return '#00ffff'; // Connected Cyan - 通常ピースと同じ明るさ
        case 11: return '#ff00ff'; // Connected Magenta - 通常ピースと同じ明るさ  
        case 12: return '#ffff00'; // Connected Yellow - 通常ピースと同じ明るさ
        
        // その他のConnected cells（明るく調整）
        case 13: return '#ff4444'; // Connected Red - より明るく
        case 14: return '#44ff44'; // Connected Green - より明るく
        case 15: return '#4444ff'; // Connected Blue - より明るく
        
        // Special cells
    case 20: return '#666666'; // Legacy gray (unused)
        case 21: return '#444444'; // Solid
        
        default: return '#222222'; // Default
    }
}

function gameLoop(currentTime: number = 0) {
    // アニメーション状態を更新（16ms = 60FPS間隔）
    if (gameState && currentTime - lastAnimationUpdate >= 16) {
        gameState.update_animation();
        lastAnimationUpdate = currentTime;
    }
    
    // UI更新（60FPS）
    updateGameUI();
    
    // デバッグ情報更新（10FPSに間引き）
    updateDebugInfo(currentTime);
    
    // 描画（60FPS）
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
            // Note: PushDown中のSolidラインは通常のボード描画で自動的に表示される
            // CLI版も同様に、特別な視覚エフェクト（落下軌跡など）は実装していない
            // アニメーションはタイミング制御のみ（50msごとにボード状態を更新）
            
            index += 3; // 次のアニメーションデータにスキップ
            
        } else {
            // 不明なアニメーションタイプ
            console.warn(`Unknown animation type: ${animationType}`);
            break;
        }
    }
}

// ゲームオーバー関連の関数
function showGameOver() {
    if (!gameState || gameOverShown) return;
    
    gameOverShown = true;
    
    // 自動落下を停止
    stopAutoFall();
    
    // 最終スコアを取得
    const totalScore = gameState.get_score();
    const chainBonus = gameState.get_chain_bonus();
    const maxChains = gameState.get_max_chains();
    
    // オーバーレイ要素を取得
    const overlay = document.getElementById('game-over-overlay');
    const finalTotalScore = document.getElementById('final-total-score');
    const finalChainBonus = document.getElementById('final-chain-bonus');
    const finalMaxChain = document.getElementById('final-max-chain');
    
    if (overlay && finalTotalScore && finalChainBonus && finalMaxChain) {
        // スコア情報を表示
        finalTotalScore.textContent = totalScore.toString();
        finalChainBonus.textContent = chainBonus.toString();
        
        // 最大チェーン（全色の最大値）
        const maxChain = Math.max(maxChains[0], maxChains[1], maxChains[2]);
        finalMaxChain.textContent = maxChain.toString();
        
        // オーバーレイを表示
        overlay.classList.remove('hidden');
    }
}

function hideGameOver() {
    gameOverShown = false;
    const overlay = document.getElementById('game-over-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function restartGameFromGameOver() {
    if (!gameState) return;
    
    // ゲームオーバー画面を隠す
    hideGameOver();
    
    // ゲーム状態をリセット
    gameState.start_game();
    currentGameMode = 1; // Playing mode
    
    // 自動落下を再開
    startAutoFall();
    
    // UIを更新
    updateGameUI();
}

// ゲームモード変化の検出
function checkGameModeChange() {
    if (!gameState) return;
    
    const newGameMode = gameState.get_game_mode();
    
    // ゲームオーバーになった場合
    if (currentGameMode !== 2 && newGameMode === 2) {
        showGameOver();
    }
    
    currentGameMode = newGameMode;
}

export { initGame };
