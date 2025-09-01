// Lightweight production error watcher to capture richer context for runtime
// exceptions like "true is not a function". Intentionally minimal and only
// logs to console to avoid external telemetry.
export function installProdErrorWatch(){
  if (typeof window === 'undefined') return
  window.addEventListener('error', (ev) => {
    try{
      console.error('[prodErrorWatch] runtime error:', ev.message || ev.error || ev)
      console.error('[prodErrorWatch] file/pos:', ev.filename, ev.lineno, ev.colno)
      try{ console.error('[prodErrorWatch] location:', window.location.href) }catch(e){}
      try{ console.error('[prodErrorWatch] ua:', navigator.userAgent) }catch(e){}
      try{ console.error('[prodErrorWatch] localStorage keys:', Object.keys(localStorage).slice(0,50)) }catch(e){}
      try{ console.error('[prodErrorWatch] error object:', ev.error) }catch(e){}
    }catch(e){ /* ignore */ }
  })
  window.addEventListener('unhandledrejection', (ev) => {
    try{ console.error('[prodErrorWatch] unhandledrejection:', ev.reason) }catch(e){}
  })
}

export default installProdErrorWatch
