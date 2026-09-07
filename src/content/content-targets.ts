namespace Gcuic {
  const EXPLICIT_CONTENT_ROOT_SELECTOR = [
    "message-content",
    ".message-content",
    ".text-content",
    ".markdown",
    '[class~="markdown"]',
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

  const WIDE_SELF_SELECTOR = [
    "pre",
    "table",
    "figure",
    "img",
    "svg",
    "canvas",
    "code-block",
    '[role="table"]',
    ".table-block",
    '[class*="code-block"]',
    '[class*="formatted-code-block"]',
    ".katex-display",
    '[data-testid*="research" i]',
    '[data-testid*="tool" i]',
    '[data-test-id*="tool" i]',
  ].join(",");

  const WIDE_DESCENDANT_SELECTOR = [
    "pre",
    "table",
    "figure",
    "code-block",
    '[role="table"]',
    ".table-block",
    '[class*="code-block"]',
    '[class*="formatted-code-block"]',
    ".katex-display",
  ].join(",");

  const WIDE_DIRECT_CHILD_SELECTOR = [
    ":scope > img",
    ":scope > svg",
    ":scope > canvas",
    ":scope > code-block",
    ':scope > [class*="code-block"]',
    ':scope > [data-testid*="research" i]',
    ':scope > [data-testid*="tool" i]',
    ':scope > [data-test-id*="tool" i]',
  ].join(",");

  export interface ContentTargets {
    textBlocks: number;
    wideBlocks: number;
  }

  export function tagAssistantContent(message: HTMLElement): ContentTargets {
    const root = findContentRoot(message);
    clearContentClasses(message);
    root.classList.add("gcuic-content-root");

    let textBlocks = 0;
    let wideBlocks = 0;

    for (const childElement of root.children) {
      const child = childElement as HTMLElement;

      if (isWideContent(child)) {
        child.classList.add("gcuic-wide-block");
        wideBlocks += 1;
      } else {
        child.classList.add("gcuic-text-block");
        textBlocks += 1;
      }
    }

    return { textBlocks, wideBlocks };
  }

  export function clearContentClasses(root: ParentNode): void {
    const rootClassList = (root as ParentNode & { classList?: DOMTokenList }).classList;

    for (const className of [
      "gcuic-content-root",
      "gcuic-text-block",
      "gcuic-wide-block",
    ]) {
      rootClassList?.remove(className);
      for (const element of root.querySelectorAll<HTMLElement>(`.${className}`)) {
        element.classList.remove(className);
      }
    }
  }

  function findContentRoot(message: HTMLElement): HTMLElement {
    const explicit = message.querySelector<HTMLElement>(
      EXPLICIT_CONTENT_ROOT_SELECTOR,
    );
    if (explicit !== null) {
      return explicit;
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
