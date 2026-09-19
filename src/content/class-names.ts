namespace Gcuic {
  /**
   * 拡張機能がDOM要素へ付与するCSSクラス名の単一情報源。
   * クラス名の重複定義や記述揺れを防ぎ、スタイル適用とクリーンアップを一元管理する。
   */
  export const CLASS_NAMES = {
    turn: "gcuic-turn",
    assistantTurn: "gcuic-assistant-turn",
    userTurn: "gcuic-user-turn",
    turnFrame: "gcuic-turn-frame",
    widthPath: "gcuic-width-path",
    assistantMessage: "gcuic-assistant-message",
    userMessage: "gcuic-user-message",
    composer: "gcuic-composer",
    composerFrame: "gcuic-composer-frame",
    composerPath: "gcuic-composer-path",
    conversationContainer: "gcuic-conversation-container",
    bottomContainer: "gcuic-bottom-container",
    contentRoot: "gcuic-content-root",
    textBlock: "gcuic-text-block",
    wideBlock: "gcuic-wide-block",
  } as const;

  /**
   * クリーンアップ時にDOMツリーから削除すべき全拡張クラス名のリスト。
   * clearTargetClasses で要素から一括削除するために使用する。
   */
  export const TARGET_CLASSES: readonly string[] = Object.values(CLASS_NAMES);

  /**
   * メッセージ内コンテンツの再タグ付け前に削除すべきクラス名のリスト。
   * clearContentClasses でメッセージ配下から削除するために使用する。
   */
  export const CONTENT_CLASSES: readonly string[] = [
    CLASS_NAMES.contentRoot,
    CLASS_NAMES.textBlock,
    CLASS_NAMES.wideBlock,
  ];
}
