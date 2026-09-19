namespace Gcuic {
  /**
   * chrome.storage.local での保存キー名。
   * content script と popup で同じキーを使うための単一情報源。
   */
  const STORAGE_KEY_ENABLED = "enabled";

  /**
   * 有効/無効設定の既定値。未設定時に有効として扱うために定義する。
   */
  const DEFAULT_ENABLED = true;

  /**
   * storage から取得した値が真偽値かどうかを調べる関数。
   */
  function isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
  }

  /**
   * storage から現在の有効/無効設定を読み取る関数。
   */
  export async function loadEnabled(): Promise<boolean> {
    const stored = await chrome.storage.local.get({
      [STORAGE_KEY_ENABLED]: DEFAULT_ENABLED,
    });
    const value = stored[STORAGE_KEY_ENABLED];
    return isBoolean(value) ? value : DEFAULT_ENABLED;
  }

  /**
   * storage へ新しい有効/無効設定を保存する関数。
   */
  export async function saveEnabled(enabled: boolean): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEY_ENABLED]: enabled,
    });
  }

  /**
   * storage の有効/無効設定の変更を監視する関数。
   */
  export function watchEnabled(listener: (enabled: boolean) => void): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }

      const change = changes[STORAGE_KEY_ENABLED];
      if (change && isBoolean(change.newValue)) {
        listener(change.newValue);
      }
    });
  }
}
