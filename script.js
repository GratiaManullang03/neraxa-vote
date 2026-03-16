/* ============================================================
   CONFIGURATION
============================================================ */
// Environment variables (set in Vercel dashboard or .env.local for development)
// For Vercel: Add these as environment variables in your project settings
const UPSTASH_REDIS_REST_URL = 'https://enhanced-tahr-57846.upstash.io';
const UPSTASH_REDIS_REST_TOKEN =
    'AeH2AAIncDEzMmJiZjg0ZTI5MzY0ODk1YTNiZTc1OTU0ZDMzNzNmOXAxNTc4NDY';

// Fallback to localStorage if Upstash is not configured
const USE_UPSTASH = UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN;

/* ============================================================
   STORAGE
============================================================ */
const KEY_VOTED = 'neraxa_v1_voted',
    KEY_CHOICE = 'neraxa_v1_choice',
    KEY_VOTES = 'neraxa_v1_votes',
    KEY_NOTES = 'neraxa_v1_notes';

const SEED = {
    'Neo-Brutalism': 0,
    Glassmorphism: 0,
    Neumorphism: 0,
    Claymorphism: 0,
    'Cyberpunk UI': 0,
    'Material Design': 0,
    Minimalism: 0,
};
const MEDALS = { 0: '🥇', 1: '🥈', 2: '🥉' };

// Upstash Redis API calls
async function redisCommand(command) {
    if (!USE_UPSTASH) return null;
    try {
        const response = await fetch(UPSTASH_REDIS_REST_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(command),
        });
        return await response.json();
    } catch (e) {
        console.error('Redis command failed:', e);
        return null;
    }
}

async function getVotesFromRedis() {
    const result = await redisCommand(['HGETALL', 'neraxa:votes']);
    if (result && result.result) {
        const votes = {};
        const arr = result.result;
        for (let i = 0; i < arr.length; i += 2) {
            votes[arr[i]] = parseInt(arr[i + 1], 10);
        }
        return votes;
    }
    return null;
}

async function saveVoteToRedis(design, notes) {
    if (!USE_UPSTASH) return false;
    try {
        console.log('Saving vote to Redis:', {
            design,
            notes: notes ? '(provided)' : '(none)',
        });
        // Increment vote count
        const voteResult = await redisCommand([
            'HINCRBY',
            'neraxa:votes',
            design,
            1,
        ]);
        console.log('Vote increment result:', voteResult);
        // Store note if provided
        if (notes && notes.trim()) {
            const timestamp = Date.now();
            const noteId = `note:${timestamp}:${Math.random().toString(36).substr(2, 9)}`;
            const noteData = { design, notes, timestamp };
            const noteResult = await redisCommand([
                'HSET',
                'neraxa:notes',
                noteId,
                JSON.stringify(noteData),
            ]);
            console.log('Note saved with ID:', noteId, noteResult);
        }
        console.log('Vote saved successfully to Redis');
        return true;
    } catch (e) {
        console.error('Failed to save vote to Redis:', e);
        return false;
    }
}

async function getAllNotesFromRedis() {
    const result = await redisCommand(['HGETALL', 'neraxa:notes']);
    if (result && result.result) {
        const notes = [];
        const arr = result.result;
        for (let i = 0; i < arr.length; i += 2) {
            try {
                notes.push(JSON.parse(arr[i + 1]));
            } catch (e) {}
        }
        return notes.sort((a, b) => b.timestamp - a.timestamp);
    }
    return [];
}

// LocalStorage fallback
function getVotesFromLocal() {
    try {
        const r = localStorage.getItem(KEY_VOTES);
        if (r) return JSON.parse(r);
    } catch (_) {}
    return { ...SEED };
}

function saveVotesToLocal(v) {
    try {
        localStorage.setItem(KEY_VOTES, JSON.stringify(v));
    } catch (_) {}
}

function hasVoted() {
    try {
        return localStorage.getItem(KEY_VOTED) === 'true';
    } catch (_) {
        return false;
    }
}

function getPrevChoice() {
    try {
        return localStorage.getItem(KEY_CHOICE) || '';
    } catch (_) {
        return '';
    }
}

function saveVoteLocal(design, notes) {
    const votes = getVotesFromLocal();
    votes[design] = (votes[design] || 0) + 1;
    saveVotesToLocal(votes);
    if (notes && notes.trim()) {
        const allNotes = JSON.parse(localStorage.getItem(KEY_NOTES) || '[]');
        allNotes.push({ design, notes, timestamp: Date.now() });
        localStorage.setItem(KEY_NOTES, JSON.stringify(allNotes));
    }
}

function getNotesFromLocal() {
    try {
        return JSON.parse(localStorage.getItem(KEY_NOTES) || '[]');
    } catch (_) {
        return [];
    }
}

// Unified functions
async function getVotes() {
    if (USE_UPSTASH) {
        const redisVotes = await getVotesFromRedis();
        if (redisVotes && Object.keys(redisVotes).length > 0) {
            return redisVotes;
        }
    }
    return getVotesFromLocal();
}

async function submitVote(design, notes) {
    if (USE_UPSTASH) {
        const success = await saveVoteToRedis(design, notes);
        if (success) {
            try {
                localStorage.setItem(KEY_VOTED, 'true');
                localStorage.setItem(KEY_CHOICE, design);
            } catch (_) {}
            return true;
        }
        // Fallback to local if Redis fails
        saveVoteLocal(design, notes);
        try {
            localStorage.setItem(KEY_VOTED, 'true');
            localStorage.setItem(KEY_CHOICE, design);
        } catch (_) {}
        return true;
    } else {
        saveVoteLocal(design, notes);
        try {
            localStorage.setItem(KEY_VOTED, 'true');
            localStorage.setItem(KEY_CHOICE, design);
        } catch (_) {}
        return true;
    }
}

async function getAllNotes() {
    if (USE_UPSTASH) {
        const redisNotes = await getAllNotesFromRedis();
        if (redisNotes && redisNotes.length > 0) {
            return redisNotes;
        }
    }
    return getNotesFromLocal();
}

/* ============================================================
   INTERACTIVE DEMOS
============================================================ */
const DEMOS = {
    'Neo-Brutalism': {
        desc: 'Click buttons to feel them physically press down. Check/uncheck the toggles.',
        html: `<div class="demo-neo">
  <div class="demo-neo-title">Control Panel</div>
  <div class="demo-neo-btns">
    <button class="nb-demo-btn">Add Expense</button>
    <button class="nb-demo-btn accent">Transfer</button>
    <button class="nb-demo-btn">History</button>
  </div>
  <div class="demo-neo-checks">
    <label class="nb-check-wrap"><input type="checkbox" class="nb-check-input"><span class="nb-check-box"></span><span class="nb-check-lbl">Auto-Save</span></label>
    <label class="nb-check-wrap"><input type="checkbox" class="nb-check-input" checked><span class="nb-check-box"></span><span class="nb-check-lbl">Notifications</span></label>
    <label class="nb-check-wrap"><input type="checkbox" class="nb-check-input"><span class="nb-check-box"></span><span class="nb-check-lbl">Dark Mode</span></label>
  </div>
</div>`,
        init() {
            document.querySelectorAll('.nb-demo-btn').forEach((btn) => {
                btn.addEventListener('mousedown', () =>
                    btn.classList.add('pressed'),
                );
                btn.addEventListener('mouseup', () =>
                    btn.classList.remove('pressed'),
                );
                btn.addEventListener('mouseleave', () =>
                    btn.classList.remove('pressed'),
                );
            });
        },
    },

    Glassmorphism: {
        desc: 'Move your cursor over each glass card to see the 3D tilt effect. Hover the button for the shimmer sweep.',
        html: `<div class="demo-glass">
  <div class="demo-glass-bg-orb1"></div>
  <div class="demo-glass-bg-orb2"></div>
  <div class="demo-glass-bg-orb3"></div>
  <div class="demo-glass-cards">
    <div class="gl-demo-card"><span class="gl-clbl">Balance</span><span class="gl-cval">$12,430</span><span class="gl-csub">↑ 12% this month</span></div>
    <div class="gl-demo-card"><span class="gl-clbl">Income</span><span class="gl-cval">$3,200</span><span class="gl-csub">Mar 2026</span></div>
    <div class="gl-demo-card"><span class="gl-clbl">Expenses</span><span class="gl-cval">$1,840</span><span class="gl-csub">Mar 2026</span></div>
  </div>
  <button class="gl-demo-btn">+ Add Transaction</button>
</div>`,
        init() {
            document.querySelectorAll('.gl-demo-card').forEach((card) => {
                card.addEventListener('mousemove', (e) => {
                    const r = card.getBoundingClientRect();
                    const x =
                        (e.clientX - r.left - r.width / 2) / (r.width / 2);
                    const y =
                        (e.clientY - r.top - r.height / 2) / (r.height / 2);
                    card.style.transform = `perspective(280px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg) scale(1.05)`;
                    card.style.transition = 'transform .08s';
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transition =
                        'transform .5s cubic-bezier(.2,.8,.2,1)';
                    card.style.transform =
                        'perspective(280px) rotateX(0) rotateY(0) scale(1)';
                });
            });
        },
    },

    Neumorphism: {
        desc: 'Toggle the switch on/off. Click and hold the button to feel it press inward. Drag the slider.',
        html: `<div class="demo-neu">
  <div class="demo-neu-row"><span class="demo-neu-label">Notifications</span><div class="nm-toggle on" id="nmToggle"><div class="nm-thumb"></div></div></div>
  <div class="demo-neu-row"><span class="demo-neu-label">Dark Mode</span><div class="nm-toggle" id="nmToggle2"><div class="nm-thumb"></div></div></div>
  <button class="nm-pay-btn" id="nmPayBtn">Confirm Payment</button>
  <div class="nm-slider-wrap">
    <span class="nm-slider-lbl">Budget Limit — $1,200</span>
    <div class="nm-slider-track" id="nmTrack">
      <div class="nm-slider-fill" id="nmFill"></div>
      <div class="nm-slider-thumb" id="nmThumb"></div>
    </div>
  </div>
</div>`,
        init() {
            [
                document.getElementById('nmToggle'),
                document.getElementById('nmToggle2'),
            ].forEach((t) => {
                if (t)
                    t.addEventListener('click', () => t.classList.toggle('on'));
            });
            // Slider drag
            const track = document.getElementById('nmTrack');
            const fill = document.getElementById('nmFill');
            const thumb = document.getElementById('nmThumb');
            const lbl = document.querySelector('.nm-slider-lbl');
            if (!track) return;
            let dragging = false;
            let pct = 60;
            const update = (p) => {
                pct = Math.max(5, Math.min(95, p));
                fill.style.width = pct + '%';
                thumb.style.left = pct + '%';
                if (lbl)
                    lbl.textContent = `Budget Limit — $${Math.round(pct * 20)}`;
            };
            update(60);
            thumb.addEventListener('mousedown', (e) => {
                dragging = true;
                e.preventDefault();
            });
            window.addEventListener('mousemove', (e) => {
                if (!dragging) return;
                const r = track.getBoundingClientRect();
                update(((e.clientX - r.left) / r.width) * 100);
            });
            window.addEventListener('mouseup', () => {
                dragging = false;
            });
            track.addEventListener('click', (e) => {
                const r = track.getBoundingClientRect();
                update(((e.clientX - r.left) / r.width) * 100);
            });
        },
    },

    Claymorphism: {
        desc: 'Click and hold the buttons — feel them squish down and spring back. The 3D offset shadow is the clay signature.',
        html: `<div class="demo-clay">
  <p class="demo-clay-title">Quick Actions</p>
  <div class="demo-clay-btns">
    <button class="cl-demo-btn purple">+ Add</button>
    <button class="cl-demo-btn green">Send</button>
    <button class="cl-demo-btn pink">Delete</button>
  </div>
  <div class="demo-clay-chips">
    <div class="cl-chip food">🍔 Food</div>
    <div class="cl-chip travel">✈️ Travel</div>
    <div class="cl-chip health">💊 Health</div>
  </div>
  <button class="cl-cta-btn">View Full Report</button>
</div>`,
        init() {},
    },

    'Cyberpunk UI': {
        desc: 'Hover over the balance to trigger a glitch effect. Click EXECUTE to run a terminal sequence.',
        html: `<div class="demo-cyber">
  <div class="demo-cyber-grid"></div>
  <div class="demo-cyber-scan"></div>
  <div class="cyber-balance">
    <span class="cyber-bal-lbl">// vault_balance</span>
    <span class="cyber-bal-amt" id="cyAmt" title="Hover to glitch">$12,430.00</span>
  </div>
  <div class="cyber-btns">
    <button class="cy-demo-btn teal" id="cyExec">EXECUTE</button>
    <button class="cy-demo-btn red" id="cyReset">RESET</button>
  </div>
  <div class="cyber-terminal" id="cyTerminal">
    <div class="cyber-terminal-line"><span class="prompt">&gt; </span>NERAXA_OS v2.77 ready<span class="cyber-cursor"></span></div>
  </div>
</div>`,
        init() {
            const amt = document.getElementById('cyAmt');
            if (amt) {
                amt.addEventListener('mouseenter', () => {
                    amt.classList.add('glitch');
                    setTimeout(() => amt.classList.remove('glitch'), 450);
                });
            }
            const terminal = document.getElementById('cyTerminal');
            const execBtn = document.getElementById('cyExec');
            const resetBtn = document.getElementById('cyReset');
            const lines = [
                'SCANNING LEDGER...',
                'ANALYZING 47 TRANSACTIONS...',
                'DECRYPTING VAULT... OK',
                'BALANCE VERIFIED: <span style="color:#00ff88">$12,430.00</span>',
                'ACCESS GRANTED. <span style="color:#00ff88">SYSTEM SECURE.</span>',
            ];
            let running = false;
            function typeLines() {
                if (running) return;
                running = true;
                terminal.innerHTML =
                    '<div class="cyber-terminal-line"><span class="prompt">&gt; </span>INITIATING PROTOCOL...<span class="cyber-cursor"></span></div>';
                let i = 0;
                const next = () => {
                    if (i >= lines.length) {
                        running = false;
                        return;
                    }
                    const div = document.createElement('div');
                    div.className = 'cyber-terminal-line';
                    div.innerHTML = `<span class="prompt">&gt; </span>${lines[i]}<span class="cyber-cursor"></span>`;
                    terminal
                        .querySelectorAll('.cyber-cursor')
                        .forEach((c) => c.remove());
                    terminal.appendChild(div);
                    terminal.scrollTop = terminal.scrollHeight;
                    i++;
                    setTimeout(next, 480);
                };
                setTimeout(next, 300);
            }
            if (execBtn) execBtn.addEventListener('click', typeLines);
            if (resetBtn)
                resetBtn.addEventListener('click', () => {
                    running = false;
                    terminal.innerHTML =
                        '<div class="cyber-terminal-line"><span class="prompt">&gt; </span>NERAXA_OS v2.77 ready<span class="cyber-cursor"></span></div>';
                });
        },
    },

    'Material Design': {
        desc: 'Click any button to see the ripple effect. Toggle the category chips. Click the FAB.',
        html: `<div class="demo-md3">
  <p class="demo-md3-title">Transactions</p>
  <div class="md3-btns">
    <button class="md3-filled-btn">Add Expense</button>
    <button class="md3-tonal-btn">Transfer</button>
    <button class="md3-outlined-btn">View All</button>
  </div>
  <div class="md3-chips">
    <div class="md3-chip active">All</div>
    <div class="md3-chip">Food</div>
    <div class="md3-chip">Travel</div>
    <div class="md3-chip">Bills</div>
  </div>
  <div class="md3-bottom-row">
    <span class="md3-bottom-label">Tap FAB to add a new transaction instantly</span>
    <button class="md3-fab" id="md3Fab">+</button>
  </div>
</div>`,
        init() {
            // Ripple on all buttons
            document
                .querySelectorAll(
                    '.md3-filled-btn,.md3-tonal-btn,.md3-outlined-btn,.md3-fab',
                )
                .forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        const ring = document.createElement('span');
                        ring.className = 'md3-ripple-ring';
                        const r = btn.getBoundingClientRect();
                        ring.style.top = e.clientY - r.top - 150 + 'px';
                        ring.style.left = e.clientX - r.left - 150 + 'px';
                        btn.appendChild(ring);
                        ring.addEventListener('animationend', () =>
                            ring.remove(),
                        );
                    });
                });
            // FAB bounce
            const fab = document.getElementById('md3Fab');
            if (fab) {
                fab.addEventListener('click', () => {
                    fab.style.transform = 'scale(.88) rotate(45deg)';
                    setTimeout(() => {
                        fab.style.transform = '';
                        fab.style.transition =
                            'transform .4s cubic-bezier(.34,1.56,.64,1)';
                    }, 180);
                });
            }
            // Chip toggle
            document.querySelectorAll('.md3-chip').forEach((chip) => {
                chip.addEventListener('click', () => {
                    document
                        .querySelectorAll('.md3-chip')
                        .forEach((c) => c.classList.remove('active'));
                    chip.classList.add('active');
                });
            });
        },
    },

    Minimalism: {
        desc: 'Hover the navigation links to see the underline animation. Hover the button. Click the transactions.',
        html: `<div class="demo-min">
  <nav class="demo-min-nav">
    <span class="min-nav-link active">Overview</span>
    <span class="min-nav-link">Transactions</span>
    <span class="min-nav-link">Analytics</span>
    <span class="min-nav-link">Settings</span>
  </nav>
  <p class="demo-min-amount">$12,430</p>
  <p class="demo-min-label">Total Balance — March 2026</p>
  <div class="demo-min-txns">
    <div class="min-txn-row"><div class="min-txn-dot" style="background:#27ae60"></div><span class="min-txn-name">Salary</span><span class="min-txn-amount pos">+$3,200</span></div>
    <div class="min-txn-row"><div class="min-txn-dot" style="background:#ddd"></div><span class="min-txn-name">Netflix</span><span class="min-txn-amount neg">−$15</span></div>
    <div class="min-txn-row"><div class="min-txn-dot" style="background:#ddd"></div><span class="min-txn-name">Groceries</span><span class="min-txn-amount neg">−$82</span></div>
  </div>
  <button class="demo-min-cta"><span>See all transactions</span></button>
</div>`,
        init() {
            document.querySelectorAll('.min-nav-link').forEach((link) => {
                link.addEventListener('click', () => {
                    document
                        .querySelectorAll('.min-nav-link')
                        .forEach((l) => l.classList.remove('active'));
                    link.classList.add('active');
                });
            });
        },
    },
};

/* ============================================================
   MODAL LOGIC
============================================================ */
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalDemo = document.getElementById('modalDemo');
const modalClose = document.getElementById('modalClose');

function openModal(designName) {
    const demo = DEMOS[designName];
    if (!demo) return;
    modalTitle.textContent = designName;
    modalDesc.textContent = demo.desc;
    modalDemo.innerHTML = demo.html;
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (demo.init) setTimeout(() => demo.init(), 60);
}

function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => {
        modalDemo.innerHTML = '';
    }, 300);
}

if (modalClose) {
    modalClose.addEventListener('click', closeModal);
}
if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

/* ============================================================
   CARD SELECTION
============================================================ */
const cardsGrid = document.getElementById('cardsGrid');
const btnVote = document.getElementById('btnVote');
const submitNote = document.getElementById('submitNote');
const submitWrap = document.getElementById('submitWrap');
const notesSection = document.getElementById('notesSection');
const btnSubmitNotes = document.getElementById('btnSubmitNotes');
const voteNotes = document.getElementById('voteNotes');
const confirmation = document.getElementById('confirmation');
const confSub = document.getElementById('confSub');
const resultsSection = document.getElementById('resultsSection');
const resultsList = document.getElementById('resultsList');
const votedNotice = document.getElementById('votedNotice');
const allCards = cardsGrid ? cardsGrid.querySelectorAll('.design-card') : [];
let currentSelection = null;

allCards.forEach((card) => {
    card.addEventListener('click', (e) => {
        if (card.classList.contains('voted-locked')) return;
        if (e.target.closest('.card-try-btn')) return;
        allCards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        card.querySelector('.card-radio').checked = true;
        currentSelection = card.dataset.design;
        btnVote.classList.add('active');
        submitNote.textContent = `Selected: ${currentSelection}`;
    });
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
        }
    });
});

// Try-it buttons
document.querySelectorAll('.card-try-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal(btn.dataset.demo);
    });
});

/* ============================================================
   VOTE SUBMISSION (TWO-STEP)
============================================================ */
// Step 1: Click "Cast My Vote" -> show notes section
if (btnVote) {
    btnVote.addEventListener('click', () => {
        if (!currentSelection || hasVoted()) return;
        // Hide the initial vote button section and show notes
        submitWrap.style.display = 'none';
        notesSection.style.display = 'block';
    });
}

// Step 2: Submit with optional notes
if (btnSubmitNotes) {
    btnSubmitNotes.addEventListener('click', async () => {
        if (!currentSelection) return;

        const notes = voteNotes ? voteNotes.value.trim() : '';
        btnSubmitNotes.disabled = true;
        btnSubmitNotes.textContent = 'Submitting...';

        // Submit vote
        await submitVote(currentSelection, notes);

        // Update UI
        lockCards();
        confSub.textContent = `You voted for "${currentSelection}". Thank you for shaping Neraxa!`;
        if (notes) {
            confSub.textContent += ' Your feedback has been recorded.';
        }
        confirmation.classList.add('visible');
        notesSection.style.display = 'none';

        setTimeout(
            () =>
                confirmation.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                }),
            80,
        );
        setTimeout(async () => {
            await renderResults(currentSelection);
            resultsSection.classList.add('visible');
        }, 350);
        setTimeout(
            () =>
                resultsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                }),
            700,
        );
    });
}

function lockCards() {
    allCards.forEach((card) => {
        card.classList.add('voted-locked');
        card.style.cursor = 'default';
    });
}

/* ============================================================
   RESULTS
============================================================ */
async function renderResults(userChoice) {
    const votes = await getVotes();
    const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    const maxV = sorted[0][1] || 1;
    const top3 = new Set(sorted.slice(0, 3).map((e) => e[0]));
    resultsList.innerHTML = '';
    sorted.forEach(([name, count], idx) => {
        const isTop = top3.has(name);
        const pct = Math.round((count / maxV) * 100);
        const isYours = name === userChoice;
        const row = document.createElement('div');
        row.className =
            'result-row' +
            (isTop ? ' top-3' : '') +
            (idx === 0 ? ' rank-1' : '');
        row.innerHTML = `<div class="result-medal">${MEDALS[idx] || ''}</div><div class="result-name">${name}</div>${isYours ? '<div class="result-voted-you">Your vote</div>' : ''}<div class="result-bar-track"><div class="result-bar-fill" data-pct="${pct}" style="width:0%"></div></div><div class="result-count">${count}</div>`;
        resultsList.appendChild(row);
    });
    requestAnimationFrame(() =>
        requestAnimationFrame(() => {
            resultsList.querySelectorAll('.result-bar-fill').forEach((bar) => {
                bar.style.width = bar.dataset.pct + '%';
            });
        }),
    );
}

/* ============================================================
   INIT
============================================================ */
async function init() {
    console.log('Neraxa Vote initialized');
    console.log('Redis configured:', USE_UPSTASH);
    console.log('Has voted:', hasVoted());

    if (hasVoted()) {
        const prev = getPrevChoice();
        votedNotice.classList.add('visible');
        lockCards();
        if (prev)
            allCards.forEach((card) => {
                if (card.dataset.design === prev)
                    card.classList.add('selected');
            });
        submitWrap.style.display = 'none';
        confSub.textContent = prev
            ? `You previously voted for "${prev}".`
            : 'Your vote has been recorded.';
        confirmation.classList.add('visible');
        await renderResults(prev);
        resultsSection.classList.add('visible');
    }
}
init();
