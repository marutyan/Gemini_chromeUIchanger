namespace Gcuic {
  /**
   * Gemini のメインコンテンツ領域を検出するためのセレクタ。
   * main 要素または role="main" を持つ領域を一元的に定義する。
   */
  const MAIN_SELECTOR = "main, [role='main']";

  const ASSISTANT_SELECTOR = [
    "model-response",
    '[data-test-id="model-response"]',
    ".model-response",
    ".gemini-response",
  ].join(",");

  const USER_SELECTOR = [
    "user-query",
    '[data-test-id="user-query"]',
    ".user-query",
    ".gemini-user-message",
  ].join(",");

  const MESSAGE_SELECTOR = `${ASSISTANT_SELECTOR},${USER_SELECTOR}`;

  const TURN_CONTAINER_SELECTOR = [
    "chat-window > *",
    ".conversation-container > *",
    '[class*="turn"]',
    '[data-test-id*="turn"]',
    "article",
  ].join(",");

  /**
   * 会話全体を包むコンテナのクラス名とセレクタ。
   * メイン領域探索、ターン境界判定、幅拡張スタイルのターゲット指定に利用する。
   */
  const CONVERSATION_CONTAINER_CLASS = "conversation-container";
  const CONVERSATION_CONTAINER_SELECTOR = `.${CONVERSATION_CONTAINER_CLASS}`;

  /**
   * 画面下部の入力欄一式を包むコンテナのクラス名とセレクタ。
   * メイン領域探索およびコンポーザー特定に利用する。
   */
  const BOTTOM_CONTAINER_CLASS = "bottom-container";
  const BOTTOM_CONTAINER_SELECTOR = `.${BOTTOM_CONTAINER_CLASS}`;

  const PRIMARY_COMPOSER_SELECTOR = [
    ".input-area-container",
    `${BOTTOM_CONTAINER_SELECTOR} form`,
    "form",
  ].join(",");

  const FALLBACK_COMPOSER_INPUT_SELECTOR = [
    "rich-textarea",
    '[contenteditable="true"][role="textbox"]',
    '[contenteditable="true"]',
    "textarea",
  ].join(",");

  export interface TaggedTargets {
    assistantMessages: number;
    userMessages: number;
    composerFound: boolean;
  }

  export function findMainRegion(root: ParentNode = document): HTMLElement | null {
    const mainEl = root.querySelector<HTMLElement>(MAIN_SELECTOR);
    if (mainEl !== null && (mainEl.querySelector(MESSAGE_SELECTOR) !== null || findComposer(mainEl) !== null)) {
      return mainEl;
    }

    const message = root.querySelector<HTMLElement>(MESSAGE_SELECTOR);
    if (message !== null) {
      const fromMessage = message.closest(MAIN_SELECTOR) as HTMLElement | null;
      if (fromMessage !== null) {
        return fromMessage;
      }
      const container = message.closest(CONVERSATION_CONTAINER_SELECTOR) as HTMLElement | null;
      if (container !== null) {
        return (container.parentElement as HTMLElement | null) ?? container;
      }
    }

    const composer = findComposer(root);
    if (composer !== null) {
      const fromComposer = composer.closest(MAIN_SELECTOR) as HTMLElement | null;
      if (fromComposer !== null) {
        return fromComposer;
      }
      const bottom = composer.closest(BOTTOM_CONTAINER_SELECTOR) as HTMLElement | null;
      if (bottom !== null) {
        return (bottom.parentElement as HTMLElement | null) ?? bottom;
      }
    }

    return mainEl;
  }

  export function tagLayoutTargets(mainRegion: HTMLElement): TaggedTargets {
    let assistantMessages = 0;
    let userMessages = 0;

    for (const convContainer of mainRegion.querySelectorAll<HTMLElement>(
      CONVERSATION_CONTAINER_SELECTOR,
    )) {
      convContainer.classList.add(CLASS_NAMES.conversationContainer);
    }

    for (const bottomContainer of mainRegion.querySelectorAll<HTMLElement>(
      BOTTOM_CONTAINER_SELECTOR,
    )) {
      bottomContainer.classList.add(CLASS_NAMES.bottomContainer);
    }

    for (const message of mainRegion.querySelectorAll<HTMLElement>(MESSAGE_SELECTOR)) {
      const isAssistant = message.matches(ASSISTANT_SELECTOR);
      const isUser = !isAssistant && message.matches(USER_SELECTOR);

      if (!isAssistant && !isUser) {
        continue;
      }

      const turn = findTurnElement(mainRegion, message);
      if (turn === null || !mainRegion.contains(turn)) {
        continue;
      }

      const frame = findDirectChildUnder(turn, message);
      turn.classList.add(
        CLASS_NAMES.turn,
        isAssistant ? CLASS_NAMES.assistantTurn : CLASS_NAMES.userTurn,
      );
      frame?.classList.add(CLASS_NAMES.turnFrame);
      tagClassPath(message.parentElement, frame, CLASS_NAMES.widthPath);
      message.classList.add(
        isAssistant ? CLASS_NAMES.assistantMessage : CLASS_NAMES.userMessage,
      );

      if (isAssistant) {
        tagAssistantContent(message);
        assistantMessages += 1;
      } else {
        userMessages += 1;
      }
    }

    const composer = findComposer(mainRegion);
    if (composer !== null) {
      const composerFrame = findComposerFrame(mainRegion, composer);
      composer.classList.add(CLASS_NAMES.composer);
      composerFrame?.classList.add(CLASS_NAMES.composerFrame);
      tagClassPath(
        composer.parentElement,
        composerFrame,
        CLASS_NAMES.composerPath,
      );
    }

    return {
      assistantMessages,
      userMessages,
      composerFound: composer !== null,
    };
  }

  export function clearTargetClasses(root: ParentNode): void {
    for (const className of TARGET_CLASSES) {
      for (const element of root.querySelectorAll<HTMLElement>(`.${className}`)) {
        element.classList.remove(className);
      }
    }
  }

  function findTurnElement(
    mainRegion: HTMLElement,
    message: HTMLElement,
  ): HTMLElement | null {
    let current: HTMLElement | null = message;
    let turn: HTMLElement | null = null;

    while (current !== null && current !== mainRegion) {
      const parent: HTMLElement | null = current.parentElement;
      if (parent === null) {
        break;
      }

      if (
        parent === mainRegion
        || parent.classList.contains(CONVERSATION_CONTAINER_CLASS)
        || parent.tagName.toLowerCase() === "chat-window"
      ) {
        turn = current;
        break;
      }

      if (current !== message && current.matches(TURN_CONTAINER_SELECTOR)) {
        turn = current;
        break;
      }

      current = parent;
    }

    return turn ?? message;
  }

  function findComposer(root: ParentNode): HTMLElement | null {
    const primary = root.querySelector<HTMLElement>(PRIMARY_COMPOSER_SELECTOR);
    if (primary !== null) {
      return primary;
    }

    const input = root.querySelector<HTMLElement>(FALLBACK_COMPOSER_INPUT_SELECTOR);
    return (input?.closest("form, .input-area-container") as HTMLElement | null)
      ?? (input?.parentElement as HTMLElement | null)
      ?? null;
  }

  function findComposerFrame(
    mainRegion: HTMLElement,
    composer: HTMLElement,
  ): HTMLElement | null {
    let current = composer.parentElement;
    let frame = current;
    let depth = 0;

    while (current !== null && current !== mainRegion && depth < 5) {
      const parent = current.parentElement;
      if (
        parent === null
        || parent === mainRegion
        || parent.querySelector(MESSAGE_SELECTOR) !== null
      ) {
        break;
      }

      frame = parent;
      current = parent;
      depth += 1;
    }

    return frame;
  }

  function findDirectChildUnder(
    ancestor: HTMLElement,
    descendant: HTMLElement,
  ): HTMLElement | null {
    if (ancestor === descendant) {
      return descendant;
    }

    let current: HTMLElement | null = descendant;

    while (current !== null && current.parentElement !== ancestor) {
      current = current.parentElement;
    }

    return current?.parentElement === ancestor ? current : null;
  }

  function tagClassPath(
    start: HTMLElement | null,
    stopExclusive: HTMLElement | null,
    className: string,
  ): void {
    let current = start;

    while (current !== null && current !== stopExclusive) {
      current.classList.add(className);
      current = current.parentElement;
    }
  }
}
