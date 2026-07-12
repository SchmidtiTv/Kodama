import { useCallback, useState } from "react";

const valueOrFactory = (value) => (typeof value === "function" ? value() : value);

export const storageCodecs = {
  string: {
    serialize: String,
    deserialize: (raw) => raw,
  },
  number: {
    serialize: String,
    deserialize: (raw) => {
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new TypeError("Stored value is not a finite number");
      return value;
    },
  },
  integer: {
    serialize: String,
    deserialize: (raw) => {
      const value = Number(raw);
      if (!Number.isInteger(value)) throw new TypeError("Stored value is not an integer");
      return value;
    },
  },
  boolean: {
    serialize: String,
    deserialize: (raw) => {
      if (raw === "true") return true;
      if (raw === "false") return false;
      throw new TypeError("Stored value is not a boolean");
    },
  },
  json: {
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  },
};

/**
 * Persist a scalar React state value with explicit storage codecs. Invalid or inaccessible stored
 * values fall back to the supplied default without replacing the stored value until the caller
 * explicitly persists a new value. Use setTransient for state changes whose write timing differs
 * from their render timing (for example a drag interaction saved on pointer release).
 */
export function usePersistedState(key, initialValue, options = {}) {
  const {
    storage = typeof window === "undefined" ? null : window.localStorage,
    serialize = storageCodecs.json.serialize,
    deserialize = storageCodecs.json.deserialize,
  } = options;

  const getDefault = useCallback(() => valueOrFactory(initialValue), [initialValue]);
  const [value, setValue] = useState(() => {
    const fallback = getDefault();
    if (!storage) return fallback;
    try {
      const raw = storage.getItem(key);
      return raw === null ? fallback : deserialize(raw);
    } catch {
      return fallback;
    }
  });

  const write = useCallback(
    (nextValue) => {
      if (!storage) return;
      try {
        storage.setItem(key, serialize(nextValue));
      } catch {
        // Persistence is best-effort; UI state remains usable when storage is unavailable.
      }
    },
    [key, serialize, storage]
  );

  const setPersistedValue = useCallback(
    (nextValue) => {
      setValue((previousValue) => {
        const resolved = typeof nextValue === "function" ? nextValue(previousValue) : nextValue;
        write(resolved);
        return resolved;
      });
    },
    [write]
  );

  const reset = useCallback(() => {
    const fallback = getDefault();
    if (storage) {
      try {
        storage.removeItem(key);
      } catch {
        // The default state is still safe to use if storage cannot be updated.
      }
    }
    setValue(fallback);
  }, [getDefault, key, storage]);

  return [value, setPersistedValue, { setTransient: setValue, reset }];
}
