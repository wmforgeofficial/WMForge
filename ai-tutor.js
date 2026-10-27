/* WMForge AI Tutor. Configure WMFORGE_AI_ENDPOINT after deploying worker.js. */
(() => {
  'use strict';
  const ENDPOINT = 'https://wmforge-ai-tutor.wmforgeofficial.workers.dev/api/chat';
  const root = document.getElementById('wmforgeAiRoot');
  if (!root) return;
  const panel = document.getElementById('wmforgeAiPanel');
  const launcher = document.getElementById('wmforgeAiLauncher');
  const close = document.getElementById('wmforgeAiClose');
  const newChat = document.getElementById('wmforgeAiNew');
  const form = document.getElementById('wmforgeAiForm');
  const input = document.getElementById('wmforgeAiInput');
  const send = document.getElementById('wmforgeAiSend');
  const messages = document.getElementById('wmforgeAiMessages');
  const starters = document.getElementById('wmforgeAiStarters');
  const notice = document.getElementById('wmforgeAiNotice');
  const welcomeHTML = messages.innerHTML;
  let history = [];
  let busy = false;
  const setNotice = (message, type='') => { notice.textContent = message; notice.className = 'wmforge-ai-notice' + (type ? ' wmforge-ai-' + type : ''); };
  const openPanel = () => { panel.classList.add('wmforge-ai-open'); panel.setAttribute('aria-hidden','false'); launcher.setAttribute('aria-expanded','true'); setTimeout(() => input.focus(), 80); };
  const closePanel = () => { panel.classList.remove('wmforge-ai-open'); panel.setAttribute('aria-hidden','true'); launcher.setAttribute('aria-expanded','false'); launcher.focus(); };
  const addMessage = (text, role, extra='') => { const node = document.createElement('div'); node.className = 'wmforge-ai-message wmforge-ai-' + role + (extra ? ' wmforge-ai-' + extra : ''); node.textContent = text; messages.appendChild(node); messages.scrollTop = messages.scrollHeight; return node; };
  const resetChat = () => { if (busy) return; history = []; messages.innerHTML = welcomeHTML; input.value = ''; setNotice(ENDPOINT ? 'Ready. Ask a practical SAP WM question.' : 'Setup required: connect a secure AI backend to enable live answers.', ENDPOINT ? 'ready' : ''); };
  const sendPrompt = async (raw) => {
    const prompt = String(raw || '').trim();
    if (!prompt || busy) return;
    openPanel();
    if (!ENDPOINT) {
      if (starters.isConnected) starters.remove();
      addMessage(prompt, 'user');
      addMessage('The chat interface is ready, but live AI is not connected yet. The next step is to deploy the secure backend in worker.js and add its URL to ai-tutor.js. Your question has not been sent anywhere.', 'assistant');
      setNotice('Backend not configured — no message was sent.', 'error');
      input.value = '';
      return;
    }
    if (starters.isConnected) starters.remove();
    addMessage(prompt, 'user'); history.push({role:'user', content:prompt});
    const pending = addMessage('Working through your SAP WM question…', 'assistant', 'pending');
    input.value = ''; busy = true; send.disabled = true;
    try {
      const response = await fetch(ENDPOINT, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({messages:history.slice(-12)})});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'The AI service could not answer right now.');
      const answer = typeof data.answer === 'string' ? data.answer.trim() : '';
      if (!answer) throw new Error('The AI service returned an empty answer. Please try again.');
      pending.remove(); addMessage(answer, 'assistant'); history.push({role:'assistant', content:answer});
      setNotice('', '');
    } catch (error) {
      pending.remove(); addMessage(error.message || 'Something went wrong. Please try again later.', 'assistant');
      history.pop(); setNotice('Could not get an answer. Please retry shortly.', 'error');
    } finally { busy = false; send.disabled = false; input.focus(); }
  };
  launcher.addEventListener('click', () => panel.classList.contains('wmforge-ai-open') ? closePanel() : openPanel());
  close.addEventListener('click', closePanel);
  newChat.addEventListener('click', resetChat);
  form.addEventListener('submit', event => { event.preventDefault(); sendPrompt(input.value); });
  input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
  starters.addEventListener('click', event => { const button = event.target.closest('button[data-prompt]'); if (button) sendPrompt(button.dataset.prompt); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && panel.classList.contains('wmforge-ai-open')) closePanel(); });
  setNotice(ENDPOINT ? 'Ready. Ask a practical SAP WM question.' : 'Setup required: connect a secure AI backend to enable live answers.', ENDPOINT ? 'ready' : '');
})();
