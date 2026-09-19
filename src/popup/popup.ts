namespace GcuicPopup {
  async function initialize(): Promise<void> {
    const toggle = document.querySelector<HTMLInputElement>("#layout-enabled");
    const status = document.querySelector<HTMLElement>("#layout-status");

    if (toggle === null || status === null) {
      return;
    }

    const enabled = await Gcuic.loadEnabled();

    toggle.checked = enabled;
    updateStatus(status, enabled);

    toggle.addEventListener("change", async () => {
      const nextEnabled = toggle.checked;
      await Gcuic.saveEnabled(nextEnabled);
      updateStatus(status, nextEnabled);
    });
  }

  function updateStatus(status: HTMLElement, enabled: boolean): void {
    status.textContent = enabled ? "Enabled" : "Disabled";
  }

  void initialize();
}
