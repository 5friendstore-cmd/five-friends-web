export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ respuesta: 'Error: Método no permitido' });
  }

  try {
    const rawKey = process.env.GEMINI_API_KEY;
    if (!rawKey) {
      return res.status(500).json({ respuesta: '⚠️ Error: Vercel no detecta tu API Key.' });
    }

    // Limpiamos espacios invisibles o comillas accidentales que rompen la URL
    const apiKey = rawKey.trim().replace(/['"]/g, '');

    const { mensaje } = req.body;
    if (!mensaje) {
      return res.status(400).json({ respuesta: '⚠️ Error: El mensaje llegó vacío.' });
    }

    // 1. Intentamos la conexión directa a Gemini 1.5 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: mensaje }] }]
      })
    });

    const data = await response.json();

    // 2. Si Google dice "Not Found", escaneamos tu cuenta para ver qué modelos tienes habilitados
    if (!response.ok) {
      try {
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listRes = await fetch(listUrl);
        const listData = await listRes.json();
        
        let modelosDisponibles = "No se pudo leer tu lista de modelos.";
        if (listData.models) {
          // Filtramos y limpiamos los nombres para mostrarlos claros en el chat
          const nombres = listData.models
            .map(m => m.name.replace('models/', ''))
            .filter(n => n.includes('gemini'));
          modelosDisponibles = nombres.join('\n- ');
        }

        return res.status(500).json({ 
          respuesta: `⚠️ Error de ruta: ${data.error?.message}\n\n💡 DIAGNÓSTICO: Tu API Key SÍ tiene acceso a estos modelos exactos:\n- ${modelosDisponibles}\n\n(Dime cuál aparece en esta lista para ajustarlo).` 
        });
      } catch(e) {
         return res.status(500).json({ respuesta: `⚠️ Error de Google: ${data.error?.message}` });
      }
    }

    // 3. Si todo sale bien, respondemos el mensaje
    const textoRespuesta = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ respuesta: textoRespuesta });

  } catch (error) {
    return res.status(500).json({ respuesta: '⚠️ Error interno del servidor: ' + error.message });
  }
}
