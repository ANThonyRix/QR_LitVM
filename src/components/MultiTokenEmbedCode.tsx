'use client'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { TOKENS } from '@/lib/tokens'
import { Button } from '@/components/ui/button'

interface Props {
  amount?: string
  label?: string
}

export function MultiTokenEmbedCode({ amount = '', label = 'Payment' }: Props) {
  const { address } = useAccount()
  const [copied, setCopied] = useState(false)
  const [acceptedTokens, setAcceptedTokens] = useState<'all' | 'zkltc' | 'usdc'>('all')

  if (!address) return null

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.pay-litvm.xyz'
  const params = new URLSearchParams()
  if (amount) params.set('amount', amount)
  if (label) params.set('label', label)
  params.set('tokens', acceptedTokens)

  const widgetSrc = `${origin}/widget/pay/${address}?${params.toString()}`
  const dropId = `plv-mt-drop-${address.slice(2, 10)}`
  const wrapId = `plv-mt-wrap-${address.slice(2, 10)}`

  const buttonLabel = acceptedTokens === 'all'
    ? 'Pay with crypto'
    : `Pay with ${acceptedTokens === 'zkltc' ? 'zkLTC' : 'USDC'}`

  const code = `<!-- Pay LitVM Multi-Token Widget -->
<style>
  .plv-wrap{position:relative;display:inline-block}
  .plv-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:12px;border:none;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;font-size:15px;font-weight:600;cursor:pointer;transition:transform .15s,box-shadow .15s;box-shadow:0 4px 20px rgba(99,102,241,.4)}
  .plv-btn:hover{transform:translateY(-1px)}.plv-btn:active{transform:scale(.97)}
  .plv-dropdown{display:none;position:absolute;top:calc(100% + 8px);left:0;z-index:9999;border-radius:16px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.6),0 0 40px rgba(99,102,241,.15);animation:plv-in .18s ease;width:340px;height:520px}
  .plv-dropdown.open{display:block}
  .plv-iframe-wrap{width:340px;height:520px;overflow:hidden;position:relative}
  .plv-iframe-wrap iframe{width:453px;height:693px;transform:scale(0.75);transform-origin:top left;border:none;display:block}
  .plv-close{position:absolute;top:8px;right:8px;z-index:10;width:26px;height:26px;border-radius:50%;border:none;background:rgba(255,255,255,.15);color:#fff;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center}
  .plv-close:hover{background:rgba(255,255,255,.25)}
  @keyframes plv-in{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
</style>
<div id="${wrapId}" class="plv-wrap">
  <button class="plv-btn" onclick="document.getElementById('${dropId}').classList.toggle('open')">
    💳 ${buttonLabel}
  </button>
  <div id="${dropId}" class="plv-dropdown">
    <div class="plv-iframe-wrap">
      <button class="plv-close" onclick="document.getElementById('${dropId}').classList.remove('open')">✕</button>
      <iframe src="${widgetSrc}" width="453" height="693" scrolling="no" frameborder="0"></iframe>
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
        Multi-token widget — payer chooses the token:
      </p>

      <div className="flex gap-2">
        {(['all', 'zkltc', 'usdc'] as const).map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => setAcceptedTokens(opt)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              acceptedTokens === opt
                ? 'border-blue-500/50 bg-blue-500/20 text-blue-200'
                : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {opt === 'all' ? 'Both (zkLTC + USDC)' : opt === 'zkltc' ? 'zkLTC only' : 'USDC only'}
          </button>
        ))}
      </div>

      <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
      <Button variant="outline" className="w-full" onClick={copy}>
        {copied ? 'Copied!' : 'Copy code'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Preview:{' '}
        <a href={`/widget/pay/${address}?${params.toString()}`} target="_blank" className="underline">
          open
        </a>
      </p>
    </div>
  )
}
