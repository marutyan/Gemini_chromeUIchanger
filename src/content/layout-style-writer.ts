namespace Gcuic {
  /**
   * 有効状態を示す属性名。
   */
  const ENABLED_ATTRIBUTE = "data-gcuic-enabled";

  /**
   * レイアウト種別（compact または wide）を示す属性名。
   */
  const LAYOUT_ATTRIBUTE = "data-gcuic-layout";

  /**
   * レイアウト計算結果を渡すCSS変数名の一覧。
   */
  const CSS_VARIABLES = {
    gutter: "--gcuic-gutter",
    textWidth: "--gcuic-text-width",
    canvasWidth: "--gcuic-canvas-width",
  } as const;

  /**
   * 属性とCSS変数の書き込み先。documentElement を直接参照せず、テストで偽の要素を渡せるようにするための最小限の型。
   */
  export interface StyleTarget {
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
    style: {
      setProperty(property: string, value: string): void;
      removeProperty(property: string): unknown;
    };
  }

  /**
   * ルート要素への属性とCSS変数の設定・除去を行うクラス。
   */
  export class LayoutStyleWriter {
    private readonly target: StyleTarget;
    private previousMetricsKey = "";

    constructor(target: StyleTarget) {
      this.target = target;
    }

    applyEnabled(): void {
      this.target.setAttribute(ENABLED_ATTRIBUTE, "true");
    }

    /**
     * 同じ metrics の場合は不要なDOM書き込みを避けるため処理を中断する。
     */
    applyMetrics(metrics: LayoutMetrics): void {
      const metricsKey = [
        metrics.gutterPx,
        metrics.textWidthPx,
        metrics.canvasWidthPx,
        metrics.compact,
      ].join(":");

      if (metricsKey === this.previousMetricsKey) {
        return;
      }
      this.previousMetricsKey = metricsKey;

      this.target.setAttribute(
        LAYOUT_ATTRIBUTE,
        metrics.compact ? "compact" : "wide",
      );
      this.target.style.setProperty(
        CSS_VARIABLES.gutter,
        `${metrics.gutterPx}px`,
      );
      this.target.style.setProperty(
        CSS_VARIABLES.textWidth,
        `${metrics.textWidthPx}px`,
      );
      this.target.style.setProperty(
        CSS_VARIABLES.canvasWidth,
        `${metrics.canvasWidthPx}px`,
      );
    }

    clear(): void {
      this.target.removeAttribute(ENABLED_ATTRIBUTE);
      this.target.removeAttribute(LAYOUT_ATTRIBUTE);
      for (const variable of Object.values(CSS_VARIABLES)) {
        this.target.style.removeProperty(variable);
      }
      this.previousMetricsKey = "";
    }
  }
}
