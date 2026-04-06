const MP_API_URL = 'https://api.mercadopago.com'

type CreatePixPaymentInput = {
  campaignId: string
  campaignTitle: string
  amount: number
}

export async function createPixPayment({
  campaignId,
  campaignTitle,
  amount,
}: CreatePixPaymentInput) {
  const response = await fetch(`${MP_API_URL}/v1/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify({
      transaction_amount: amount,
      description: `Doação casamento - ${campaignTitle}`,
      payment_method_id: 'pix',
      payer: {
        email: 'comprador@email.com',
        first_name: 'Convidado',
      },
      external_reference: campaignId,
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook`,
      metadata: {
        campaign_id: campaignId,
        campaign_title: campaignTitle,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Erro Mercado Pago: ${response.status} - ${errorText}`)
  }

  return response.json()
}

export async function getPayment(paymentId: string) {
  const response = await fetch(`${MP_API_URL}/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Erro ao consultar pagamento: ${response.status} - ${errorText}`)
  }

  return response.json()
}