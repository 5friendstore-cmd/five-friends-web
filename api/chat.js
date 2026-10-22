import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ respuesta: 'Error: Método no permitido' });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ respuesta: '⚠️ Error: Vercel no detecta tu API Key.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const { mensaje } = req.body;
    
    if (!mensaje) {
      return res.status(400).json({ respuesta: '⚠️ Error: El mensaje llegó vacío.' });
    }

    // SOLUCIÓN: Cambiamos al modelo universal garantizado para cualquier versión del SDK
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(mensaje);
    
    return res.status(200).json({ respuesta: result.response.text() });
    
  } catch (error) {
    return res.status(500).json({ respuesta: '⚠️ Error de Gemini: ' + error.message });
  }
}
