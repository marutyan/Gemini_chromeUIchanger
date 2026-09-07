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
      return (this.querySelectorAll(_selector)[0] as T | undefined) ?? null;
    }

    querySelectorAll<T>(selector: string): T[] {
      const matches: FakeElement[] = [];
      const visit = (element: FakeElement): void => {
        if (element.matches(selector)) matches.push(element);
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

    matches(selectorList: string): boolean {
      return selectorList.split(",").some((raw) => {
        const selector = raw.trim();
        if (/^[a-z][a-z0-9-]*$/.test(selector)) return this.tagName.toLowerCase() === selector.toLowerCase();
        if (selector.startsWith(".")) return this.classList.contains(selector.slice(1));
        if (selector === '[data-test-id="model-response"]') {
          return this.attributes["data-test-id"] === "model-response";
        }
        if (selector === '[data-test-id="user-query"]') {
          return this.attributes["data-test-id"] === "user-query";
        }
        if (selector === '[role="table"]') {
          return this.attributes["role"] === "table";
        }
        if (selector === '[contenteditable="true"][role="textbox"]') {
          return this.attributes["contenteditable"] === "true" && this.attributes["role"] === "textbox";
        }
        if (selector === '[contenteditable="true"]') {
          return this.attributes["contenteditable"] === "true";
        }
        if (selector === ".input-area-container") {
          return this.classList.contains("input-area-container");
        }
        if (selector === ".bottom-container form") {
          return this.tagName === "form" && (this.parentElement?.classList.contains("bottom-container") ?? false);
        }
        if (selector === "chat-window > *") {
          return this.parentElement?.tagName.toLowerCase() === "chat-window";
        }
        if (selector === ".conversation-container > *") {
          return this.parentElement?.classList.contains("conversation-container") ?? false;
        }
        if (selector === '[data-testid*="research" i]') {
          return (this.attributes["data-testid"]?.toLowerCase().includes("research")) ?? false;
        }
        if (selector === '[data-testid*="tool" i]' || selector === '[data-test-id*="tool" i]') {
          return (this.attributes["data-testid"]?.toLowerCase().includes("tool") || this.attributes["data-test-id"]?.toLowerCase().includes("tool")) ?? false;
        }
        if (selector === ":scope > img") {
          return this.tagName.toLowerCase() === "img";
        }
        if (selector === ":scope > svg") {
          return this.tagName.toLowerCase() === "svg";
        }
        if (selector === ":scope > canvas") {
          return this.tagName.toLowerCase() === "canvas";
        }
        if (selector === ":scope > code-block") {
          return this.tagName.toLowerCase() === "code-block";
        }
        return false;
      });
    }
  }

  test("tags model-response, user-query, conversation-container, and composer", () => {
    const main = new FakeElement("main");
    const convContainer = main.append(new FakeElement("div", { class: "conversation-container" }));
    convContainer.classList.add("conversation-container");

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
    bottom.classList.add("bottom-container");
    const inputContainer = bottom.append(new FakeElement("div", { class: "input-area-container" }));
    inputContainer.classList.add("input-area-container");
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
}
