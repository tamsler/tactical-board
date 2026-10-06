// Builds the files behind the public "Create drills with AI" page from docs/agent:
//   public/ai/prompt.md      the prompt a coach pastes into a chat assistant
//   public/ai/examples.json  example drills with share links into the app
//
//   npm run build:ai   (also runs before every production build)
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";

const agentDir = new URL("../docs/agent/", import.meta.url);
const outDir = new URL("../public/ai/", import.meta.url);
const read = (name) => readFile(new URL(name, agentDir), "utf8");

// Same encoding as src/animation/shareLink.ts: raw DEFLATE, unpadded base64url.
const shareFragment = (json) =>
  `#share=1.${deflateRawSync(Buffer.from(json)).toString("base64url")}`;

/** The generated files, by name. scripts/build-ai-prompt.test.mjs checks the committed copies against this. */
export async function buildAiFiles() {
  // The agent prompt tells the model to run the checker; a chat assistant cannot,
  // so everything from "Check your work" on is swapped for the chat ending.
  const systemPrompt = await read("system-prompt.md");
  const body = systemPrompt.slice(systemPrompt.indexOf("\n---\n") + 5);
  const cut = body.indexOf("## Check your work");
  if (cut === -1) throw new Error('system-prompt.md has no "Check your work"');
  const prompt = [
    body.slice(0, cut).trim(),
    (await read("chat-ending.md")).trim(),
    "---",
    (await read("document-format.md")).trim(),
  ].join("\n\n");

  const exampleDir = new URL("examples/", agentDir);
  const examples = [];
  for (const file of (await readdir(exampleDir)).sort()) {
    if (!file.endsWith(".tacticalboard")) continue;
    const doc = JSON.parse(await readFile(new URL(file, exampleDir), "utf8"));
    examples.push({
      title: doc.title,
      frames: doc.frames.length,
      players: doc.frames[0].players.length,
      pitch: `${doc.settings.matchFormat}, ${doc.settings.pitchType} pitch`,
      link: `/${shareFragment(JSON.stringify(doc))}`,
    });
  }

  return {
    "prompt.md": `${prompt}\n`,
    "examples.json": `${JSON.stringify(examples, null, 2)}\n`,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = await buildAiFiles();
  await mkdir(outDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    await writeFile(new URL(name, outDir), content);
  }
  console.log(
    `Wrote public/ai/prompt.md (${files["prompt.md"].length - 1} characters) and ${JSON.parse(files["examples.json"]).length} example(s).`,
  );
}
