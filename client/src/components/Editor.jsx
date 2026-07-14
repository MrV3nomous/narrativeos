import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import EditorCanvas from './EditorCanvas';
import StoryPanel from './StoryPanel';
import { compileDocumentToKernel } from '../lib/Compiler';
import { parseDocument } from '../lib/parser/index';

export default function Editor({ onCompile }) {
    const { user } = useAuth();
    const [saveStatus, setSaveStatus] = useState('SAVED');
    const saveTimerRef = useRef(null);

    const [projectName, setProjectName] = useState(() => {
        return localStorage.getItem('narrative_os_project_name') || 'UNTITLED_NARRATIVE';
    });

    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

    const [isParsing, setIsParsing] = useState(false);
    const [isAIAssisting, setIsAIAssisting] = useState(false);

    const [editorInstance, setEditorInstance] = useState(null);
    const [storyMap, setStoryMap] = useState([]);
    const [activeNode, setActiveNode] = useState(null);

    const handleNameChange = (e) => {
        const newName = e.target.value.toUpperCase();
        setProjectName(newName);
        localStorage.setItem('narrative_os_project_name', newName);
    };

    const handleDocumentUpdate = (documentModel) => {
        setSaveStatus('UNSAVED');

        if (documentModel?.content) {
            const extractedScenes = documentModel.content
                .filter(node => node.type === 'sceneBreak')
                .map(node => ({
                    id: node.attrs?.sceneId,
                    title: node.attrs?.title
                }));
            setStoryMap(extractedScenes);

            const compiledKernel = compileDocumentToKernel(documentModel);
            if (onCompile) onCompile(compiledKernel);
        }

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => setSaveStatus('SAVED'), 1000);
    };

    const scrollToScene = (sceneId) => {
        const element = document.querySelector(`[data-scene-id="${sceneId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            element.style.transition = 'background-color 0.5s';
            element.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
            setTimeout(() => {
                element.style.backgroundColor = 'transparent';
            }, 1000);
        }
    };

    const getRawTextSafely = () => {
        const activeEditorDOM = document.querySelector('.ProseMirror');

        if (activeEditorDOM) {
            const text = activeEditorDOM.innerText || activeEditorDOM.textContent;
            if (text && text.trim() !== '') {
                return text;
            }
        }

        if (editorInstance) {
            try {
                const html = editorInstance.getHTML();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                return tempDiv.innerText || tempDiv.textContent;
            } catch (err) {
                console.error("HTML Fallback failed:", err);
            }
        }

        return '';
    };

    const handleLocalParse = () => {
        if (!editorInstance || editorInstance.isDestroyed) {
            console.warn("Editor is synchronizing. Please try again.");
            return;
        }

        const rawText = getRawTextSafely();

        if (!rawText || rawText.trim() === '') {
            alert("No text detected. Try typing a space and hitting Parse again.");
            return;
        }

        setIsParsing(true);
        setSaveStatus('COMPILING...');

        try {
            const parserResult = parseDocument(rawText);
            editorInstance.commands.setContent(parserResult.document);
            setSaveStatus('SAVED');
        } catch (error) {
            console.error("Local Parsing failed:", error);
            setSaveStatus('ERROR');
        } finally {
            setIsParsing(false);
        }
    };

    const handleAIAssist = async () => {
        if (!editorInstance) return;

        const rawText = getRawTextSafely();
        if (!rawText || rawText.trim() === '') return;

        setIsAIAssisting(true);
        setSaveStatus('AI ANALYZING...');

        try {
            const { data, error } = await supabase.functions.invoke('parse-script', {
                body: { rawText }
            });

            if (error) throw error;

            if (data?.documentModel) {
                editorInstance.commands.setContent(data.documentModel);
            }
        } catch (err) {
            console.error("AI Assist Error:", err);
            alert("Failed to connect to AI Assistant. Check console.");
        } finally {
            setIsAIAssisting(false);
            setSaveStatus('SAVED');
        }
    };

    return (
        <div className="h-full w-full bg-[#050505] font-mono overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-3 border-b border-white/5 bg-[#0a0a0a] z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <div>
                        <p className="text-[9px] tracking-[0.4em] text-zinc-500 mb-0.5">PROJECT</p>
                        <input
                            type="text"
                            value={projectName}
                            onChange={handleNameChange}
                            placeholder="NAME_PROJECT..."
                            className="text-xs tracking-widest font-bold text-zinc-200 bg-transparent border-none outline-none focus:text-cyan-400 transition-colors w-48 placeholder:text-zinc-700"
                        />
                    </div>
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <p className={`text-[9px] tracking-widest ${isParsing || isAIAssisting ? 'text-cyan-400 animate-pulse' :
                        saveStatus === 'UNSAVED' ? 'text-amber-500 animate-pulse' : 'text-zinc-600'
                        }`}>
                        [{saveStatus}]
                    </p>
                </div>

                <div className="flex gap-4 items-center">
                    <p className="text-[10px] text-zinc-500 tracking-widest hidden sm:block">
                        {user?.email}
                    </p>

                    <button
                        onClick={handleAIAssist}
                        disabled={isAIAssisting || isParsing}
                        className={`px-3 py-1.5 border text-[10px] tracking-widest transition-colors ${isAIAssisting
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 cursor-not-allowed'
                            : 'bg-transparent border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                            }`}
                    >
                        {isAIAssisting ? 'ANALYZING...' : 'AI CLEANUP'}
                    </button>

                    <button
                        onClick={handleLocalParse}
                        disabled={isParsing || isAIAssisting}
                        className={`px-4 py-1.5 border text-[10px] tracking-widest transition-colors ${isParsing
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 cursor-not-allowed'
                            : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20'
                            }`}
                    >
                        {isParsing ? 'STRUCTURING...' : 'PARSE LAYOUT'}
                    </button>

                    <button className="px-4 py-1.5 bg-zinc-900 border border-white/10 text-[10px] text-zinc-400 tracking-widest hover:bg-white/5 transition-colors">
                        PUBLISH
                    </button>
                    <button onClick={() => supabase.auth.signOut()} className="text-[10px] text-zinc-600 tracking-widest hover:text-red-400 transition-colors ml-2">
                        EXIT
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="hidden lg:flex w-64 border-r border-white/5 bg-[#080808] p-4 flex-col gap-4 shrink-0">
                    <p className="text-[10px] tracking-[0.4em] text-zinc-500">STORY_MAP</p>
                    <div className="flex flex-col gap-2 overflow-y-auto">
                        {storyMap.length === 0 ? (
                            <p className="text-[10px] text-zinc-700 italic">Type "--- " to create a scene.</p>
                        ) : (
                            storyMap.map((scene, index) => (
                                <div
                                    key={scene.id}
                                    onClick={() => scrollToScene(scene.id)}
                                    className="text-[11px] text-zinc-400 border-l border-cyan-500/30 pl-3 py-1 hover:text-cyan-400 hover:border-cyan-400 transition-colors cursor-pointer truncate"
                                >
                                    <span className="text-zinc-600 mr-2">{String(index + 1).padStart(2, '0')}</span>
                                    {scene.title || 'UNTITLED'}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex-1 relative font-sans min-w-0">
                    <div className={(isParsing || isAIAssisting) ? "pointer-events-none opacity-50 transition-opacity" : "h-full"}>
                        <EditorCanvas
                            onEditorReady={setEditorInstance}
                            onUpdate={handleDocumentUpdate}
                            onSelectionChange={setActiveNode}
                        />
                    </div>
                </div>

                <div className="hidden xl:block h-full">
                    <StoryPanel activeNode={activeNode} storyMap={storyMap} editor={editorInstance} projectName={projectName} />
                </div>
            </div>
        </div>
    );
}