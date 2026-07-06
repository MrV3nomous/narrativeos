import { useState, useEffect, useRef } from 'react'
import irData from './ir.json'

function App() {
  const [isBooting, setIsBooting] = useState(true)
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
    const bootTimer = setTimeout(() => setIsBooting(false), 2000)
    return () => clearTimeout(bootTimer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString())
      setCpuLoad(Math.floor(Math.random() * 20) + 10)
      setMemUsage(Math.floor(Math.random() * 5) + 40)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const availableScenes = Object.keys(irData.scenes);
    if (availableScenes.length > 0) setCurrentSceneId(availableScenes[0]);
  }, [])

  useEffect(() => {
    if (!currentSceneId || !irData.scenes[currentSceneId]) return;
    const activeScene = irData.scenes[currentSceneId];

    const emits = activeScene.instructions.filter(inst => inst.type === 'emit');
    let newTheme = 'cyan';
    emits.forEach(e => {
      if (e.event === 'UI:THEME_ALERT') newTheme = 'amber';
      if (e.event === 'UI:THEME_DANGER') newTheme = 'red';
      if (e.event === 'UI:THEME_SAFE') newTheme = 'emerald';
    });
    setThemeColor(newTheme);

    const sets = activeScene.instructions.filter(inst => inst.type === 'set');
    if (sets.length > 0) {
      setVariables(prev => {
        const newVars = { ...prev };
        sets.forEach(s => {
          const [key, val] = s.expression.split('=').map(str => str.trim());
          if (key && val) newVars[key] = val;
        });
        return newVars;
      });
    }
  }, [currentSceneId])

  useEffect(() => {
    if (chatContainerRef.current && (mobileTab === 'terminal' || window.innerWidth >= 1024)) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [currentSceneId, mobileTab])

  if (isBooting) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center font-mono text-cyan-500 gap-4 select-none">
        <div className="w-12 h-12 lg:w-16 lg:h-16 border-t-2 border-r-2 border-cyan-500 rounded-full animate-spin" />
        <p className="tracking-[0.5em] text-[10px] lg:text-xs animate-pulse text-center px-4">DECRYPTING NARRATIVE KERNEL...</p>
      </div>
    )
  }

  if (!currentSceneId || !irData.scenes[currentSceneId]) return null;

  const activeScene = irData.scenes[currentSceneId]
  const dialogues = activeScene.instructions.filter(inst => inst.type === 'dialogue')
  const allChoices = activeScene.instructions.filter(inst => inst.type === 'choice')

  const evaluateCondition = (cond) => {
    if (!cond) return true;
    const engineValue = String(variables[cond.variable]);
    const targetValue = String(cond.value);
    if (cond.operator === '==') return engineValue === targetValue;
    if (cond.operator === '!=') return engineValue !== targetValue;
    return false;
  }
  const visibleChoices = allChoices.filter(choice => evaluateCondition(choice.condition));

  const handleChoice = (targetScene) => {
    setSceneHistory([...sceneHistory, currentSceneId])
    setCurrentSceneId(targetScene)
  }

  const getThemeVars = () => {
    if (themeColor === 'red') return { border: 'border-red-500/50', text: 'text-red-400', bg: 'bg-red-500', glow: 'shadow-[0_0_30px_rgba(220,38,38,0.2)]', hover: 'hover:bg-red-950/60 hover:border-red-400 hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]', activeTab: 'bg-red-500/20 border-red-500 text-red-400' };
    if (themeColor === 'amber') return { border: 'border-amber-500/50', text: 'text-amber-400', bg: 'bg-amber-500', glow: 'shadow-[0_0_30px_rgba(217,119,6,0.2)]', hover: 'hover:bg-amber-950/60 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(217,119,6,0.5)]', activeTab: 'bg-amber-500/20 border-amber-500 text-amber-400' };
    if (themeColor === 'emerald') return { border: 'border-emerald-500/50', text: 'text-emerald-400', bg: 'bg-emerald-500', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]', hover: 'hover:bg-emerald-950/60 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]', activeTab: 'bg-emerald-500/20 border-emerald-500 text-emerald-400' };
    return { border: 'border-cyan-500/50', text: 'text-cyan-400', bg: 'bg-cyan-500', glow: 'shadow-[0_0_30px_rgba(6,182,212,0.2)]', hover: 'hover:bg-cyan-950/60 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]', activeTab: 'bg-cyan-500/20 border-cyan-500 text-cyan-400' };
  }
  const theme = getThemeVars();

  return (
    <div className="h-screen w-screen bg-black font-mono overflow-hidden relative selection:bg-cyan-900 selection:text-white flex flex-col lg:flex-row p-2 lg:p-4 gap-2 lg:gap-4 box-border">

      <div className="absolute inset-0 z-0 bg-tactical-grid opacity-60 pointer-events-none" />
      <div className="absolute inset-0 z-50 bg-noise pointer-events-none" />
      <div className="absolute inset-0 z-50 vignette pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] lg:w-[1000px] lg:h-[1000px] bg-cyan-950/15 rounded-full blur-[100px] lg:blur-[150px] pointer-events-none" />
      <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
        <div className={`h-[1px] w-full ${theme.bg} animate-scanline shadow-[0_0_20px_currentColor] opacity-70`} />
      </div>

      <div className="flex lg:hidden w-full gap-2 z-20 shrink-0">
        {['terminal', 'scanner', 'vitals'].map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 border ${mobileTab === tab ? theme.activeTab : 'bg-black/50 border-white/10 text-zinc-500 hover:bg-white/5'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={`relative z-10 w-full lg:w-[340px] flex-1 lg:flex-none flex-col backdrop-blur-xl bg-black/80 border ${theme.border} ${theme.glow} shrink-0 ${mobileTab === 'vitals' ? 'flex' : 'hidden'} lg:flex`}>
        <div className={`p-4 lg:p-5 border-b ${theme.border} bg-gradient-to-r from-white/[0.03] to-transparent flex justify-between items-center relative shrink-0`}>
          <div className={`absolute top-0 left-0 w-1 h-full ${theme.bg}`} />
          <div>
            <p className={`text-[8px] lg:text-[9px] tracking-[0.5em] text-zinc-500 mb-1`}>CORE_SYSTEM</p>
            <p className={`text-xs lg:text-sm tracking-widest font-bold ${theme.text} drop-shadow-[0_0_8px_currentColor]`}>NARRATIVE OS</p>
          </div>
          <div className="flex gap-[2px] lg:gap-[3px] h-3 lg:h-4 items-end opacity-80">
            <div className={`w-[2px] lg:w-[3px] ${theme.bg} eq-bar`} />
            <div className={`w-[2px] lg:w-[3px] ${theme.bg} eq-bar`} />
            <div className={`w-[2px] lg:w-[3px] ${theme.bg} eq-bar`} />
            <div className={`w-[2px] lg:w-[3px] ${theme.bg} eq-bar`} />
          </div>
        </div>

        <div className="px-4 py-3 lg:px-5 flex gap-4 border-b border-white/5 bg-zinc-950/50 shrink-0">
          <div className="flex-1">
            <p className="text-[7px] lg:text-[8px] text-zinc-600 tracking-widest mb-1">CPU_LOAD</p>
            <p className={`text-[10px] lg:text-xs ${theme.text}`}>{cpuLoad}%</p>
          </div>
          <div className="flex-1 border-l border-white/5 pl-4">
            <p className="text-[7px] lg:text-[8px] text-zinc-600 tracking-widest mb-1">MEM_USAGE</p>
            <p className={`text-[10px] lg:text-xs ${theme.text}`}>{memUsage}%</p>
          </div>
        </div>

        <div className="p-4 lg:p-6 flex-1 flex flex-col gap-6 lg:gap-8 text-[10px] lg:text-xs text-zinc-400 min-h-0 overflow-y-auto">
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-[9px] lg:text-[10px] tracking-[0.4em] text-zinc-600">SYS_TIME</p>
              <p className={`text-[9px] lg:text-[10px] tracking-widest ${theme.text}`}>{time}</p>
            </div>
          </div>

          <div>
            <p className="text-[9px] lg:text-[10px] tracking-[0.4em] mb-1 lg:mb-2 text-zinc-600">ACTIVE_NODE</p>
            <div className="relative p-3 bg-zinc-900/40 border border-white/10 uppercase overflow-hidden group">
              <div className="absolute inset-0 bg-white/5 w-0 group-hover:w-full transition-all duration-500" />
              <p className="relative z-10 text-white tracking-widest truncate">{currentSceneId}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-1 lg:mb-2">
              <p className="text-[9px] lg:text-[10px] tracking-[0.4em] text-zinc-600">STRESS</p>
              <p className={`text-[10px] lg:text-[12px] font-bold ${theme.text}`}>{variables["local.stress"]}%</p>
            </div>
            <div className="w-full h-1.5 bg-zinc-950 border border-white/10 overflow-hidden relative">
              <div className={`h-full ${theme.bg} transition-all duration-1000 ease-in-out shadow-[0_0_10px_currentColor]`} style={{ width: `${variables["local.stress"]}%` }} />
            </div>
          </div>

          <div className="mt-auto border-t border-white/5 pt-4 lg:pt-5 shrink-0">
            <p className="text-[10px] tracking-[0.5em] mb-3 text-zinc-600">ACTIVE_COMMS</p>
            <div className={`flex items-center justify-between px-4 py-3 bg-zinc-950/80 border-l-2 ${theme.border}`}>
              <span className="tracking-widest text-[11px] text-white">OP_LUCIO</span>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" />
                <span className="text-[9px] text-emerald-500 font-bold tracking-widest uppercase">Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`relative z-10 flex-1 flex-col gap-2 lg:gap-4 h-full min-h-0 w-full ${mobileTab !== 'vitals' ? 'flex' : 'hidden'} lg:flex`}>

        <div className={`flex-1 lg:flex-none lg:h-[40%] backdrop-blur-xl bg-black/60 border ${theme.border} relative overflow-hidden flex-col shadow-2xl min-h-0 ${mobileTab === 'scanner' ? 'flex' : 'hidden'} lg:flex`}>
          <div className={`absolute top-0 left-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-l-2 ${theme.border} opacity-50`} />
          <div className={`absolute top-0 right-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-r-2 ${theme.border} opacity-50`} />
          <div className={`absolute bottom-0 left-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-l-2 ${theme.border} opacity-50`} />
          <div className={`absolute bottom-0 right-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-r-2 ${theme.border} opacity-50`} />

          <div className={`p-3 border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent shrink-0 flex justify-between px-4 lg:px-6`}>
            <p className="text-[8px] lg:text-[9px] tracking-[0.5em] text-zinc-500">VISUAL_UPLINK</p>
            <p className="text-[8px] lg:text-[9px] tracking-[0.5em] text-zinc-600">3D_CANVAS</p>
          </div>

          <div className="flex-1 flex items-center justify-center relative min-h-0">
            <div className={`absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none`}>
              <div className={`w-full h-[1px] ${theme.bg}`} />
              <div className={`h-full w-[1px] ${theme.bg} absolute`} />
            </div>

            <div className="flex flex-col items-center gap-4 lg:gap-6 opacity-60">
              <div className={`w-24 h-24 lg:w-40 lg:h-40 rounded-full border-[2px] border-dashed ${theme.border} flex items-center justify-center animate-spin-slow relative`}>
                <div className={`absolute top-0 w-1.5 h-1.5 lg:w-2 lg:h-2 ${theme.bg} rounded-full blur-[2px]`} />
                <div className={`w-16 h-16 lg:w-28 lg:h-28 rounded-full border border-dotted ${theme.border} flex items-center justify-center`} style={{ animationDirection: 'reverse' }}>
                  <div className={`w-10 h-10 lg:w-16 lg:h-16 rounded-full border ${theme.border} shadow-[0_0_10px_currentColor_inset] lg:shadow-[0_0_20px_currentColor_inset]`} />
                </div>
              </div>
              <p className={`tracking-[0.6em] lg:tracking-[0.8em] text-[9px] lg:text-[10px] font-bold ${theme.text} animate-pulse drop-shadow-[0_0_5px_currentColor]`}>AWAITING_DATA</p>
            </div>
          </div>
        </div>

        <div className={`flex-1 lg:flex-none lg:h-[60%] min-h-[300px] backdrop-blur-xl bg-black/85 border ${theme.border} flex-col relative shadow-2xl shrink-0 ${mobileTab === 'terminal' ? 'flex' : 'hidden'} lg:flex`}>
          <div className={`px-4 py-3 lg:px-5 border-b border-white/5 bg-zinc-950/60 flex justify-between items-center shrink-0`}>
            <div className="flex items-center gap-2 lg:gap-3">
              <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-sm ${theme.bg} animate-pulse`} />
              <p className="text-[9px] lg:text-[10px] tracking-[0.5em] text-zinc-400 font-bold">SYS_TERMINAL</p>
            </div>
            <p className={`text-[8px] lg:text-[9px] tracking-widest ${theme.text}`}>AWAITING_INPUT</p>
          </div>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6 min-h-0">
            {dialogues.map((log, index) => (
              <div key={index} className="flex gap-4 items-start group animate-feed">
                <div className="w-24 shrink-0 text-right mt-0 relative">
                  <span className={`tracking-widest text-[11px] font-bold ${theme.text} uppercase opacity-70 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_4px_currentColor]`}>
                    {log.speaker}
                  </span>
                  <div className={`absolute top-[0.45rem] -right-3 w-2 h-[1px] ${theme.bg} opacity-30`} />
                </div>

                <div className="text-zinc-300 text-[13px] leading-[1.8] tracking-wide border-l border-white/10 pl-4 pt-0">
                  {log.text}
                </div>
              </div>
            ))}
          </div>

          <div className={`p-3 lg:p-5 bg-[#050505] border-t border-white/10 shrink-0`}>
            <div className="flex gap-2 lg:gap-4">
              <span className={`text-lg lg:text-xl font-bold ${theme.text} animate-blink mt-1`}>{'>'}</span>
              <div className="flex gap-2 lg:gap-3 flex-wrap w-full">
                {visibleChoices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => handleChoice(choice.target)}
                    className={`btn-glitch relative px-4 py-2 lg:px-6 lg:py-3 bg-zinc-900/50 border border-white/20 text-zinc-400 transition-all duration-300 overflow-hidden flex items-center gap-2 lg:gap-4 ${theme.hover} w-full sm:w-auto`}
                  >
                    <span className={`text-[9px] lg:text-[10px] opacity-30 tracking-widest font-bold group-hover:${theme.text}`}>[{index + 1}]</span>
                    <span className="text-[10px] lg:text-[11px] font-bold tracking-[0.15em] lg:tracking-[0.2em] uppercase text-left">
                      {choice.isPrompt ? '[AI_OVERRIDE] ' : ''}{choice.text}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-700 pointer-events-none" />
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default App