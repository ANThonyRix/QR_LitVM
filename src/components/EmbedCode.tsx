'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  requestId: string
}

export function EmbedCode({ requestId }: Props) {
  const [copied, setCopied] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://qrlitvm.app'
  const code = `<iframe\n  src="${origin}/widget/${requestId}"\n  width="300"\n  height="120"\n  frameborder="0"\n  style="border-radius:12px;border:1px solid #e2e8f0"\n></iframe>`

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
