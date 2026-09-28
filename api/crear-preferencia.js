export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, shipping_cost, shipping_details, payer_email } = req.body;

  const ACCESS_TOKEN = "APP_USR-8740390679694896-092815-2deb03edc6e78227ae4b7e25f87e7c11-3720525449";

  const preferenceItems = (items || []).map(item => ({
    title: item.title,
    quantity: parseInt(item.quantity) || 1,
    unit_price: parseFloat(item.price),
    currency_id: "MXN"
  }));

  if (parseFloat(shipping_cost) > 0) {
    preferenceItems.push({
      title: `Envío (${shipping_details?.provider || 'Paquetería'})`,
      quantity: 1,
      unit_price: parseFloat(shipping_cost),
      currency_id: "MXN"
    });
  }

  const preferencePayload = {
    items: preferenceItems,
    payer: {
      email: payer_email || "cliente@fivefriends.com"
    },
    back_urls: {
      success: `${req.headers.origin || 'https://five-friends-web.vercel.app'}?payment=success`,
      failure: `${req.headers.origin || 'https://five-friends-web.vercel.app'}?payment=failure`,
      pending: `${req.headers.origin || 'https://five-friends-web.vercel.app'}?payment=pending`
    },
    auto_return: "approved"
  };

  try {
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify(preferencePayload)
    });

    const preferenceData = await mpResponse.json();

    if (!mpResponse.ok) {
      return res.status(400).json({ error: preferenceData });
    }

    return res.status(200).json({
      id: preferenceData.id,
      init_point: preferenceData.init_point
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
