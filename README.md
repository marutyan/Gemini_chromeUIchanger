# Gemini Chrome UI Changer

> **このリポジトリはアーカイブ済みです。** ChatGPT・Gemini・X向けの3つの拡張は [chrome_UI_changer](https://github.com/marutyan/chrome_UI_changer) に統合され、以後はそちらで保守します。

Google Gemini (`https://gemini.google.com/*`) の会話画面を横長ディスプレイへ適応させる、ローカル利用向けChrome拡張です。

## Features

- Geminiのメイン領域幅へ追従するレスポンシブレイアウト
- 通常本文を画面に応じて最大1200〜1400pxへ拡張
- コードブロック・表・画像・カードを最大1680pxへ拡張
- Model本文と入力欄の左端・幅を統一
- Userメッセージの右寄せと標準吹き出し幅を維持
- サイドバー開閉、ウィンドウリサイズ、SPA遷移へ追従
- PopupからON/OFFを切り替え

## Scope and privacy

- 対象は`https://gemini.google.com/*`のみ
- Chrome権限は`storage`のみ
- 保存する値はON/OFF設定だけ
- 外部通信、telemetry、analyticsなし
- 会話本文、入力内容、Cookie、認証情報、添付ファイルを収集・保存しない

## Development

### Requirements

- Node.js 22以上
- npm

### Setup

```bash
npm install
```

### Verification

```bash
npm run typecheck
npm test
```

`npm test`はbuild、生成JavaScriptの構文確認、単体テストを実行します。

### Build

```bash
npm run build
```

成果物は`dist/`へ生成されます。

## Install in Chrome

1. `chrome://extensions/`を開く
2. 「デベロッパー モード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」を選ぶ
4. このリポジトリの`dist/`を指定する

更新後は`npm run build`を実行し、拡張機能とGeminiタブを再読み込みしてください。

## Disable or remove

PopupのLayoutをOFFにすると、付与したclass、CSS変数、Observerを撤去して標準表示へ戻します。削除する場合は`chrome://extensions/`から本拡張を削除してください。

## Design documents

- [Architecture](docs/architecture.md)
- [Selector policy](docs/selector-policy.md)
- [Manual smoke test](docs/manual-test.md)

## Known limitations

- Geminiの内部DOMは公開APIではないため、UI更新後にselectorの保守が必要になる場合があります
- 未知のカードは安全側として本文幅で表示します
- Chrome Web Store配布、モバイル表示、`gemini.google.com`以外は対象外です
