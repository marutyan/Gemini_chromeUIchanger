/**
 * Chrome Storage の変更通知で渡される新旧の値。
 */
interface GcuicStorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Chrome Storage の読み書き操作を提供するストレージ領域の型定義。
 */
interface GcuicStorageArea {
  get(defaultValues: Record<string, unknown>): Promise<Record<string, unknown>>;
  set(values: Record<string, unknown>): Promise<void>;
}

/**
 * Chrome Storage の変更イベントリスナーを登録するための型定義。
 */
interface GcuicStorageChangeEvent {
  addListener(
    listener: (
      changes: Record<string, GcuicStorageChange>,
      areaName: string,
    ) => void,
  ): void;
}

/**
 * 拡張機能で利用する Chrome API のグローバル宣言。
 */
declare const chrome: {
  storage: {
    local: GcuicStorageArea;
    onChanged: GcuicStorageChangeEvent;
  };
};
