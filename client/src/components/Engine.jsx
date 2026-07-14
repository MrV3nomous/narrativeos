import { useState, useEffect, useRef } from 'react'

export default function Engine({ engineData }) {
    const [currentSceneId, setCurrentSceneId] = useState(null)
    const [sceneHistory, setSceneHistory] = useState([])
    const [variables, setVariables] = useState({ "global.plugin_gridhacker": "false", "local.stress": "0" })
    const [themeColor, setThemeColor] = useState('cyan')
    const [mobileTab, setMobileTab] = useState('terminal')

    const [time, setTime] = useState(new Date().toLocaleTimeString())
    const [cpuLoad, setCpuLoad] = useState(14)
    const [memUsage, setMemUsage] = useState(42)

    const chatContainerRef = useRef(null)

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString())
            setCpuLoad(Math.floor(Math.random() * 20) + 10)
            setMemUsage(Math.floor(Math.random() * 5) + 40)
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    // Auto-boot when data is received
    useEffect(() => {
        if (engineData && engineData.scenes) {
            const availableScenes = Object.keys(engineData.scenes);
            if (availableScenes.length > 0) setCurrentSceneId(availableScenes[0]);
        }
    }, [engineData])

    useEffect(() => {
        if (!engineData || !currentSceneId || !engineData.scenes[currentSceneId]) return;
        const activeScene = engineData.scenes[currentSceneId];

        const emits = activeScene.instructions.filter(inst => inst.type === 'emit');
        let newTheme = 'cyan';
        emits.forEach(e => {
            if (e.event === 'UI:THEME_ALERT') newTheme = 'amber';
            if (e.event === 'UI:THEME_DANGER') newTheme = 'red';
            if (e.event === 'UI:THEME_SAFE') newTheme = 'emerald';
        });
        setThemeColor(newTheme);
    }, [currentSceneId, engineData])

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [currentSceneId, mobileTab])

    if (!engineData) {
        return (
            <div className="h-full flex flex-col items-center justify-center font-mono gap-4">
                <p className="text-zinc-500 tracking-[0.5em] text-xs animate-pulse">NO KERNEL LOADED</p>
                <p className="text-zinc-600 text-[10px] tracking-widest">USE THE IDE MODULE TO COMPILE A SCRIPT</p>
            </div>
        )
    }

    if (!currentSceneId || !engineData.scenes[currentSceneId]) return null;

    const activeScene = engineData.scenes[currentSceneId]
    const dialogues = activeScene.instructions.filter(inst => inst.type === 'dialogue')
    const allChoices = activeScene.instructions.filter(inst => inst.type === 'choice')

    const handleChoice = (targetScene) => {
        setSceneHistory([...sceneHistory, currentSceneId])
        setCurrentSceneId(targetScene)
    }

    const getThemeVars = () => {
        if (themeColor === 'red') return { border: 'border-red-500/50', text: 'text-red-400', bg: 'bg-red-500', glow: 'shadow-[0_0_30px_rgba(220,38,38,0.2)]', hover: 'hover:bg-red-950/60 hover:border-red-400' };
        if (themeColor === 'amber') return { border: 'border-amber-500/50', text: 'text-amber-400', bg: 'bg-amber-500', glow: 'shadow-[0_0_30px_rgba(217,119,6,0.2)]', hover: 'hover:bg-amber-950/60 hover:border-amber-400' };
        if (themeColor === 'emerald') return { border: 'border-emerald-500/50', text: 'text-emerald-400', bg: 'bg-emerald-500', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]', hover: 'hover:bg-emerald-950/60 hover:border-emerald-400' };
        return { border: 'border-cyan-500/50', text: 'text-cyan-400', bg: 'bg-cyan-500', glow: 'shadow-[0_0_30px_rgba(6,182,212,0.2)]', hover: 'hover:bg-cyan-950/60 hover:border-cyan-400' };
    }
    const theme = getThemeVars();

    return (
        <div className="h-full w-full flex flex-col lg:flex-row p-2 lg:p-4 gap-2 lg:gap-4 box-border relative">
            {/* MOBILE TAB BAR */}
            <div className="flex lg:hidden w-full gap-2 z-20 shrink-0">
                {['terminal', 'scanner', 'vitals'].map((tab) => (
                    <button key={tab} onClick={() => setMobileTab(tab)} className={`flex-1 py-3 text-[10px] font-bold tracking-[0.2em] uppercase border ${mobileTab === tab ? `bg-${themeColor}-500/20 border-${themeColor}-500 text-${themeColor}-400` : 'bg-black/50 border-white/10 text-zinc-500'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* LEFT PANEL: VITALS */}
            <div className={`w-full lg:w-[340px] flex-1 lg:flex-none flex-col backdrop-blur-xl bg-black/80 border ${theme.border} ${theme.glow} shrink-0 ${mobileTab === 'vitals' ? 'flex' : 'hidden'} lg:flex`}>
                <div className={`p-4 lg:p-5 border-b ${theme.border} bg-gradient-to-r from-white/[0.03] to-transparent`}>
                    <p className={`text-[8px] lg:text-[9px] tracking-[0.5em] text-zinc-500 mb-1`}>CORE_SYSTEM</p>
                    <p className={`text-xs lg:text-sm tracking-widest font-bold ${theme.text}`}>NARRATIVE OS</p>
                </div>
                <div className="p-4 lg:p-6 flex-1 flex flex-col gap-6 lg:gap-8 text-xs text-zinc-400">
                    <div><p className="text-[9px] tracking-[0.4em] text-zinc-600 mb-2">SYS_TIME</p><p className={theme.text}>{time}</p></div>
                    <div><p className="text-[9px] tracking-[0.4em] text-zinc-600 mb-2">ACTIVE_NODE</p><p className="text-white bg-zinc-900/40 p-3 border border-white/10">{currentSceneId}</p></div>
                </div>
            </div>

            {/* RIGHT SIDE CONTAINER */}
            <div className={`flex-1 flex-col gap-2 lg:gap-4 h-full min-h-0 w-full ${mobileTab !== 'vitals' ? 'flex' : 'hidden'} lg:flex`}>

                {/* SCANNER */}
                <div className={`flex-1 lg:flex-none lg:h-[40%] backdrop-blur-xl bg-black/60 border ${theme.border} flex-col shadow-2xl min-h-0 ${mobileTab === 'scanner' ? 'flex' : 'hidden'} lg:flex`}>
                    <div className={`p-3 border-b border-white/5 text-[9px] tracking-[0.5em] text-zinc-500 px-4`}>VISUAL_UPLINK</div>
                    <div className="flex-1 flex items-center justify-center"><p className={`tracking-[0.8em] text-[10px] font-bold ${theme.text} animate-pulse`}>AWAITING_DATA</p></div>
                </div>

                {/* TERMINAL */}
                <div className={`flex-1 lg:flex-none lg:h-[60%] backdrop-blur-xl bg-black/85 border ${theme.border} flex-col shadow-2xl min-h-0 ${mobileTab === 'terminal' ? 'flex' : 'hidden'} lg:flex`}>
                    <div className={`px-4 py-3 border-b border-white/5 flex justify-between`}>
                        <p className="text-[10px] tracking-[0.5em] text-zinc-400 font-bold">SYS_TERMINAL</p>
                    </div>

                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
                        {dialogues.map((log, index) => (
                            <div key={index} className="flex gap-4 lg:gap-5 items-start">
                                <div className="w-20 lg:w-24 shrink-0 text-right"><span className={`text-[10px] lg:text-[11px] font-bold ${theme.text}`}>{log.speaker}</span></div>
                                <div className="text-zinc-300 text-[12px] lg:text-[13px] border-l border-white/10 pl-4 lg:pl-5">{log.text}</div>
                            </div>
                        ))}
                    </div>

                    <div className={`p-3 lg:p-5 bg-[#050505] border-t border-white/10`}>
                        <div className="flex gap-2 lg:gap-3 flex-wrap w-full">
                            {allChoices.map((choice, index) => (
                                <button key={index} onClick={() => handleChoice(choice.target)} className={`px-4 py-2 lg:px-6 lg:py-3 bg-zinc-900/50 border border-white/20 text-zinc-400 ${theme.hover} w-full sm:w-auto`}>
                                    <span className="text-[10px] lg:text-[11px] font-bold tracking-[0.15em]">{choice.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}