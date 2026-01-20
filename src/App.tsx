import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { CharacterLimitPlugin } from '@lexical/react/LexicalCharacterLimitPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection } from 'lexical';
import { OverflowNode } from '@lexical/overflow';
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
} from 'lexical';
import { LocalAIProvider, runEditorAI } from './services/ai';

const aiProvider = new LocalAIProvider(
  'http://mediaroom.lan:11434',
  'gemma3-4b-8k:latest'
);


/* -----------------------------
   Editor configuration
----------------------------- */

const editorConfig = {
  namespace: 'OfflineAIWriter',
  nodes: [OverflowNode],
  onError(error: Error) {
    console.error('Lexical error:', error);
  },
};

/* -----------------------------
   AI Stub
----------------------------- */

function fakeAIResponse(
  action: 'continue' | 'expand' | 'refactor',
  input: string
): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      switch (action) {
        case 'continue':
          resolve(`${input} …and then the story continues naturally.`);
          break;
        case 'expand':
          resolve(`${input}\n\n[Expanded with more detail and depth.]`);
          break;
        case 'refactor':
          resolve(`[Refactored version]: ${input}`);
          break;
      }
    }, 600);
  });
}


/* -----------------------------
   Toolbar (INSIDE composer)
----------------------------- */

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [loading, setLoading] = React.useState<
    null | 'continue' | 'expand' | 'refactor'
  >(null);

  const withSelection = async (
    action: 'continue' | 'expand' | 'refactor'
  ) => {
    let selectedText = '';

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selectedText = selection.getTextContent();
      } else {
        selectedText = $getRoot().getTextContent();
      }
    });

    setLoading(action);
    const aiText = await runEditorAI(
	  aiProvider,
	  action,
	  selectedText
	);
    setLoading(null);

    editor.update(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        selection.insertText(aiText);
      } else {
        const root = $getRoot();
        root.clear();
        const p = $createParagraphNode();
        p.append($createTextNode(aiText));
        root.append(p);
      }
    });
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => withSelection('continue')}
        disabled={loading !== null}
        style={{ marginRight: 8 }}
      >
        {loading === 'continue' ? 'Thinking…' : 'Continue'}
      </button>

      <button
        onClick={() => withSelection('expand')}
        disabled={loading !== null}
        style={{ marginRight: 8 }}
      >
        {loading === 'expand' ? 'Thinking…' : 'Expand'}
      </button>

      <button
        onClick={() => withSelection('refactor')}
        disabled={loading !== null}
      >
        {loading === 'refactor' ? 'Thinking…' : 'Refactor'}
      </button>
    </div>
  );
}



/* -----------------------------
   Word + character count
----------------------------- */

function WordCount() {
  const [editor] = useLexicalComposerContext();
  const [counts, setCounts] = React.useState({ words: 0, chars: 0 });

  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const text = $getRoot().getTextContent();
        const trimmed = text.trim();

        setCounts({
          words: trimmed ? trimmed.split(/\s+/).length : 0,
          chars: text.length,
        });
      });
    });
  }, [editor]);

  return (
    <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
      {counts.words} words · {counts.chars} characters
    </div>
  );
}

/* -----------------------------
   App
----------------------------- */

export default function App() {
  return (
    <div style={{ padding: 24, background: '#f6f6f6', minHeight: '100vh' }}>
      <h1>Offline AI Writer</h1>

      <LexicalComposer initialConfig={editorConfig}>
        <Toolbar />

        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: 6,
            padding: 12,
            background: '#fff',
          }}
        >
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                style={{
                  minHeight: 200,
                  outline: 'none',
                }}
              />
            }
            placeholder={
              <div style={{ color: '#999' }}>Start writing…</div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />

          <HistoryPlugin />
          <CharacterLimitPlugin maxLength={5000} />
          <WordCount />
        </div>
      </LexicalComposer>
    </div>
  );
}

