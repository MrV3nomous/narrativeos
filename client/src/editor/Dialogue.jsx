import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { InputRule } from '@tiptap/core';

const DialogueNodeView = ({ node }) => {
    return (
        <NodeViewWrapper className="flex gap-4 items-start group relative my-4 py-1">
            <div className="w-24 shrink-0 text-right relative select-none pt-0.5">
                <span className="tracking-widest text-[11px] font-bold text-cyan-400 uppercase opacity-70 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]">
                    {node.attrs.speaker}
                </span>
                <div className="absolute top-[0.60rem] -right-3 w-2 h-[1px] bg-cyan-500 opacity-30" />
            </div>

            <NodeViewContent
                className="text-zinc-300 text-[13px] leading-[1.8] tracking-wide border-l border-white/10 pl-4 flex-1 outline-none [&>p]:m-0 [&>p+p]:mt-3"
            />
        </NodeViewWrapper>
    );
};

export const DialogueExtension = Node.create({
    name: 'dialogue',
    group: 'block',
    content: 'block+',
    defining: true,

    addAttributes() {
        return { speaker: { default: 'UNKNOWN' } };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="dialogue"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'dialogue' }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(DialogueNodeView);
    },

    addKeyboardShortcuts() {
        return {
            Enter: ({ editor }) => {
                const { state } = editor;
                const { selection } = state;
                const { $from, empty } = selection;

                if (!empty) return false;

                if ($from.parent.type.name === 'paragraph' && $from.parent.textContent === '') {
                    const depth = $from.depth;
                    const parentNode = depth > 1 ? $from.node(depth - 1) : null;

                    if (parentNode && parentNode.type.name === this.name) {
                        const dialoguePos = $from.before(depth - 1);
                        const dialogueEnd = dialoguePos + parentNode.nodeSize;

                        editor.commands.command(({ tr, dispatch }) => {
                            if (dispatch) {
                                tr.delete($from.before(depth), $from.after(depth));
                                const mappedEnd = tr.mapping.map(dialogueEnd);
                                tr.insert(mappedEnd, state.schema.nodes.paragraph.create());
                                tr.setSelection(state.selection.constructor.near(tr.doc.resolve(mappedEnd + 1)));
                            }
                            return true;
                        });
                        return true;
                    }
                }
                return false;
            }
        };
    },

    addInputRules() {
        return [
            new InputRule({
                find: /^([a-zA-Z0-9 \-_']+):\s$/,
                handler: ({ state, range, match }) => {
                    const { tr } = state;
                    const $start = state.doc.resolve(range.from);

                    for (let i = $start.depth; i > 0; i--) {
                        if ($start.node(i).type.name === this.name) return null;
                    }

                    const speaker = match[1].trim().toUpperCase();

                    tr.delete(range.from, range.to);

                    const $newPos = tr.doc.resolve(range.from);
                    const blockRange = $newPos.blockRange();

                    if (blockRange) {
                        tr.wrap(blockRange, [{ type: this.type, attrs: { speaker } }]);
                    }

                    return tr;
                },
            }),
        ];
    },
});