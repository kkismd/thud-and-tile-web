# Thud & Tile Web版

WebAssembly (Rust) + TypeScript で作られたパズルゲーム

## 🎮 ゲームプレイ

### デスクトップ操作
- **A/←**: 左移動
- **D/→**: 右移動  
- **S/↓**: ソフトドロップ
- **W/↑**: 回転
- **Space**: ハードドロップ
- **R**: リスタート

### モバイル操作
- **タップ**: 回転
- **横スワイプ**: 左右移動
- **下スワイプ**: ソフトドロップ
- **上スワイプ**: ハードドロップ

## 🚀 開発・デプロイ

### ローカル開発
```bash
# 依存関係インストール
npm install

# WASM ビルド + 開発サーバー起動
npm run wasm:dev

# 個別実行
npm run wasm:build  # WASMビルドのみ
npm run dev         # 開発サーバーのみ
```

### プロダクションビルド
```bash
npm run wasm:build
npm run build
```

### GitHub Pagesデプロイ

#### 方法1: GitHub Actions (自動デプロイ)
1. GitHubリポジトリの Settings → Pages
2. Source を "GitHub Actions" に設定
3. mainブランチにpushすると自動デプロイ

#### 方法2: 手動デプロイ
```bash
# gh-pagesパッケージインストール
npm install --save-dev gh-pages

# デプロイ実行
npm run deploy
```

### デプロイURL
https://kkismd.github.io/thud-and-tile-web/

## 🛠 技術スタック
- **フロントエンド**: Vite + TypeScript
- **ゲームエンジン**: Rust + WebAssembly
- **UI**: レスポンシブCSS + Canvas API
- **デプロイ**: GitHub Pages + GitHub Actions

## 📱 モバイル対応
- レスポンシブレイアウト
- タッチ操作サポート
- ビューポート最適化
- アスペクト比保持