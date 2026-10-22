import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ respuesta: 'Error: Método no permitido' });
  }

  try {
    // 1. Verificamos si Vercel está leyendo la variable de entorno
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ respuesta: '⚠️ Error: Vercel no detecta tu API Key. Necesitas ir a Vercel > Deployments > Redeploy.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const { mensaje } = req.body;
    
    if (!mensaje) {
      return res.status(400).json({ respuesta: '⚠️ Error: El mensaje llegó vacío al servidor.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(mensaje);
    
    return res.status(200).json({ respuesta: result.response.text() });
    
  } catch (error) {
    // 2. Si Gemini rechaza la conexión, enviamos el error real a tu pantalla
    return res.status(500).json({ respuesta: '⚠️ Error de Gemini: ' + error.message });
  }
}
