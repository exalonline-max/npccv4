// Development-only runtime error watcher to surface non-function call sites
// and helpful context. Imported from main.jsx only in dev mode.
export function installErrorWatch(){
  if (typeof window === 'undefined') return
  try{
    window.addEventListener('error', (ev) => {
      try{
        // Log the original error and the event
        console.error('[errorWatch] window error event:', ev.error || ev)
        // If the error message suggests calling a boolean, try to print nearby globals
        if (ev.error && /true is not a function|is not a function/.test(String(ev.error.message||ev.error))){
          console.warn('[errorWatch] Attempting to snapshot top-level globals for debugging:')
          try { console.warn(Object.keys(window).slice(0,200)) } catch(e) { /* ignore */ }
        }
      }catch(e){ /* noop */ }
    })

    window.addEventListener('unhandledrejection', (ev) => {
      try{
        console.error('[errorWatch] unhandledrejection:', ev.reason)
      }catch(e){ }
    })
  }catch(e){ /* ignore in older browsers */ }
}

export default installErrorWatch
