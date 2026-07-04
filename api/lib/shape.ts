type JsonObject = Record<string, unknown>;

function camelKey(key: string) {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function camelize<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => camelize(item)) as T;
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    const next: JsonObject = {};
    for (const [key, child] of Object.entries(value as JsonObject)) {
      next[camelKey(key)] = camelize(child);
    }
    return next as T;
  }

  return value;
}

export function unwrapRpcSingle<T>(value: T | T[]): T {
  return Array.isArray(value) ? value[0] : value;
}
