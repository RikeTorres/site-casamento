'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import CampaignCard from '@/components/campaign-card'
import { Campaign } from '@/types/campaign'

export default function Home() {
  const supabase = useMemo(() => createClient(), [])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  useEffect(() => {
    async function fetchCampaigns() {
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .order('titulo', { ascending: true })

      if (!error) {
        setCampaigns(data || [])
      }
    }

    fetchCampaigns()

    const channel = supabase
      .channel('campanhas-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campanhas',
        },
        (payload) => {
          const updated = payload.new as Campaign

          setCampaigns((current) =>
            current.map((campaign) =>
              campaign.id === updated.id ? updated : campaign
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-stone-100">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
            Nosso casamento
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900 md:text-6xl">
            Ajude a construir os primeiros capítulos dessa linda história ❤️
          </h1>

          <p className="mt-5 text-base leading-7 text-stone-600 md:text-lg">
            Criamos algumas campanhas especiais para que vocês, nossos amigos e familiares, possam
            nos ajudar com qualquer valor naquele projeto que mais se indentificarem.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </section>
    </main>
  )
}