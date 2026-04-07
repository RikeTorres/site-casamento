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

        <div className="space-y-4 p-5">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">
              {campaign.titulo}
            </h2>

            <p className="mt-1 text-sm text-stone-600">
              R$ {campaign.valor_arrecadado} de R$ {campaign.valor_meta} arrecadados.
            </p>
          </div>

          <div>
            <div className="h-3 w-full rounded-full bg-stone-200">
              <div
                className="h-3 rounded-full bg-emerald-500 transition-all duration-700 ease-out"
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
      </div>

      <DonationModal
        campaign={campaign}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}