const html = document.documentElement;
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionWasManuallyChanged = false;

html.dataset.motion = motionPreference.matches ? 'reduced' : 'full';

// ===== Season Detection =====
(function detectSeason() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  let season = 'default';

  if (month === 12 && (day === 24 || day === 25)) season = 'christmas-eve';
  else if ((month === 10 && day >= 25) || (month === 11 && day <= 2)) season = 'halloween';
  else if ((month === 12 && day >= 15) || (month === 1 && day <= 5)) season = 'christmas';
  else if (month === 12 || month === 1 || month === 2) season = 'winter';
  else if (month >= 3 && month <= 5) season = 'spring';
  else if (month >= 6 && month <= 8) season = 'summer';
  else if (month >= 9 && month <= 11) season = 'autumn';

  html.dataset.season = season;
})();

const footerMessages = {
  halloween: 'trick or treat · no bugs · clean code',
  christmas: 'silent night · clean signal',
  'christmas-eve': 'holy night · calm signal',
  winter: 'cold air · warm code',
  spring: 'fresh bloom · clean builds',
  summer: 'bright days · clean deploys',
  autumn: 'soft amber · steady code',
  default: 'no noise · no tracking · no ads · no explanation'
};

const themeEl = document.getElementById('themeName');
const motionEl = document.getElementById('motionName');
const footerEl = document.getElementById('footer-text');

function updateMeta() {
  themeEl.textContent = html.dataset.season || 'default';
  motionEl.textContent = html.dataset.motion === 'reduced' ? 'reduced' : 'full';
  footerEl.textContent = footerMessages[html.dataset.season] || footerMessages.default;
}

// ===== Intro Glitch =====
function runIntroGlitch() {
  if (html.dataset.motion === 'reduced') return;
  document.body.classList.add('intro-glitch');
  setTimeout(() => document.body.classList.remove('intro-glitch'), 400);
}

if (document.fonts?.ready) document.fonts.ready.then(runIntroGlitch);
else window.addEventListener('load', runIntroGlitch, { once: true });

// ===== Discord Copy =====
async function copyDiscord(button) {
  const name = button.dataset.name || 'alphav5';

  try {
    await navigator.clipboard.writeText(name);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = name;
    textarea.setAttribute('readonly', '');
    textarea.className = 'clipboard-fallback';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  const oldContent = button.innerHTML;
  button.innerHTML = '✓ Copied';
  setTimeout(() => { button.innerHTML = oldContent; }, 1200);
}

document.getElementById('discordBtn').addEventListener('click', event => copyDiscord(event.currentTarget));
document.getElementById('footerDiscordBtn').addEventListener('click', event => copyDiscord(event.currentTarget));

// ===== Personal Discord Presence =====
(function loadDiscordPresence() {
  const card = document.getElementById('discordCard');
  const userId = card.dataset.userId;
  const avatarEl = card.querySelector('.discord-avatar');
  const skeletonEl = card.querySelector('.discord-avatar-skeleton');
  const decorationEl = card.querySelector('.discord-decoration');
  const nameEl = card.querySelector('.discord-name');
  const statusEl = card.querySelector('.discord-status');
  const activityEl = card.querySelector('.discord-activity');

  fetch(`https://api.lanyard.rest/v1/users/${userId}`)
    .then(response => {
      if (!response.ok) throw new Error('Presence request failed');
      return response.json();
    })
    .then(({ data }) => {
      if (!data?.discord_user) throw new Error('Presence data unavailable');

      const user = data.discord_user;
      const fallbackIndex = Number(user.discriminator || 0) % 5;
      const avatarUrl = user.avatar
        ? `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png?size=128`
        : `https://cdn.discordapp.com/embed/avatars/${fallbackIndex}.png`;

      avatarEl.src = avatarUrl;
      avatarEl.alt = `${user.username} avatar`;
      avatarEl.onload = () => {
        skeletonEl.style.display = 'none';
        avatarEl.style.display = 'block';
      };
      avatarEl.onerror = () => {
        skeletonEl.style.display = 'none';
        avatarEl.style.display = 'block';
      };

      nameEl.textContent = user.display_name || user.username;
      const status = data.discord_status || 'offline';
      statusEl.dataset.status = status;
      statusEl.textContent = {
        online: 'online',
        idle: 'idle',
        dnd: 'do not disturb',
        offline: 'offline'
      }[status] || status;

      const activity = (data.activities || []).find(item => item.type !== 4);
      if (!activity) activityEl.textContent = 'No activity';
      else if (activity.name === 'Spotify') activityEl.textContent = `♪ ${activity.state || '?'} — ${activity.details || '?'}`;
      else {
        const parts = [activity.details, activity.state].filter(Boolean);
        activityEl.textContent = parts.length ? `${activity.name}: ${parts.join(' · ')}` : activity.name;
      }

      const decoration = user.avatar_decoration_data?.asset;
      if (decoration) {
        decorationEl.src = `https://cdn.discordapp.com/avatar-decoration-presets/${decoration}.png`;
        decorationEl.alt = '';
        decorationEl.style.display = 'block';
      } else {
        decorationEl.style.display = 'none';
      }
    })
    .catch(() => {
      skeletonEl.style.display = 'none';
      statusEl.dataset.status = 'offline';
      statusEl.textContent = 'offline';
      activityEl.textContent = 'Presence unavailable';
      decorationEl.style.display = 'none';
    });
})();

// ===== Shop Discord Widget Data =====
(function loadShopServer() {
  const statusEl = document.getElementById('shopServerStatus');
  const joinLink = document.getElementById('shopJoinLink');

  fetch('https://discord.com/api/guilds/1498761456735354890/widget.json')
    .then(response => {
      if (!response.ok) throw new Error('Widget request failed');
      return response.json();
    })
    .then(data => {
      const online = Number.isFinite(data.presence_count) ? data.presence_count : 0;
      statusEl.textContent = `${online} online on ${data.name || 'the shop server'}`;
      if (data.instant_invite) joinLink.href = data.instant_invite;
    })
    .catch(() => {
      statusEl.textContent = 'Shop server available on Discord';
    });
})();

// ===== Cursor Glow =====
const glow = document.getElementById('cursor-glow');
const buttons = document.querySelectorAll('.btn');
let mouseX = innerWidth / 2;
let mouseY = innerHeight / 2;
let glowX = mouseX;
let glowY = mouseY;
let glowLocked = false;
let animationFrameId = null;

window.addEventListener('mousemove', event => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

function animateGlow() {
  if (!glowLocked) {
    glowX += (mouseX - glowX) * 0.14;
    glowY += (mouseY - glowY) * 0.14;
    glow.style.left = `${glowX}px`;
    glow.style.top = `${glowY}px`;
  }
  animationFrameId = requestAnimationFrame(animateGlow);
}

function syncMotion() {
  const shouldAnimate = html.dataset.motion !== 'reduced' && !document.hidden;
  if (shouldAnimate && animationFrameId === null) animateGlow();
  if (!shouldAnimate && animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  updateMeta();
}

document.addEventListener('visibilitychange', syncMotion);
motionPreference.addEventListener('change', event => {
  if (motionWasManuallyChanged) return;
  html.dataset.motion = event.matches ? 'reduced' : 'full';
  syncMotion();
});

buttons.forEach(button => {
  button.addEventListener('mouseenter', () => {
    if (html.dataset.motion === 'reduced') return;
    const rect = button.getBoundingClientRect();
    glowLocked = true;
    glow.style.left = `${rect.left + rect.width / 2}px`;
    glow.style.top = `${rect.top + rect.height / 2}px`;
    glow.style.width = `${rect.width + 24}px`;
    glow.style.height = `${rect.height + 24}px`;
    glow.style.borderRadius = '18px';
    glow.style.background = 'linear-gradient(90deg, var(--snap-soft), var(--snap-strong), var(--snap-soft)), linear-gradient(0deg, var(--snap-soft), var(--snap-strong), var(--snap-soft))';
    glow.style.filter = 'blur(18px)';
    glow.style.opacity = '.62';
  });

  button.addEventListener('mouseleave', () => {
    glowLocked = false;
    glow.style.width = '260px';
    glow.style.height = '260px';
    glow.style.borderRadius = '50%';
    glow.style.background = 'radial-gradient(circle, var(--glow-main), var(--glow-soft), transparent 65%)';
    glow.style.filter = 'blur(20px)';
    glow.style.opacity = '.9';
  });
});

// ===== Navigation & Scroll Reveal =====
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('revealed');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.section, .project-card, .stack-group, .about-text, .about-tags')
  .forEach(element => revealObserver.observe(element));

// ===== Command Palette =====
const palette = document.getElementById('palette');
const commandInput = document.getElementById('cmdInput');
const commandList = document.getElementById('cmdList');
let focusBeforePalette = null;

const commands = [
  { key: 'github', name: 'Open GitHub', desc: 'go to github.com/AlphaGlyph1371', run: () => window.open('https://github.com/AlphaGlyph1371', '_blank', 'noopener,noreferrer') },
  { key: 'discord', name: 'Copy Discord', desc: 'copy: alphav5', run: () => copyDiscord(document.getElementById('discordBtn')) },
  { key: 'about', name: 'Jump to About', desc: 'scroll to about section', run: () => document.getElementById('about').scrollIntoView({ behavior: html.dataset.motion === 'reduced' ? 'auto' : 'smooth' }) },
  { key: 'projects', name: 'Jump to Projects', desc: 'scroll to projects section', run: () => document.getElementById('projects').scrollIntoView({ behavior: html.dataset.motion === 'reduced' ? 'auto' : 'smooth' }) },
  { key: 'shop', name: 'Jump to Shop', desc: 'open the shop Discord section', run: () => document.getElementById('shop').scrollIntoView({ behavior: html.dataset.motion === 'reduced' ? 'auto' : 'smooth' }) },
  { key: 'stack', name: 'Jump to Stack', desc: 'scroll to stack section', run: () => document.getElementById('stack').scrollIntoView({ behavior: html.dataset.motion === 'reduced' ? 'auto' : 'smooth' }) },
  { key: 'season', name: 'Next Season Theme', desc: 'cycle through all seasonal themes', run: () => window.season.next() },
  {
    key: 'motion',
    name: 'Toggle Reduced Motion',
    desc: 'enable or disable animations',
    run: () => {
      motionWasManuallyChanged = true;
      html.dataset.motion = html.dataset.motion === 'reduced' ? 'full' : 'reduced';
      syncMotion();
    }
  }
];

function runCommand(key) {
  const command = commands.find(item => item.key === key);
  if (!command) return;
  closePalette();
  command.run();
}

function renderCommands(filter = '') {
  const query = filter.trim().toLowerCase();
  const matchingCommands = commands.filter(command => (
    !query ||
    command.key.includes(query) ||
    command.name.toLowerCase().includes(query) ||
    command.desc.toLowerCase().includes(query)
  ));

  commandList.replaceChildren();

  matchingCommands.forEach(command => {
    const button = document.createElement('button');
    button.className = 'cmd';
    button.type = 'button';
    button.dataset.key = command.key;

    const left = document.createElement('span');
    left.className = 'left';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = command.name;
    const description = document.createElement('span');
    description.className = 'desc';
    description.textContent = command.desc;
    left.append(name, description);

    const keyHint = document.createElement('kbd');
    keyHint.textContent = '↵';
    keyHint.setAttribute('aria-hidden', 'true');
    button.append(left, keyHint);
    button.addEventListener('click', () => runCommand(command.key));
    commandList.appendChild(button);
  });
}

function openPalette() {
  focusBeforePalette = document.activeElement;
  palette.dataset.open = 'true';
  palette.setAttribute('aria-hidden', 'false');
  commandInput.value = '';
  renderCommands();
  commandInput.focus();
}

function closePalette() {
  if (palette.dataset.open !== 'true') return;
  palette.dataset.open = 'false';
  palette.setAttribute('aria-hidden', 'true');
  if (focusBeforePalette instanceof HTMLElement) focusBeforePalette.focus();
}

document.getElementById('openPaletteBtn').addEventListener('click', openPalette);
document.getElementById('closePaletteBtn').addEventListener('click', closePalette);
commandInput.addEventListener('input', event => renderCommands(event.target.value));
commandInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') commandList.querySelector('.cmd')?.click();
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    commandList.querySelector('.cmd')?.focus();
  }
});

commandList.addEventListener('keydown', event => {
  if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
  event.preventDefault();
  const items = [...commandList.querySelectorAll('.cmd')];
  const currentIndex = items.indexOf(document.activeElement);
  const nextIndex = event.key === 'ArrowDown'
    ? (currentIndex + 1) % items.length
    : (currentIndex - 1 + items.length) % items.length;
  items[nextIndex]?.focus();
});

palette.addEventListener('mousedown', event => {
  if (event.target === palette) closePalette();
});

palette.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closePalette();
    return;
  }

  if (event.key !== 'Tab') return;
  const focusable = [...palette.querySelectorAll('button:not([disabled]), input:not([disabled])')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

window.addEventListener('keydown', event => {
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  const isEditable = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

  if ((isMac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    palette.dataset.open === 'true' ? closePalette() : openPalette();
  } else if (event.key === '?' && !isEditable && palette.dataset.open !== 'true') {
    openPalette();
  }
});

// ===== Season Control =====
window.season = {
  set(name) {
    const valid = ['default', 'spring', 'summer', 'autumn', 'winter', 'halloween', 'christmas', 'christmas-eve'];
    if (!valid.includes(name)) {
      console.warn('Invalid season:', name);
      return;
    }
    html.dataset.season = name;
    updateMeta();
  },
  current() {
    return html.dataset.season;
  },
  next() {
    const order = ['default', 'spring', 'summer', 'autumn', 'winter', 'halloween', 'christmas', 'christmas-eve'];
    this.set(order[(order.indexOf(this.current()) + 1) % order.length]);
  }
};

updateMeta();
syncMotion();
console.info('%cAlpha · Ctrl/⌘K for commands · season.next() for themes', 'color: #8df6ff; font-family: monospace; font-size: 11px;');
