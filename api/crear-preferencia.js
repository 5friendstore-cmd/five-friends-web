// api/crear-preferencia.js - Endpoint Seguro de Mercado Pago
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, items, shippingCost } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    // TOKEN RENOVADO PROTEGIDO EN EL SERVIDOR
    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "APP_USR-1421461334886474-100117-0102c2347cb5e980779a4578861bf85f-293350388";

    const mpItems = items.map(i => ({
      title: String(i.title).substring(0, 100),
      quantity: Number(i.quantity || 1),
      currency_id: 'MXN',
      unit_price: Number(i.price)
    }));

    if (shippingCost && Number(shippingCost) > 0) {
      mpItems.push({
        title: 'Costo de Envío',
        quantity: 1,
        currency_id: 'MXN',
        unit_price: Number(shippingCost)
      });
    }

    const host = req.headers.host || 'five-friends-web.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;

    const preferenceData = {
      items: mpItems,
      external_reference: String(orderId),
      back_urls: {
        success: `${baseUrl}?status=success&order=${orderId}`,
        failure: `${baseUrl}?status=failure&order=${orderId}`,
        pending: `${baseUrl}?status=pending&order=${orderId}`
      },
      auto_return: 'approved',
      binary_mode: false
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    const data = await mpResponse.json();

    if (data && data.init_point) {
      return res.status(200).json({ init_point: data.init_point, id: data.id });
    } else {
      console.error("Error Mercado Pago API:", data);
      return res.status(400).json({ error: data.message || 'Error al generar preferencia en Mercado Pago' });
    }
  } catch (error) {
    console.error("Error servidor Mercado Pago:", error);
    return res.status(500).json({ error: error.message });
  }
}
