'use client'
import { use } from 'react'
import { useAddressForUsername } from '@/hooks/useUsername'
import { WalletConnect } from '@/components/WalletConnect'
import { Card, CardContent } from '@/components/ui/card'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = use(params)
  const { address, isLoading } = useAddressForUsername(username)

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">Загрузка...</p>
      </main>
    )
  }

  if (!address || address === ZERO_ADDRESS) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900">
        <Card className="max-w-sm w-full mx-4">
          <CardContent className="pt-6 text-center text-muted-foreground">
            Пользователь <strong>@{username}</strong> не найден
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">@{username}</h1>
            <p className="text-slate-400 text-xs font-mono">
              {address.slice(0, 8)}...{address.slice(-6)}
            </p>
          </div>
          <WalletConnect />
        </header>
        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Адрес кошелька <strong>@{username}</strong>:
            </p>
            <p className="font-mono text-sm break-all bg-muted rounded-lg p-3">
              {address}
            </p>
            <p className="text-xs text-muted-foreground">
              Создай платёжный запрос на{' '}
              <a href="/" className="underline">главной странице</a>,
              чтобы получить ссылку для оплаты.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
