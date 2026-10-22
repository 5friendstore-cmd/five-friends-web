export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ respuesta: 'Error: Método no permitido' });
  }

  try {
    const rawKey = process.env.GEMINI_API_KEY;
    if (!rawKey) {
      return res.status(500).json({ respuesta: '⚠️ Error: Vercel no detecta tu API Key.' });
    }
    const apiKey = rawKey.trim().replace(/['"]/g, '');

    const { mensaje } = req.body;
    if (!mensaje) {
      return res.status(400).json({ respuesta: '⚠️ Error: El mensaje llegó vacío.' });
    }

    // INSTRUCCIONES DEL SISTEMA (Personalidad de Five Friends)
    const systemInstruction = `Eres el asistente de ventas amigable y experto de Five Friends.
Reglas estrictas:
1. Respuestas cortas, persuasivas y directas. Usa un tono cercano.
2. Somos un taller en Cuautitlán Izcalli. Ofrecemos 3 pilares: Impresión 3D (PETG/PLA Pro), Coleccionables y Desarrollo Web.
3. El tiempo de fabricación 3D es de 2 a 4 días. Tenemos garantía si la paquetería rompe la pieza.
4. Las entregas en Plaza Centella y Plaza San Miguel son GRATIS ($0 MXN). Los envíos nacionales son por paquetería.
5. NO inventes precios que no estén en la charla. Si piden cotizar una pieza 3D nueva, diles que usen el botón "Cotizar" o que manden su archivo/foto al WhatsApp 56 3951 1105.
6. Nunca hables de marcas de impresoras (como Bambu Lab). Solo di que usamos equipo de alta precisión.`;

    // Conexión al modelo verificado: gemini-2.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [{ parts: [{ text: mensaje }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ respuesta: `⚠️ Error de Google: ${data.error?.message || 'Desconocido'}` });
    }

    const textoRespuesta = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ respuesta: textoRespuesta });

  } catch (error) {
    return res.status(500).json({ respuesta: '⚠️ Error interno: ' + error.message });
  }
}
