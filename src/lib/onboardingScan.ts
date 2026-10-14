// G2: the onboarding website scan as an explicit state machine.
//
//   idle ──START──▶ scanning ──SUCCESS──▶ suggested
//                       │                    │
//                       └──FAILURE/TIMEOUT──▶ failed ──START──▶ scanning
//   any state ──RESET──▶ idle   (on entering the URL step)
//
// Events that don't make sense in the current state are ignored - in particular a
// SUCCESS that arrives after the 30 s timeout (or after a reset) must never
// overwrite what the user is doing now.

export const SCAN_TIMEOUT_MS = 30_000;

export type ScanState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "suggested" }
  | { status: "failed"; reason: "timeout" | "unreachable"; message: string };

export type ScanEvent =
  | { type: "START" }
  | { type: "SUCCESS" }
  | { type: "FAILURE" }
  | { type: "TIMEOUT" }
  | { type: "RESET" };

export const TIMEOUT_MESSAGE =
  "That took longer than 30 seconds, so we stopped. You can try again, or fill in the details yourself.";
export const UNREACHABLE_MESSAGE =
  "We couldn't read that website automatically. Check the address and try again, or fill in the details yourself.";

export const initialScanState: ScanState = { status: "idle" };

export function scanReducer(state: ScanState, event: ScanEvent): ScanState {
  switch (event.type) {
    case "RESET":
      return initialScanState;
    case "START":
      return state.status === "scanning" ? state : { status: "scanning" };
    case "SUCCESS":
      return state.status === "scanning" ? { status: "suggested" } : state;
    case "FAILURE":
      return state.status === "scanning" ? { status: "failed", reason: "unreachable", message: UNREACHABLE_MESSAGE } : state;
    case "TIMEOUT":
      return state.status === "scanning" ? { status: "failed", reason: "timeout", message: TIMEOUT_MESSAGE } : state;
    default:
      return state;
  }
}

export type ScanOutcome<T> = { kind: "ok"; value: T } | { kind: "timeout" } | { kind: "error"; error: unknown };

/** Run `fetcher`, giving up after `timeoutMs`. On timeout the request is aborted
 *  (through `controller`) AND the result is returned right away, even if the
 *  fetcher ignores the abort and never settles. */
export async function runScan<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  controller: AbortController,
  timeoutMs: number = SCAN_TIMEOUT_MS,
): Promise<ScanOutcome<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<ScanOutcome<T>>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve({ kind: "timeout" });
    }, timeoutMs);
  });
  const attempt = fetcher(controller.signal).then(
    (value): ScanOutcome<T> => ({ kind: "ok", value }),
    (error): ScanOutcome<T> => ({ kind: "error", error }),
  );
  try {
    return await Promise.race([attempt, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
