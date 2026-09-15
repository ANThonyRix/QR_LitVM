'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  requestId: string
  tokenSymbol?: string
}

export function EmbedCode({ requestId, tokenSymbol = 'zkLTC' }: Props) {
  const [copied, setCopied] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://qrlitvm.app'
  const dropId = `plv-drop-${requestId.slice(2, 10)}`
  const wrapId = `plv-wrap-${requestId.slice(2, 10)}`
  const widgetSrc = `${origin}/widget/${requestId}`
  const code = `<!-- Pay LitVM Widget Button -->
<style>
  .plv-wrap{position:relative;display:inline-block}
  .plv-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:12px;border:1px solid #2c3e6b;background:#3b82f6;color:#fff;font-size:15px;font-weight:600;cursor:pointer;transition:background-color .15s}
  .plv-btn:hover{background:#2f6fd8}
  .plv-dropdown{display:none;position:absolute;top:calc(100% + 8px);left:0;z-index:9999;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.1);box-shadow:0 16px 48px rgba(0,0,0,.5);animation:plv-in .18s ease;width:340px;height:480px}
  .plv-dropdown.open{display:block}
  .plv-iframe-wrap{width:340px;height:480px;overflow:hidden;position:relative}
  .plv-iframe-wrap iframe{width:453px;height:640px;transform:scale(0.75);transform-origin:top left;border:none;display:block}
  .plv-close{position:absolute;top:8px;right:8px;z-index:10;width:26px;height:26px;border-radius:50%;border:none;background:rgba(255,255,255,.15);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}
  .plv-close:hover{background:rgba(255,255,255,.25)}
  .plv-close svg{width:12px;height:12px}
  @keyframes plv-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
</style>
<div id="${wrapId}" class="plv-wrap">
  <button class="plv-btn" onclick="document.getElementById('${dropId}').classList.toggle('open')">
    Pay with ${tokenSymbol}
  </button>
  <div id="${dropId}" class="plv-dropdown">
    <div class="plv-iframe-wrap">
      <button class="plv-close" onclick="document.getElementById('${dropId}').classList.remove('open')" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <iframe src="${widgetSrc}" width="453" height="640" scrolling="no" frameborder="0"></iframe>
    </div>
  </div>
</div>
<script>
  document.addEventListener('click',function(e){
    var w=document.getElementById('${wrapId}');
    if(w&&!w.contains(e.target))document.getElementById('${dropId}').classList.remove('open');
  });
</script>`

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Embed the &quot;Pay&quot; button on your site:
      </p>
      <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
      <Button variant="outline" className="w-full" onClick={copy}>
        {copied ? 'Copied!' : 'Copy code'}
      </Button>
      <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-1.5">
        <p className="text-xs font-medium text-foreground">Where to paste:</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>In your HTML file — inside <code className="bg-muted px-1 rounded">&lt;body&gt;</code> where you want the button</li>
          <li>WordPress — use a &quot;Custom HTML&quot; block</li>
          <li>Tilda / Wix / Squarespace — use an &quot;Embed code&quot; or &quot;HTML&quot; widget</li>
          <li>React / Next.js — paste into a <code className="bg-muted px-1 rounded">dangerouslySetInnerHTML</code> or use an iframe directly</li>
        </ul>
      </div>
      <p className="text-xs text-muted-foreground">
        Preview:{' '}
        <a href={`/widget/${requestId}`} target="_blank" className="underline">
          open
        </a>
      </p>
    </div>
  )
}
