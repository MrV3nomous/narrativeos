import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';

const DecisionNodeView = ({ node }) => {
    const hasEffects = node.attrs.effects && node.attrs.effects.length > 0;

    return (
        <NodeViewWrapper className="my-4 flex items-center gap-4 group">
            <div className="w-24 shrink-0 text-right relative flex justify-end items-center">
                <div className="h-[1px] w-8 bg-amber-500/50 mr-2" />
                <div className="w-2 h-2 rounded-full border border-amber-500 bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
            </div>

            <div className="flex-1 bg-zinc-900/50 border border-white/5 group-hover:border-amber-500/30 transition-colors p-3 pr-48 rounded-sm relative overflow-hidden">
                <NodeViewContent className="text-amber-400/90 text-[13px] tracking-wide font-bold outline-none" />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] tracking-widest text-zinc-500 font-normal flex items-center gap-2 max-w-[180px] bg-[#0a0a0a] px-2 py-1 border border-white/5">
                    {hasEffects && (
                        <span className="text-emerald-500 animate-pulse" title="Contains State Effects">⚡</span>
                    )}
                    {node.attrs.targetName ? (
                        <>
                            <span className="text-amber-500/50">➔</span>
                            <span className="text-amber-400 font-bold uppercase truncate">{node.attrs.targetName}</span>
                        </>
                    ) : (
                        <span className="text-zinc-600 animate-pulse">UNASSIGNED</span>
                    )}
                </div>
            </div>
        </NodeViewWrapper>
    );
};

export const DecisionExtension = Node.create({
    name: 'decision',
    group: 'block',
    content: 'inline*',
    defining: true,

    addAttributes() {
        return {
            targetId: { default: null },
            targetName: { default: null },
            effects: { default: [] }
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="decision"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'decision' }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(DecisionNodeView);
    },
});