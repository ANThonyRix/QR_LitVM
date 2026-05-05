'use client'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useCreateRequest } from '@/hooks/useCreateRequest'
import { QRDisplay } from './QRDisplay'
import { EmbedCode } from './EmbedCode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function PaymentGenerator() {
  const { isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [payUrl, setPayUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const { create, isPending, isConfirming, requestId, error } = useCreateRequest()

  useEffect(() => {
    if (requestId) {
      const url = `${window.location.origin}/pay/${requestId}`
      setPayUrl(url)
      const history = JSON.parse(localStorage.getItem('qrlitvm_history') ?? '[]')
      history.unshift({ id: requestId, url, label, amount, createdAt: Date.now() })
      localStorage.setItem('qrlitvm_history', JSON.stringify(history.slice(0, 50)))
    }
  }, [requestId])

  const handleCreate = () => {
    if (!label.trim()) return
    create(amount, label)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(payUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Подключи кошелёк для создания платёжной ссылки
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Создать платёжную ссылку</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Описание *</Label>
            <Input
              placeholder="Фриланс проект / Товар"
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Сумма zkLTC (оставь пустым — любая сумма)</Label>
            <Input
              type="number"
              placeholder="0.5"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0"
              step="0.001"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={!label.trim() || isPending || isConfirming}
          >
            {isPending ? 'Подтверди в кошельке...' :
             isConfirming ? 'Ждём блокчейн...' :
             'Создать ссылку'}
          </Button>
          {error && (
            <p className="text-sm text-destructive">{(error as Error).message}</p>
          )}
        </CardContent>
      </Card>

      {payUrl && (
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="qr">
              <TabsList className="w-full">
                <TabsTrigger value="qr" className="flex-1">QR-код</TabsTrigger>
                <TabsTrigger value="link" className="flex-1">Ссылка</TabsTrigger>
                <TabsTrigger value="embed" className="flex-1">Виджет</TabsTrigger>
              </TabsList>
              <TabsContent value="qr" className="flex justify-center py-4">
                <QRDisplay url={payUrl} label={label} />
              </TabsContent>
              <TabsContent value="link" className="space-y-3 py-4">
                <div className="bg-muted rounded-lg p-3 break-all text-sm font-mono">
                  {payUrl}
                </div>
                <Button variant="outline" className="w-full" onClick={copyLink}>
                  {copied ? 'Скопировано!' : 'Копировать ссылку'}
                </Button>
              </TabsContent>
              <TabsContent value="embed" className="py-4">
                {requestId && <EmbedCode requestId={requestId} />}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
