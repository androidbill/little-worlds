import { APP_VERSION } from "./app-meta";
import { assetUrl, baseUrl } from "./paths";

const VERSION_PATTERN = /^\d{4}\.\d{2}\.\d{2}\.\d{2,}$/;

function newer(candidate: string) {
  const current = APP_VERSION.split(".").map(Number);
  const remote = candidate.split(".").map(Number);
  for (let index = 0; index < current.length; index++) {
    if (remote[index] !== current[index]) return remote[index] > current[index];
  }
  return false;
}

function deadline<T>(task: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error("Update timed out")),
      milliseconds,
    );
    task.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function waitForActivation(worker: ServiceWorker): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(
      () => finish(new Error("Update download timed out")),
      12000,
    );
    function finish(error?: Error) {
      clearTimeout(timer);
      worker.removeEventListener("statechange", changed);
      if (error) reject(error);
      else resolve();
    }
    function changed() {
      if (worker.state === "activated") finish();
      else if (worker.state === "redundant")
        finish(new Error("Update download failed"));
      else if (worker.state === "installed")
        worker.postMessage({ type: "SKIP_WAITING" });
    }
    worker.addEventListener("statechange", changed);
    changed();
  });
}

/** Caches may update in the background; only the player's Refresh reloads the page. */
export function setupUpdates(options: {
  onAvailable: (version: string) => void;
  beforeReload: () => void;
}) {
  let latestVersion: string | null = null;
  let checking = false;
  let lastCheck = 0;

  const registration =
    import.meta.env.PROD && "serviceWorker" in navigator
      ? navigator.serviceWorker
          .register(assetUrl("sw.js"), {
            scope: baseUrl,
            updateViaCache: "none",
          })
          .catch(() => null)
      : Promise.resolve(null);

  async function check(force = false) {
    if (
      !navigator.onLine ||
      checking ||
      (!force && Date.now() - lastCheck < 60000)
    )
      return;
    checking = true;
    lastCheck = Date.now();
    // This JSON is deliberately excluded from the offline cache. The query also
    // avoids a stale CDN response when a new Pages deployment has just finished.
    try {
      const response = await fetch(
        assetUrl(`version.json?check=${Date.now()}`),
        {
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!response.ok) return;
      const result: unknown = await response.json();
      const version = (result as { version?: unknown } | null)?.version;
      if (
        typeof version === "string" &&
        VERSION_PATTERN.test(version) &&
        newer(version)
      ) {
        latestVersion = version;
        options.onAvailable(version);
      }
    } catch {
      // An offline or interrupted check never blocks play or changes the save.
    } finally {
      checking = false;
    }
  }

  async function prepareLatest() {
    const workerRegistration = await registration;
    if (!workerRegistration) return;
    await workerRegistration.update();
    const worker = workerRegistration.installing || workerRegistration.waiting;
    if (worker) await waitForActivation(worker);
  }

  async function refresh() {
    options.beforeReload();
    if (navigator.onLine) {
      try {
        await deadline(prepareLatest(), 12000);
      } catch {
        if (latestVersion)
          throw new Error(
            "The update could not finish downloading. Please try Refresh again.",
          );
      }
    }
    options.beforeReload();
    window.location.reload();
  }

  void registration.then((value) => value?.update().catch(() => {}));
  void check(true);
  window.addEventListener("online", () => void check(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void check();
  });
  return { refresh };
}
