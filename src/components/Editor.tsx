import { useEffect, useRef } from 'react';
import { EditorView, keymap, Decoration, type DecorationSet } from '@codemirror/view';
import { EditorState, StateEffect, StateField, Compartment } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { java } from '@codemirror/lang-java';
import { indentWithTab } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const setErr = StateEffect.define<number | null>();
const errField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    for (const e of tr.effects) if (e.is(setErr)) {
      if (e.value === null || e.value < 1 || e.value > tr.state.doc.lines) return Decoration.none;
      const line = tr.state.doc.line(e.value);
      return Decoration.set([Decoration.line({ class: 'cm-errline' }).range(line.from)]);
    }
    return tr.docChanged ? Decoration.none : deco;
  },
  provide: f => EditorView.decorations.from(f),
});

const style = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier, tags.controlKeyword, tags.definitionKeyword, tags.typeName, tags.standard(tags.typeName)], color: 'var(--pen)', fontWeight: '600' },
  { tag: [tags.string, tags.character], color: 'var(--green)' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--amber)' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: 'var(--muted)', fontStyle: 'italic' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: 'var(--violet)' },
]);

const theme = EditorView.theme({
  '&': { backgroundColor: 'var(--surface)', color: 'var(--ink)' },
  '.cm-content': { caretColor: 'var(--pen)', padding: '8px 0' },
  '.cm-matchingBracket': { backgroundColor: 'var(--pen-soft)', outline: '1px solid var(--pen)' },
  '.cm-tooltip': { backgroundColor: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)' },
  '.cm-tooltip-autocomplete ul li[aria-selected]': { backgroundColor: 'var(--pen)', color: 'var(--on-pen)' },
  '.cm-panels': { backgroundColor: 'var(--surface-2)', color: 'var(--ink)' },
  '.cm-searchMatch': { backgroundColor: 'var(--amber-soft)' },
});

export interface EditorProps { value: string; onChange: (v: string) => void; errorLine?: number | null; label?: string; minLines?: number }

/** CodeMirror 6 Java editor. Tab indents; Esc then Tab moves focus out (standard CM accessibility). */
export default function Editor({ value, onChange, errorLine = null, label = 'Java code editor', minLines = 12 }: EditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;
  const lineComp = useRef(new Compartment());

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup, java(), keymap.of([indentWithTab]), syntaxHighlighting(style), theme, errField,
          EditorState.tabSize.of(4),
          lineComp.current.of(EditorView.theme({ '.cm-content': { minHeight: `${minLines * 1.55}em` } })),
          EditorView.contentAttributes.of({ 'aria-label': label, spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off' }),
          EditorView.updateListener.of(u => { if (u.docChanged) cb.current(u.state.doc.toString()); }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // external value changes (reset / load solution)
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => { view.current?.dispatch({ effects: setErr.of(errorLine ?? null) }); }, [errorLine, value]);

  return <div ref={host} />;
}
