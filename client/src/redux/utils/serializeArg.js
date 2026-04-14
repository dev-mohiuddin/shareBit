const normalizeForSerialization = (value) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeForSerialization(entry));
  }

  if (value && typeof value === "object") {
    const sorted = {};
    Object.keys(value)
      .sort()
      .forEach((key) => {
        sorted[key] = normalizeForSerialization(value[key]);
      });
    return sorted;
  }

  return value;
};

export const serializeArg = (arg) => {
  if (arg === undefined) {
    return "__undefined__";
  }

  if (arg === null) {
    return "__null__";
  }

  return JSON.stringify(normalizeForSerialization(arg));
};
