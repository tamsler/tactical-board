import { expect, type Page } from "@playwright/test";

const STORAGE_KEY = "tactical_board_saved_state_v2";

interface Entity {
  id: string;
  x: number;
  y: number;
  team?: string;
  name?: string;
}
interface SavedFrame {
  players: Entity[];
  balls: Entity[];
}
interface SavedDocument {
  title: string;
  frames: SavedFrame[];
}

/** Opens the app with analytics blocked, so test runs send no events. */
export async function openBoard(page: Page, path = "/") {
  await page.unrouteAll();
  await page.route(/googletagmanager\.com|google-analytics\.com/, (route) =>
    route.abort(),
  );
  await page.goto(path);
  await expect(boardSvg(page)).toBeVisible();
}

export const boardSvg = (page: Page) =>
  page.locator('svg[viewBox="0 0 1050 680"]');

/** Where a pitch position is on screen right now, including zoom and pan. */
export function toScreen(page: Page, x: number, y: number) {
  return boardSvg(page).evaluate(
    (svg: SVGSVGElement, p) => {
      const pt = svg.createSVGPoint();
      pt.x = p.x;
      pt.y = p.y;
      const out = pt.matrixTransform(svg.getScreenCTM()!);
      return { x: out.x, y: out.y };
    },
    { x, y },
  );
}

/** Screen pixels per pitch unit at 100% zoom, measured from the element's layout size. */
export function basePixelsPerUnit(page: Page) {
  return boardSvg(page).evaluate((svg: SVGSVGElement) =>
    Math.min(svg.clientWidth / 1050, svg.clientHeight / 680),
  );
}

/** The document the app last autosaved, or null before the first save. */
export function savedDocument(page: Page): Promise<SavedDocument | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw).document : null;
  }, STORAGE_KEY);
}

/** Polls the autosaved document until `pick` returns the expected value. */
export function expectSaved<T>(
  page: Page,
  pick: (doc: SavedDocument) => T,
  expected: T,
) {
  return expect
    .poll(async () => {
      const doc = await savedDocument(page);
      return doc ? pick(doc) : null;
    })
    .toEqual(expected);
}

export const teamARightBack = (doc: SavedDocument) => {
  const p = doc.frames[0].players.find(
    (pl) => pl.team === "A" && pl.name === "RB",
  )!;
  return { x: p.x, y: p.y };
};

export const ball = (doc: SavedDocument) => {
  const b = doc.frames[0].balls[0];
  return { x: b.x, y: b.y };
};

// Default 11v11 board (docs/specs/core-board.md §6).
export const RIGHT_BACK = { x: 260, y: 550 };
export const BALL = { x: 525, y: 340 };

export async function dragWithMouse(
  page: Page,
  from: { x: number; y: number },
  by: { x: number; y: number },
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + by.x / 2, from.y + by.y / 2, { steps: 4 });
  await page.mouse.move(from.x + by.x, from.y + by.y, { steps: 4 });
  await page.mouse.up();
}
