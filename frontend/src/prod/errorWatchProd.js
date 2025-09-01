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
      // If the error points to a bundled asset, attempt to fetch the file and
      // print a small snippet around the reported line/column. This helps map
      // minified positions to the offending expression in the bundle.
      try{
        const f = ev.filename
        const ln = typeof ev.lineno === 'number' ? ev.lineno : null
        const col = typeof ev.colno === 'number' ? ev.colno : null
        if (f && ln && col && f.includes('/assets/')){
          fetch(f, { cache: 'no-store' }).then(r => r.text()).then(text => {
            try{
              const lines = text.split('\n')
              const idx = Math.max(0, ln-1)
              const contextLines = 3
              const start = Math.max(0, idx - contextLines)
              const end = Math.min(lines.length, idx + contextLines + 1)
              const snippet = lines.slice(start, end).map((L,i) => {
                const lineNum = start + i + 1
                const pointer = lineNum === ln ? '>>' : '  '
                let colMarker = ''
                if(lineNum === ln){
                  const c = Math.max(0, col - 1)
                  colMarker = '\n' + ' '.repeat(4 + c) + '^' // visual pointer
                }
                return `${pointer} ${lineNum.toString().padStart(4,' ')} | ${L}${colMarker}`
              }).join('\n')
              console.error('[prodErrorWatch] bundle snippet:\n' + snippet)
            }catch(e){ console.error('[prodErrorWatch] snippet error', e) }
          }).catch(e => console.error('[prodErrorWatch] fetch bundle failed', e))
        }
      }catch(e){ /* ignore */ }
    }catch(e){ /* ignore */ }
  })
  window.addEventListener('unhandledrejection', (ev) => {
    try{ console.error('[prodErrorWatch] unhandledrejection:', ev.reason) }catch(e){}
  })
}

export default installProdErrorWatch
