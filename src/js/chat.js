export function toggleAIChat() {
  const chatWin = document.getElementById('ai-chat-window');
  if (chatWin) chatWin.classList.toggle('hidden');
}

export async function enviarMensajeAI() {
  const inputField = document.getElementById('ai-chat-input');
  const text = inputField.value.trim();
  if (!text) return;

  const messagesContainer = document.getElementById('ai-chat-messages');

  // 1. Mostrar el mensaje del usuario
  messagesContainer.innerHTML += '<div class="flex justify-end"><div class="bg-indigo-600 text-white p-2.5 rounded-xl max-w-[85%] shadow-sm leading-relaxed">' + text + '</div></div>';
  inputField.value = '';
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // 2. Mostrar indicador de carga
  const loadingId = 'loading-' + Date.now();
  messagesContainer.innerHTML += '<div id="' + loadingId + '" class="flex justify-start"><div class="bg-white border border-zinc-200 text-zinc-500 p-2.5 rounded-xl animate-pulse text-[11px] font-semibold">El asistente está escribiendo...</div></div>';
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    // 3. Petición al backend en Vercel
    const respuesta = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje: text })
    });

    const datos = await respuesta.json();

    // 4. Remover indicador de carga
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    // 5. Mostrar respuesta de Gemini
    let respText = datos.respuesta || "Lo siento, hubo un problema al procesar tu solicitud.";
    respText = respText.replace(/\n/g, '<br>');

    messagesContainer.innerHTML += '<div class="flex justify-start"><div class="bg-white border border-zinc-200 p-2.5 rounded-xl max-w-[85%] text-zinc-800 shadow-sm leading-relaxed">' + respText + '</div></div>';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (error) {
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();
    messagesContainer.innerHTML += '<div class="flex justify-start"><div class="bg-rose-50 border border-rose-200 text-rose-600 p-2.5 rounded-xl max-w-[85%]">Error de conexión. Asegúrate de que el backend (/api/chat) esté publicado.</div></div>';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}
