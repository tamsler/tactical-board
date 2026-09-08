import packageJson from "../../package.json";

export const APP_INFO = {
  name: "Tactical Soccer Board",
  shortName: "Tactical Board",
  version: packageJson.version,
  author: "Thomas Amsler",
  siteUrl: "https://tacticalboard.app/",
  githubRepo: "https://github.com/tamsler/tactical-board",
  issuesUrl: "https://github.com/tamsler/tactical-board/issues",
  contactEmail: "info@tacticalboard.app",
  description:
    "An interactive tactical soccer board for designing formations, set pieces, player movements, and coaching drills.",
} as const;
