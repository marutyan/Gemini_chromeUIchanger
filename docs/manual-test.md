# Manual smoke test

実行していない項目をPASSに変更しない。検証対象commit SHAとChrome versionを記録する。

## Environment

- Commit SHA: 要記入
- Chrome version: 要記入
- OS: 要記入
- Display resolution: 要記入

## Installation

1. `npm install`
2. `npm run build`
3. `chrome://extensions/`でデベロッパーモードを有効化
4. `dist/`をパッケージ化されていない拡張機能として読み込む
5. 対象commitを更新した場合はbuild後に拡張とGeminiタブを再読み込みする

## Checklist

| 項目 | 結果 | 観測結果 |
|---|---|---|
| 通常の長文回答 | NOT RUN | |
| 見出し・箇条書き | NOT RUN | |
| 長いコードブロック | NOT RUN | |
| 列数の多い表 | NOT RUN | |
| 画像・グラフ | NOT RUN | |
| ブロック数式 | NOT RUN | |
| Userメッセージ右寄せ | NOT RUN | |
| 入力欄と本文の幅・左端 | NOT RUN | |
| サイドバー開閉 | NOT RUN | |
| 新規チャットへのSPA遷移 | NOT RUN | |
| 過去チャットへのSPA遷移 | NOT RUN | |
| PopupからOFF→ON | NOT RUN | |
| ダークモード | NOT RUN | |
| ライトモード | NOT RUN | |
| Chrome zoom 80% | NOT RUN | |
| Chrome zoom 100% | NOT RUN | |
| Chrome zoom 125% | NOT RUN | |
| ページ全体の横スクロールなし | NOT RUN | |
| コード・表内部の横スクロール | NOT RUN | |
| 設定・別画面へ誤適用しない | NOT RUN | |

## Failure capture

FAILの場合は次を記録する。

- URLの画面種別。会話IDなどprivateな値は伏せる
- サイドバー状態、zoom、window幅
- 崩れた要素
- DevToolsで確認した安定属性と親子構造
- 再現手順
- スクリーンショット。会話内容や個人情報を含めない
