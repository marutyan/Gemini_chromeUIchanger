interface GcuicStorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

interface GcuicStorageArea {
  get(defaultValues: { enabled: boolean }): Promise<{ enabled?: unknown }>;
  set(values: { enabled: boolean }): Promise<void>;
}

interface GcuicStorageChangeEvent {
  addListener(
    listener: (
      changes: Record<string, GcuicStorageChange>,
      areaName: string,
    ) => void,
  ): void;
}

declare const chrome: {
  storage: {
    local: GcuicStorageArea;
    onChanged: GcuicStorageChangeEvent;
  };
};
