import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createPixPayment } from '@/lib/mercadopago'


export async function POST(request: Request) {
  try {
    const body = await request.json()
    const campaignId = String(body.campaignId || '')
    const amount = Number(body.amount)

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId é obrigatório.' }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 })
    }

    const { data: campaign, error } = await supabaseAdmin
      .from('campanhas')
      .select('id, titulo')
      .eq('id', campaignId)
      .single()

    if (error || !campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 })
    }

    const payment = await createPixPayment({
      campaignId: campaign.id,
      campaignTitle: campaign.titulo,
      amount,
    })

    const qrCodeBase64 =
      payment?.point_of_interaction?.transaction_data?.qr_code_base64

    const copiaECola =
      payment?.point_of_interaction?.transaction_data?.qr_code

    if (!qrCodeBase64 || !copiaECola) {
      return NextResponse.json(
        { error: 'Pix gerado, mas os dados do QR Code não vieram.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      paymentId: String(payment.id),
      copiaECola,
      qrCodeBase64,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro interno ao gerar Pix.',
      },
      { status: 500 }
    )
  }
}