'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  requestId: string
}

export function EmbedCode({ requestId }: Props) {
  const [copied, setCopied] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://qrlitvm.app'
  const iframeId = `pay-litvm-widget-${requestId.slice(2, 10)}`
  const code = `<iframe\n  id="${iframeId}"\n  src="${origin}/widget/${requestId}?view=button"\n  width="100%"\n  height="132"\n  frameborder="0"\n  scrolling="no"\n  style="max-width:560px;width:100%;min-height:132px;border:0;border-radius:24px;overflow:hidden;background:#050816;box-shadow:0 24px 80px rgba(3,7,18,.45)"\n></iframe>\n<script>\n  (function () {\n    const iframe = document.getElementById('${iframeId}');\n    if (!iframe) return;\n    const expectedOrigin = new URL(iframe.src).origin;\n    function handleMessage(event) {\n      if (event.origin !== expectedOrigin) return;\n      if (event.source !== iframe.contentWindow) return;\n      if (!event.data || event.data.type !== 'pay-litvm:widget-resize') return;\n      if (typeof event.data.height !== 'number') return;\n      iframe.style.height = Math.max(132, Math.ceil(event.data.height)) + 'px';\n    }\n    window.addEventListener('message', handleMessage);\n  })();\n</script>`

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Embed the "Pay" button on your site:
      </p>
      <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
      <Button variant="outline" className="w-full" onClick={copy}>
        {copied ? 'Copied!' : 'Copy code'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Preview:{' '}
        <a href={`/widget/${requestId}`} target="_blank" className="underline">
          open
        </a>
      </p>
    </div>
  )
}
