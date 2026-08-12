'use client';

import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { EditorView } from '@codemirror/view';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const arduinoTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    fontSize: '14px',
  },
  '.cm-content': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    caretColor: '#22d3ee',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#475569',
  },
  '&.cm-focused': {
    outline: 'none',
  },
}, { dark: true });

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  return (
    <CodeMirror
      value={value}
      height="320px"
      theme="dark"
      extensions={[cpp(), arduinoTheme]}
      onChange={(val) => onChange(val)}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
      }}
    />
  );
}