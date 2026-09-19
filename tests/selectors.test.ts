declare function require(name: string): any;

namespace SelectorTests {
  const assert = require("node:assert/strict");
  const test = require("node:test");

  class FakeClassList {
    private readonly values = new Set<string>();

    add(...names: string[]): void {
      for (const name of names) this.values.add(name);
    }

    remove(...names: string[]): void {
      for (const name of names) this.values.delete(name);
    }

    contains(name: string): boolean {
      return this.values.has(name);
    }

    toString(): string {
      return Array.from(this.values).join(" ");
    }
  }

  /**
   * 単一の複合セレクタと、それに後続する結合子（> または空白）のペアを保持するデータ構造。
   */
  interface SelectorChainItem {
    compound: string;
    combinatorAfter: ">" | " " | null;
  }

  /**
   * 複合セレクタと結合子（> または空白）の連続をパースして配列に分解する。
   */
  function parseSelectorChain(selector: string): SelectorChainItem[] {
    const s = selector.trim();
    const items: SelectorChainItem[] = [];
    let currentCompound = "";
    let i = 0;

    while (i < s.length) {
      const ch = s.charAt(i);
      if (ch === "[") {
        const closeIdx = s.indexOf("]", i);
        if (closeIdx === -1) {
          currentCompound += s.slice(i);
          break;
        }
        currentCompound += s.slice(i, closeIdx + 1);
        i = closeIdx + 1;
        continue;
      }

      if (ch === ">") {
        items.push({ compound: currentCompound.trim(), combinatorAfter: ">" });
        currentCompound = "";
        i++;
        while (i < s.length && /\s/.test(s.charAt(i))) i++;
        continue;
      }

      if (/\s/.test(ch)) {
        let j = i;
        while (j < s.length && /\s/.test(s.charAt(j))) j++;
        if (j < s.length && s.charAt(j) === ">") {
          items.push({ compound: currentCompound.trim(), combinatorAfter: ">" });
          currentCompound = "";
          i = j + 1;
          while (i < s.length && /\s/.test(s.charAt(i))) i++;
          continue;
        }
        if (currentCompound.trim().length > 0) {
          items.push({ compound: currentCompound.trim(), combinatorAfter: " " });
          currentCompound = "";
        }
        i = j;
        continue;
      }

      currentCompound += ch;
      i++;
    }

    if (currentCompound.trim().length > 0) {
      items.push({ compound: currentCompound.trim(), combinatorAfter: null });
    }

    return items;
  }

  /**
   * 1つの要素が単一の複合セレクタ（タグ、クラス、属性、:scope、*）に適合するか判定する。
   */
  function matchesCompound(compound: string, element: FakeElement, scope?: FakeElement): boolean {
    let rest = compound.trim();

    if (rest.startsWith(":scope")) {
      if (scope ? element !== scope : false) {
        return false;
      }
      rest = rest.slice(6);
      if (rest.length === 0) return true;
    }

    if (rest.startsWith("*")) {
      rest = rest.slice(1);
      if (rest.length === 0) return true;
    }

    const tagMatch = rest.match(/^[a-zA-Z][a-zA-Z0-9-]*/);
    if (tagMatch) {
      if (element.tagName.toLowerCase() !== tagMatch[0].toLowerCase()) {
        return false;
      }
      rest = rest.slice(tagMatch[0].length);
    }

    while (rest.length > 0) {
      if (rest.startsWith(".")) {
        const classMatch = rest.match(/^\.([a-zA-Z0-9_-]+)/);
        const className = classMatch?.[1];
        if (!className || !element.classList.contains(className)) {
          return false;
        }
        rest = rest.slice(classMatch[0].length);
        continue;
      }

      if (rest.startsWith("[")) {
        const attrMatch = rest.match(/^\[([a-zA-Z0-9_-]+)(?:([~*]?=)(?:"([^"]*)"|'([^']*)'|([^\]\s]+))(\s+i)?)?\]/);
        if (!attrMatch) return false;

        const attrName = attrMatch[1];
        if (!attrName) return false;

        const operator = attrMatch[2];
        const attrValue = attrMatch[3] ?? attrMatch[4] ?? attrMatch[5] ?? "";
        const caseInsensitive = Boolean(attrMatch[6]);

        let actualRaw: string | undefined;
        if (attrName === "class") {
          actualRaw = element.classList.toString() || element.attributes["class"];
        } else {
          actualRaw = element.attributes[attrName];
        }

        if (actualRaw === undefined) {
          return false;
        }

        if (!operator) {
          // 属性存在確認
        } else if (operator === "=") {
          const actual = caseInsensitive ? actualRaw.toLowerCase() : actualRaw;
          const expected = caseInsensitive ? attrValue.toLowerCase() : attrValue;
          if (actual !== expected) return false;
        } else if (operator === "~=") {
          if (attrName === "class") {
            if (!element.classList.contains(attrValue)) return false;
          } else {
            const list = actualRaw.split(/\s+/);
            if (!list.includes(attrValue)) return false;
          }
        } else if (operator === "*=") {
          const actual = caseInsensitive ? actualRaw.toLowerCase() : actualRaw;
          const expected = caseInsensitive ? attrValue.toLowerCase() : attrValue;
          if (!actual.includes(expected)) return false;
        }

        rest = rest.slice(attrMatch[0].length);
        continue;
      }

      return false;
    }

    return true;
  }

  /**
   * 結合子で結ばれたセレクタチェーンを要素とその親・祖先関係に対して右から左へ評価する。
   */
  function matchChain(chain: SelectorChainItem[], element: FakeElement, scope?: FakeElement): boolean {
    if (chain.length === 0) return false;

    const last = chain[chain.length - 1];
    if (!last || !matchesCompound(last.compound, element, scope)) {
      return false;
    }

    if (chain.length === 1) {
      return true;
    }

    const prev = chain[chain.length - 2];
    if (!prev) return false;

    if (prev.combinatorAfter === ">") {
      if (element.parentElement === null) return false;
      return matchChain(chain.slice(0, -1), element.parentElement, scope);
    }

    if (prev.combinatorAfter === " ") {
      let current = element.parentElement;
      while (current !== null) {
        if (matchChain(chain.slice(0, -1), current, scope)) {
          return true;
        }
        current = current.parentElement;
      }
      return false;
    }

    return false;
  }

  class FakeElement {
    readonly children: FakeElement[] = [];
    readonly classList = new FakeClassList();
    readonly dataset: Record<string, string> = {};
    parentElement: FakeElement | null = null;

    constructor(
      readonly tagName: string,
      readonly attributes: Record<string, string> = {},
    ) {
      if (attributes["class"]) {
        for (const cls of attributes["class"].split(/\s+/)) {
          if (cls) this.classList.add(cls);
        }
      }
      for (const [key, val] of Object.entries(attributes)) {
        if (key.startsWith("data-")) {
          const prop = key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          this.dataset[prop] = val;
        }
      }
    }

    append(child: FakeElement): FakeElement {
      child.parentElement = this;
      this.children.push(child);
      return child;
    }

    contains(candidate: FakeElement): boolean {
      return candidate === this || this.children.some((child) => child.contains(candidate));
    }

    querySelector<T>(_selector: string): T | null {
      return (this.querySelectorAll<T>(_selector)[0] as T | undefined) ?? null;
    }

    querySelectorAll<T>(selector: string): T[] {
      const matches: FakeElement[] = [];
      const visit = (element: FakeElement): void => {
        if (element.matches(selector, this)) matches.push(element);
        for (const child of element.children) visit(child);
      };
      for (const child of this.children) visit(child);
      return matches as T[];
    }

    closest<T>(selector: string): T | null {
      let current: FakeElement | null = this;
      while (current !== null) {
        if (current.matches(selector)) return current as T;
        current = current.parentElement;
      }
      return null;
    }

    matches(selectorList: string, scope?: FakeElement): boolean {
      return selectorList.split(",").some((raw) => {
        const chain = parseSelectorChain(raw);
        if (chain.length === 0) return false;
        return matchChain(chain, this, scope ?? this);
      });
    }
  }

  test("tags model-response, user-query, conversation-container, and composer", () => {
    const main = new FakeElement("main");
    const convContainer = main.append(new FakeElement("div", { class: "conversation-container" }));

    const userTurn = convContainer.append(new FakeElement("div", { class: "turn" }));
    const userMsg = userTurn.append(new FakeElement("user-query"));
    userMsg.append(new FakeElement("div", { class: "user-query-bubble-with-background" }));

    const modelTurn = convContainer.append(new FakeElement("div", { class: "turn" }));
    const modelMsg = modelTurn.append(new FakeElement("model-response"));
    const content = modelMsg.append(new FakeElement("message-content"));
    content.append(new FakeElement("p"));
    content.append(new FakeElement("pre"));
    content.append(new FakeElement("code-block"));
    content.append(new FakeElement("table"));

    const bottom = main.append(new FakeElement("div", { class: "bottom-container" }));
    const inputContainer = bottom.append(new FakeElement("div", { class: "input-area-container" }));
    const form = inputContainer.append(new FakeElement("form"));
    form.append(new FakeElement("rich-textarea"));

    const foundMain = Gcuic.findMainRegion(main as unknown as HTMLElement);
    assert.equal(foundMain, main);

    const result = Gcuic.tagLayoutTargets(main as unknown as HTMLElement);
    assert.equal(result.assistantMessages, 1);
    assert.equal(result.userMessages, 1);
    assert.equal(result.composerFound, true);

    assert.equal(convContainer.classList.contains("gcuic-conversation-container"), true);
    assert.equal(bottom.classList.contains("gcuic-bottom-container"), true);
    assert.equal(modelTurn.classList.contains("gcuic-turn"), true);
    assert.equal(modelTurn.classList.contains("gcuic-assistant-turn"), true);
    assert.equal(userTurn.classList.contains("gcuic-user-turn"), true);
    assert.equal(modelMsg.classList.contains("gcuic-assistant-message"), true);
    assert.equal(userMsg.classList.contains("gcuic-user-message"), true);

    assert.equal(content.classList.contains("gcuic-content-root"), true);
    assert.equal(content.children[0]?.classList.contains("gcuic-text-block"), true);
    assert.equal(content.children[1]?.classList.contains("gcuic-wide-block"), true);
    assert.equal(content.children[2]?.classList.contains("gcuic-wide-block"), true);
    assert.equal(content.children[3]?.classList.contains("gcuic-wide-block"), true);

    Gcuic.clearTargetClasses(main as unknown as HTMLElement);
    assert.equal(modelTurn.classList.contains("gcuic-turn"), false);
    assert.equal(userTurn.classList.contains("gcuic-user-turn"), false);
  });

  test("tags Gemini markdown content root and nested table wrapper as wide-block", () => {
    const main = new FakeElement("main");
    // Gemini creates separate conversation-container per message
    const userConv = main.append(new FakeElement("div", { class: "conversation-container" }));
    const userTurn = userConv.append(new FakeElement("div", { class: "turn" }));
    userTurn.append(new FakeElement("user-query"));

    const modelConv = main.append(new FakeElement("div", { class: "conversation-container" }));
    const modelResponse = modelConv.append(new FakeElement("model-response"));
    const msgContent = modelResponse.append(new FakeElement("message-content"));
    const markdown = msgContent.append(new FakeElement("div", { class: "markdown markdown-main-panel" }));

    const textPara1 = markdown.append(new FakeElement("p"));
    const tableWrapper = markdown.append(new FakeElement("div", { class: "horizontal-scroll-wrapper" }));
    const tableBlockComp = tableWrapper.append(new FakeElement("div", { class: "table-block-component" }));
    const responseEl = tableBlockComp.append(new FakeElement("response-element"));
    const tableBlockEl = responseEl.append(new FakeElement("table-block"));
    const tableBlockDiv = tableBlockEl.append(new FakeElement("div", { class: "table-block new-table-style" }));
    tableBlockDiv.append(new FakeElement("table"));
    const textPara2 = markdown.append(new FakeElement("p"));

    const result = Gcuic.tagLayoutTargets(main as unknown as HTMLElement);
    assert.equal(result.assistantMessages, 1);
    assert.equal(result.userMessages, 1);

    // Both conversation containers should be tagged
    assert.equal(userConv.classList.contains("gcuic-conversation-container"), true);
    assert.equal(modelConv.classList.contains("gcuic-conversation-container"), true);

    // .markdown should be the content root, NOT message-content
    assert.equal(markdown.classList.contains("gcuic-content-root"), true);
    assert.equal(msgContent.classList.contains("gcuic-content-root"), false);

    // Children of .markdown should be categorized into text-block and wide-block
    assert.equal(textPara1.classList.contains("gcuic-text-block"), true);
    assert.equal(textPara1.classList.contains("gcuic-wide-block"), false);

    assert.equal(tableWrapper.classList.contains("gcuic-wide-block"), true);
    assert.equal(tableWrapper.classList.contains("gcuic-text-block"), false);

    assert.equal(textPara2.classList.contains("gcuic-text-block"), true);
    assert.equal(textPara2.classList.contains("gcuic-wide-block"), false);
  });

  test("distinguishes wide blocks from text blocks accurately", () => {
    const main = new FakeElement("main");
    const conv = main.append(new FakeElement("div", { class: "conversation-container" }));
    const turn = conv.append(new FakeElement("div", { class: "turn" }));
    const modelMsg = turn.append(new FakeElement("model-response"));
    const content = modelMsg.append(new FakeElement("message-content"));

    // 1. content root 直下の img は wide
    const directImg = content.append(new FakeElement("img", { src: "photo.jpg" }));

    // 2. p の中の深い img は wide にならない（p 自身が text-block、内側に img があっても wide にならない）
    const paraWithDeepImg = content.append(new FakeElement("p"));
    const span = paraWithDeepImg.append(new FakeElement("span"));
    span.append(new FakeElement("img", { src: "inline.jpg" }));

    // 3. data-testid に "tool" を含む直下カードは wide
    const toolCard = content.append(new FakeElement("div", { "data-testid": "search-tool-result" }));

    // 4. 深い位置の code-block を含む直下コンテナは wide
    const nestedCodeBlockContainer = content.append(new FakeElement("div", { class: "custom-code-wrapper" }));
    const codeWrapperInner = nestedCodeBlockContainer.append(new FakeElement("div"));
    codeWrapperInner.append(new FakeElement("code-block"));

    // 5. 通常の段落は text-block
    const normalPara = content.append(new FakeElement("p"));

    const result = Gcuic.tagLayoutTargets(main as unknown as HTMLElement);
    assert.equal(result.assistantMessages, 1);

    assert.equal(content.classList.contains("gcuic-content-root"), true);

    // directImg: wide-block
    assert.equal(directImg.classList.contains("gcuic-wide-block"), true);
    assert.equal(directImg.classList.contains("gcuic-text-block"), false);

    // paraWithDeepImg: text-block (p の直下でない深い img は wide 判定を作らない)
    assert.equal(paraWithDeepImg.classList.contains("gcuic-text-block"), true);
    assert.equal(paraWithDeepImg.classList.contains("gcuic-wide-block"), false);

    // toolCard: wide-block
    assert.equal(toolCard.classList.contains("gcuic-wide-block"), true);
    assert.equal(toolCard.classList.contains("gcuic-text-block"), false);

    // nestedCodeBlockContainer: wide-block (深い位置の code-block を拾う)
    assert.equal(nestedCodeBlockContainer.classList.contains("gcuic-wide-block"), true);
    assert.equal(nestedCodeBlockContainer.classList.contains("gcuic-text-block"), false);

    // normalPara: text-block
    assert.equal(normalPara.classList.contains("gcuic-text-block"), true);
    assert.equal(normalPara.classList.contains("gcuic-wide-block"), false);
  });
}
