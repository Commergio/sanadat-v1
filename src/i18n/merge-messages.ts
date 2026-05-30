type MessageTree = Record<string, unknown>;

/** Deep-merge locale messages; `override` wins on conflicts. */
export function mergeMessages(base: MessageTree, override: MessageTree): MessageTree {
  const result: MessageTree = { ...base };

  for (const key of Object.keys(override)) {
    const baseVal = base[key];
    const overrideVal = override[key];

    if (
      overrideVal &&
      typeof overrideVal === "object" &&
      !Array.isArray(overrideVal) &&
      baseVal &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal)
    ) {
      result[key] = mergeMessages(baseVal as MessageTree, overrideVal as MessageTree);
    } else {
      result[key] = overrideVal;
    }
  }

  return result;
}
