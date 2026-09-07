namespace Gcuic {
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

  const CONVERSATION_CONTAINER_SELECTOR = ".conversation-container";
  const BOTTOM_CONTAINER_SELECTOR = ".bottom-container";

  const PRIMARY_COMPOSER_SELECTOR = [
    ".input-area-container",
    ".bottom-container form",
    "form",
  ].join(",");

  const FALLBACK_COMPOSER_INPUT_SELECTOR = [
    "rich-textarea",
    '[contenteditable="true"][role="textbox"]',
    '[contenteditable="true"]',
    "textarea",
  ].join(",");

  const TARGET_CLASSES = [
    "gcuic-turn",
    "gcuic-assistant-turn",
    "gcuic-user-turn",
    "gcuic-turn-frame",
    "gcuic-width-path",
    "gcuic-assistant-message",
    "gcuic-user-message",
    "gcuic-composer",
    "gcuic-composer-frame",
    "gcuic-composer-path",
    "gcuic-conversation-container",
    "gcuic-bottom-container",
    "gcuic-content-root",
    "gcuic-text-block",
    "gcuic-wide-block",
  ] as const;

  export interface TaggedTargets {
    assistantMessages: number;
    userMessages: number;
    composerFound: boolean;
  }

  export function findMainRegion(root: ParentNode = document): HTMLElement | null {
    const mainEl = root.querySelector<HTMLElement>("main, [role='main']");
    if (mainEl !== null && (mainEl.querySelector(MESSAGE_SELECTOR) !== null || findComposer(mainEl) !== null)) {
      return mainEl;
    }

    const message = root.querySelector<HTMLElement>(MESSAGE_SELECTOR);
    if (message !== null) {
      const fromMessage = message.closest("main, [role='main']") as HTMLElement | null;
      if (fromMessage !== null) {
        return fromMessage;
      }
      const container = message.closest(".conversation-container") as HTMLElement | null;
      if (container !== null) {
        return (container.parentElement as HTMLElement | null) ?? container;
      }
    }

    const composer = findComposer(root);
    if (composer !== null) {
      const fromComposer = composer.closest("main, [role='main']") as HTMLElement | null;
      if (fromComposer !== null) {
        return fromComposer;
      }
      const bottom = composer.closest(".bottom-container") as HTMLElement | null;
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
      convContainer.classList.add("gcuic-conversation-container");
    }

    for (const bottomContainer of mainRegion.querySelectorAll<HTMLElement>(
      BOTTOM_CONTAINER_SELECTOR,
    )) {
      bottomContainer.classList.add("gcuic-bottom-container");
    }

    for (const message of mainRegion.querySelectorAll<HTMLElement>(MESSAGE_SELECTOR)) {
      const isAssistant = message.matches(ASSISTANT_SELECTOR);
      const isUser = !isAssistant && message.matches(USER_SELECTOR);

      if (!isAssistant && !isUser) {
        continue;
      }

      const role = isAssistant ? "assistant" : "user";
      const turn = findTurnElement(mainRegion, message);
      if (turn === null || !mainRegion.contains(turn)) {
        continue;
      }

      const frame = findDirectChildUnder(turn, message);
      turn.classList.add("gcuic-turn", `gcuic-${role}-turn`);
      frame?.classList.add("gcuic-turn-frame");
      tagWidthPath(message.parentElement, frame);
      message.classList.add(`gcuic-${role}-message`);

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
      composer.classList.add("gcuic-composer");
      composerFrame?.classList.add("gcuic-composer-frame");
      tagClassPath(
        composer.parentElement,
        composerFrame,
        "gcuic-composer-path",
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
        || parent.classList.contains("conversation-container")
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

  function tagWidthPath(
    start: HTMLElement | null,
    stopExclusive: HTMLElement | null,
  ): void {
    tagClassPath(start, stopExclusive, "gcuic-width-path");
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
