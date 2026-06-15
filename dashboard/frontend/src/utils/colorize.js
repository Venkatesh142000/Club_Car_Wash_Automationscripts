export function colorizeOutput(text) {
  if (!text) return null;

  const lines = text.split("\n");
  return lines.map((line, idx) => {
    let className = "log-line";
    let displayLine = line;

    const lowerLine = line.toLowerCase();

    // Error patterns
    if (
      lowerLine.includes("error") ||
      lowerLine.includes("failed") ||
      lowerLine.includes("✖") ||
      lowerLine.includes("× ") ||
      lowerLine.match(/^\s*(at\s+|>|Error:)/)
    ) {
      className = "log-error";
    }
    // Warning/deprecation patterns
    else if (
      lowerLine.includes("warning") ||
      lowerLine.includes("warn") ||
      lowerLine.includes("⚠") ||
      lowerLine.includes("deprecated")
    ) {
      className = "log-warn";
    }
    // Success patterns
    else if (
      lowerLine.includes("passed") ||
      lowerLine.includes("✓") ||
      lowerLine.includes("success") ||
      lowerLine.match(/\d+\s+(?:passed|passed\s+in)/)
    ) {
      className = "log-success";
    }
    // Test/file patterns
    else if (line.match(/\.spec\.(js|ts)|\.test\.(js|ts)|tests\/|pages\//)) {
      className = "log-file";
    }
    // Running patterns
    else if (lowerLine.includes("running") || lowerLine.includes("starting")) {
      className = "log-info";
    }

    return { line: displayLine, className, key: idx };
  });
}
