import { NextResponse } from 'next/server'
import { getPayment } from '@/lib/mercadopago'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('WEBHOOK BODY:', JSON.stringify(body, null, 2))

    const eventType = body.type || body.action
    const paymentId = String(body?.data?.id || body?.id || '')

    console.log('eventType:', eventType)
    console.log('paymentId:', paymentId)

    if (!paymentId) {
      console.log('Webhook sem paymentId')
      return NextResponse.json({ received: true })
    }

    const payment = await getPayment(paymentId)

    console.log('PAYMENT DETAILS:', JSON.stringify(payment, null, 2))

    if (payment.status !== 'approved') {
      console.log('Pagamento ainda não aprovado:', payment.status)
      return NextResponse.json({ received: true, ignored: true })
    }

    const campaignId =
      payment.external_reference ||
      payment.metadata?.campaign_id ||
      null

    const amountPaid = Number(payment.transaction_amount || 0)

    console.log('campaignId:', campaignId)
    console.log('amountPaid:', amountPaid)

    if (!campaignId || amountPaid <= 0) {
      console.log('campaignId ausente ou valor inválido')
      return NextResponse.json({ received: true, ignored: true })
    }

    const { data: existingPayment, error: existingPaymentError } = await supabaseAdmin
      .from('pagamentos_processados')
      .select('payment_id')
      .eq('payment_id', paymentId)
      .maybeSingle()

    console.log('existingPayment:', existingPayment)
    console.log('existingPaymentError:', existingPaymentError)

    if (existingPayment) {
      console.log('Pagamento duplicado, ignorando')
      return NextResponse.json({ received: true, duplicated: true })
    }

    const { data: currentCampaign, error: campaignError } = await supabaseAdmin
      .from('campanhas')
      .select('id, valor_arrecadado')
      .eq('id', campaignId)
      .single()

    console.log('currentCampaign:', currentCampaign)
    console.log('campaignError:', campaignError)

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

    console.log('logError:', logError)

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('campanhas')
      .update({
        valor_arrecadado: newTotal,
      })
      .eq('id', campaignId)

    console.log('updateError:', updateError)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log('Webhook processado com sucesso')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro interno no webhook.',
      },
      { status: 500 }
    )
  }
}