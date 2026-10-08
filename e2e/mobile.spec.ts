import { expect, test, type Page } from "@playwright/test";
import {
  BALL,
  ball,
  basePixelsPerUnit,
  boardSvg,
  expectSaved,
  openBoard,
  toScreen,
} from "./board";

test.beforeEach(async ({ page }) => {
  await openBoard(page);
});

// Real touch input, which Playwright only exposes through the DevTools protocol.
async function dragWithTouch(
  page: Page,
  from: { x: number; y: number },
  by: { x: number; y: number },
) {
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: string, x?: number, y?: number) =>
    cdp.send("Input.dispatchTouchEvent", {
      type: type as "touchStart",
      touchPoints: x === undefined ? [] : [{ x, y: y! }],
    });
  await touch("touchStart", from.x, from.y);
  for (let i = 1; i <= 5; i++) {
    await touch("touchMove", from.x + (by.x * i) / 5, from.y + (by.y * i) / 5);
  }
  await touch("touchEnd");
}

test("a touch drag moves the ball without scrolling the page", async ({
  page,
}) => {
  const scale = await basePixelsPerUnit(page);
  const from = await toScreen(page, BALL.x, BALL.y);

  await dragWithTouch(page, from, { x: 60 * scale, y: 90 * scale });

  await expectSaved(page, ball, { x: BALL.x + 60, y: BALL.y + 90 });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("a drag at 200% zoom covers half the pitch distance", async ({ page }) => {
  const scale = await basePixelsPerUnit(page);
  const zoomIn = page.getByTitle("Zoom In");
  for (let i = 0; i < 4; i++) await zoomIn.click();
  await expect(page.getByText("200%")).toBeVisible();

  const from = await toScreen(page, BALL.x, BALL.y);
  // 120 units' worth of pixels at 100% is 60 units at 200%.
  await dragWithTouch(page, from, { x: 120 * scale, y: 0 });

  await expectSaved(page, ball, { x: BALL.x + 60, y: BALL.y });
  await expect(boardSvg(page)).toBeVisible();
});

test("the timeline controls fit inside the panel on a phone", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Animate" }).click();
  await page.getByRole("button", { name: /add frame/i }).click();

  const panel = (await page
    .getByRole("region", { name: "Animation frames" })
    .boundingBox())!;
  for (const control of [
    page.getByLabel("Playback speed"),
    page.getByRole("button", { name: "Loop playback" }),
    page.getByLabel("Playback position"),
  ]) {
    const box = (await control.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(panel.x);
    expect(box.x + box.width).toBeLessThanOrEqual(panel.x + panel.width);
  }

  // The sidebar handle floats over the board, not over the timeline.
  const handle = (await page
    .getByRole("button", { name: "Expand sidebar" })
    .boundingBox())!;
  expect(handle.y + handle.height).toBeLessThanOrEqual(panel.y);

  // The frame chips get the panel's width, not what the action buttons leave.
  const strip = (await page.getByRole("list").boundingBox())!;
  expect(strip.width).toBeGreaterThan(panel.width * 0.8);
});
