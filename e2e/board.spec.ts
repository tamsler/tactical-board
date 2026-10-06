import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import {
  RIGHT_BACK,
  basePixelsPerUnit,
  dragWithMouse,
  expectSaved,
  openBoard,
  teamARightBack,
  toScreen,
} from "./board";

test.beforeEach(async ({ page }) => {
  await openBoard(page);
});

test("loads the default board", async ({ page }) => {
  await expect(page.getByPlaceholder("Tactics Title...")).toHaveValue(
    "Match Tactics - 11v11",
  );
  // One number label per player.
  await expect(page.getByText("RB", { exact: true })).toHaveCount(2);
});

test("dragging moves a player by the distance the pointer travelled", async ({
  page,
}) => {
  const scale = await basePixelsPerUnit(page);
  const from = await toScreen(page, RIGHT_BACK.x, RIGHT_BACK.y);

  // 100 pitch units right and 50 up, expressed in screen pixels.
  await dragWithMouse(page, from, { x: 100 * scale, y: -50 * scale });

  await expectSaved(page, teamARightBack, {
    x: RIGHT_BACK.x + 100,
    y: RIGHT_BACK.y - 50,
  });
});

test("a reload restores the board", async ({ page }) => {
  const scale = await basePixelsPerUnit(page);
  const from = await toScreen(page, RIGHT_BACK.x, RIGHT_BACK.y);
  await dragWithMouse(page, from, { x: 80 * scale, y: 0 });
  await expectSaved(page, teamARightBack, {
    x: RIGHT_BACK.x + 80,
    y: RIGHT_BACK.y,
  });

  await page.reload();

  await expect(page.getByText("Restored")).toBeVisible();
  // The player is drawn where it was left: dragging it back lands on the start.
  const moved = await toScreen(page, RIGHT_BACK.x + 80, RIGHT_BACK.y);
  await dragWithMouse(page, moved, { x: -80 * scale, y: 0 });
  await expectSaved(page, teamARightBack, RIGHT_BACK);
});

test("holding an arrow key nudges the selection and undoes in one step", async ({
  page,
}) => {
  const at = await toScreen(page, RIGHT_BACK.x, RIGHT_BACK.y);
  await page.mouse.click(at.x, at.y);

  // A second keydown without a keyup is an auto-repeat.
  await page.keyboard.down("ArrowRight");
  for (let i = 0; i < 9; i++) await page.keyboard.down("ArrowRight");
  await page.keyboard.up("ArrowRight");
  await expectSaved(page, teamARightBack, {
    x: RIGHT_BACK.x + 10,
    y: RIGHT_BACK.y,
  });

  await page.keyboard.press("Shift+ArrowUp");
  await expectSaved(page, teamARightBack, {
    x: RIGHT_BACK.x + 10,
    y: RIGHT_BACK.y - 10,
  });

  await page.keyboard.press("ControlOrMeta+z");
  await page.keyboard.press("ControlOrMeta+z");
  await expectSaved(page, teamARightBack, RIGHT_BACK);
});

test.describe("export", () => {
  const exportAs = async (
    page: import("@playwright/test").Page,
    item: string,
  ) => {
    await page.getByRole("button", { name: /save \/ export/i }).click();
    const download = page.waitForEvent("download");
    await page.getByText(item, { exact: true }).click();
    const file = await download;
    return {
      name: file.suggestedFilename(),
      bytes: await readFile(await file.path()),
    };
  };

  test("PNG", async ({ page }) => {
    const { name, bytes } = await exportAs(page, "Export Image (PNG)");
    expect(name).toMatch(/\.png$/);
    expect(bytes.subarray(0, 8).toString("latin1")).toBe("\x89PNG\r\n\x1a\n");
    // Width and height from the IHDR chunk: a 1050 × 680 board, scaled up.
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    expect(width).toBeGreaterThanOrEqual(1050);
    expect(width / height).toBeCloseTo(1050 / 680, 1);
    expect(bytes.length).toBeGreaterThan(20_000);
  });

  test("JPEG", async ({ page }) => {
    const { name, bytes } = await exportAs(page, "Export Image (JPEG)");
    expect(name).toMatch(/\.jpe?g$/);
    expect(bytes.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
    expect(bytes.length).toBeGreaterThan(20_000);
  });

  test("SVG has the players but no selection handles", async ({ page }) => {
    const at = await toScreen(page, RIGHT_BACK.x, RIGHT_BACK.y);
    await page.mouse.click(at.x, at.y); // select a player first

    const { name, bytes } = await exportAs(page, "Export Vector (SVG)");
    const svg = bytes.toString("utf8");
    expect(name).toMatch(/\.svg$/);
    expect(svg).toContain("<svg");
    expect(svg.match(/>RB</g)).toHaveLength(2);
    expect(svg).not.toContain("data-editor-only");
  });

  test("PDF", async ({ page }) => {
    const { name, bytes } = await exportAs(page, "Export PDF Sheet");
    expect(name).toMatch(/\.pdf$/);
    expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(20_000);
  });
});

test("a share link opens the shared board after confirmation", async ({
  page,
}) => {
  const examples = await (await page.request.get("/ai/examples.json")).json();
  const example = examples[0];

  let question = "";
  page.once("dialog", (dialog) => {
    question = dialog.message();
    void dialog.accept();
  });
  // The app reads a share link on page load only, so leave it first.
  await page.goto("about:blank");
  await openBoard(page, example.link);

  await expect(page.getByPlaceholder("Tactics Title...")).toHaveValue(
    example.title,
  );
  expect(question).toContain("Open the shared board?");
  await expectSaved(page, (doc) => doc.frames.length, example.frames);
});

test("opening a share link reports its source and no board content", async ({
  page,
}) => {
  const examples = await (await page.request.get("/ai/examples.json")).json();
  const example = examples[0];
  page.once("dialog", (dialog) => void dialog.accept());
  await page.goto("about:blank");
  await openBoard(page, example.link);
  await expect(page.getByPlaceholder("Tactics Title...")).toHaveValue(
    example.title,
  );

  // index.html queues every gtag call on window.dataLayer; the network
  // request to Google is blocked by openBoard.
  const events = await page.evaluate(() =>
    ((window as { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? [])
      .map((entry) => Array.from(entry))
      .filter((entry) => entry[0] === "event")
      .map((entry) => ({ name: entry[1], params: entry[2] })),
  );

  expect(events.filter((e) => e.name === "import_tactics")).toEqual([
    {
      name: "import_tactics",
      params: {
        source: "share_link",
        players: example.players,
        frames: example.frames,
      },
    },
  ]);
  expect(JSON.stringify(events)).not.toContain(example.title);
});
