// src/components/StoryPanel.jsx
import React from 'react';

export default function StoryPanel({ activeNode, storyMap, editor, projectName }) {
    if (!activeNode) {
        return (
            <div className="w-80 h-full bg-[#080808] border-l border-white/5 p-6 flex flex-col shrink-0 custom-scrollbar overflow-y-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-2 h-2 rounded-full bg-zinc-500" />
                    <p className="text-[10px] tracking-[0.3em] text-zinc-400 font-bold">DOC_PROPERTIES</p>
                </div>
                <div className="space-y-6">
                    <div>
                        <label className="block text-[9px] tracking-widest text-zinc-500 mb-2">ACTIVE_PROJECT</label>
                        <p className="text-xs text-zinc-300 font-bold">{projectName || 'UNTITLED'}</p>
                    </div>
                    <div>
                        <label className="block text-[9px] tracking-widest text-zinc-500 mb-2">SCENE_COUNT</label>
                        <p className="text-2xl text-cyan-500 font-light">{storyMap.length}</p>
                    </div>
                </div>
            </div>
        );
    }

    const updateNode = (attrs) => {
        if (editor) {
            // CRITICAL FIX: Do NOT use .focus() here. It steals focus from the input fields!
            editor.commands.updateAttributes(activeNode.type.name, attrs);
        }
    };

    const currentEffects = activeNode.attrs?.effects || [];

    const addEffect = () => {
        updateNode({ effects: [...currentEffects, { key: 'NEW_VAR', value: 'TRUE' }] });
    };

    const updateEffect = (index, field, newValue) => {
        // Deep clone to ensure React state registers the change
        const updated = currentEffects.map((effect, i) =>
            i === index ? { ...effect, [field]: newValue.toUpperCase().replace(/\s+/g, '_') } : effect
        );
        updateNode({ effects: updated });
    };

    const removeEffect = (index) => {
        const updated = currentEffects.filter((_, i) => i !== index);
        updateNode({ effects: updated });
    };

    return (
        <div className="w-80 h-full bg-[#080808] border-l border-white/5 p-6 flex flex-col shrink-0 custom-scrollbar overflow-y-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className={`w-2 h-2 rounded-full ${activeNode.type === 'sceneBreak' ? 'bg-cyan-500' :
                        activeNode.type === 'decision' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                <p className="text-[10px] tracking-[0.3em] text-zinc-400 font-bold">
                    {activeNode.type.toUpperCase()}_PROPERTIES
                </p>
            </div>

            {(activeNode.type === 'paragraph' || activeNode.type === 'dialogue') && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-[9px] tracking-widest text-zinc-500 mb-4">TEXT_FORMATTING</label>
                        <div className="flex bg-[#050505] border border-white/10 rounded-sm overflow-hidden p-1 gap-1">
                            <button onClick={() => editor.chain().focus().undo().run()} className="flex-1 p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors rounded-sm text-xs" title="Undo">↶</button>
                            <button onClick={() => editor.chain().focus().redo().run()} className="flex-1 p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors rounded-sm text-xs" title="Redo">↷</button>
                            <div className="w-px bg-white/10 my-1 mx-1" />
                            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`flex-1 p-2 transition-colors rounded-sm text-xs font-bold ${editor.isActive('bold') ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`} title="Bold">B</button>
                            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`flex-1 p-2 transition-colors rounded-sm text-xs italic ${editor.isActive('italic') ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`} title="Italic">I</button>
                        </div>
                    </div>
                </div>
            )}

            {activeNode.type === 'sceneBreak' && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-[9px] tracking-widest text-zinc-500 mb-2">SCENE_TITLE</label>
                        <input
                            type="text"
                            value={activeNode.attrs.title || ''}
                            onChange={(e) => updateNode({ title: e.target.value.toUpperCase() })}
                            className="w-full bg-[#050505] border border-white/10 p-2 text-xs text-cyan-400 font-bold outline-none focus:border-cyan-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-[9px] tracking-widest text-zinc-500 mb-2">KERNEL_ID</label>
                        <code className="block w-full bg-[#050505] border border-white/5 p-2 text-[10px] text-zinc-600 truncate">
                            {activeNode.attrs.sceneId}
                        </code>
                    </div>
                </div>
            )}

            {activeNode.type === 'decision' && (
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-amber-500">⑂</span>
                            <label className="block text-[10px] tracking-widest text-zinc-400 font-bold">NODE_ROUTING</label>
                        </div>
                        <div className="space-y-2">
                            {storyMap.map(scene => (
                                <button
                                    key={scene.id}
                                    onClick={() => updateNode({ targetId: scene.id, targetName: scene.title })}
                                    className={`w-full text-left px-3 py-2 text-[10px] tracking-widest transition-colors border ${activeNode.attrs.targetId === scene.id
                                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                            : 'bg-[#050505] border-white/5 text-zinc-500 hover:border-amber-500/30 hover:text-zinc-300'
                                        }`}
                                >
                                    ➔ {scene.title || 'UNTITLED'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-emerald-500">⚡</span>
                            <label className="block text-[10px] tracking-widest text-zinc-400 font-bold">STATE_EFFECTS</label>
                        </div>

                        <div className="space-y-2 mb-4">
                            {currentEffects.map((effect, index) => (
                                <div key={index} className="flex gap-2 items-center bg-[#050505] border border-white/5 p-2 focus-within:border-emerald-500/50 transition-colors">
                                    <input
                                        type="text"
                                        value={effect.key}
                                        onChange={(e) => updateEffect(index, 'key', e.target.value)}
                                        className="w-1/2 bg-transparent text-[10px] text-emerald-400 outline-none placeholder:text-zinc-700 font-bold uppercase"
                                        placeholder="VARIABLE"
                                    />
                                    <span className="text-zinc-600">=</span>
                                    <input
                                        type="text"
                                        value={effect.value}
                                        onChange={(e) => updateEffect(index, 'value', e.target.value)}
                                        className="w-1/3 bg-transparent text-[10px] text-emerald-400 outline-none placeholder:text-zinc-700 font-bold uppercase"
                                        placeholder="VALUE"
                                    />
                                    <button onClick={() => removeEffect(index)} className="text-zinc-600 hover:text-red-400 ml-auto transition-colors">×</button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addEffect}
                            className="w-full py-2 border border-dashed border-white/10 text-[9px] tracking-widest text-zinc-500 hover:border-emerald-500/50 hover:text-emerald-500 transition-colors"
                        >
                            + INJECT_VARIABLE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}