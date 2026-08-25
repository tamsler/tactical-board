export interface StyledTextSpan {
  text: string;
  bold: boolean;
  italic: boolean;
}

export interface TextToken {
  raw: string;
  text: string;
  start: number;
  end: number;
  bold: boolean;
  italic: boolean;
}

const MARKDOWN_TOKEN_REGEX =
  /(\*\*\*(?:[\s\S]+?)\*\*\*|___(?:[\s\S]+?)___|\*\*_(?:[\s\S]+?)_\*\*|_\*\*(?:[\s\S]+?)\*\*_|\*\*(?:[\s\S]+?)\*\*|__(?:[\s\S]+?)__|\*(?:[^*]+?)\*|_(?:[^_]+?)_)/g;

/**
 * Parses full multi-line text into styled spans grouped by line.
 * Supports bold, italic, and bold-italic across line breaks.
 */
export function parseStyledTextLines(
  fullText: string,
  baseBold = false,
  baseItalic = false,
): StyledTextSpan[][] {
  const tokens = tokenizeText(fullText, baseBold, baseItalic);
  const lines: StyledTextSpan[][] = [[]];

  for (const token of tokens) {
    const parts = token.text.split(/\r?\n/);
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        lines.push([]);
      }
      if (parts[i].length > 0 || parts.length === 1) {
        lines[lines.length - 1].push({
          text: parts[i],
          bold: token.bold,
          italic: token.italic,
        });
      }
    }
  }

  return lines.map((spans) => {
    if (spans.length === 0) {
      return [{ text: "", bold: baseBold, italic: baseItalic }];
    }
    return spans;
  });
}

/**
 * Parses a single line of text into styled spans supporting markdown syntax:
 * - ***bold italic*** or ___bold italic___
 * - **bold** or __bold__
 * - *italic* or _italic_
 */
export function parseStyledTextLine(
  line: string,
  baseBold = false,
  baseItalic = false,
): StyledTextSpan[] {
  const result = parseStyledTextLines(line, baseBold, baseItalic);
  return result[0] || [{ text: "", bold: baseBold, italic: baseItalic }];
}

/**
 * Tokenizes entire text into styled and unstyled tokens with offsets.
 */
export function tokenizeText(
  text: string,
  baseBold = false,
  baseItalic = false,
): TextToken[] {
  const tokens: TextToken[] = [];
  const regex = new RegExp(MARKDOWN_TOKEN_REGEX.source, "g");

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const raw = text.slice(lastIndex, match.index);
      tokens.push({
        raw,
        text: raw,
        start: lastIndex,
        end: match.index,
        bold: baseBold,
        italic: baseItalic,
      });
    }

    const raw = match[0];
    let content = "";
    let isBold = baseBold;
    let isItalic = baseItalic;

    if (
      (raw.startsWith("***") && raw.endsWith("***")) ||
      (raw.startsWith("___") && raw.endsWith("___")) ||
      (raw.startsWith("**_") && raw.endsWith("_**")) ||
      (raw.startsWith("_**") && raw.endsWith("**_"))
    ) {
      content = raw.slice(3, -3);
      isBold = true;
      isItalic = true;
    } else if (
      (raw.startsWith("**") && raw.endsWith("**")) ||
      (raw.startsWith("__") && raw.endsWith("__"))
    ) {
      content = raw.slice(2, -2);
      isBold = true;
    } else if (
      (raw.startsWith("*") && raw.endsWith("*")) ||
      (raw.startsWith("_") && raw.endsWith("_"))
    ) {
      content = raw.slice(1, -1);
      isItalic = true;
    } else {
      content = raw;
    }

    tokens.push({
      raw,
      text: content,
      start: match.index,
      end: regex.lastIndex,
      bold: isBold,
      italic: isItalic,
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const raw = text.slice(lastIndex);
    tokens.push({
      raw,
      text: raw,
      start: lastIndex,
      end: text.length,
      bold: baseBold,
      italic: baseItalic,
    });
  }

  return tokens;
}

/**
 * Checks if the selection or cursor position currently has bold/italic format active.
 */
export function isFormatActive(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  format: "bold" | "italic",
  baseDefault = false,
): boolean {
  if (baseDefault) return true;
  if (!text) return false;

  const tokens = tokenizeText(text, baseDefault, baseDefault);
  if (tokens.length === 0) return false;

  if (selectionStart < selectionEnd) {
    const overlapping = tokens.filter(
      (t) =>
        t.start < selectionEnd &&
        t.end > selectionStart &&
        t.raw.trim().length > 0,
    );
    if (overlapping.length === 0) return false;
    return overlapping.every((t) => (format === "bold" ? t.bold : t.italic));
  }

  // Collapsed cursor
  const pos = selectionStart;
  const token = tokens.find((t) => pos >= t.start && pos <= t.end);
  if (!token) return false;
  return format === "bold" ? token.bold : token.italic;
}

/**
 * Formats clean inner text with bold and italic flags.
 */
function applyStyleToContent(
  content: string,
  bold: boolean,
  italic: boolean,
): string {
  if (!bold && !italic) return content;
  if (bold && italic) return `***${content}***`;
  if (bold) return `**${content}**`;
  return `*${content}*`;
}

/**
 * Toggles bold or italic markdown formatting on a selected portion of text or at cursor.
 */
export function toggleMarkdownFormat(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  format: "bold" | "italic",
): { newText: string; newStart: number; newEnd: number } {
  const isRangeSelected = selectionStart < selectionEnd;

  // 1. If user highlighted a range of text
  if (isRangeSelected) {
    const selected = text.slice(selectionStart, selectionEnd);

    // Case 1A: Selected text is immediately surrounded by delimiters outside the selection
    if (format === "bold") {
      const hasOuterBoldStars =
        selectionStart >= 2 &&
        selectionEnd + 2 <= text.length &&
        text.slice(selectionStart - 2, selectionStart) === "**" &&
        text.slice(selectionEnd, selectionEnd + 2) === "**";

      if (hasOuterBoldStars) {
        const hasOuterTripleStars =
          selectionStart >= 3 &&
          selectionEnd + 3 <= text.length &&
          text.slice(selectionStart - 3, selectionStart) === "***" &&
          text.slice(selectionEnd, selectionEnd + 3) === "***";

        if (hasOuterTripleStars) {
          // ***hello*** -> *hello*
          const newText =
            text.slice(0, selectionStart - 3) +
            `*${selected}*` +
            text.slice(selectionEnd + 3);
          return {
            newText,
            newStart: selectionStart - 2,
            newEnd: selectionEnd - 2,
          };
        }

        // **hello** -> hello
        const newText =
          text.slice(0, selectionStart - 2) +
          selected +
          text.slice(selectionEnd + 2);
        return {
          newText,
          newStart: selectionStart - 2,
          newEnd: selectionEnd - 2,
        };
      }
    }

    if (format === "italic") {
      const hasOuterItalicStars =
        selectionStart >= 1 &&
        selectionEnd + 1 <= text.length &&
        text[selectionStart - 1] === "*" &&
        (selectionStart < 2 || text[selectionStart - 2] !== "*") &&
        text[selectionEnd] === "*" &&
        (selectionEnd + 1 >= text.length || text[selectionEnd + 1] !== "*");

      const hasOuterTripleStars =
        selectionStart >= 3 &&
        selectionEnd + 3 <= text.length &&
        text.slice(selectionStart - 3, selectionStart) === "***" &&
        text.slice(selectionEnd, selectionEnd + 3) === "***";

      if (hasOuterTripleStars) {
        // ***hello*** -> **hello**
        const newText =
          text.slice(0, selectionStart - 3) +
          `**${selected}**` +
          text.slice(selectionEnd + 3);
        return {
          newText,
          newStart: selectionStart - 1,
          newEnd: selectionEnd - 1,
        };
      }

      if (hasOuterItalicStars) {
        // *hello* -> hello
        const newText =
          text.slice(0, selectionStart - 1) +
          selected +
          text.slice(selectionEnd + 1);
        return {
          newText,
          newStart: selectionStart - 1,
          newEnd: selectionEnd - 1,
        };
      }
    }

    // Case 1B: Selection itself starts and ends with formatting delimiters
    if (format === "bold") {
      if (
        (selected.startsWith("***") &&
          selected.endsWith("***") &&
          selected.length >= 6) ||
        (selected.startsWith("___") &&
          selected.endsWith("___") &&
          selected.length >= 6)
      ) {
        // ***hello*** -> *hello*
        const inner = selected.slice(3, -3);
        const unwrapped = `*${inner}*`;
        const newText =
          text.slice(0, selectionStart) + unwrapped + text.slice(selectionEnd);
        return {
          newText,
          newStart: selectionStart + 1,
          newEnd: selectionStart + 1 + inner.length,
        };
      }

      if (
        (selected.startsWith("**") &&
          selected.endsWith("**") &&
          selected.length >= 4) ||
        (selected.startsWith("__") &&
          selected.endsWith("__") &&
          selected.length >= 4)
      ) {
        // **hello** -> hello
        const unwrapped = selected.slice(2, -2);
        const newText =
          text.slice(0, selectionStart) + unwrapped + text.slice(selectionEnd);
        return {
          newText,
          newStart: selectionStart,
          newEnd: selectionStart + unwrapped.length,
        };
      }

      if (
        selected.startsWith("*") &&
        !selected.startsWith("**") &&
        selected.endsWith("*") &&
        !selected.endsWith("**") &&
        selected.length >= 2
      ) {
        // *hello* -> ***hello***
        const inner = selected.slice(1, -1);
        const wrapped = `***${inner}***`;
        const newText =
          text.slice(0, selectionStart) + wrapped + text.slice(selectionEnd);
        return {
          newText,
          newStart: selectionStart + 3,
          newEnd: selectionStart + 3 + inner.length,
        };
      }

      // Normal unformatted selection: hello -> **hello**
      const wrapped = `**${selected}**`;
      const newText =
        text.slice(0, selectionStart) + wrapped + text.slice(selectionEnd);
      return {
        newText,
        newStart: selectionStart + 2,
        newEnd: selectionStart + 2 + selected.length,
      };
    }

    if (format === "italic") {
      if (
        (selected.startsWith("***") &&
          selected.endsWith("***") &&
          selected.length >= 6) ||
        (selected.startsWith("___") &&
          selected.endsWith("___") &&
          selected.length >= 6)
      ) {
        // ***hello*** -> **hello**
        const inner = selected.slice(3, -3);
        const unwrapped = `**${inner}**`;
        const newText =
          text.slice(0, selectionStart) + unwrapped + text.slice(selectionEnd);
        return {
          newText,
          newStart: selectionStart + 2,
          newEnd: selectionStart + 2 + inner.length,
        };
      }

      if (
        selected.startsWith("*") &&
        !selected.startsWith("**") &&
        selected.endsWith("*") &&
        !selected.endsWith("**") &&
        selected.length >= 2
      ) {
        // *hello* -> hello
        const unwrapped = selected.slice(1, -1);
        const newText =
          text.slice(0, selectionStart) + unwrapped + text.slice(selectionEnd);
        return {
          newText,
          newStart: selectionStart,
          newEnd: selectionStart + unwrapped.length,
        };
      }

      if (
        (selected.startsWith("**") &&
          selected.endsWith("**") &&
          selected.length >= 4) ||
        (selected.startsWith("__") &&
          selected.endsWith("__") &&
          selected.length >= 4)
      ) {
        // **hello** -> ***hello***
        const inner = selected.slice(2, -2);
        const wrapped = `***${inner}***`;
        const newText =
          text.slice(0, selectionStart) + wrapped + text.slice(selectionEnd);
        return {
          newText,
          newStart: selectionStart + 3,
          newEnd: selectionStart + 3 + inner.length,
        };
      }

      // Normal unformatted selection: hello -> *hello*
      const wrapped = `*${selected}*`;
      const newText =
        text.slice(0, selectionStart) + wrapped + text.slice(selectionEnd);
      return {
        newText,
        newStart: selectionStart + 1,
        newEnd: selectionStart + 1 + selected.length,
      };
    }
  }

  // 2. Cursor is collapsed (selectionStart === selectionEnd)
  const pos = selectionStart;
  const tokens = tokenizeText(text);

  // Check if cursor is inside an existing formatted token
  const currentToken = tokens.find((t) => pos >= t.start && pos <= t.end);

  if (currentToken && (currentToken.bold || currentToken.italic)) {
    const targetBold =
      format === "bold" ? !currentToken.bold : currentToken.bold;
    const targetItalic =
      format === "italic" ? !currentToken.italic : currentToken.italic;

    const replacement = applyStyleToContent(
      currentToken.text,
      targetBold,
      targetItalic,
    );
    const newText =
      text.slice(0, currentToken.start) +
      replacement +
      text.slice(currentToken.end);

    let offsetDelta = 0;
    if (targetBold && targetItalic) offsetDelta = 3;
    else if (targetBold) offsetDelta = 2;
    else if (targetItalic) offsetDelta = 1;

    return {
      newText,
      newStart: currentToken.start + offsetDelta,
      newEnd: currentToken.start + offsetDelta + currentToken.text.length,
    };
  }

  // Check if cursor is inside a plain word
  let wordStart = pos;
  let wordEnd = pos;
  while (wordStart > 0 && /[^\s*_\r\n]/.test(text[wordStart - 1])) {
    wordStart--;
  }
  while (wordEnd < text.length && /[^\s*_\r\n]/.test(text[wordEnd])) {
    wordEnd++;
  }

  if (wordStart < wordEnd) {
    const word = text.slice(wordStart, wordEnd);
    const wrapped = format === "bold" ? `**${word}**` : `*${word}*`;
    const newText = text.slice(0, wordStart) + wrapped + text.slice(wordEnd);
    const prefixLen = format === "bold" ? 2 : 1;
    return {
      newText,
      newStart: wordStart + prefixLen,
      newEnd: wordStart + prefixLen + word.length,
    };
  }

  // Empty placeholder
  const placeholder = format === "bold" ? "bold text" : "italic text";
  const wrapped = format === "bold" ? `**${placeholder}**` : `*${placeholder}*`;
  const prefixLen = format === "bold" ? 2 : 1;
  const newText = text.slice(0, pos) + wrapped + text.slice(pos);

  return {
    newText,
    newStart: pos + prefixLen,
    newEnd: pos + prefixLen + placeholder.length,
  };
}
