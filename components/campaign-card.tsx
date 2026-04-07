'use client'

import { useState } from 'react'
import { Campaign } from '@/types/campaign'
import DonationModal from '@/components/donation-modal'

type Props = {
  campaign: Campaign
}

export default function CampaignCard({ campaign }: Props) {
  const [open, setOpen] = useState(false)

  const percentage =
    campaign.valor_meta > 0
      ? (campaign.valor_arrecadado / campaign.valor_meta) * 100
      : 0

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
        <div className="h-56 w-full bg-stone-100">
          {campaign.imagem_url ? (
            <img
              src={campaign.imagem_url}
              alt={campaign.titulo}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              Sem imagem
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-right text-sm text-stone-500">
            {percentage >= 100
              ? 'Meta atingida 🎉'
              : `${Math.min(percentage, 100).toFixed(0)}% da meta`}
          </div>

          <div className="h-5 w-full overflow-hidden rounded-full bg-stone-200 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700 ease-out"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

          <button
            onClick={() => setOpen(true)}
            className="w-full rounded-2xl bg-stone-900 py-3 font-medium text-white transition hover:bg-stone-800"
          >
            Presentear via Pix
          </button>
        </div>

      <DonationModal
        campaign={campaign}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}