namespace Gcuic {
  /**
   * Gemini の Markdown コンテンツ領域を特定するためのセレクタ。
   * content root の直接探索および明示的コンテナ配下の探索で再利用する。
   */
  const MARKDOWN_SELECTOR = [
    ".markdown",
    ".markdown-main-panel",
    '[class~="markdown"]',
  ].join(",");

  const EXPLICIT_CONTENT_ROOT_SELECTOR = [
    MARKDOWN_SELECTOR,
    "message-content",
    ".message-content",
    ".text-content",
    "[data-message-content]",
    '[class*="message-content"]',
  ].join(",");

  const SEMANTIC_BLOCK_SELECTOR = [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "blockquote",
    "pre",
    "table",
    "figure",
    "details",
    "hr",
    "code-block",
  ].join(",");

  /**
   * content root 直下の子の中に深さを問わず含まれていれば、その子を wide にする要素セレクタ群。
   * pre やテーブル、コードブロックなど横幅を要するブロック要素を定義する。
   */
  const WIDE_DESCENDANT_TARGETS = [
    "pre",
    "table",
    "figure",
    "code-block",
    '[role="table"]',
    ".table-block",
    "table-block",
    ".table-block-component",
    ".horizontal-scroll-wrapper",
    '[class*="code-block"]',
    '[class*="formatted-code-block"]',
    ".katex-display",
  ] as const;

  /**
   * content root 直下の子自身、またはその子の直接の子である場合だけ、その子を wide にする要素セレクタ群。
   * 段落内の深い画像などの誤判定を防ぎつつ、直下の図版やツール結果カードを wide 化するために定義する。
   */
  const WIDE_DIRECT_CHILD_TARGETS = [
    "img",
    "svg",
    "canvas",
    '[data-testid*="research" i]',
    '[data-testid*="tool" i]',
    '[data-test-id*="tool" i]',
  ] as const;

  const WIDE_SELF_SELECTOR = [
    ...WIDE_DESCENDANT_TARGETS,
    ...WIDE_DIRECT_CHILD_TARGETS,
  ].join(",");

  const WIDE_DESCENDANT_SELECTOR = WIDE_DESCENDANT_TARGETS.join(",");

  const WIDE_DIRECT_CHILD_SELECTOR = WIDE_DIRECT_CHILD_TARGETS.map(
    (selector) => `:scope > ${selector}`,
  ).join(",");

  export interface ContentTargets {
    textBlocks: number;
    wideBlocks: number;
  }

  export function tagAssistantContent(message: HTMLElement): ContentTargets {
    const root = findContentRoot(message);
    clearContentClasses(message);
    root.classList.add(CLASS_NAMES.contentRoot);

    let textBlocks = 0;
    let wideBlocks = 0;

    for (const childElement of root.children) {
      const child = childElement as HTMLElement;

      if (isWideContent(child)) {
        child.classList.add(CLASS_NAMES.wideBlock);
        wideBlocks += 1;
      } else {
        child.classList.add(CLASS_NAMES.textBlock);
        textBlocks += 1;
      }
    }

    return { textBlocks, wideBlocks };
  }

  export function clearContentClasses(root: ParentNode): void {
    const rootClassList = (root as ParentNode & { classList?: DOMTokenList }).classList;

    for (const className of CONTENT_CLASSES) {
      rootClassList?.remove(className);
      for (const element of root.querySelectorAll<HTMLElement>(`.${className}`)) {
        element.classList.remove(className);
      }
    }
  }

  function findContentRoot(message: HTMLElement): HTMLElement {
    const markdownRoot = message.querySelector<HTMLElement>(MARKDOWN_SELECTOR);
    if (markdownRoot !== null) {
      return markdownRoot;
    }

    const explicit = message.querySelector<HTMLElement>(
      EXPLICIT_CONTENT_ROOT_SELECTOR,
    );
    if (explicit !== null) {
      const innerMarkdown = explicit.querySelector<HTMLElement>(MARKDOWN_SELECTOR);
      return innerMarkdown ?? explicit;
    }

    let bestCandidate = message;
    let bestScore = scoreContentRoot(message);

    for (const candidate of message.querySelectorAll<HTMLElement>("div, section, article")) {
      const score = scoreContentRoot(candidate);
      if (score > bestScore) {
        bestCandidate = candidate;
        bestScore = score;
      }
    }

    return bestCandidate;
  }

  function scoreContentRoot(candidate: HTMLElement): number {
    let score = 0;

    for (const childElement of candidate.children) {
      const child = childElement as HTMLElement;

      if (child.matches(SEMANTIC_BLOCK_SELECTOR)) {
        score += 2;
      } else if (child.querySelector(SEMANTIC_BLOCK_SELECTOR) !== null) {
        score += 1;
      }

      if (isWideContent(child)) {
        score += 2;
      }
    }

    return score;
  }

  function isWideContent(element: HTMLElement): boolean {
    return element.matches(WIDE_SELF_SELECTOR)
      || element.querySelector(WIDE_DESCENDANT_SELECTOR) !== null
      || element.querySelector(WIDE_DIRECT_CHILD_SELECTOR) !== null;
  }
}
