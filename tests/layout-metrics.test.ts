declare function require(name: string): any;

namespace LayoutMetricsTests {
  const assert = require("node:assert/strict");
  const test = require("node:test");

  test("compact widths remain inside the available region", () => {
    const metrics = Gcuic.calculateLayoutMetrics(600);

    assert.equal(metrics.compact, true);
    assert.equal(metrics.gutterPx, 16);
    assert.equal(metrics.canvasWidthPx, 568);
    assert.equal(metrics.textWidthPx, 568);
  });

  test("text width grows from 1200px to the 1400px cap", () => {
    assert.equal(Gcuic.calculateLayoutMetrics(1400).textWidthPx, 1200);
    assert.equal(Gcuic.calculateLayoutMetrics(1600).textWidthPx, 1280);
    assert.equal(Gcuic.calculateLayoutMetrics(1750).textWidthPx, 1400);
    assert.equal(Gcuic.calculateLayoutMetrics(2200).textWidthPx, 1400);
  });

  test("canvas width never exceeds 1680px", () => {
    assert.equal(Gcuic.calculateLayoutMetrics(1800).canvasWidthPx, 1680);
    assert.equal(Gcuic.calculateLayoutMetrics(2200).canvasWidthPx, 1680);
  });

  test("invalid widths fail safely", () => {
    const metrics = Gcuic.calculateLayoutMetrics(Number.NaN);

    assert.equal(metrics.mainWidthPx, 0);
    assert.equal(metrics.canvasWidthPx, 0);
    assert.equal(metrics.textWidthPx, 0);
    assert.equal(metrics.compact, true);
  });
}
