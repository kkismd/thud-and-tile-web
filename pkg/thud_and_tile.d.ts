/* tslint:disable */
/* eslint-disable */
export function main(): void;
/**
 * バージョン情報を返す
 */
export function get_version(): string;
/**
 * ボード寸法を返す
 */
export function get_board_dimensions(): Uint32Array;
/**
 * WASMバインディング対応のCustomScoreSystemラッパー
 * 既存のscoring.rsロジックを活用し、JavaScript連携を提供
 */
export class WasmCustomScoreSystem {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * 新しいWasmCustomScoreSystemを作成
   */
  constructor();
  /**
   * スコアを加算（色別管理は行わない）
   */
  add_score(points: number): void;
  /**
   * 合計スコアを取得
   */
  get_total_score(): number;
  /**
   * 指定された色の最大チェーン数を更新
   */
  update_max_chain(color_index: number, chain_count: number): void;
  /**
   * 指定された色の最大チェーン数を取得
   */
  get_max_chain(color_index: number): number;
  /**
   * 全色の最大チェーン数を配列で取得 [cyan, magenta, yellow]
   */
  get_all_max_chains(): Uint32Array;
  /**
   * 全体の最大チェーン数を取得
   */
  get_overall_max_chain(): number;
  /**
   * スコア表示用文字列を取得（CLI版のDisplay traitと同等）
   */
  get_display_string(): string;
  /**
   * JavaScript用のスコア詳細情報を取得
   * [total_score, cyan_chain, magenta_chain, yellow_chain]
   */
  get_score_details(): Uint32Array;
  /**
   * 現在のchain bonus段数を取得
   */
  get_chain_bonus(): number;
}
/**
 * ゲーム状態を表すWASMエクスポート用構造体
 */
export class WasmGameState {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * 新しいゲーム状態を作成
   */
  constructor();
  /**
   * ゲームを開始
   */
  start_game(): void;
  /**
   * 新しいピースをスポーン（CLI版と同じロジック）
   */
  spawn_piece(): void;
  /**
   * 現在の合計スコアを取得
   */
  get_score(): number;
  /**
   * 3色別最大チェーン数を取得 [cyan, magenta, yellow]
   */
  get_max_chains(): Uint32Array;
  /**
   * 現在のchain bonus段数を取得
   */
  get_chain_bonus(): number;
  /**
   * スコア詳細情報を取得
   * [total, cyan_chain, magenta_chain, yellow_chain]
   */
  get_score_details(): Uint32Array;
  /**
   * スコア表示用文字列を取得
   */
  get_score_display(): string;
  /**
   * ゲームモードを取得
   */
  get_game_mode(): number;
  /**
   * ボードの状態を取得（JavaScriptで扱いやすい形式）
   */
  get_board_state(): Uint8Array;
  /**
   * 入力を処理
   */
  handle_input(input_code: number): boolean;
  /**
   * 現在のピースを移動
   */
  move_current_piece(dx: number, dy: number): boolean;
  /**
   * 現在のピースを回転（SRS準拠）
   */
  rotate_current_piece(clockwise: boolean): boolean;
  /**
   * ハードドロップ
   */
  hard_drop(): boolean;
  /**
   * ピースを固定
   */
  lock_piece(): void;
  /**
   * Connected cellsの詳細情報を取得 [x, y, count, x, y, count, ...]
   */
  get_connected_cells_info(): Int32Array;
  /**
   * 現在のピース情報を取得（JavaScript用）
   */
  get_current_piece_info(): Int32Array;
  /**
   * 自動落下処理 - JavaScriptから定期的に呼び出される
   */
  auto_fall(): boolean;
  /**
   * 自動落下速度を取得（ミリ秒）
   */
  get_fall_speed_ms(): number;
  /**
   * 自動落下速度を設定（ミリ秒）
   */
  set_fall_speed_ms(ms: number): void;
  /**
   * 現在のボード高さを取得（Dynamic Board Height System）
   */
  get_current_board_height(): number;
  /**
   * 現在のボード高さを設定（Dynamic Board Height System）
   */
  set_current_board_height(height: number): void;
  get_current_piece_blocks(): Int32Array;
  /**
   * 次のテトロミノの情報を取得 [x, y, rotation, primary_color, shape]
   */
  get_next_piece_info(): Int32Array;
  /**
   * 次のテトロミノの全ブロック座標を取得（プレビュー用）
   */
  get_next_piece_blocks(): Int32Array;
  /**
   * ゴーストピースのブロック座標を取得
   */
  get_ghost_piece_blocks(): Int32Array;
  /**
   * アニメーション処理を実行（段階的ライン検出版）
   */
  update_animation(): void;
  /**
   * アニメーション情報を取得（JavaScript用）
   */
  get_animation_info(): Int32Array;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasmcustomscoresystem_free: (a: number, b: number) => void;
  readonly wasmcustomscoresystem_new: () => number;
  readonly wasmcustomscoresystem_add_score: (a: number, b: number) => void;
  readonly wasmcustomscoresystem_get_total_score: (a: number) => number;
  readonly wasmcustomscoresystem_update_max_chain: (a: number, b: number, c: number) => void;
  readonly wasmcustomscoresystem_get_max_chain: (a: number, b: number) => number;
  readonly wasmcustomscoresystem_get_all_max_chains: (a: number) => [number, number];
  readonly wasmcustomscoresystem_get_overall_max_chain: (a: number) => number;
  readonly wasmcustomscoresystem_get_display_string: (a: number) => [number, number];
  readonly wasmcustomscoresystem_get_score_details: (a: number) => [number, number];
  readonly wasmcustomscoresystem_get_chain_bonus: (a: number) => number;
  readonly __wbg_wasmgamestate_free: (a: number, b: number) => void;
  readonly wasmgamestate_new: () => number;
  readonly wasmgamestate_start_game: (a: number) => void;
  readonly wasmgamestate_spawn_piece: (a: number) => void;
  readonly wasmgamestate_get_score: (a: number) => number;
  readonly wasmgamestate_get_max_chains: (a: number) => [number, number];
  readonly wasmgamestate_get_chain_bonus: (a: number) => number;
  readonly wasmgamestate_get_score_details: (a: number) => [number, number];
  readonly wasmgamestate_get_score_display: (a: number) => [number, number];
  readonly wasmgamestate_get_game_mode: (a: number) => number;
  readonly wasmgamestate_get_board_state: (a: number) => [number, number];
  readonly wasmgamestate_handle_input: (a: number, b: number) => number;
  readonly wasmgamestate_move_current_piece: (a: number, b: number, c: number) => number;
  readonly wasmgamestate_rotate_current_piece: (a: number, b: number) => number;
  readonly wasmgamestate_hard_drop: (a: number) => number;
  readonly wasmgamestate_lock_piece: (a: number) => void;
  readonly wasmgamestate_get_connected_cells_info: (a: number) => [number, number];
  readonly wasmgamestate_get_current_piece_info: (a: number) => [number, number];
  readonly wasmgamestate_auto_fall: (a: number) => number;
  readonly wasmgamestate_get_fall_speed_ms: (a: number) => number;
  readonly wasmgamestate_set_fall_speed_ms: (a: number, b: number) => void;
  readonly wasmgamestate_get_current_board_height: (a: number) => number;
  readonly wasmgamestate_set_current_board_height: (a: number, b: number) => void;
  readonly get_version: () => [number, number];
  readonly get_board_dimensions: () => [number, number];
  readonly wasmgamestate_get_current_piece_blocks: (a: number) => [number, number];
  readonly wasmgamestate_get_next_piece_info: (a: number) => [number, number];
  readonly wasmgamestate_get_next_piece_blocks: (a: number) => [number, number];
  readonly wasmgamestate_get_ghost_piece_blocks: (a: number) => [number, number];
  readonly wasmgamestate_update_animation: (a: number) => void;
  readonly wasmgamestate_get_animation_info: (a: number) => [number, number];
  readonly main: () => void;
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
