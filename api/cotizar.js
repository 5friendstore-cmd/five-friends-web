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

  const { zip_to, weight, length, width, height } = req.body;

  if (!zip_to) {
    return res.status(400).json({ error: 'Código postal de destino requerido' });
  }

  const SKYDROPX_API_KEY = "BHD4o2RyH74IYBIdaIpQqVC2W6o3lJrE5Rja_YyKHeQ";
  const ORIGIN_ZIP = "54807"; // Cuautitlán, Estado de México

  const payload = {
    address_from: {
      province: "México",
      city: "Cuautitlán",
      name: "Five Friends",
      zip: ORIGIN_ZIP,
      country: "MX",
      address1: "Cda. Sor Juana Inés de La Cruz 232, 1",
      company: "Five Friends 3D",
      phone: "5512345678",
      email: "5friendstore@gmail.com"
    },
    address_to: {
      province: "México",
      city: "Destino",
      name: "Cliente Five Friends",
      zip: String(zip_to),
      country: "MX",
      address1: "Dirección de Entrega",
      phone: "5500000000",
      email: "cliente@fivefriends.com"
    },
    parcels: [
      {
        weight: parseFloat(weight) || 3,
        distance_unit: "CM",
        mass_unit: "KG",
        length: parseFloat(length) || 25,
        width: parseFloat(width) || 25,
        height: parseFloat(height) || 25
      }
    ]
  };

  try {
    const skydropResponse = await fetch("https://api.skydropx.com/v1/quotations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token token=${SKYDROPX_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await skydropResponse.json();

    if (!skydropResponse.ok) {
      return res.status(200).json({
        rates: [
          { provider: "Estafeta", service: "Terrestre", cost: 145, days: "3 a 5 días" },
          { provider: "Redpack", service: "EcoExpress", cost: 135, days: "3 a 6 días" },
          { provider: "FedEx", service: "Express Nacional", cost: 185, days: "1 a 2 días" }
        ],
        fallback: true
      });
    }

    const rates = (data || []).map(r => ({
      provider: r.carrier || r.provider || "Paquetería",
      service: r.service_description || "Servicio Estándar",
      cost: parseFloat(r.total_pricing || r.price || 150),
      days: r.days ? `${r.days} días` : "3 a 5 días"
    }));

    return res.status(200).json({ rates });
  } catch (error) {
    return res.status(200).json({
      rates: [
        { provider: "Estafeta", service: "Terrestre", cost: 145, days: "3 a 5 días" },
        { provider: "FedEx", service: "Nacional Express", cost: 185, days: "1 a 2 días" }
      ],
      fallback: true
    });
  }
}
