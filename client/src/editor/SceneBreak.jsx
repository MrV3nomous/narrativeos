import { Node, mergeAttributes, InputRule } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';

const SceneBreakView = ({ node, updateAttributes }) => {
    return (
        <NodeViewWrapper className="my-12 relative group" contentEditable={false} data-scene-id={node.attrs.sceneId}>
            <div className="flex items-center gap-4">
                <div className="h-px bg-cyan-900/50 flex-1 group-hover:bg-cyan-700/50 transition-colors" />

                <div className="px-4 py-1 border border-cyan-900/50 bg-[#050505] flex items-center gap-3">
                    <span className="text-[9px] font-bold tracking-[0.3em] text-cyan-600">SCENE_ANCHOR</span>
                    <input
                        type="text"
                        value={node.attrs.title}
                        onChange={(e) => updateAttributes({ title: e.target.value.toUpperCase() })}
                        className="bg-transparent border-none outline-none text-cyan-400 text-xs tracking-widest font-bold w-32 focus:w-48 transition-all placeholder:text-cyan-900/50"
                        placeholder="ENTER_NAME..."
                    />
                </div>

                <div className="h-px bg-cyan-900/50 flex-1 group-hover:bg-cyan-700/50 transition-colors" />
            </div>
        </NodeViewWrapper>
    );
};

export const SceneBreakExtension = Node.create({
    name: 'sceneBreak',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            sceneId: {
                default: null,
                parseHTML: element => element.getAttribute('data-scene-id'),
                renderHTML: attributes => {
                    if (!attributes.sceneId) return {};
                    return { 'data-scene-id': attributes.sceneId };
                }
            },
            title: { default: '' }
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="scene-break"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'scene-break' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(SceneBreakView);
    },

    addInputRules() {
        return [
            new InputRule({
                find: /^(---)\s$/,
                handler: ({ state, range }) => {
                    const { tr } = state;
                    const newId = window.crypto && window.crypto.randomUUID
                        ? window.crypto.randomUUID()
                        : Math.random().toString(36).slice(2);

                    tr.replaceWith(range.from, range.to, this.type.create({
                        sceneId: newId,
                        title: 'UNTITLED_SCENE'
                    }));
                    return tr;
                },
            }),
        ];
    },
});