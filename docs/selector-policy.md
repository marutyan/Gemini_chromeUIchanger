# Selector policy

## Priority

1. `model-response`, `user-query`, `data-test-id`, `role`など意味を持つカスタムタグ・属性
2. `main`, `chat-window`, `article`, `form`, `pre`, `code-block`, `table`など意味要素
3. 親子関係と`closest()`による構造（`.conversation-container`, `.bottom-container`）
4. `message-content`, `.message-content`, `.text-content`, `.markdown`など意味が安定しているclassを限定的なfallbackとして使用

ビルドごとに変化するhash class、深い`nth-child`、表示文言には依存しない。

## Fail closed

次のいずれかからメイン領域または会話構造を確定できた場合だけ適用する。

- `model-response`または`[data-test-id="model-response"]`を持つModelメッセージ
- `user-query`または`[data-test-id="user-query"]`を持つUserメッセージ
- `.conversation-container`
- `.input-area-container`または`rich-textarea`から到達できる入力領域

設定画面や無関係なページでこれらを確認できない場合は適用しない。

## Wide content allowlist

次を含むcontent root直下要素をwide blockとして扱う。

- `pre`
- `code-block`または`[class*="code-block"]`, `[class*="formatted-code-block"]`
- `table`または`role="table"`, `.table-block`
- `figure`, `img`, `svg`, `canvas`
- `.katex-display`
- `data-testid`または`data-test-id`に`research`や`tool`を含む既知のカード

未知のカードはtext blockへフォールバックする。誤って操作UIを全幅化するより、幅が狭い状態を優先する。

## Maintenance

Gemini更新後に表示が効かない場合は、まず`src/content/selectors.ts`、`src/content/content-targets.ts`、およびクラス定義の`src/content/class-names.ts`を確認する。selectorを追加する場合は、実DOMで複数種類の会話に共通することを確認し、模擬DOMテストを追加する。
