import { useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { autocompletion, completionKeymap, startCompletion } from "@codemirror/autocomplete";

const CodeMirrorEditor = ({ code, onChange }) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const [completions, setCompletions] = useState([]);

  // Fetch framework completions on mount
  useEffect(() => {
    const fetchCompletions = async () => {
      try {
        const res = await fetch("/api/completions");
        const data = await res.json();
        setCompletions(data.completions || []);
      } catch (error) {
        console.error("Failed to load completions:", error);
      }
    };
    fetchCompletions();
  }, []);

  // Create custom completion source
  const frameworkCompletion = (context) => {
    const word = context.matchBefore(/[\w$]*/);
    const beforeCursor = context.state.sliceDoc(Math.max(0, context.pos - 1), context.pos);
    const triggeredByMemberAccess = beforeCursor === ".";

    if (!triggeredByMemberAccess && (!word || (word.from === word.to && !context.explicit))) {
      return null;
    }

    const query = triggeredByMemberAccess ? "" : word.text.toLowerCase();
    const from = triggeredByMemberAccess ? context.pos : word.from;
    const options = completions
      .filter((completion) => completion.label.toLowerCase().includes(query))
      .map((completion) => ({
        label: completion.label,
        type: completion.type,
        info: completion.info,
        detail: completion.section,
      }));

    if (!options.length) {
      return null;
    }

    return {
      from,
      options,
    };
  };

  // Initialize CodeMirror editor
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        javascript(),
        autocompletion({
          activateOnTyping: true,
          override: [frameworkCompletion],
        }),
        keymap.of(completionKeymap),
        EditorView.lineWrapping,
        EditorView.theme({
          "&": {
            height: "100%",
          },
          ".cm-scroller": {
            overflow: "auto",
            fontFamily: "Consolas, Monaco, monospace",
          },
          ".cm-content": {
            minHeight: "360px",
            caretColor: "#d9f4ff",
          },
          ".cm-focused": {
            outline: "none",
          },
          ".cm-editor.cm-focused": {
            outline: "none",
          },
          ".cm-selectionBackground, ::selection": {
            backgroundColor: "rgba(32, 212, 255, 0.22)",
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());

            const lastChar = update.state.sliceDoc(
              Math.max(0, update.state.selection.main.head - 1),
              update.state.selection.main.head,
            );

            if (/^[\w$.]$/.test(lastChar)) {
              queueMicrotask(() => startCompletion(update.view));
            }
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    editorRef.current = view;

    return () => {
      view.destroy();
    };
  }, [completions]);

  // Update code when external code prop changes (without losing cursor position)
  useEffect(() => {
    if (editorRef.current && code !== editorRef.current.state.doc.toString()) {
      editorRef.current.dispatch({
        changes: {
          from: 0,
          to: editorRef.current.state.doc.length,
          insert: code,
        },
      });
    }
  }, [code]);

  return (
    <div
      ref={containerRef}
      className="codemirror-editor"
    />
  );
};

export default CodeMirrorEditor;
