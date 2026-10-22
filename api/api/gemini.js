import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Aseguramos que solo reciba peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Inicializar el SDK con la variable de entorno de Vercel
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Extraer el mensaje enviado desde el frontend
    const { mensaje } = req.body;
    
    // Seleccionar el modelo (gemini-2.5-flash es ideal para respuestas rápidas)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Generar la respuesta
    const result = await model.generateContent(mensaje);
    const textoRespuesta = result.response.text();
    
    // Devolver la respuesta al frontend
    return res.status(200).json({ respuesta: textoRespuesta });
    
  } catch (error) {
    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
}
