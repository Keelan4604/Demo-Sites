/* ========================================
   8:30 BEER CHALLENGE — GAME ENGINE
   ======================================== */

const TOTAL_SECONDS = 8 * 60 + 30; // 510 seconds
const DANGER_THRESHOLD = 30; // seconds remaining when things get urgent
const CIRCUMFERENCE = 2 * Math.PI * 90; // timer ring circumference

// ---- STATE ----
let players = [];
let currentRound = 0;
let remaining = TOTAL_SECONDS;
let running = false;
let intervalId = null;
let gameStartTime = null;
let roundHistory = [];

// ---- DOM REFS ----
const $ = (id) => document.getElementById(id);
const setupScreen = $('setupScreen');
const gameScreen = $('gameScreen');
const gameOverScreen = $('gameOverScreen');
const playerNameInput = $('playerNameInput');
const addPlayerBtn = $('addPlayerBtn');
const playerList = $('playerList');
const startGameBtn = $('startGameBtn');
const roundBadge = $('roundBadge');
const timerDisplay = $('timerDisplay');
const timerLabel = $('timerLabel');
const timerRingProgress = $('timerRingProgress');
const beerFill = $('beerFill');
const beerLabel = $('beerLabel');
const startPauseBtn = $('startPauseBtn');
const startPauseText = $('startPauseText');
const resetBtn = $('resetBtn');
const roundCompleteBtn = $('roundCompleteBtn');
const playersGrid = $('playersGrid');
const survivorCount = $('survivorCount');
const historyList = $('historyList');
const menuBtn = $('menuBtn');
const menuOverlay = $('menuOverlay');
const endGameBtn = $('endGameBtn');
const resetGameBtn = $('resetGameBtn');
const closeMenuBtn = $('closeMenuBtn');
const playAgainBtn = $('playAgainBtn');
const newPlayersBtn = $('newPlayersBtn');
const confettiCanvas = $('confettiCanvas');
const bubbleCanvas = $('bubbleCanvas');

// ---- TIMER RING SVG GRADIENT ----
(function injectGradient() {
  const svg = document.querySelector('.timer-ring');
  if (!svg) return;
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  grad.setAttribute('id', 'timerGradient');
  grad.setAttribute('x1', '0%');
  grad.setAttribute('y1', '0%');
  grad.setAttribute('x2', '100%');
  grad.setAttribute('y2', '100%');
  const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  s1.setAttribute('offset', '0%');
  s1.setAttribute('stop-color', '#f59e0b');
  const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  s2.setAttribute('offset', '100%');
  s2.setAttribute('stop-color', '#22c55e');
  grad.appendChild(s1);
  grad.appendChild(s2);
  defs.appendChild(grad);
  svg.prepend(defs);
})();

// ---- SCREEN MANAGEMENT ----
function showScreen(screen) {
  [setupScreen, gameScreen, gameOverScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// ---- PLAYER MANAGEMENT ----
function addPlayer(name) {
  name = name.trim();
  if (!name || players.some(p => p.name.toLowerCase() === name.toLowerCase())) return;
  players.push({ name, status: 'drinking', roundsCompleted: 0 });
  renderPlayerChips();
  playerNameInput.value = '';
  playerNameInput.focus();
  updateStartBtn();
}

function removePlayer(index) {
  players.splice(index, 1);
  renderPlayerChips();
  updateStartBtn();
}

function renderPlayerChips() {
  playerList.innerHTML = players.map((p, i) => `
    <div class="player-chip">
      <span>${p.name}</span>
      <span class="remove-player" data-index="${i}">&times;</span>
    </div>
  `).join('');
}

function updateStartBtn() {
  startGameBtn.disabled = false; // Always allow starting, players are optional
}

// Quick add players
function quickAddPlayers(count) {
  const names = ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8'];
  players = [];
  for (let i = 0; i < count; i++) {
    players.push({ name: names[i], status: 'drinking', roundsCompleted: 0 });
  }
  renderPlayerChips();
  updateStartBtn();
}

// ---- GAME FLOW ----
function startGame() {
  currentRound = 1;
  gameStartTime = Date.now();
  roundHistory = [];
  players.forEach(p => { p.status = 'drinking'; p.roundsCompleted = 0; });
  remaining = TOTAL_SECONDS;
  running = false;
  showScreen(gameScreen);
  renderGameUI();
}

function renderGameUI() {
  // Round badge
  roundBadge.textContent = `ROUND ${currentRound}`;

  // Timer
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Timer ring
  const pct = remaining / TOTAL_SECONDS;
  const offset = CIRCUMFERENCE * (1 - pct);
  timerRingProgress.style.strokeDasharray = CIRCUMFERENCE;
  timerRingProgress.style.strokeDashoffset = offset;

  // Timer states
  const wrap = document.querySelector('.timer-ring-wrap');
  wrap.classList.remove('timer-running', 'timer-danger', 'timer-expired');
  if (remaining === 0) {
    wrap.classList.add('timer-expired');
    timerLabel.textContent = "TIME'S UP!";
  } else if (remaining <= DANGER_THRESHOLD && running) {
    wrap.classList.add('timer-danger');
    timerLabel.textContent = 'HURRY UP!';
  } else if (running) {
    wrap.classList.add('timer-running');
    timerLabel.textContent = 'DRINKING...';
  } else {
    timerLabel.textContent = remaining === TOTAL_SECONDS ? 'TAP TO START' : 'PAUSED';
  }

  // Beer glass fill
  const fillPct = (remaining / TOTAL_SECONDS) * 100;
  beerFill.style.height = `${fillPct}%`;
  if (remaining === 0) {
    beerLabel.textContent = 'Glass empty — time\'s up!';
  } else if (remaining <= DANGER_THRESHOLD) {
    beerLabel.textContent = 'Almost empty — drink faster!';
  } else if (remaining < TOTAL_SECONDS * 0.5) {
    beerLabel.textContent = 'Halfway there...';
  } else {
    beerLabel.textContent = 'Full beer — ready to drink!';
  }

  // Start/Pause button
  if (running) {
    startPauseBtn.classList.add('running');
    startPauseText.textContent = 'Pause';
  } else {
    startPauseBtn.classList.remove('running');
    startPauseText.textContent = remaining === 0 ? 'Finished' : 'Start';
  }
  startPauseBtn.disabled = remaining === 0;

  // Players grid
  const playersCard = document.querySelector('.players-card');
  if (players.length === 0) {
    playersCard.style.display = 'none';
  } else {
    playersCard.style.display = '';
    const activePlayers = players.filter(p => p.status !== 'out');
    survivorCount.textContent = `(${activePlayers.length} active)`;

    playersGrid.innerHTML = players.map((p, i) => `
      <div class="player-card ${p.status}" data-index="${i}" title="Click to toggle status">
        <div class="player-avatar">${p.name.charAt(0).toUpperCase()}</div>
        <div class="player-name">${p.name}</div>
        <div class="player-status">${
          p.status === 'drinking' ? '🍺 Drinking' :
          p.status === 'finished' ? '✅ Done' :
          '❌ Out'
        }</div>
      </div>
    `).join('');

    // Round complete button glow
    const allFinished = activePlayers.length > 0 && activePlayers.every(p => p.status === 'finished');
    roundCompleteBtn.classList.toggle('glow', allFinished);
  }

  // History — only rebuild if round count changed to prevent animation flicker
  const historyCount = historyList.querySelectorAll('.history-entry').length;
  if (historyCount !== roundHistory.length) {
    if (roundHistory.length === 0) {
      historyList.innerHTML = '<p class="hint">No rounds completed yet. Let\'s go!</p>';
    } else {
      historyList.innerHTML = roundHistory.map(h => `
        <div class="history-entry">
          <div class="history-round">R${h.round}</div>
          <div class="history-details">${h.total > 0 ? `${h.survivors}/${h.total} survived` : 'Round completed!'}</div>
          <div class="history-time">${h.time}</div>
        </div>
      `).join('');
    }
  }
}

// ---- TIMER ----
function startTimer() {
  if (running || remaining === 0) return;
  running = true;
  intervalId = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      remaining = 0;
      stopTimer();
      playSound('alarm');
    } else if (remaining === DANGER_THRESHOLD) {
      playSound('warning');
    } else if (remaining <= 5) {
      playSound('tick');
    }
    renderGameUI();
  }, 1000);
  renderGameUI();
}

function stopTimer() {
  running = false;
  clearInterval(intervalId);
  intervalId = null;
  renderGameUI();
}

function resetTimer() {
  stopTimer();
  remaining = TOTAL_SECONDS;
  players.forEach(p => { if (p.status !== 'out') p.status = 'drinking'; });
  renderGameUI();
}

function toggleTimer() {
  if (running) stopTimer();
  else startTimer();
}

// ---- PLAYER STATUS TOGGLE ----
function cyclePlayerStatus(index) {
  const p = players[index];
  if (p.status === 'drinking') p.status = 'finished';
  else if (p.status === 'finished') p.status = 'out';
  else p.status = 'drinking';
  playSound('click');
  renderGameUI();
}

// ---- ROUND COMPLETE ----
function completeRound() {
  const activePlayers = players.filter(p => p.status !== 'out');
  const finishedPlayers = activePlayers.filter(p => p.status === 'finished');
  const eliminatedThisRound = activePlayers.filter(p => p.status === 'drinking');

  // Mark unfinished active players as out (only if players exist)
  eliminatedThisRound.forEach(p => p.status = 'out');

  // Record finished players
  finishedPlayers.forEach(p => p.roundsCompleted++);

  const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const survivorCount = players.length > 0 ? finishedPlayers.length : 0;
  const totalCount = players.length > 0 ? activePlayers.length : 0;
  roundHistory.push({
    round: currentRound,
    survivors: survivorCount,
    total: totalCount,
    eliminated: eliminatedThisRound.length,
    time: stamp
  });

  // Celebrate!
  playSound('celebrate');
  fireConfetti();

  // Next round
  currentRound++;
  remaining = TOTAL_SECONDS;
  running = false;
  clearInterval(intervalId);
  intervalId = null;

  // Reset active players to drinking
  players.forEach(p => { if (p.status !== 'out') p.status = 'drinking'; });

  renderGameUI();
}

// ---- GAME OVER ----
function endGame() {
  stopTimer();
  showScreen(gameOverScreen);

  const totalRounds = currentRound;
  const totalBeers = players.reduce((sum, p) => sum + p.roundsCompleted, 0);
  const elapsed = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
  const elapsedMins = Math.floor(elapsed / 60);
  const elapsedSecs = elapsed % 60;

  $('finalRounds').textContent = totalRounds;
  $('finalBeers').textContent = totalBeers;
  $('finalTime').textContent = `${elapsedMins}:${String(elapsedSecs).padStart(2, '0')}`;

  if (players.length > 0) {
    $('finalPlayerStats').innerHTML = players.map(p => `
      <div class="final-player-stat">
        ${p.name}: <span class="beer-count">${p.roundsCompleted} beers</span>
      </div>
    `).join('');
  } else {
    $('finalPlayerStats').innerHTML = '';
  }

  fireConfetti();
  playSound('celebrate');
}

// ---- SOUNDS ----
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    if (type === 'click') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(1200, now);
      g.gain.setValueAtTime(0.05, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.08);
    }

    if (type === 'tick') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, now);
      o.frequency.exponentialRampToValueAtTime(440, now + 0.15);
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.15);
    }

    if (type === 'warning') {
      for (let i = 0; i < 3; i++) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(600, now + i * 0.2);
        g.gain.setValueAtTime(0.08, now + i * 0.2);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.15);
        o.connect(g); g.connect(ctx.destination);
        o.start(now + i * 0.2); o.stop(now + i * 0.2 + 0.15);
      }
    }

    if (type === 'alarm') {
      for (let i = 0; i < 5; i++) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(i % 2 === 0 ? 800 : 600, now + i * 0.25);
        g.gain.setValueAtTime(0.1, now + i * 0.25);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.2);
        o.connect(g); g.connect(ctx.destination);
        o.start(now + i * 0.25); o.stop(now + i * 0.25 + 0.2);
      }
    }

    if (type === 'celebrate') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + i * 0.12);
        g.gain.setValueAtTime(0.1, now + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
        o.connect(g); g.connect(ctx.destination);
        o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.4);
      });
    }
  } catch (e) {
    // Audio not supported — silently fail
  }
}

// ---- CONFETTI ----
let confettiParticles = [];
let confettiAnimId = null;

function fireConfetti() {
  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  confettiParticles = [];

  const colors = ['#f59e0b', '#fbbf24', '#eab308', '#22c55e', '#ef4444', '#3b82f6', '#a855f7', '#ec4899'];

  for (let i = 0; i < 150; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }

  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);

  function animateConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = false;

    confettiParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.rotation += p.rotSpeed;
      if (p.y > confettiCanvas.height - 50) p.opacity -= 0.02;
      if (p.opacity <= 0) return;
      alive = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (alive) confettiAnimId = requestAnimationFrame(animateConfetti);
    else ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }

  animateConfetti();
}

// ---- BUBBLE BACKGROUND ----
(function initBubbles() {
  const ctx = bubbleCanvas.getContext('2d');
  let bubbles = [];
  const MAX_BUBBLES = 30;

  function resize() {
    bubbleCanvas.width = window.innerWidth;
    bubbleCanvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function spawnBubble() {
    if (bubbles.length >= MAX_BUBBLES) return;
    bubbles.push({
      x: Math.random() * bubbleCanvas.width,
      y: bubbleCanvas.height + 20,
      r: 3 + Math.random() * 8,
      speed: 0.3 + Math.random() * 0.8,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.01 + Math.random() * 0.02,
      opacity: 0.1 + Math.random() * 0.2
    });
  }

  function animate() {
    ctx.clearRect(0, 0, bubbleCanvas.width, bubbleCanvas.height);

    if (Math.random() < 0.15) spawnBubble();

    bubbles = bubbles.filter(b => b.y + b.r > -20);

    bubbles.forEach(b => {
      b.y -= b.speed;
      b.wobble += b.wobbleSpeed;
      const wx = Math.sin(b.wobble) * 1.5;

      ctx.beginPath();
      ctx.arc(b.x + wx, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 158, 11, ${b.opacity})`;
      ctx.fill();

      // Highlight
      ctx.beginPath();
      ctx.arc(b.x + wx - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 0.6})`;
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }

  animate();
})();

// ---- EVENT LISTENERS ----

// Setup: Add player
addPlayerBtn.addEventListener('click', () => addPlayer(playerNameInput.value));
playerNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addPlayer(playerNameInput.value);
});

// Setup: Remove player chips
playerList.addEventListener('click', (e) => {
  const rm = e.target.closest('.remove-player');
  if (rm) removePlayer(parseInt(rm.dataset.index));
});

// Setup: Quick add
document.querySelectorAll('[data-quick]').forEach(btn => {
  btn.addEventListener('click', () => quickAddPlayers(parseInt(btn.dataset.quick)));
});

// Setup: Start game
startGameBtn.addEventListener('click', startGame);

// Game: Timer controls
startPauseBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);

// Game: Timer ring click to start
document.querySelector('.timer-ring-wrap')?.addEventListener('click', () => {
  if (!running && remaining > 0) startTimer();
});

// Game: Player card click
playersGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.player-card');
  if (card) cyclePlayerStatus(parseInt(card.dataset.index));
});

// Game: Round complete
roundCompleteBtn.addEventListener('click', completeRound);

// Menu
menuBtn.addEventListener('click', () => menuOverlay.classList.add('active'));
closeMenuBtn.addEventListener('click', () => menuOverlay.classList.remove('active'));
menuOverlay.addEventListener('click', (e) => {
  if (e.target === menuOverlay) menuOverlay.classList.remove('active');
});
endGameBtn.addEventListener('click', () => {
  menuOverlay.classList.remove('active');
  endGame();
});
resetGameBtn.addEventListener('click', () => {
  menuOverlay.classList.remove('active');
  resetTimer();
});

// Game Over
playAgainBtn.addEventListener('click', () => {
  players.forEach(p => { p.status = 'drinking'; });
  currentRound++;
  remaining = TOTAL_SECONDS;
  running = false;
  gameStartTime = Date.now();
  showScreen(gameScreen);
  renderGameUI();
});

newPlayersBtn.addEventListener('click', () => {
  players = [];
  renderPlayerChips();
  updateStartBtn();
  showScreen(setupScreen);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (gameScreen.classList.contains('active')) {
    if (e.code === 'Space') { e.preventDefault(); toggleTimer(); }
    if (e.code === 'KeyR') resetTimer();
    if (e.code === 'Enter') completeRound();
  }
});

// Window resize for confetti
window.addEventListener('resize', () => {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
});

// Init
renderPlayerChips();
updateStartBtn();
