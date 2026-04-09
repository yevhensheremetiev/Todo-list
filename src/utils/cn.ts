type CnPrimitive = string | number | boolean | null | undefined;
type CnDict = Record<string, boolean | null | undefined>;
export type CnValue = CnPrimitive | CnDict | readonly CnValue[];

export function cn(...values: readonly CnValue[]): string {
  const out: string[] = [];

  const push = (v: CnValue): void => {
    if (!v) return;
    if (typeof v === "string") {
      if (v) out.push(v);
      return;
    }
    if (typeof v === "number") {
      if (Number.isFinite(v)) out.push(String(v));
      return;
    }
    if (Array.isArray(v)) {
      for (const item of v) push(item);
      return;
    }
    if (typeof v === "object") {
      for (const [k, ok] of Object.entries(v)) {
        if (ok) out.push(k);
      }
    }
  };

  for (const v of values) push(v);
  return out.join(" ");
}

