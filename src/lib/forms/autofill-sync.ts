import type { AnimationEvent } from "react";
import type { FieldValues, Path, UseFormSetValue } from "react-hook-form";

export const AUTOFILL_ANIMATION_NAME = "sanadat-autofill-start";

type FieldRef<T extends FieldValues> = {
  name: Path<T>;
  elementId: string;
};

/** Merge React Hook Form ref with a local ref callback. */
export function mergeInputRefs<T extends HTMLElement>(
  ...refs: Array<((node: T | null) => void) | undefined>
): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      ref?.(node);
    }
  };
}

/** Read live DOM values into RHF — needed when Safari/Chrome autofill skips onChange. */
export function syncFormFieldsFromDom<T extends FieldValues>(
  setValue: UseFormSetValue<T>,
  fields: readonly FieldRef<T>[]
): void {
  for (const { name, elementId } of fields) {
    const el = document.getElementById(elementId);
    if (!(el instanceof HTMLInputElement)) continue;
    const value = el.value;
    if (!value) continue;
    setValue(name, value as T[Path<T>], { shouldDirty: true, shouldValidate: false });
  }
}

/** Sync a single field when WebKit applies :-webkit-autofill. */
export function handleAutofillAnimation<T extends FieldValues>(
  setValue: UseFormSetValue<T>,
  name: Path<T>
) {
  return (event: AnimationEvent<HTMLInputElement>) => {
    if (event.animationName !== AUTOFILL_ANIMATION_NAME) return;
    const value = event.currentTarget.value;
    if (!value) return;
    setValue(name, value as T[Path<T>], { shouldDirty: true, shouldValidate: false });
  };
}
