import { spawn } from "node:child_process";
import http from "node:http";

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const url = `http://localhost:${port}`;

const nextDev = spawn("next", ["dev"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

let browserOpened = false;

function openBrowser(targetUrl) {
  const platform = process.platform;

  if (platform === "darwin") {
    return spawn("open", [targetUrl], { stdio: "ignore", detached: true });
  }

  if (platform === "win32") {
    return spawn("cmd", ["/c", "start", "", targetUrl], {
      stdio: "ignore",
      detached: true,
    });
  }

  return spawn("xdg-open", [targetUrl], { stdio: "ignore", detached: true });
}

function probeServer() {
  // `exitCode` stays null when the child is killed by a signal, so check both
  // or the retry loop keeps the process alive after Ctrl+C.
  if (browserOpened || nextDev.exitCode !== null || nextDev.signalCode !== null) {
    return;
  }

  const request = http.get(
    {
      host,
      port,
      path: "/",
      timeout: 1000,
    },
    () => {
      if (browserOpened) {
        return;
      }

      browserOpened = true;
      const opener = openBrowser(url);
      opener.unref();
    },
  );

  request.on("error", () => {
    setTimeout(probeServer, 500);
  });

  request.on("timeout", () => {
    request.destroy();
    setTimeout(probeServer, 500);
  });
}

probeServer();

nextDev.on("exit", (code, signal) => {
  if (signal) {
    // Re-raise so the shell sees the same signal — with the default handler
    // restored first, otherwise this re-enters Node's own handler and hangs.
    process.removeAllListeners(signal);
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    nextDev.kill(signal);
  });
}
