import { watch, type FSWatcher } from "chokidar";
import type { ServerMessage } from "./types.js";

const VAULT_PATHS = [
  "/workspaces/venture-os/concepts/**/*.md",
  "/workspaces/venture-os/learnings/**/*.md",
  "/workspaces/venture-os/wiki/**/*.md",
];

const PROJECT_PATHS = [
  "/workspaces/venture-os/projects/**/*.md",
  "/workspaces/venture-os/agents/**/*.md",
];

export function startWatchers(broadcast: (msg: ServerMessage) => void): FSWatcher[] {
  const watcher = watch([...VAULT_PATHS, ...PROJECT_PATHS], {
    ignoreInitial: true,
    ignored: /(node_modules|\.git|^\.)/,
    awaitWriteFinish: { stabilityThreshold: 300 },
  });

  watcher.on("all", (event: string, path: string) => {
    broadcast({ type: "fs_event", event, path, timestamp: Date.now() });
  });

  watcher.on("ready", () => {
    console.log("[watcher] watching vault and project directories");
  });

  return [watcher];
}

export async function stopWatchers(watchers: FSWatcher[]): Promise<void> {
  await Promise.all(watchers.map((w) => w.close()));
}
