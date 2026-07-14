// src/components/EditorCanvas.jsx
import { useState, useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { DialogueExtension } from '../editor/Dialogue'
import { DecisionExtension } from '../editor/Decision'
import { SceneBreakExtension } from '../editor/SceneBreak'

const LOCAL_STORAGE_KEY = 'narrative_os_autosave';

export default function EditorCanvas({ onUpdate, onEditorReady, onSelectionChange }) {
    const [menuPos, setMenuPos] = useState(null);
    const lastNodeSignature = useRef('');
    const autoSaveTimerRef = useRef(null);

    const getInitialContent = () => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            return saved ? JSON.parse(saved) : '';
        } catch (e) {
            return '';
        }
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                horizontalRule: false,
            }),
            Placeholder.configure({
                placeholder: 'Start writing your story, or paste an existing manuscript...',
                emptyEditorClass: 'is-editor-empty',
            }),
            DialogueExtension,
            DecisionExtension,
            SceneBreakExtension,
        ],
        content: getInitialContent(),
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-2xl mx-auto focus:outline-none min-h-[60vh] text-zinc-300 leading-relaxed tracking-wide pb-32',
            },
        },
        onUpdate: ({ editor }) => {
            const documentModel = editor.getJSON();

            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = setTimeout(() => {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(documentModel));
            }, 2000);

            if (onUpdate) onUpdate(documentModel);
        },
        onSelectionUpdate: ({ editor }) => {
            const { selection } = editor.state;
            const { $anchor } = selection;

            let activeNode = $anchor.parent;
            for (let i = $anchor.depth; i > 0; i--) {
                const node = $anchor.node(i);
                if (['decision', 'sceneBreak', 'dialogue'].includes(node?.type?.name)) {
                    activeNode = node;
                    break;
                }
            }

            if (activeNode?.type?.name) {
                const currentSignature = `${activeNode.type.name}-${JSON.stringify(activeNode.attrs)}`;
                if (currentSignature !== lastNodeSignature.current) {
                    lastNodeSignature.current = currentSignature;
                    if (onSelectionChange) {
                        onSelectionChange({ type: activeNode.type.name, attrs: activeNode.attrs });
                    }
                }
            } else {
                if (lastNodeSignature.current !== 'empty') {
                    lastNodeSignature.current = 'empty';
                    if (onSelectionChange) onSelectionChange(null);
                }
            }

            const isTextHighlighted = !selection.empty && selection.from !== selection.to;

            if (!isTextHighlighted) {
                setMenuPos(null);
                return;
            }

            let overlapsForbidden = false;
            editor.state.doc.nodesBetween(selection.from, selection.to, (node) => {
                if (node?.type?.name === 'sceneBreak' || node?.type?.name === 'decision') {
                    overlapsForbidden = true;
                    return false;
                }
            });

            if (overlapsForbidden) {
                setMenuPos(null);
                return;
            }

            try {
                const start = editor.view.coordsAtPos(selection.from);
                const end = editor.view.coordsAtPos(selection.to);

                setMenuPos({
                    top: start.top,
                    left: (start.left + end.left) / 2,
                });
            } catch (err) {
                setMenuPos(null);
            }
        }
    });

    useEffect(() => {
        if (editor && !editor.isDestroyed) {
            if (onEditorReady) onEditorReady(editor);
            if (onUpdate) onUpdate(editor.getJSON());
        }
        return () => {
            if (onEditorReady) onEditorReady(null);
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [editor, onEditorReady]);

    if (!editor) return null;

    // Set decision and conditionally inject a base effect
    const setDecision = (withEffect = false) => {
        if (withEffect) {
            editor.chain().focus().setNode('decision', { effects: [{ key: 'NEW_VAR', value: 'TRUE' }] }).run();
        } else {
            editor.chain().focus().setNode('decision').run();
        }
        setMenuPos(null);
    };

    return (
        <div className="w-full h-full overflow-y-auto px-4 py-12 lg:px-12 bg-[#0a0a0a] custom-scrollbar relative">
            {menuPos && (
                <div
                    className="fixed z-50 flex bg-[#050505] border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] rounded-sm overflow-hidden backdrop-blur-xl -translate-x-1/2 -translate-y-full pointer-events-auto"
                    style={{
                        top: `${menuPos.top - 12}px`,
                        left: `${menuPos.left}px`
                    }}
                >
                    <button
                        onMouseDown={(e) => { e.preventDefault(); setDecision(false); }}
                        className="px-4 py-2 text-[10px] tracking-widest font-bold text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 transition-colors border-r border-white/5"
                    >
                        + BRANCH
                    </button>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); setDecision(true); }}
                        className="px-4 py-2 text-[10px] tracking-widest font-bold text-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                    >
                        + EFFECT
                    </button>
                </div>
            )}

            <EditorContent editor={editor} />
        </div>
    );
}