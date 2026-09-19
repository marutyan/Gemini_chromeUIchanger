declare function require(name: string): any;

namespace LayoutStyleWriterTests {
  const assert = require("node:assert/strict");
  const test = require("node:test");

  /**
   * LayoutStyleWriterのテスト用フェイクターゲット。
   * DOM要素のプロパティ・属性操作呼び出しを記録し、状態を検証するために定義する。
   */
  class FakeStyleTarget implements Gcuic.StyleTarget {
    readonly attributes = new Map<string, string>();
    readonly properties = new Map<string, string>();
    readonly setPropertyCalls: Array<{ property: string; value: string }> = [];
    readonly removePropertyCalls: string[] = [];
    readonly setAttributeCalls: Array<{ name: string; value: string }> = [];
    readonly removeAttributeCalls: string[] = [];

    readonly style = {
      setProperty: (property: string, value: string): void => {
        this.setPropertyCalls.push({ property, value });
        this.properties.set(property, value);
      },
      removeProperty: (property: string): void => {
        this.removePropertyCalls.push(property);
        this.properties.delete(property);
      },
    };

    setAttribute(name: string, value: string): void {
      this.setAttributeCalls.push({ name, value });
      this.attributes.set(name, value);
    }

    removeAttribute(name: string): void {
      this.removeAttributeCalls.push(name);
      this.attributes.delete(name);
    }
  }

  test("applyEnabled sets data-gcuic-enabled attribute", () => {
    const target = new FakeStyleTarget();
    const writer = new Gcuic.LayoutStyleWriter(target);

    writer.applyEnabled();

    assert.equal(target.attributes.get("data-gcuic-enabled"), "true");
    assert.equal(target.setAttributeCalls.length, 1);
  });

  test("applyMetrics sets layout attribute and CSS variables for wide layout", () => {
    const target = new FakeStyleTarget();
    const writer = new Gcuic.LayoutStyleWriter(target);

    writer.applyMetrics({
      mainWidthPx: 1600,
      gutterPx: 40,
      textWidthPx: 1280,
      canvasWidthPx: 1520,
      compact: false,
    });

    assert.equal(target.attributes.get("data-gcuic-layout"), "wide");
    assert.equal(target.properties.get("--gcuic-gutter"), "40px");
    assert.equal(target.properties.get("--gcuic-text-width"), "1280px");
    assert.equal(target.properties.get("--gcuic-canvas-width"), "1520px");
  });

  test("applyMetrics sets layout attribute to compact when compact is true", () => {
    const target = new FakeStyleTarget();
    const writer = new Gcuic.LayoutStyleWriter(target);

    writer.applyMetrics({
      mainWidthPx: 800,
      gutterPx: 20,
      textWidthPx: 640,
      canvasWidthPx: 760,
      compact: true,
    });

    assert.equal(target.attributes.get("data-gcuic-layout"), "compact");
  });

  test("suppresses re-applying styles when metrics have not changed", () => {
    const target = new FakeStyleTarget();
    const writer = new Gcuic.LayoutStyleWriter(target);

    const metrics: Gcuic.LayoutMetrics = {
      mainWidthPx: 1600,
      gutterPx: 40,
      textWidthPx: 1280,
      canvasWidthPx: 1520,
      compact: false,
    };

    writer.applyMetrics(metrics);
    const initialSetAttributeCount = target.setAttributeCalls.length;
    const initialSetPropertyCount = target.setPropertyCalls.length;

    writer.applyMetrics({ ...metrics });

    assert.equal(target.setAttributeCalls.length, initialSetAttributeCount);
    assert.equal(target.setPropertyCalls.length, initialSetPropertyCount);

    writer.applyMetrics({
      mainWidthPx: 1700,
      gutterPx: 42.5,
      textWidthPx: 1360,
      canvasWidthPx: 1615,
      compact: false,
    });

    assert.equal(target.setAttributeCalls.length, initialSetAttributeCount + 1);
    assert.equal(target.setPropertyCalls.length, initialSetPropertyCount + 3);
    assert.equal(target.properties.get("--gcuic-gutter"), "42.5px");
  });

  test("clear removes all attributes, CSS variables, and resets metrics cache", () => {
    const target = new FakeStyleTarget();
    const writer = new Gcuic.LayoutStyleWriter(target);

    writer.applyEnabled();
    const metrics: Gcuic.LayoutMetrics = {
      mainWidthPx: 1600,
      gutterPx: 40,
      textWidthPx: 1280,
      canvasWidthPx: 1520,
      compact: false,
    };
    writer.applyMetrics(metrics);

    assert.equal(target.attributes.has("data-gcuic-enabled"), true);
    assert.equal(target.attributes.has("data-gcuic-layout"), true);
    assert.equal(target.properties.size, 3);

    writer.clear();

    assert.equal(target.attributes.has("data-gcuic-enabled"), false);
    assert.equal(target.attributes.has("data-gcuic-layout"), false);
    assert.equal(target.properties.size, 0);

    writer.applyMetrics(metrics);
    assert.equal(target.attributes.get("data-gcuic-layout"), "wide");
    assert.equal(target.properties.get("--gcuic-gutter"), "40px");
    assert.equal(target.properties.get("--gcuic-text-width"), "1280px");
    assert.equal(target.properties.get("--gcuic-canvas-width"), "1520px");
  });
}
