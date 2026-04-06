import { NextResponse } from 'next/server'
import { getPayment } from '@/lib/mercadopago'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const eventType = body.type || body.action
    const paymentId = String(body?.data?.id || body?.id || '')

    if (!paymentId) {
      return NextResponse.json({ received: true })
    }

    if (
      eventType !== 'payment' &&
      eventType !== 'payment.updated' &&
      eventType !== 'payment.created'
    ) {
      return NextResponse.json({ received: true, ignored: true })
    }

    const payment = await getPayment(paymentId)

    if (payment.status !== 'approved') {
      return NextResponse.json({ received: true, ignored: true })
    }

    const campaignId =
      payment.external_reference ||
      payment.metadata?.campaign_id ||
      null

    const amountPaid = Number(payment.transaction_amount || 0)

    if (!campaignId || amountPaid <= 0) {
      return NextResponse.json({ received: true, ignored: true })
    }

    const { data: existingPayment } = await supabaseAdmin
      .from('pagamentos_processados')
      .select('payment_id')
      .eq('payment_id', paymentId)
      .maybeSingle()

    if (existingPayment) {
      return NextResponse.json({ received: true, duplicated: true })
    }

    const { data: currentCampaign, error: campaignError } = await supabaseAdmin
      .from('campanhas')
      .select('id, valor_arrecadado')
      .eq('id', campaignId)
      .single()

    if (campaignError || !currentCampaign) {
      return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 })
    }

    const newTotal = Number(currentCampaign.valor_arrecadado) + amountPaid

    const { error: logError } = await supabaseAdmin
      .from('pagamentos_processados')
      .insert({
        payment_id: paymentId,
        campaign_id: campaignId,
        valor_pago: amountPaid,
      })

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('campanhas')
      .update({
        valor_arrecadado: newTotal,
      })
      .eq('id', campaignId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro interno no webhook.',
      },
      { status: 500 }
    )
  }
}