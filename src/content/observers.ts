namespace Gcuic {
  export class RefreshObserver {
    private mutationObserver: MutationObserver | null = null;
    private animationFrameId: number | null = null;

    constructor(private readonly refresh: () => void) {}

    start(): void {
      if (this.mutationObserver !== null) {
        return;
      }

      const root = document.body ?? document.documentElement;
      this.mutationObserver = new MutationObserver((records) => {
        if (records.some(hasElementMutation)) {
          this.schedule();
        }
      });
      this.mutationObserver.observe(root, {
        childList: true,
        subtree: true,
      });
    }

    stop(): void {
      this.mutationObserver?.disconnect();
      this.mutationObserver = null;

      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }

    schedule(): void {
      if (this.animationFrameId !== null) {
        return;
      }

      this.animationFrameId = requestAnimationFrame(() => {
        this.animationFrameId = null;
        this.refresh();
      });
    }
  }

  function hasElementMutation(record: MutationRecord): boolean {
    return containsElement(record.addedNodes) || containsElement(record.removedNodes);
  }

  function containsElement(nodes: NodeList): boolean {
    return Array.from(nodes).some((node) => node.nodeType === Node.ELEMENT_NODE);
  }
}
