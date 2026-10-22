export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ respuesta: 'Error: Método no permitido' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ respuesta: '⚠️ Error: Vercel no detecta tu API Key.' });
    }

    const { mensaje } = req.body;
    if (!mensaje) {
      return res.status(400).json({ respuesta: '⚠️ Error: El mensaje llegó vacío.' });
    }

    // Conexión REST directa a gemini-1.5-flash (sin usar el SDK problemático)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: mensaje }]
        }]
      })
    });

    const data = await response.json();

    // Si Google rechaza la petición, capturamos el mensaje exacto
    if (!response.ok) {
      console.error("Error de la API de Google:", data);
      return res.status(500).json({ respuesta: `⚠️ Error de Google: ${data.error?.message || 'Desconocido'}` });
    }

    // Extraemos la respuesta generada
    const textoRespuesta = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ respuesta: textoRespuesta });

  } catch (error) {
    console.error("Error en el servidor Vercel:", error);
    return res.status(500).json({ respuesta: '⚠️ Error interno: ' + error.message });
  }
}
