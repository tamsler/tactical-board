import { jsPDF } from "jspdf";
import type { BoardState } from "../hooks/useTacticsState";
import { PITCH_WIDTH, PITCH_HEIGHT } from "../constants/formations";

// Convert SVG to Canvas for PNG / JPEG / PDF export
export async function svgToCanvas(
  svgElement: SVGSVGElement,
  scale = 2,
): Promise<HTMLCanvasElement> {
  // Clone SVG to avoid modifying the DOM
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

  // Set explicit width and height on cloned SVG
  clonedSvg.setAttribute("width", (PITCH_WIDTH * scale).toString());
  clonedSvg.setAttribute("height", (PITCH_HEIGHT * scale).toString());

  const svgData = new XMLSerializer().serializeToString(clonedSvg);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const URL = window.URL || window.webkitURL || window;
  const blobURL = URL.createObjectURL(svgBlob);

  const canvas = document.createElement("canvas");
  canvas.width = PITCH_WIDTH * scale;
  canvas.height = PITCH_HEIGHT * scale;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context could not be initialized");
  }

  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = () => {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      URL.revokeObjectURL(blobURL);
      resolve(canvas);
    };
    image.onerror = (err) => {
      URL.revokeObjectURL(blobURL);
      reject(err);
    };
    image.src = blobURL;
  });
}

// Download Image (PNG or JPEG)
export async function exportAsImage(
  svgElement: SVGSVGElement,
  filename = "soccer-tactics.png",
  format: "image/png" | "image/jpeg" = "image/png",
  scale = 2,
) {
  const canvas = await svgToCanvas(svgElement, scale);
  const dataUrl = canvas.toDataURL(format, 0.95);

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export as vector SVG
export function exportAsSVG(
  svgElement: SVGSVGElement,
  filename = "soccer-tactics.svg",
) {
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const svgData = new XMLSerializer().serializeToString(clonedSvg);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export as PDF with Header, Notes, and Tactical Pitch Diagram
export async function exportAsPDF(
  svgElement: SVGSVGElement,
  state: BoardState,
  filename = "soccer-tactical-sheet.pdf",
) {
  const canvas = await svgToCanvas(svgElement, 2.5);
  const imgData = canvas.toDataURL("image/png");

  // Landscape A4: 297mm x 210mm
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Background Slate Theme
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  // Header Banner
  pdf.setFillColor(30, 41, 59); // slate-800
  pdf.rect(0, 0, pageWidth, 22, "F");

  // Title
  pdf.setTextColor(248, 250, 252);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(state.title || "Soccer Tactical Board Plan", 14, 14);

  // Date & Tag
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(148, 163, 184); // slate-400
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  pdf.text(`Created: ${dateStr}  |  Tactical Blueprint`, pageWidth - 14, 14, {
    align: "right",
  });

  // Tactical Pitch Image (Left / Center)
  const pitchMargin = 12;
  const pitchW = 195;
  const pitchH = (pitchW * PITCH_HEIGHT) / PITCH_WIDTH; // ~126mm
  const pitchY = 28;

  pdf.addImage(imgData, "PNG", pitchMargin, pitchY, pitchW, pitchH);

  // Right Side: Tactical Notes & Match Analysis Card
  const notesX = pitchMargin + pitchW + 8;
  const notesW = pageWidth - notesX - pitchMargin;
  const notesH = pitchH;

  pdf.setFillColor(30, 41, 59);
  pdf.roundedRect(notesX, pitchY, notesW, notesH, 3, 3, "F");

  // Notes Title
  pdf.setTextColor(56, 189, 248); // sky-400
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("COACHING NOTES", notesX + 6, pitchY + 10);

  // Notes Content
  pdf.setTextColor(226, 232, 240); // slate-200
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);

  const notesText = state.notes || "No notes provided for this drill.";
  const splitNotes = pdf.splitTextToSize(notesText, notesW - 12);
  pdf.text(splitNotes, notesX + 6, pitchY + 18);

  // Squad Summary
  const countA = state.players.filter((p) => p.team === "A").length;
  const countB = state.players.filter((p) => p.team === "B").length;
  const ballCount = state.balls.length;

  pdf.setFontSize(8.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Team Red: ${countA} players`, notesX + 6, pitchY + notesH - 16);
  pdf.text(`Team Blue: ${countB} players`, notesX + 6, pitchY + notesH - 11);
  pdf.text(
    `Balls: ${ballCount} | Equipment: ${state.equipments.length}`,
    notesX + 6,
    pitchY + notesH - 6,
  );

  // Footer Branding
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    "Tactical Soccer Board Pro • Exported Tactical Sheet",
    14,
    pageHeight - 5,
  );

  pdf.save(filename);
}

// Export / Save JSON
export function exportAsJSON(
  state: BoardState,
  filename = "soccer-tactics.json",
) {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
