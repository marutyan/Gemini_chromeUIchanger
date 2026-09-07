namespace Gcuic {
  const DEFAULT_ENABLED = true;
  const ENABLED_ATTRIBUTE = "data-gcuic-enabled";
  const LAYOUT_ATTRIBUTE = "data-gcuic-layout";
  const CSS_VARIABLES = [
    "--gcuic-gutter",
    "--gcuic-text-width",
    "--gcuic-canvas-width",
  ] as const;

  export class LayoutController {
    private mainRegion: HTMLElement | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private enabled = false;
    private readonly refreshObserver = new RefreshObserver(() => this.refresh());
    private previousMetricsKey = "";

    async initialize(): Promise<void> {
      const stored = await chrome.storage.local.get({ enabled: DEFAULT_ENABLED });
      this.setEnabled(
        typeof stored.enabled === "boolean" ? stored.enabled : DEFAULT_ENABLED,
      );

      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local") {
          return;
        }

        const nextEnabled = changes["enabled"]?.newValue;
        if (typeof nextEnabled === "boolean") {
          this.setEnabled(nextEnabled);
        }
      });
    }

    setEnabled(enabled: boolean): void {
      if (this.enabled === enabled) {
        if (enabled) {
          this.refresh();
        }
        return;
      }

      this.enabled = enabled;
      if (enabled) {
        this.enable();
      } else {
        this.disable();
      }
    }

    refresh(): void {
      if (!this.enabled) {
        return;
      }

      const nextMainRegion = findMainRegion();
      if (nextMainRegion === null) {
        this.detachFromMainRegion();
        return;
      }

      if (nextMainRegion !== this.mainRegion) {
        this.attachToMainRegion(nextMainRegion);
      }

      tagLayoutTargets(nextMainRegion);
      this.updateMetrics(nextMainRegion.clientWidth);
    }

    private enable(): void {
      document.documentElement.setAttribute(ENABLED_ATTRIBUTE, "true");
      this.refreshObserver.start();
      this.refresh();
    }

    private disable(): void {
      this.refreshObserver.stop();
      this.detachFromMainRegion();
      document.documentElement.removeAttribute(ENABLED_ATTRIBUTE);
      document.documentElement.removeAttribute(LAYOUT_ATTRIBUTE);
      for (const variable of CSS_VARIABLES) {
        document.documentElement.style.removeProperty(variable);
      }
      this.previousMetricsKey = "";
    }

    private attachToMainRegion(mainRegion: HTMLElement): void {
      this.detachFromMainRegion();
      this.mainRegion = mainRegion;
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[entries.length - 1];
        const width = entry?.contentRect.width ?? mainRegion.clientWidth;
        this.updateMetrics(width);
      });
      this.resizeObserver.observe(mainRegion);
    }

    private detachFromMainRegion(): void {
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;

      if (this.mainRegion !== null) {
        clearTargetClasses(this.mainRegion);
      }
      this.mainRegion = null;
    }

    private updateMetrics(mainWidthPx: number): void {
      const metrics = calculateLayoutMetrics(mainWidthPx);
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

      document.documentElement.setAttribute(
        LAYOUT_ATTRIBUTE,
        metrics.compact ? "compact" : "wide",
      );
      document.documentElement.style.setProperty(
        "--gcuic-gutter",
        `${metrics.gutterPx}px`,
      );
      document.documentElement.style.setProperty(
        "--gcuic-text-width",
        `${metrics.textWidthPx}px`,
      );
      document.documentElement.style.setProperty(
        "--gcuic-canvas-width",
        `${metrics.canvasWidthPx}px`,
      );
    }
  }
}
