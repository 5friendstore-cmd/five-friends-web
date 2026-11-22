export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ respuesta: 'Error: Método no permitido' });
  }

  try {
    const rawKey = process.env.GEMINI_API_KEY;
    if (!rawKey) {
      return res.status(500).json({ respuesta: '⚠️ Error: Vercel no detecta la variable GEMINI_API_KEY.' });
    }
    const apiKey = rawKey.trim().replace(/['"]/g, '');

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const mensaje = body.mensaje ? String(body.mensaje).trim() : '';

    if (!mensaje) {
      return res.status(400).json({ respuesta: '⚠️ Escribe una pregunta para poder ayudarte.' });
    }

    const systemInstruction = `Eres el asistente de ventas amigable y experto de Five Friends ("Crea lo que imaginas, colecciona lo que sueñas").
Reglas estrictas:
1. Respuestas cortas, claras y persuasivas (máximo 3 líneas).
2. Somos un taller en Cuautitlán Izcalli con 3 pilares: Impresión 3D (PLA Pro y PETG), Coleccionables & TCG, y Desarrollo Web.
3. Impresión 3D: fabricación en 2 a 4 días hábiles y garantía de reimpresión sin costo si la paquetería daña la pieza. Para cotizar piezas personalizadas, indícales usar la pestaña "Cotizador 3D" o enviar su archivo/foto al WhatsApp 56 3951 1105.
4. Desarrollo Web: Landing Page ($3,000 MXN), Sitio Multi-Sección ($4,500 MXN) y Tienda Online E-commerce ($6,000 MXN). Todos incluyen opción de mantenimiento mensual por $200 MXN/mes con cambios ilimitados durante el mes.
5. Entregas: Recolección GRATIS ($0 MXN) en Oficina/Taller Central Five Friends, Plaza Centella, Plaza San Miguel, Taiyari, Haruss Cake y Farmacias del Dr. Economix; o envío nacional por paquetería.
6. Nunca menciones marcas de impresoras (como Bambu Lab). Solo di que usamos equipo de alta precisión.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [{ parts: [{ text: mensaje }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 250,
          thinkingConfig: {
            thinkingBudget: 0
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ respuesta: `⚠️ Error de Google Gemini: ${data?.error?.message || response.status}` });
    }

    const textoRespuesta = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta en este momento.';
    return res.status(200).json({ respuesta: textoRespuesta });

  } catch (error) {
    return res.status(500).json({ respuesta: '⚠️ Error interno: ' + error.message });
  }
}
