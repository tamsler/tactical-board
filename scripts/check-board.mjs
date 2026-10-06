// Validates a .tacticalboard (or legacy .json) file with the app's own parser,
// reports advisory warnings, and prints a share link that opens it in the app.
//
//   npm run check:board -- drill.tacticalboard [--base-url http://localhost:5173/]
//
// Exit code 0: valid (warnings may be printed). 1: invalid or unreadable.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const DEFAULT_BASE_URL = "https://tacticalboard.app/";

const args = process.argv.slice(2);
const baseFlag = args.indexOf("--base-url");
const baseUrl = baseFlag === -1 ? DEFAULT_BASE_URL : args[baseFlag + 1];
const file = args.find(
  (a, i) => !a.startsWith("--") && (baseFlag === -1 || i !== baseFlag + 1),
);

if (!file || !baseUrl) {
  console.error(
    "Usage: npm run check:board -- <file.tacticalboard> [--base-url <url>]",
  );
  process.exit(1);
}

let text;
try {
  text = await readFile(file, "utf8");
} catch (e) {
  console.error(`Could not read ${file}: ${e.message}`);
  process.exit(1);
}

// Vite loads the TypeScript sources directly, so this runs the exact code the app ships.
const server = await createServer({
  root: fileURLToPath(new URL("..", import.meta.url)),
  configFile: false,
  appType: "custom",
  logLevel: "error",
  server: { middlewareMode: true, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true },
});

let exitCode = 0;
try {
  const { parseProjectJSON, toDocument } = await server.ssrLoadModule(
    "/src/animation/migrate.ts",
  );
  const { lintDocument } = await server.ssrLoadModule("/src/animation/lint.ts");
  const { createShareLink } = await server.ssrLoadModule(
    "/src/animation/shareLink.ts",
  );
  const { totalDurationMs } = await server.ssrLoadModule(
    "/src/animation/timeline.ts",
  );

  const result = parseProjectJSON(text);
  if (!result.ok) {
    console.error(`INVALID  ${result.error}`);
    exitCode = 1;
  } else {
    const { sequence, settings } = result.value;
    const { frames } = sequence;
    const seconds = (totalDurationMs(frames) / 1000).toFixed(1);
    console.log(
      `VALID  "${sequence.title}": ${frames.length} frame(s), ` +
        `${frames[0].players.length} player(s), ${frames[0].balls.length} ball(s), ${seconds} s`,
    );
    if (!settings) {
      console.log(
        "Legacy single-board JSON: no layout settings, so no lint or share link.",
      );
    } else {
      const doc = toDocument(sequence, settings);
      const warnings = lintDocument(doc);
      console.log(`\nWarnings (${warnings.length}):`);
      for (const w of warnings) console.log(`  - ${w}`);
      console.log(`\nShare link:\n${await createShareLink(doc, baseUrl)}`);
    }
  }
} finally {
  await server.close();
}
process.exit(exitCode);
