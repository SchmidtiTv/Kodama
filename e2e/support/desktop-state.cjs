const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function createWorkerState(artifactsDirectory) {
  const workerId = `worker-${process.pid}-${crypto.randomUUID().replaceAll("-", "")}`;
  const workerDirectory = path.join(artifactsDirectory, "workers", workerId);
  fs.mkdirSync(workerDirectory, { recursive: true });

  return { workerId, workerDirectory };
}

async function clearWebviewStorage() {
  await browser.execute(async () => {
    window.localStorage.clear();
    window.sessionStorage.clear();

    if (typeof indexedDB.databases === "function") {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases.map(({ name }) =>
          name
            ? new Promise((resolve) => {
                const request = indexedDB.deleteDatabase(name);
                request.onsuccess = request.onerror = request.onblocked = () => resolve();
              })
            : undefined
        )
      );
    }

    if (typeof caches !== "undefined") {
      await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
    }
  });

  await browser.refresh();
}

module.exports = { clearWebviewStorage, createWorkerState };
