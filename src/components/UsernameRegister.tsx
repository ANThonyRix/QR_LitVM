'use client'
import { useState, useEffect } from 'react'
import { useUsername } from '@/hooks/useUsername'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function UsernameRegister() {
  const [input, setInput] = useState('')
  const { isConnected } = useAccount()
  const { myUsername, register, isPending, isConfirming, isSuccess, error, refetch } = useUsername()

  useEffect(() => {
    if (isSuccess) refetch()
  }, [isSuccess])

  if (!isConnected) return null

  if (myUsername) {
    return (
      <Card>
        <CardContent className="pt-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground">Твоя короткая ссылка:</span>
          <Badge variant="secondary" className="font-mono">
            {typeof window !== 'undefined' ? window.location.origin : ''}/u/{myUsername}
          </Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Получить короткую ссылку</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label>Username (3–32 символа, a-z, 0-9, _)</Label>
          <Input
            placeholder="alice"
            value={input}
            onChange={e => setInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            maxLength={32}
          />
        </div>
        <Button
          className="w-full"
          onClick={() => register(input)}
          disabled={input.length < 3 || isPending || isConfirming}
        >
          {isPending ? 'Подтверди...' : isConfirming ? 'Ждём...' : 'Зарегистрировать'}
        </Button>
        {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      </CardContent>
    </Card>
  )
}
