import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const { mensaje } = req.body;
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent(mensaje);
    const textoRespuesta = result.response.text();
    
    return res.status(200).json({ respuesta: textoRespuesta });
  } catch (error) {
    // Imprime el error en los Logs de Vercel si algo falla con la API Key
    console.error("Detalle del error en Gemini:", error);
    return res.status(500).json({ error: 'Error al procesar la solicitud', detalle: error.message });
  }
}
