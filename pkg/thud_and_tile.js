let wasm;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint32ArrayMemory0 = null;

function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

export function main() {
    wasm.main();
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedInt32ArrayMemory0 = null;

function getInt32ArrayMemory0() {
    if (cachedInt32ArrayMemory0 === null || cachedInt32ArrayMemory0.byteLength === 0) {
        cachedInt32ArrayMemory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32ArrayMemory0;
}

function getArrayI32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}
/**
 * バージョン情報を返す
 * @returns {string}
 */
export function get_version() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.get_version();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * ボード寸法を返す
 * @returns {Uint32Array}
 */
export function get_board_dimensions() {
    const ret = wasm.get_board_dimensions();
    var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

const WasmCustomScoreSystemFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmcustomscoresystem_free(ptr >>> 0, 1));
/**
 * WASMバインディング対応のCustomScoreSystemラッパー
 * 既存のscoring.rsロジックを活用し、JavaScript連携を提供
 */
export class WasmCustomScoreSystem {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmCustomScoreSystemFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmcustomscoresystem_free(ptr, 0);
    }
    /**
     * 新しいWasmCustomScoreSystemを作成
     */
    constructor() {
        const ret = wasm.wasmcustomscoresystem_new();
        this.__wbg_ptr = ret >>> 0;
        WasmCustomScoreSystemFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * スコアを加算（色別管理は行わない）
     * @param {number} points
     */
    add_score(points) {
        wasm.wasmcustomscoresystem_add_score(this.__wbg_ptr, points);
    }
    /**
     * 合計スコアを取得
     * @returns {number}
     */
    get_total_score() {
        const ret = wasm.wasmcustomscoresystem_get_total_score(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * 指定された色の最大チェーン数を更新
     * @param {number} color_index
     * @param {number} chain_count
     */
    update_max_chain(color_index, chain_count) {
        wasm.wasmcustomscoresystem_update_max_chain(this.__wbg_ptr, color_index, chain_count);
    }
    /**
     * 指定された色の最大チェーン数を取得
     * @param {number} color_index
     * @returns {number}
     */
    get_max_chain(color_index) {
        const ret = wasm.wasmcustomscoresystem_get_max_chain(this.__wbg_ptr, color_index);
        return ret >>> 0;
    }
    /**
     * 全色の最大チェーン数を配列で取得 [cyan, magenta, yellow]
     * @returns {Uint32Array}
     */
    get_all_max_chains() {
        const ret = wasm.wasmcustomscoresystem_get_all_max_chains(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * 全体の最大チェーン数を取得
     * @returns {number}
     */
    get_overall_max_chain() {
        const ret = wasm.wasmcustomscoresystem_get_overall_max_chain(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * スコア表示用文字列を取得（CLI版のDisplay traitと同等）
     * @returns {string}
     */
    get_display_string() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmcustomscoresystem_get_display_string(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * JavaScript用のスコア詳細情報を取得
     * [total_score, cyan_chain, magenta_chain, yellow_chain]
     * @returns {Uint32Array}
     */
    get_score_details() {
        const ret = wasm.wasmcustomscoresystem_get_score_details(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * 現在のchain bonus段数を取得
     * @returns {number}
     */
    get_chain_bonus() {
        const ret = wasm.wasmcustomscoresystem_get_chain_bonus(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) WasmCustomScoreSystem.prototype[Symbol.dispose] = WasmCustomScoreSystem.prototype.free;

const WasmGameStateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmgamestate_free(ptr >>> 0, 1));
/**
 * ゲーム状態を表すWASMエクスポート用構造体
 */
export class WasmGameState {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmGameStateFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmgamestate_free(ptr, 0);
    }
    /**
     * 新しいゲーム状態を作成
     */
    constructor() {
        const ret = wasm.wasmgamestate_new();
        this.__wbg_ptr = ret >>> 0;
        WasmGameStateFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * ゲームを開始
     */
    start_game() {
        wasm.wasmgamestate_start_game(this.__wbg_ptr);
    }
    /**
     * 新しいピースをスポーン（CLI版と同じロジック）
     */
    spawn_piece() {
        wasm.wasmgamestate_spawn_piece(this.__wbg_ptr);
    }
    /**
     * 現在の合計スコアを取得
     * @returns {number}
     */
    get_score() {
        const ret = wasm.wasmgamestate_get_score(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * 3色別最大チェーン数を取得 [cyan, magenta, yellow]
     * @returns {Uint32Array}
     */
    get_max_chains() {
        const ret = wasm.wasmgamestate_get_max_chains(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * 現在のchain bonus段数を取得
     * @returns {number}
     */
    get_chain_bonus() {
        const ret = wasm.wasmgamestate_get_chain_bonus(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * スコア詳細情報を取得
     * [total, cyan_chain, magenta_chain, yellow_chain]
     * @returns {Uint32Array}
     */
    get_score_details() {
        const ret = wasm.wasmgamestate_get_score_details(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * スコア表示用文字列を取得
     * @returns {string}
     */
    get_score_display() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmgamestate_get_score_display(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * ゲームモードを取得
     * @returns {number}
     */
    get_game_mode() {
        const ret = wasm.wasmgamestate_get_game_mode(this.__wbg_ptr);
        return ret;
    }
    /**
     * ボードの状態を取得（JavaScriptで扱いやすい形式）
     * @returns {Uint8Array}
     */
    get_board_state() {
        const ret = wasm.wasmgamestate_get_board_state(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * 入力を処理
     * @param {number} input_code
     * @returns {boolean}
     */
    handle_input(input_code) {
        const ret = wasm.wasmgamestate_handle_input(this.__wbg_ptr, input_code);
        return ret !== 0;
    }
    /**
     * 現在のピースを移動
     * @param {number} dx
     * @param {number} dy
     * @returns {boolean}
     */
    move_current_piece(dx, dy) {
        const ret = wasm.wasmgamestate_move_current_piece(this.__wbg_ptr, dx, dy);
        return ret !== 0;
    }
    /**
     * 現在のピースを回転（SRS準拠）
     * @param {boolean} clockwise
     * @returns {boolean}
     */
    rotate_current_piece(clockwise) {
        const ret = wasm.wasmgamestate_rotate_current_piece(this.__wbg_ptr, clockwise);
        return ret !== 0;
    }
    /**
     * ハードドロップ
     * @returns {boolean}
     */
    hard_drop() {
        const ret = wasm.wasmgamestate_hard_drop(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * ピースを固定
     */
    lock_piece() {
        wasm.wasmgamestate_lock_piece(this.__wbg_ptr);
    }
    /**
     * Connected cellsの詳細情報を取得 [x, y, count, x, y, count, ...]
     * @returns {Int32Array}
     */
    get_connected_cells_info() {
        const ret = wasm.wasmgamestate_get_connected_cells_info(this.__wbg_ptr);
        var v1 = getArrayI32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * 現在のピース情報を取得（JavaScript用）
     * @returns {Int32Array}
     */
    get_current_piece_info() {
        const ret = wasm.wasmgamestate_get_current_piece_info(this.__wbg_ptr);
        var v1 = getArrayI32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * 自動落下処理 - JavaScriptから定期的に呼び出される
     * @returns {boolean}
     */
    auto_fall() {
        const ret = wasm.wasmgamestate_auto_fall(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * 自動落下速度を取得（ミリ秒）
     * @returns {number}
     */
    get_fall_speed_ms() {
        const ret = wasm.wasmgamestate_get_fall_speed_ms(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * 自動落下速度を設定（ミリ秒）
     * @param {number} ms
     */
    set_fall_speed_ms(ms) {
        wasm.wasmgamestate_set_fall_speed_ms(this.__wbg_ptr, ms);
    }
    /**
     * 現在のボード高さを取得（Dynamic Board Height System）
     * @returns {number}
     */
    get_current_board_height() {
        const ret = wasm.wasmgamestate_get_current_board_height(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * 現在のボード高さを設定（Dynamic Board Height System）
     * @param {number} height
     */
    set_current_board_height(height) {
        wasm.wasmgamestate_set_current_board_height(this.__wbg_ptr, height);
    }
    /**
     * @returns {Int32Array}
     */
    get_current_piece_blocks() {
        const ret = wasm.wasmgamestate_get_current_piece_blocks(this.__wbg_ptr);
        var v1 = getArrayI32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * 次のテトロミノの情報を取得 [x, y, rotation, primary_color, shape]
     * @returns {Int32Array}
     */
    get_next_piece_info() {
        const ret = wasm.wasmgamestate_get_next_piece_info(this.__wbg_ptr);
        var v1 = getArrayI32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * 次のテトロミノの全ブロック座標を取得（プレビュー用）
     * @returns {Int32Array}
     */
    get_next_piece_blocks() {
        const ret = wasm.wasmgamestate_get_next_piece_blocks(this.__wbg_ptr);
        var v1 = getArrayI32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * ゴーストピースのブロック座標を取得
     * @returns {Int32Array}
     */
    get_ghost_piece_blocks() {
        const ret = wasm.wasmgamestate_get_ghost_piece_blocks(this.__wbg_ptr);
        var v1 = getArrayI32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * アニメーション処理を実行（CLI版互換・共通モジュール使用）
     */
    update_animation() {
        wasm.wasmgamestate_update_animation(this.__wbg_ptr);
    }
    /**
     * アニメーション情報を取得（JavaScript用）
     * @returns {Int32Array}
     */
    get_animation_info() {
        const ret = wasm.wasmgamestate_get_animation_info(this.__wbg_ptr);
        var v1 = getArrayI32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) WasmGameState.prototype[Symbol.dispose] = WasmGameState.prototype.free;

const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_log_1f178360679b366e = function(arg0, arg1) {
        console.log(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_now_b9720d7cf1ebb2f3 = function() {
        const ret = Date.now();
        return ret;
    };
    imports.wbg.__wbg_random_f692b0a36f9fba62 = function() {
        const ret = Math.random();
        return ret;
    };
    imports.wbg.__wbg_wbindgenthrow_451ec1a8469d7eb6 = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_0;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedInt32ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('thud_and_tile_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
