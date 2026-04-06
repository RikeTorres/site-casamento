'use client'

import { useEffect, useState } from 'react'
import { X, Copy, CheckCircle2, Loader2 } from 'lucide-react'
import { Campaign } from '@/types/campaign'

type Props = {
  campaign: Campaign
  open: boolean
  onClose: () => void
}

type PixResponse = {
  paymentId: string
  copiaECola: string
  qrCodeBase64: string
}

export default function DonationModal({ campaign, open, onClose }: Props) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pixData, setPixData] = useState<PixResponse | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) {
      setAmount('')
      setLoading(false)
      setError(null)
      setPixData(null)
      setCopied(false)
    }
  }, [open])

  if (!open) return null

  async function handleGeneratePix() {
    setLoading(true)
    setError(null)
    setPixData(null)

    try {
      const numericAmount = Number(amount.replace(',', '.'))

      if (!numericAmount || numericAmount <= 0) {
        throw new Error('Digite um valor válido.')
      }

      const response = await fetch('/api/pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          amount: numericAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar Pix.')
      }

      setPixData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopyPix() {
    if (!pixData?.copiaECola) return

    await navigator.clipboard.writeText(pixData.copiaECola)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-stone-500 transition hover:bg-stone-100"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
            Contribuição
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-900">
            {campaign.titulo}
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Digite o valor que deseja contribuir para essa campanha.
          </p>
        </div>

        <div className="space-y-4">
          {!pixData && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Valor da doação
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Ex: 50,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none placeholder:text-stone-500 focus:border-stone-900"
                />
              </div>

              <button
                onClick={handleGeneratePix}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando Pix...
                  </>
                ) : (
                  'Gerar Pix'
                )}
              </button>
            </>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {pixData && (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Pix gerado com sucesso. Após a confirmação do pagamento, a barra da campanha será atualizada automaticamente.
              </div>

              <img
                src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                alt="QR Code Pix"
                className="mx-auto h-56 w-56 rounded-xl bg-white p-2"
              />

              <textarea
                readOnly
                value={pixData.copiaECola}
                className="mt-4 min-h-[110px] w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 outline-none"
              />

              <button
                onClick={handleCopyPix}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-300 py-3 font-medium text-stone-800 transition hover:bg-stone-100"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Pix copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar Pix
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="mt-3 w-full rounded-2xl bg-stone-900 py-3 font-medium text-white transition hover:bg-stone-800"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}