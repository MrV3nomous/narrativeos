import { useState } from 'react'
import Editor from './components/Editor'
import Engine from './components/Engine'

function App() {
  const [activeModule, setActiveModule] = useState('editor')

  const [kernelData, setKernelData] = useState(null)

  return (
    <div className="h-screen w-screen bg-[#010204] font-mono overflow-hidden relative selection:bg-cyan-900 selection:text-white flex">

      <div className="absolute inset-0 z-0 bg-tactical-grid opacity-60 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-noise pointer-events-none" />
      <div className="absolute inset-0 z-0 vignette pointer-events-none" />

      <div className="relative z-20 w-16 lg:w-20 h-full bg-black/90 border-r border-white/10 flex flex-col items-center py-6 gap-8 backdrop-blur-xl shrink-0">
        <div className="w-8 h-8 border-2 border-cyan-500 rounded-sm flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <span className="text-cyan-500 font-bold text-xs">OS</span>
        </div>

        <button
          onClick={() => setActiveModule('editor')}
          className={`w-12 h-12 flex flex-col items-center justify-center gap-1 border transition-all duration-300 ${activeModule === 'editor' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
        >
          <span className="text-[10px] font-bold tracking-widest">IDE</span>
        </button>

        <button
          onClick={() => setActiveModule('engine')}
          className={`w-12 h-12 flex flex-col items-center justify-center gap-1 border transition-all duration-300 ${activeModule === 'engine' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
        >
          <span className="text-[10px] font-bold tracking-widest">RUN</span>
        </button>

        <div className="mt-auto flex flex-col items-center gap-4">
          <div className={`w-2 h-2 rounded-full ${kernelData ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse'}`} />
          <p className="text-[8px] text-zinc-600 tracking-[0.2em] -rotate-90 mb-8 whitespace-nowrap">STATUS: {kernelData ? 'LOADED' : 'EMPTY'}</p>
        </div>
      </div>

      <div className="relative z-10 flex-1 h-full min-w-0">
        {activeModule === 'editor' && (
          <Editor
            onCompile={(data) => {
              setKernelData(data);
            }}
          />
        )}
        {activeModule === 'engine' && (
          <Engine engineData={kernelData} />
        )}
      </div>
    </div>
  )
}

export default App