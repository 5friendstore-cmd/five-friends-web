// Webhook para Mercado Pago en Vercel
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Webhook active');
  }

  try {
    const { type, data, action } = req.body;
    const paymentId = data ? data.id : req.query['data.id'] || req.query.id;

    // Solo procesamos eventos de pagos aprobados
    if ((type === 'payment' || action === 'payment.created' || action === 'payment.updated') && paymentId) {
      const MP_ACCESS_TOKEN = "APP_USR-8740390679694896-092815-2deb03edc6e78227ae4b7e25f87e7c11-3720525449";

      // 1. Consultar a Mercado Pago los detalles del pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
      });
      const payment = await mpResponse.json();

      if (payment && payment.status === 'approved') {
        const orderId = payment.external_reference;
        const totalPaid = payment.transaction_amount;

        // 2. Conectar a Supabase para actualizar la orden y el saldo del cliente
        const SUPABASE_URL = "https://vqsuycquoeqakhttibao.supabase.co";
        const SUPABASE_KEY = "sb_publishable_iglMJnYPy3iFulCFv3j_qw_s3An5vme";

        if (orderId) {
          // Cambiar estado a 'Pagado / En Preparación'
          await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ status: 'Pagado / En Preparación' })
          });
        }
      }
    }

    // Mercado Pago requiere status 200/201 en menos de 22 segundos
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(200).json({ received: true, error: error.message });
  }
}
