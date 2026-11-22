/* Portfolio Copilot Chatbot — Version 1 IDE Edition */
(function () {
  const bodyEl = document.getElementById('chat-body');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');
  const chipsEl = document.getElementById('chat-chips');
  const aiDock = document.getElementById('ai-dock');
  const closeBtn = document.getElementById('chat-close');
  const fabBtn = document.getElementById('chat-fab');
  const aiToggleBtn = document.getElementById('ai-toggle-btn');
  const activityAiToggle = document.getElementById('activity-ai-toggle');

  if (!bodyEl || !form) return;

  const history = [];
  let busy = false;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DEFAULT_CHIPS = ['What has he built?', 'What’s his tech stack?', 'Tell me about his experience', 'How can I contact him?'];

  const scroll = () => {
    bodyEl.scrollTop = bodyEl.scrollHeight;
  };

  // ── Open / Close / Toggle Right AI Dock ──
  function isMobile() {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  const topAiBtn = document.getElementById('toggle-ai-layout-btn');

  // Ensure default state is collapsed on initial landing
  if (!document.body.classList.contains('ai-open')) {
    document.body.classList.add('ai-collapsed');
    if (activityAiToggle) activityAiToggle.classList.remove('active');
    if (topAiBtn) topAiBtn.classList.remove('active');
  }

  window.openChat = function () {
    document.body.classList.remove('ai-collapsed');
    document.body.classList.add('ai-open');
    if (activityAiToggle) activityAiToggle.classList.add('active');
    if (topAiBtn) topAiBtn.classList.add('active');
    setTimeout(() => {
      if (input) input.focus();
    }, 250);
  };

  window.closeChat = function () {
    document.body.classList.add('ai-collapsed');
    document.body.classList.remove('ai-open');
    if (activityAiToggle) activityAiToggle.classList.remove('active');
    if (topAiBtn) topAiBtn.classList.remove('active');
  };

  window.toggleChat = function () {
    if (document.body.classList.contains('ai-collapsed')) {
      window.openChat();
    } else {
      window.closeChat();
    }
  };

  if (closeBtn) closeBtn.addEventListener('click', window.closeChat);
  if (fabBtn) fabBtn.addEventListener('click', window.openChat);
  if (aiToggleBtn) aiToggleBtn.addEventListener('click', window.toggleChat);
  if (activityAiToggle) activityAiToggle.addEventListener('click', window.toggleChat);

  document.querySelectorAll('[data-open-chat]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.openChat();
      const prompt = btn.getAttribute('data-ask');
      if (prompt) window.askChat(prompt);
    });
  });

  // ── Messages rendering ──
  function addMsg(role, text) {
    const m = document.createElement('div');
    m.className = 'msg ' + role;
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = text; // Safe textContent avoids XSS
    m.appendChild(b);
    bodyEl.appendChild(m);
    scroll();
    return { m, b };
  }

  function typingEl() {
    const m = document.createElement('div');
    m.className = 'msg bot';
    m.innerHTML = '<div class="bubble typing"><i></i><i></i><i></i></div>';
    bodyEl.appendChild(m);
    scroll();
    return m;
  }

  function setChips(list) {
    chipsEl.innerHTML = '';
    (list || []).slice(0, 4).forEach(t => {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'chip';
      c.textContent = t;
      c.addEventListener('click', () => ask(t));
      chipsEl.appendChild(c);
    });
  }

  function reveal(el, text) {
    return new Promise(res => {
      if (reduce) {
        el.textContent = text;
        return res();
      }
      const parts = text.split(/(\s+)/);
      let i = 0;
      el.textContent = '';
      const t = setInterval(() => {
        el.textContent += parts[i++] || '';
        scroll();
        if (i >= parts.length) {
          clearInterval(t);
          res();
        }
      }, 18);
    });
  }

  function addSources(msgEl, sources) {
    if (!sources || !sources.length) return;
    const d = document.createElement('div');
    d.className = 'srcs';
    sources.forEach(s => {
      const a = document.createElement('a');
      a.className = 'src';
      a.href = '#' + s.section;
      a.textContent = '↗ ' + s.label + (s.label.endsWith('.py') || s.label.endsWith('.sh') ? '' : '.py');
      a.addEventListener('click', (e) => {
        const target = document.getElementById(s.section);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          if (isMobile()) window.closeChat();
        }
      });
      d.appendChild(a);
    });
    msgEl.appendChild(d);
    scroll();
  }

  async function ask(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    window.openChat();
    busy = true;
    if (send) send.disabled = true;
    if (input) input.value = '';
    chipsEl.innerHTML = '';

    addMsg('user', text);
    const typing = typingEl();

    let data;
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(-8) })
      });
      data = await r.json();
      if (!data.reply) {
        data = { reply: 'Something went wrong on my side — please try asking again.', sources: [], suggestions: [] };
      }
    } catch (e) {
      data = { reply: 'Cannot connect to server. Feel free to use the contact form below or reach out via email!', sources: [], suggestions: [] };
    }

    await new Promise(r => setTimeout(r, reduce ? 0 : 250));
    typing.remove();
    const { m, b } = addMsg('bot', '');
    await reveal(b, data.reply);
    addSources(m, data.sources);
    history.push({ role: 'user', content: text }, { role: 'assistant', content: data.reply });
    setChips(data.suggestions && data.suggestions.length ? data.suggestions : DEFAULT_CHIPS);
    busy = false;
    if (send) send.disabled = false;
    if (!isMobile() && input) input.focus();
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    ask(input.value);
  });

  window.askChat = ask;

  // Initial greeting
  (async () => {
    const { m, b } = addMsg('bot', '');
    const titleEl = document.querySelector('.ai-dock-title');
    const name = titleEl ? titleEl.textContent.replace(/^Ask\s+/i, '').replace(/['’]s\s+AI.*$/i, '').trim() : 'Pankaj';
    await reveal(b, `Hey! I'm ${name}'s AI Assistant. Ask me about his machine learning projects, tech stack, experience, or hiring details.`);
    setChips(DEFAULT_CHIPS);
  })();
})();
