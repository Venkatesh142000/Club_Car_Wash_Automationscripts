export function highlightCode(code) {
  if (!code) return [];

  const lines = code.split("\n");
  return lines.map((line, idx) => {
    const tokens = tokenizeLine(line);
    return { line, tokens, key: idx };
  });
}

function tokenizeLine(line) {
  const tokens = [];
  let i = 0;

  while (i < line.length) {
    // Single-line comments
    if (line[i] === "/" && line[i + 1] === "/") {
      tokens.push({
        text: line.slice(i),
        className: "syntax-comment",
      });
      break;
    }

    // Multi-line comment start (simplified)
    if (line[i] === "/" && line[i + 1] === "*") {
      const endIdx = line.indexOf("*/", i);
      const endPos = endIdx !== -1 ? endIdx + 2 : line.length;
      tokens.push({
        text: line.slice(i, endPos),
        className: "syntax-comment",
      });
      i = endPos;
      continue;
    }

    // Strings (double quotes)
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length && (line[j] !== '"' || line[j - 1] === "\\")) {
        j++;
      }
      tokens.push({
        text: line.slice(i, j + 1),
        className: "syntax-string",
      });
      i = j + 1;
      continue;
    }

    // Strings (single quotes)
    if (line[i] === "'") {
      let j = i + 1;
      while (j < line.length && (line[j] !== "'" || line[j - 1] === "\\")) {
        j++;
      }
      tokens.push({
        text: line.slice(i, j + 1),
        className: "syntax-string",
      });
      i = j + 1;
      continue;
    }

    // Backtick strings (template literals)
    if (line[i] === "`") {
      let j = i + 1;
      while (j < line.length && (line[j] !== "`" || line[j - 1] === "\\")) {
        j++;
      }
      tokens.push({
        text: line.slice(i, j + 1),
        className: "syntax-string",
      });
      i = j + 1;
      continue;
    }

    // Numbers
    if (/\d/.test(line[i])) {
      let j = i;
      while (j < line.length && /[\d.]/.test(line[j])) {
        j++;
      }
      tokens.push({
        text: line.slice(i, j),
        className: "syntax-number",
      });
      i = j;
      continue;
    }

    // Keywords and identifiers
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) {
        j++;
      }
      const word = line.slice(i, j);
      const keywords = [
        "function",
        "const",
        "let",
        "var",
        "if",
        "else",
        "for",
        "while",
        "do",
        "return",
        "break",
        "continue",
        "switch",
        "case",
        "default",
        "try",
        "catch",
        "finally",
        "throw",
        "new",
        "this",
        "class",
        "extends",
        "import",
        "export",
        "from",
        "async",
        "await",
        "true",
        "false",
        "null",
        "undefined",
      ];

      const isKeyword = keywords.includes(word);
      tokens.push({
        text: word,
        className: isKeyword ? "syntax-keyword" : "syntax-identifier",
      });
      i = j;
      continue;
    }

    // Operators and punctuation
    if (/[{}()\[\];:,.<>!@#$%^&*+\-=/|?]/.test(line[i])) {
      tokens.push({
        text: line[i],
        className: "syntax-operator",
      });
      i++;
      continue;
    }

    // Whitespace
    if (/\s/.test(line[i])) {
      let j = i;
      while (j < line.length && /\s/.test(line[j])) {
        j++;
      }
      tokens.push({
        text: line.slice(i, j),
        className: "syntax-whitespace",
      });
      i = j;
      continue;
    }

    // Default
    tokens.push({
      text: line[i],
      className: "syntax-default",
    });
    i++;
  }

  return tokens;
}
