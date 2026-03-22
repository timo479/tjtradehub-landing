// ============================================================
// TJ CHARTS — app.js
// ============================================================

const STORAGE_KEY   = 'tj_charts_selected';
const FAVS_KEY      = 'tj_charts_favs';
const TZ_KEY        = 'tj_charts_tz';
const CUSTOM_SYM_KEY = 'tj_custom_symbols';
const PRESETS_KEY   = 'tj_watchlist_presets';
const NOTES_KEY     = 'tj_chart_notes';
const TF_KEY        = 'tj_charts_tf';
const COLS_KEY      = 'tj_charts_cols';
const CAT_KEY       = 'tj_charts_cat';
const HEIGHT_KEY    = 'tj_charts_height';
const DEFAULT_SELECTED = ['SP:SPX', 'NASDAQ:NDX', 'TVC:GOLD', 'FX:EURUSD'];

// ---- FAVS ----
function loadFavs() {
  try { return JSON.parse(localStorage.getItem(FAVS_KEY)) || []; } catch { return []; }
}
function saveFavs() {
  localStorage.setItem(FAVS_KEY, JSON.stringify(favs));
}
let favs = loadFavs();

// ---- TIMEZONE ----
function loadTz() {
  return localStorage.getItem(TZ_KEY) || 'UTC';
}
function saveTz(tz) {
  localStorage.setItem(TZ_KEY, tz);
}
let activeTz = loadTz();

function formatTimeInTz(date, tz) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function formatSessionTimeInTz(utcTotalMins, tz) {
  const now = new Date();
  const h = Math.floor(utcTotalMins / 60) % 24;
  const m = utcTotalMins % 60;
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m, 0));
  return formatTimeInTz(d, tz);
}

// ---- CUSTOM SYMBOLS ----
function loadCustomSymbols() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_SYM_KEY)) || []; } catch { return []; }
}
function saveCustomSymbols(arr) {
  localStorage.setItem(CUSTOM_SYM_KEY, JSON.stringify(arr));
}
let customSymbols = loadCustomSymbols();

// ---- NOTES ----
function loadNotes() {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; } catch { return {}; }
}
function saveNote(symbol, text) {
  const notes = loadNotes();
  if (text.trim()) notes[symbol] = text.trim();
  else delete notes[symbol];
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  // Update button state
  const containerId = 'tv_' + symbol.replace(/[^a-zA-Z0-9]/g, '_');
  const btn = document.querySelector('#' + containerId)?.closest('.chart-cell')?.querySelector('.chart-note-btn');
  if (btn) btn.classList.toggle('has-note', !!text.trim());
}
function toggleNote(symbol) {
  const containerId = 'tv_' + symbol.replace(/[^a-zA-Z0-9]/g, '_');
  const panel = document.getElementById('note_' + containerId);
  if (panel) panel.style.display = panel.style.display === 'none' ? '' : 'none';
}

// ---- PRESETS ----
function loadPresets() {
  try { return JSON.parse(localStorage.getItem(PRESETS_KEY)) || []; } catch { return []; }
}
function savePresets(arr) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(arr));
}

function renderPresets() {
  const slots = document.getElementById('preset-slots');
  if (!slots) return;
  const presets = loadPresets();
  slots.innerHTML = presets.map(p => `
    <button class="preset-btn" data-preset-id="${p.id}" title="Load: ${p.name}">
      <span>${p.name}</span>
      <span class="preset-btn-del" data-del-preset="${p.id}" title="Delete preset">✕</span>
    </button>
  `).join('');

  slots.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      // If click was on the del span, don't load
      if (e.target.dataset.delPreset) {
        deletePreset(e.target.dataset.delPreset);
        return;
      }
      loadPreset(btn.dataset.presetId);
    });
  });
}

function loadPreset(id) {
  const presets = loadPresets();
  const p = presets.find(x => x.id === id);
  if (!p) return;
  selected = [...p.symbols];
  activeTf  = p.tf;
  saveSelected();
  localStorage.setItem(TF_KEY, activeTf);
  // Sync TF button UI
  document.querySelectorAll('.tf-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tf === activeTf);
  });
  renderChips();
  renderGrid();
}

function deletePreset(id) {
  let presets = loadPresets();
  presets = presets.filter(p => p.id !== id);
  savePresets(presets);
  renderPresets();
}

function saveCurrentAsPreset() {
  const modal = document.getElementById('modal-preset');
  const input = document.getElementById('preset-name-input');
  if (!modal || !input) return;
  input.value = '';
  modal.style.display = 'flex';
  setTimeout(() => input.focus(), 50);
}

function closePresetModal() {
  const modal = document.getElementById('modal-preset');
  if (modal) modal.style.display = 'none';
}

function submitPreset(name) {
  if (!name || !name.trim()) return;
  let presets = loadPresets();
  presets.push({ id: 'preset_' + Date.now(), name: name.trim(), symbols: [...selected], tf: activeTf });
  if (presets.length > 5) presets = presets.slice(presets.length - 5);
  savePresets(presets);
  renderPresets();
  closePresetModal();
  showToast('Preset saved!');
}

// ---- SYMBOL CATALOGUE ----
const CATALOGUE = [
  // Indices
  { cat: 'indices', label: 'S&P 500',     symbol: 'SP:SPX',          desc: 'S&P 500'       },
  { cat: 'indices', label: 'NASDAQ',      symbol: 'NASDAQ:NDX',      desc: 'Nasdaq 100'    },
  { cat: 'indices', label: 'DOW',         symbol: 'DJ:DJI',          desc: 'Dow Jones'     },
  { cat: 'indices', label: 'DAX',         symbol: 'XETR:DAX',        desc: 'DAX 40'        },
  { cat: 'indices', label: 'FTSE 100',    symbol: 'TVC:UKX',         desc: 'UK 100'        },
  { cat: 'indices', label: 'Nikkei',      symbol: 'TVC:NI225',       desc: 'Nikkei 225'    },
  { cat: 'indices', label: 'CAC 40',      symbol: 'EURONEXT:PX1',    desc: 'CAC 40'        },
  { cat: 'indices', label: 'Russell 2000',symbol: 'TVC:RUT',         desc: 'Russell 2000'  },
  { cat: 'indices', label: 'VIX',         symbol: 'TVC:VIX',         desc: 'Volatility'    },

  // Forex
  { cat: 'forex', label: 'EUR/USD', symbol: 'FX:EURUSD', desc: 'Euro / US Dollar'       },
  { cat: 'forex', label: 'GBP/USD', symbol: 'FX:GBPUSD', desc: 'Pound / US Dollar'      },
  { cat: 'forex', label: 'USD/JPY', symbol: 'FX:USDJPY', desc: 'Dollar / Yen'           },
  { cat: 'forex', label: 'GBP/JPY', symbol: 'FX:GBPJPY', desc: 'Pound / Yen'            },
  { cat: 'forex', label: 'USD/CHF', symbol: 'FX:USDCHF', desc: 'Dollar / Franc'         },
  { cat: 'forex', label: 'AUD/USD', symbol: 'FX:AUDUSD', desc: 'Aussie / Dollar'        },
  { cat: 'forex', label: 'USD/CAD', symbol: 'FX:USDCAD', desc: 'Dollar / Loonie'        },
  { cat: 'forex', label: 'EUR/JPY', symbol: 'FX:EURJPY', desc: 'Euro / Yen'             },
  { cat: 'forex', label: 'EUR/GBP', symbol: 'FX:EURGBP', desc: 'Euro / Pound'           },
  { cat: 'forex', label: 'NZD/USD', symbol: 'FX:NZDUSD', desc: 'Kiwi / Dollar'          },
  { cat: 'forex', label: 'USD/MXN', symbol: 'FX:USDMXN', desc: 'Dollar / Peso'          },
  { cat: 'forex', label: 'DXY',     symbol: 'TVC:DXY',   desc: 'Dollar Index'           },

  // Metals
  { cat: 'metals', label: 'Gold',     symbol: 'TVC:GOLD',     desc: 'XAU/USD'    },
  { cat: 'metals', label: 'Silver',   symbol: 'TVC:SILVER',   desc: 'XAG/USD'    },
  { cat: 'metals', label: 'Platinum', symbol: 'TVC:PLATINUM', desc: 'XPT/USD'    },
  { cat: 'metals', label: 'Copper',   symbol: 'TVC:COPPER',   desc: 'Copper'     },

  // Crypto
  { cat: 'crypto', label: 'BTC/USD',   symbol: 'BITSTAMP:BTCUSD',    desc: 'Bitcoin'        },
  { cat: 'crypto', label: 'ETH/USD',   symbol: 'BITSTAMP:ETHUSD',    desc: 'Ethereum'       },
  { cat: 'crypto', label: 'SOL/USD',   symbol: 'BINANCE:SOLUSDT',    desc: 'Solana'         },
  { cat: 'crypto', label: 'BNB/USD',   symbol: 'BINANCE:BNBUSDT',    desc: 'BNB'            },
  { cat: 'crypto', label: 'XRP/USD',   symbol: 'BITSTAMP:XRPUSD',    desc: 'Ripple'         },
  { cat: 'crypto', label: 'ADA/USD',   symbol: 'BINANCE:ADAUSDT',    desc: 'Cardano'        },
  { cat: 'crypto', label: 'AVAX/USD',  symbol: 'BINANCE:AVAXUSDT',   desc: 'Avalanche'      },
  { cat: 'crypto', label: 'DOGE/USD',  symbol: 'BINANCE:DOGEUSDT',   desc: 'Dogecoin'       },
  { cat: 'crypto', label: 'DOT/USD',   symbol: 'BINANCE:DOTUSDT',    desc: 'Polkadot'       },
  { cat: 'crypto', label: 'LINK/USD',  symbol: 'BINANCE:LINKUSDT',   desc: 'Chainlink'      },
  { cat: 'crypto', label: 'MATIC/USD', symbol: 'BINANCE:MATICUSDT',  desc: 'Polygon'        },
  { cat: 'crypto', label: 'UNI/USD',   symbol: 'BINANCE:UNIUSDT',    desc: 'Uniswap'        },
  { cat: 'crypto', label: 'LTC/USD',   symbol: 'BITSTAMP:LTCUSD',    desc: 'Litecoin'       },
  { cat: 'crypto', label: 'ATOM/USD',  symbol: 'BINANCE:ATOMUSDT',   desc: 'Cosmos'         },
  { cat: 'crypto', label: 'NEAR/USD',  symbol: 'BINANCE:NEARUSDT',   desc: 'NEAR Protocol'  },
  { cat: 'crypto', label: 'ARB/USD',   symbol: 'BINANCE:ARBUSDT',    desc: 'Arbitrum'       },
  { cat: 'crypto', label: 'OP/USD',    symbol: 'BINANCE:OPUSDT',     desc: 'Optimism'       },
  { cat: 'crypto', label: 'SUI/USD',   symbol: 'BINANCE:SUIUSDT',    desc: 'Sui'            },
  { cat: 'crypto', label: 'TON/USD',   symbol: 'BINANCE:TONUSDT',    desc: 'Toncoin'        },
  { cat: 'crypto', label: 'SHIB/USD',  symbol: 'BINANCE:SHIBUSDT',   desc: 'Shiba Inu'      },
  { cat: 'crypto', label: 'TRX/USD',   symbol: 'BINANCE:TRXUSDT',    desc: 'TRON'           },
  { cat: 'crypto', label: 'APT/USD',   symbol: 'BINANCE:APTUSDT',    desc: 'Aptos'          },
  { cat: 'crypto', label: 'INJ/USD',   symbol: 'BINANCE:INJUSDT',    desc: 'Injective'      },
  { cat: 'crypto', label: 'FTM/USD',   symbol: 'BINANCE:FTMUSDT',    desc: 'Fantom'         },
  { cat: 'crypto', label: 'PEPE/USD',  symbol: 'BINANCE:PEPEUSDT',   desc: 'Pepe'           },

  // Commodities
  { cat: 'commodities', label: 'Oil WTI',     symbol: 'TVC:USOIL',      desc: 'Crude Oil WTI'  },
  { cat: 'commodities', label: 'Oil Brent',   symbol: 'TVC:UKOIL',      desc: 'Crude Oil Brent' },
  { cat: 'commodities', label: 'Nat. Gas',    symbol: 'TVC:NATURALGAS', desc: 'Natural Gas'    },
  { cat: 'commodities', label: 'Wheat',       symbol: 'CBOT:ZW1!',      desc: 'Wheat Futures'  },
  { cat: 'commodities', label: 'Corn',        symbol: 'CBOT:ZC1!',      desc: 'Corn Futures'   },
];

function allCatalogueItems() {
  return [...CATALOGUE, ...customSymbols];
}

// ---- STATE ----
let selected     = loadSelected();
let activeCat    = localStorage.getItem(CAT_KEY)    || 'indices';
let activeTf     = localStorage.getItem(TF_KEY)     || '60';
let activeCols   = parseInt(localStorage.getItem(COLS_KEY) || '1');
let activeHeight = localStorage.getItem(HEIGHT_KEY)  || 'auto';
let activeSort   = localStorage.getItem('tj_charts_sort') || 'default';
let searchQuery  = '';

function loadSelected() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(s) && s.length > 0 ? s : [...DEFAULT_SELECTED];
  } catch { return [...DEFAULT_SELECTED]; }
}
function saveSelected() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
}

// ---- RENDER SYMBOL CHIPS ----
function renderChips() {
  const container = document.getElementById('symbol-chips');
  const all = allCatalogueItems();
  let items;
  if (activeCat === 'all')        items = all;
  else if (activeCat === 'favs')  items = all.filter(s => favs.includes(s.symbol));
  else if (activeCat === 'custom') items = customSymbols;
  else                             items = all.filter(s => s.cat === activeCat);

  // Apply search filter
  if (searchQuery) {
    items = items.filter(s =>
      s.label.toLowerCase().includes(searchQuery) ||
      s.desc.toLowerCase().includes(searchQuery) ||
      s.symbol.toLowerCase().includes(searchQuery)
    );
  }

  // Apply sort
  if (activeSort === 'az') {
    items = [...items].sort((a, b) => a.label.localeCompare(b.label));
  } else if (activeSort === 'pct') {
    items = [...items].sort((a, b) => (pctCache[b.symbol] ?? -Infinity) - (pctCache[a.symbol] ?? -Infinity));
  }

  if (activeCat === 'favs' && items.length === 0 && !searchQuery) {
    container.innerHTML = '<span style="font-size:12px;color:var(--text-muted);padding:4px 0;">No favorites yet — click ★ on any symbol to save it here.</span>';
    return;
  }

  if (items.length === 0) {
    container.innerHTML = '<span style="font-size:12px;color:var(--text-muted);padding:4px 0;">No symbols found.</span>';
    return;
  }

  container.innerHTML = items.map(s => {
    const isCustom = s.cat === 'custom';
    return `
      <div class="sym-chip-wrap">
        <button
          class="sym-chip ${selected.includes(s.symbol) ? 'active' : ''}"
          data-symbol="${s.symbol}"
          title="${s.desc}"
        ><span class="sym-chip-dot"></span>${s.label}</button>
        ${isCustom
          ? `<button class="fav-btn custom-del-btn" data-symbol="${s.symbol}" title="Remove custom symbol">✕</button>`
          : `<button
              class="fav-btn ${favs.includes(s.symbol) ? 'active' : ''}"
              data-symbol="${s.symbol}"
              title="${favs.includes(s.symbol) ? 'Remove from favorites' : 'Add to favorites'}"
            >${favs.includes(s.symbol) ? '★' : '☆'}</button>`
        }
      </div>
    `;
  }).join('');

  container.querySelectorAll('.sym-chip').forEach(chip => {
    chip.addEventListener('click', () => toggleSymbol(chip.dataset.symbol));
  });
  container.querySelectorAll('.fav-btn:not(.custom-del-btn)').forEach(btn => {
    btn.addEventListener('click', () => toggleFav(btn.dataset.symbol));
  });
  container.querySelectorAll('.custom-del-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteCustomSymbol(btn.dataset.symbol));
  });
}

function toggleFav(symbol) {
  if (favs.includes(symbol)) {
    favs = favs.filter(s => s !== symbol);
  } else {
    favs.push(symbol);
  }
  saveFavs();
  renderChips();
}

function deleteCustomSymbol(symbol) {
  customSymbols = customSymbols.filter(s => s.symbol !== symbol);
  saveCustomSymbols(customSymbols);
  // Also remove from selected if present
  if (selected.includes(symbol)) {
    selected = selected.filter(s => s !== symbol);
    saveSelected();
    renderGrid();
  }
  renderChips();
}

// ---- TOGGLE SYMBOL ----
function toggleSymbol(symbol) {
  const adding = !selected.includes(symbol);
  if (adding) {
    selected.push(symbol);
  } else {
    selected = selected.filter(s => s !== symbol);
  }
  saveSelected();
  renderChips();
  renderGrid();
  if (adding) setTimeout(() => fetchAndUpdatePct(symbol), 600);
}

function removeSymbol(symbol) {
  const all   = allCatalogueItems();
  const meta  = all.find(c => c.symbol === symbol);
  const label = meta ? meta.label : symbol.split(':')[1] || symbol;
  const pos   = selected.indexOf(symbol);
  selected = selected.filter(s => s !== symbol);
  saveSelected();
  renderChips();
  renderGrid();
  showUndoToast(`${label} removed`, () => {
    selected.splice(Math.min(pos, selected.length), 0, symbol);
    saveSelected();
    renderChips();
    renderGrid();
  });
}

// ---- FULLSCREEN ----
function toggleFullscreen(symbol) {
  const containerId = 'tv_' + symbol.replace(/[^a-zA-Z0-9]/g, '_');
  const cell = document.getElementById(containerId)?.closest('.chart-cell');
  if (!cell) return;
  if (cell.classList.contains('chart-fullscreen')) {
    cell.classList.remove('chart-fullscreen');
    document.body.classList.remove('has-fullscreen');
  } else {
    document.querySelectorAll('.chart-cell.chart-fullscreen').forEach(c => {
      c.classList.remove('chart-fullscreen');
    });
    cell.classList.add('chart-fullscreen');
    document.body.classList.add('has-fullscreen');
    showFullscreenHint(cell);
  }
}

// ---- RENDER CHART GRID ----
function renderGrid() {
  const grid  = document.getElementById('chart-grid');
  const empty = document.getElementById('empty-state');
  const notes = loadNotes();

  grid.className = `chart-grid cols-${activeCols}`;

  if (selected.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';

  // Calculate chart height
  let cellH;
  if (activeHeight === 'S') {
    cellH = 300;
  } else if (activeHeight === 'L') {
    cellH = 580;
  } else {
    const headerH = 56 + 46 + 88; // ticker + header + symbol bar (approx)
    const rowCount = Math.ceil(selected.length / activeCols);
    cellH = Math.max(380, Math.floor((window.innerHeight - headerH) / rowCount));
  }

  const all = allCatalogueItems();

  grid.innerHTML = selected.map(sym => {
    const meta = all.find(c => c.symbol === sym);
    const label = meta ? meta.label : sym.split(':')[1] || sym;
    const desc  = meta ? meta.desc  : '';
    const containerId = 'tv_' + sym.replace(/[^a-zA-Z0-9]/g, '_');
    const hasNote = !!notes[sym];
    const pct = pctCache[sym];
    const pctHtml = pct != null
      ? `<span class="pct-badge ${pct >= 0 ? 'pct-up' : 'pct-down'}" id="pct_${containerId}">${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%</span>`
      : `<span class="pct-badge pct-empty" id="pct_${containerId}"></span>`;
    return `
      <div class="chart-cell" data-sym="${sym}" draggable="true" style="min-height:${cellH}px;" ondblclick="toggleFullscreen('${sym}')">
        <div class="chart-cell-header">
          <div class="chart-cell-meta">
            <span class="drag-handle" title="Drag to reorder">⠿</span>
            <span class="chart-cell-symbol">${label}</span>
            <span class="chart-cell-label">${desc}</span>
            ${pctHtml}
            ${getCorrBadges(sym)}
          </div>
          <div class="chart-cell-actions">
            <button class="chart-note-btn ${hasNote ? 'has-note' : ''}" onclick="toggleNote('${sym}')" title="Note">📝</button>
            <button class="chart-reload-btn" onclick="reloadChart('${sym}')" title="Reload chart">↺</button>
            <button class="chart-cell-close" onclick="removeSymbol('${sym}')" title="Remove">✕</button>
          </div>
        </div>
        <div class="chart-note-panel" id="note_${containerId}" style="display:none;">
          <textarea class="chart-note-textarea" placeholder="Your note for ${label}..." onchange="saveNote('${sym}', this.value)">${notes[sym] || ''}</textarea>
        </div>
        <div class="chart-cell-widget" id="${containerId}"></div>
      </div>
    `;
  }).join('');

  // Drag & Drop (Mouse + Touch)
  let dragSym = null;
  let touchDragSym = null;
  let touchClone = null;
  grid.querySelectorAll('.chart-cell').forEach(cell => {
    cell.addEventListener('dragstart', () => {
      dragSym = cell.dataset.sym;
      setTimeout(() => cell.classList.add('dragging'), 0);
    });
    cell.addEventListener('dragend', () => {
      cell.classList.remove('dragging');
      grid.querySelectorAll('.chart-cell').forEach(c => c.classList.remove('drag-over'));
    });
    cell.addEventListener('dragover', e => {
      e.preventDefault();
      grid.querySelectorAll('.chart-cell').forEach(c => c.classList.remove('drag-over'));
      if (cell.dataset.sym !== dragSym) cell.classList.add('drag-over');
    });
    cell.addEventListener('drop', e => {
      e.preventDefault();
      const dropSym = cell.dataset.sym;
      if (!dragSym || dragSym === dropSym) return;
      const fi = selected.indexOf(dragSym);
      const ti = selected.indexOf(dropSym);
      if (fi !== -1 && ti !== -1) [selected[fi], selected[ti]] = [selected[ti], selected[fi]];
      saveSelected();
      dragSym = null;
      renderGrid();
    });

    // Touch Drag & Drop (Mobile)
    cell.addEventListener('touchstart', e => {
      if (!e.target.closest('.drag-handle')) return;
      e.preventDefault();
      touchDragSym = cell.dataset.sym;
      cell.classList.add('dragging');
      const rect = cell.getBoundingClientRect();
      touchClone = cell.cloneNode(true);
      Object.assign(touchClone.style, {
        position: 'fixed', top: rect.top + 'px', left: rect.left + 'px',
        width: rect.width + 'px', opacity: '0.6', pointerEvents: 'none', zIndex: '9999',
      });
      document.body.appendChild(touchClone);
    }, { passive: false });

    cell.addEventListener('touchmove', e => {
      if (!touchDragSym) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (touchClone) {
        touchClone.style.top  = (touch.clientY - 20) + 'px';
        touchClone.style.left = (touch.clientX - 20) + 'px';
      }
      if (touchClone) touchClone.style.display = 'none';
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (touchClone) touchClone.style.display = '';
      grid.querySelectorAll('.chart-cell').forEach(c => c.classList.remove('drag-over'));
      const target = el?.closest('.chart-cell');
      if (target && target.dataset.sym !== touchDragSym) target.classList.add('drag-over');
    }, { passive: false });

    cell.addEventListener('touchend', e => {
      if (!touchDragSym) return;
      if (touchClone) { touchClone.remove(); touchClone = null; }
      const touch = e.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const target = el?.closest('.chart-cell');
      if (target && target.dataset.sym !== touchDragSym) {
        const fi = selected.indexOf(touchDragSym);
        const ti = selected.indexOf(target.dataset.sym);
        if (fi !== -1 && ti !== -1) [selected[fi], selected[ti]] = [selected[ti], selected[fi]];
        saveSelected();
      }
      grid.querySelectorAll('.chart-cell').forEach(c => c.classList.remove('dragging', 'drag-over'));
      touchDragSym = null;
      renderGrid();
    }, { passive: false });
  });

  // Mount TradingView widgets
  mountWidgets(cellH - 40);
}

// ---- MOUNT TRADINGVIEW WIDGETS ----
function mountWidgets(height) {
  if (typeof TradingView === 'undefined') {
    loadTvScript(() => mountWidgets(height));
    return;
  }

  selected.forEach(sym => {
    const containerId = 'tv_' + sym.replace(/[^a-zA-Z0-9]/g, '_');
    const container   = document.getElementById(containerId);
    if (!container || container.dataset.mounted === '1') return;
    container.dataset.mounted = '1';

    new TradingView.widget({
      container_id:        containerId,
      symbol:              sym,
      interval:            activeTf,
      timezone:            activeTz,
      theme:               'dark',
      style:               '1',
      locale:              'en',
      toolbar_bg:          '#0d0d0d',
      enable_publishing:   false,
      allow_symbol_change: true,
      hide_top_toolbar:    false,
      hide_legend:         false,
      save_image:          false,
      width:               '100%',
      height:              height,
    });
  });
}

// ============================================================
// TRADING SESSIONS
// ============================================================
// open/close stored as total UTC minutes from midnight
const SESSIONS = [
  { id: 'asia',    label: 'Asia',     short: 'Tokyo',  color: '#f59e0b', open: 0,   close: 540  }, // 00:00–09:00
  { id: 'london',  label: 'London',   short: 'London', color: '#60a5fa', open: 420, close: 960  }, // 07:00–16:00
  { id: 'newyork', label: 'New York', short: 'NY',     color: '#22c55e', open: 780, close: 1320 }, // 13:00–22:00
];

// London + NY overlap: 13:00–16:00 UTC

// ---- SESSION NOTIFICATIONS ----
const sessionOpenStates = {};
let sessionStatesInitialized = false;
const NOTIF_KEY = 'tj_session_notif';

function notifEnabled() {
  return localStorage.getItem(NOTIF_KEY) !== 'off' && Notification.permission === 'granted';
}

async function requestNotifPermission() {
  if (!('Notification' in window)) {
    showToast('Notifications not supported in this browser', 'error');
    return false;
  }
  if (Notification.permission === 'granted') {
    localStorage.setItem(NOTIF_KEY, 'on');
    showToast('Session notifications enabled 🔔');
    sendTestNotification();
    return true;
  }
  if (Notification.permission === 'denied') {
    showToast('Notifications blocked — enable in browser settings', 'error');
    return false;
  }
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    localStorage.setItem(NOTIF_KEY, 'on');
    showToast('Session notifications enabled 🔔');
    setTimeout(sendTestNotification, 500);
    return true;
  } else {
    showToast('Notifications blocked — enable in browser settings', 'error');
    return false;
  }
}

function sendTestNotification() {
  if (Notification.permission !== 'granted') return;
  new Notification('🔔 TJ Charts — Notifications active', {
    body: "You'll be alerted when your custom sessions start.",
    tag: 'tj_test',
  });
}

function showNotifOptions() {
  document.querySelectorAll('.toast-notif-opts').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast toast-undo toast-notif-opts';
  el.innerHTML = `
    <span>Session notifications</span>
    <button class="toast-undo-btn" id="btn-test-notif">Test</button>
    <button class="toast-undo-btn" style="border-color:#ef4444;color:#ef4444;" id="btn-disable-notif">Disable</button>
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('toast-show')));
  const autoClose = setTimeout(() => { el.classList.remove('toast-show'); setTimeout(() => el.remove(), 300); }, 8000);

  document.getElementById('btn-test-notif')?.addEventListener('click', () => {
    clearTimeout(autoClose); el.remove();
    sendTestNotification();
  });
  document.getElementById('btn-disable-notif')?.addEventListener('click', () => {
    clearTimeout(autoClose); el.remove();
    localStorage.setItem(NOTIF_KEY, 'off');
    showToast('Session notifications disabled 🔕');
    renderSessions();
  });
}

function sendSessionNotification(session) {
  const closeStr = minsToHHMM(session.close);
  const openStr  = minsToHHMM(session.open);

  // Always show in-app toast — 5 seconds
  showToast(`📈 ${session.label} Session is now open  ${openStr}–${closeStr} UTC`, 'success', 5000);

  // Browser notification if enabled
  if (notifEnabled()) {
    new Notification(`📈 ${session.label} Session now open`, {
      body: `Trading window: ${openStr} – ${closeStr} UTC`,
      tag:  'session_' + session.id,
    });
  }
}

function checkSessionNotifications(utcMins) {
  if (!sessionStatesInitialized) {
    customSessions.forEach(s => { sessionOpenStates[s.id] = isSessionOpen(s, utcMins); });
    sessionStatesInitialized = true;
    return;
  }
  customSessions.forEach(s => {
    const nowOpen = isSessionOpen(s, utcMins);
    if (sessionOpenStates[s.id] === false && nowOpen === true) {
      sendSessionNotification(s);
    }
    sessionOpenStates[s.id] = nowOpen;
  });
}

// ---- CUSTOM SESSIONS ----
const CUSTOM_SESSIONS_KEY = 'tj_custom_sessions';

function loadCustomSessions() {
  try {
    const data = JSON.parse(localStorage.getItem(CUSTOM_SESSIONS_KEY)) || [];
    // Migrate old format (hours) → new format (total minutes)
    return data.map(s => ({
      ...s,
      open:  s.open  < 60 ? s.open  * 60 : s.open,
      close: s.close < 60 ? s.close * 60 : s.close,
    }));
  } catch { return []; }
}
function saveCustomSessions(data) {
  localStorage.setItem(CUSTOM_SESSIONS_KEY, JSON.stringify(data));
}
let customSessions = loadCustomSessions();

function allSessions() {
  return [...SESSIONS, ...customSessions];
}

function openSessionModal(editId = null) {
  const modal = document.getElementById('modal-session');
  const form  = document.getElementById('form-session');
  if (!modal || !form) return;
  form.reset();
  form.dataset.editId = editId || '';
  document.getElementById('modal-session-title').textContent = editId ? 'Edit Session' : 'Custom Session';
  if (editId) {
    const s = customSessions.find(s => s.id === editId);
    if (s) {
      document.getElementById('cs-name').value  = s.label;
      document.getElementById('cs-open').value  = minsToHHMM(s.open);
      document.getElementById('cs-close').value = minsToHHMM(s.close);
      document.getElementById('cs-color').value = s.color;
    }
  } else {
    document.getElementById('cs-color').value = '#a855f7';
  }
  modal.style.display = 'flex';
}

function closeSessionModal() {
  const modal = document.getElementById('modal-session');
  if (modal) modal.style.display = 'none';
}

function deleteCustomSession(id) {
  customSessions = customSessions.filter(s => s.id !== id);
  saveCustomSessions(customSessions);
  renderSessions();
}

function getUtcMinutes() {
  const now = new Date();
  return now.getUTCHours() * 60 + now.getUTCMinutes();
}

function isSessionOpen(session, utcMins) {
  if (session.close < session.open) {
    // Crosses midnight: open e.g. 22:00 → close e.g. 02:00
    return utcMins >= session.open || utcMins < session.close;
  }
  return utcMins >= session.open && utcMins < session.close;
}

function minsToHHMM(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function getNextEvent(utcMins) {
  const events = [];
  allSessions().forEach(s => {
    const toOpen = s.open > utcMins ? s.open - utcMins : (24 * 60 - utcMins) + s.open;
    events.push({ label: s.label, type: 'opens', mins: toOpen, color: s.color });
    if (isSessionOpen(s, utcMins)) {
      const crossesMidnight = s.close < s.open;
      let toClose;
      if (crossesMidnight && utcMins >= s.open) {
        toClose = (24 * 60 - utcMins) + s.close;
      } else {
        toClose = s.close > utcMins ? s.close - utcMins : (24 * 60 - utcMins) + s.close;
      }
      events.push({ label: s.label, type: 'closes', mins: toClose, color: s.color });
    }
  });
  events.sort((a, b) => a.mins - b.mins);
  return events[0] || null;
}

function renderSessions() {
  const now     = new Date();
  const utcMins = getUtcMinutes();

  // Clock — show in selected timezone
  const clockEl = document.getElementById('session-clock');
  if (clockEl) {
    const tzTime = formatTimeInTz(now, activeTz);
    const tzLabel = activeTz === 'UTC' ? 'UTC' : activeTz.split('/')[1]?.replace('_', ' ') || activeTz;
    const utcTime = now.toUTCString().slice(17, 22);
    if (activeTz === 'UTC') {
      clockEl.textContent = utcTime + ' UTC';
    } else {
      clockEl.textContent = tzTime + ' ' + tzLabel + ' (' + utcTime + ' UTC)';
    }
  }

  // Session pills
  const sessionsEl = document.getElementById('sessions');
  if (sessionsEl) {
    const overlap = isSessionOpen(SESSIONS[1], utcMins) && isSessionOpen(SESSIONS[2], utcMins);

    const defaultPills = SESSIONS.map(s => {
      const open = isSessionOpen(s, utcMins);
      let timeStr;
      if (activeTz === 'UTC') {
        timeStr = `${minsToHHMM(s.open)}–${minsToHHMM(s.close)}`;
      } else {
        const tzOpen  = formatSessionTimeInTz(s.open,  activeTz);
        const tzClose = formatSessionTimeInTz(s.close, activeTz);
        const tzLabel = activeTz.split('/')[1]?.replace('_', ' ') || activeTz;
        timeStr = `${tzOpen}–${tzClose} ${tzLabel} (${minsToHHMM(s.open)}–${minsToHHMM(s.close)} UTC)`;
      }
      return `
        <div class="session-pill ${open ? 'open' : 'closed'}" style="--sc:${s.color}">
          <span class="session-dot"></span>
          <span class="session-label">${s.label}</span>
          <span class="session-time">${timeStr}</span>
        </div>
      `;
    }).join('');

    const overlapPill = overlap ? `
      <div class="session-pill open overlap" style="--sc:#a855f7">
        <span class="session-dot"></span>
        <span class="session-label">Overlap</span>
        <span class="session-time">${minsToHHMM(SESSIONS[2].open)}–${minsToHHMM(SESSIONS[1].close)} UTC</span>
      </div>` : '';

    const customPills = customSessions.map(s => {
      const open = isSessionOpen(s, utcMins);
      let timeStr;
      if (activeTz === 'UTC') {
        timeStr = `${minsToHHMM(s.open)}–${minsToHHMM(s.close)} UTC`;
      } else {
        const tzOpen  = formatSessionTimeInTz(s.open,  activeTz);
        const tzClose = formatSessionTimeInTz(s.close, activeTz);
        const tzLabel = activeTz.split('/')[1]?.replace('_', ' ') || activeTz;
        timeStr = `${tzOpen}–${tzClose} ${tzLabel} (${minsToHHMM(s.open)}–${minsToHHMM(s.close)} UTC)`;
      }
      return `
        <div class="session-pill ${open ? 'open' : 'closed'} custom-pill" style="--sc:${s.color}">
          <span class="session-dot"></span>
          <span class="session-label">${s.label}</span>
          <span class="session-time">${timeStr}</span>
          <button class="session-edit-btn" onclick="openSessionModal('${s.id}')" title="Edit">✎</button>
          <button class="session-del-btn"  onclick="deleteCustomSession('${s.id}')" title="Delete">✕</button>
        </div>
      `;
    }).join('');

    const addBtn = `<button class="session-add-btn" id="btn-add-session" title="Add custom session">+ Session</button>`;

    const notifGranted = Notification.permission === 'granted' && localStorage.getItem(NOTIF_KEY) !== 'off';
    const notifBtn = `<button class="session-notif-btn ${notifGranted ? 'active' : ''}" id="btn-session-notif" title="${notifGranted ? 'Notifications on — click to disable' : 'Enable session notifications'}">${notifGranted ? '🔔' : '🔕'}</button>`;

    sessionsEl.innerHTML = defaultPills + overlapPill + customPills + addBtn + notifBtn;

    document.getElementById('btn-add-session')?.addEventListener('click', () => openSessionModal());
    document.getElementById('btn-session-notif')?.addEventListener('click', async () => {
      if (notifGranted) {
        showNotifOptions();
      } else {
        const ok = await requestNotifPermission();
        if (ok) renderSessions();
      }
    });
  }

  // Check notifications
  checkSessionNotifications(utcMins);

  // Next event countdown
  const nextEl = document.getElementById('session-next');
  if (nextEl) {
    const next = getNextEvent(utcMins);
    if (next) {
      const h = Math.floor(next.mins / 60);
      const m = next.mins % 60;
      const countdown = h > 0 ? `${h}h ${m}m` : `${m}m`;
      nextEl.innerHTML = `<span style="color:var(--text-muted);font-size:11px;">Next:</span> <span style="color:${next.color};font-weight:600;">${next.label}</span> <span style="color:var(--text-muted);">${next.type}</span> <span style="color:var(--text);font-weight:600;">in ${countdown}</span>`;
    }
  }
}

function loadTvScript(cb) {
  if (document.getElementById('tv-script')) {
    document.getElementById('tv-script').addEventListener('load', cb, { once: true });
    return;
  }
  const s = document.createElement('script');
  s.id  = 'tv-script';
  s.src = 'https://s3.tradingview.com/tv.js';
  s.onload = cb;
  document.head.appendChild(s);
}

// ---- TICKER WIDGET ----
function initTickerWidget() {
  const container = document.getElementById('ticker-widget');
  if (!container) return;
  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
  script.async = true;
  script.innerHTML = JSON.stringify({
    symbols: [
      { proName: 'SP:SPX',          description: 'S&P 500'  },
      { proName: 'NASDAQ:NDX',      description: 'NASDAQ'   },
      { proName: 'DJ:DJI',          description: 'DOW'      },
      { proName: 'TVC:GOLD',        description: 'Gold'     },
      { proName: 'FX:EURUSD',       description: 'EUR/USD'  },
      { proName: 'FX:GBPUSD',       description: 'GBP/USD'  },
      { proName: 'FX:USDJPY',       description: 'USD/JPY'  },
      { proName: 'BITSTAMP:BTCUSD', description: 'BTC'      },
      { proName: 'BITSTAMP:ETHUSD', description: 'ETH'      },
      { proName: 'TVC:USOIL',       description: 'Oil WTI'  },
      { proName: 'TVC:DXY',         description: 'DXY'      },
    ],
    showSymbolLogo: false,
    colorTheme: 'dark',
    isTransparent: true,
    displayMode: 'compact',
    locale: 'en',
  });
  container.appendChild(script);
}

// ---- TOOL PANELS ----
const TOOL_PANELS = {
  cal: {
    panel: 'cal-panel', btn: 'btn-cal-toggle', loaded: false,
    init() {
      const c = document.getElementById('cal-widget');
      if (!c) return;
      const s = document.createElement('script');
      s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
      s.async = true;
      s.innerHTML = JSON.stringify({ colorTheme:'dark', isTransparent:true, width:'100%', height:'420', locale:'en', importanceFilter:'0,1', countryFilter:'us,eu,gb,jp,de,ca,au,ch' });
      c.appendChild(s);
    },
  },
  heatmap: {
    panel: 'heatmap-panel', btn: 'btn-heatmap-toggle', loaded: false,
    init() {
      const c = document.getElementById('heatmap-widget');
      if (!c) return;
      const s = document.createElement('script');
      s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
      s.async = true;
      s.innerHTML = JSON.stringify({ exchanges:[], dataSource:'SPX500', grouping:'sector', blockSize:'market_cap_basic', blockColor:'change', locale:'en', symbolUrl:'', colorTheme:'dark', hasTopBar:true, isDataSetEnabled:true, isZoomEnabled:true, hasSymbolTooltip:true, isMonoSize:false, width:'100%', height:'500' });
      c.appendChild(s);
    },
  },
  news: {
    panel: 'news-panel', btn: 'btn-news-toggle', loaded: false,
    init() {
      const c = document.getElementById('news-widget');
      if (!c) return;
      const s = document.createElement('script');
      s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
      s.async = true;
      s.innerHTML = JSON.stringify({ feedMode:'all_symbols', colorTheme:'dark', isTransparent:true, displayMode:'regular', width:'100%', height:'420', locale:'en' });
      c.appendChild(s);
    },
  },
  screener: {
    panel: 'screener-panel', btn: 'btn-screener-toggle', loaded: false, market: 'forex',
    init(market = 'forex') {
      const c = document.getElementById('screener-widget');
      if (!c) return;
      c.innerHTML = '';
      const s = document.createElement('script');
      s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
      s.async = true;
      s.innerHTML = JSON.stringify({ width:'100%', height:'500', defaultColumn:'overview', defaultScreen:'most_capitalized', market, showToolbar:true, colorTheme:'dark', locale:'en' });
      c.appendChild(s);
    },
  },
};

function switchScreenerMarket(market) {
  TOOL_PANELS.screener.market = market;
  TOOL_PANELS.screener.init(market);
  document.querySelectorAll('.screener-market-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.market === market);
  });
}

function toggleToolPanel(key) {
  const tool = TOOL_PANELS[key];
  if (!tool) return;
  const panel = document.getElementById(tool.panel);
  const btn   = document.getElementById(tool.btn);
  if (!panel) return;
  const opening = panel.style.display === 'none';
  // Close all panels
  Object.values(TOOL_PANELS).forEach(t => {
    const p = document.getElementById(t.panel);
    const b = document.getElementById(t.btn);
    if (p) p.style.display = 'none';
    if (b) b.classList.remove('active');
  });
  if (opening) {
    panel.style.display = '';
    btn.classList.add('active');
    if (!tool.loaded) { tool.loaded = true; tool.init(); }
  }
}

// ---- % CHANGE CACHE ----
const YAHOO_MAP = {
  'SP:SPX':'%5EGSPC','NASDAQ:NDX':'%5ENDX','DJ:DJI':'%5EDJI','TVC:VIX':'%5EVIX',
  'TVC:GOLD':'GC%3DF','TVC:SILVER':'SI%3DF','TVC:PLATINUM':'PL%3DF','TVC:COPPER':'HG%3DF',
  'FX:EURUSD':'EURUSD%3DX','FX:GBPUSD':'GBPUSD%3DX','FX:USDJPY':'USDJPY%3DX',
  'FX:USDCHF':'USDCHF%3DX','FX:AUDUSD':'AUDUSD%3DX','FX:USDCAD':'USDCAD%3DX',
  'FX:EURJPY':'EURJPY%3DX','FX:EURGBP':'EURGBP%3DX','FX:NZDUSD':'NZDUSD%3DX',
  'TVC:DXY':'DX-Y.NYB',
  'BITSTAMP:BTCUSD':'BTC-USD','BITSTAMP:ETHUSD':'ETH-USD','BITSTAMP:LTCUSD':'LTC-USD',
  'BITSTAMP:XRPUSD':'XRP-USD',
  'BINANCE:SOLUSDT':'SOL-USD','BINANCE:BNBUSDT':'BNB-USD','BINANCE:ADAUSDT':'ADA-USD',
  'BINANCE:AVAXUSDT':'AVAX-USD','BINANCE:DOGEUSDT':'DOGE-USD','BINANCE:DOTUSDT':'DOT-USD',
  'BINANCE:LINKUSDT':'LINK-USD','BINANCE:MATICUSDT':'MATIC-USD','BINANCE:UNIUSDT':'UNI-USD',
  'BINANCE:ATOMUSDT':'ATOM-USD','BINANCE:NEARUSDT':'NEAR-USD','BINANCE:ARBUSDT':'ARB-USD',
  'BINANCE:OPUSDT':'OP-USD','BINANCE:SUIUSDT':'SUI-USD','BINANCE:TONUSDT':'TON-USD',
  'BINANCE:SHIBUSDT':'SHIB-USD','BINANCE:TRXUSDT':'TRX-USD','BINANCE:APTUSDT':'APT-USD',
  'BINANCE:INJUSDT':'INJ-USD','BINANCE:FTMUSDT':'FTM-USD','BINANCE:PEPEUSDT':'PEPE-USD',
  'TVC:USOIL':'CL%3DF','TVC:UKOIL':'BZ%3DF','TVC:NATURALGAS':'NG%3DF',
  'XETR:DAX':'%5EGDAXI','TVC:UKX':'%5EFTSE','TVC:NI225':'%5EN225',
  'TVC:RUT':'%5ERUT','EURONEXT:PX1':'%5EFCHI',
  'FX:GBPJPY':'GBPJPY%3DX','FX:USDMXN':'USDMXN%3DX',
  'CBOT:ZW1!':'ZW%3DF','CBOT:ZC1!':'ZC%3DF',
};
const pctCache = {};

async function fetchPctChange(sym) {
  const yahoo = YAHOO_MAP[sym];
  if (!yahoo) return null;
  try {
    const url   = `https://query2.finance.yahoo.com/v8/finance/chart/${yahoo}?interval=1d&range=2d`;
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res   = await fetch(proxy);
    const data  = await res.json();
    const json  = JSON.parse(data.contents);
    const meta  = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice;
    const prev  = meta.chartPreviousClose ?? meta.previousClose;
    return prev ? ((price - prev) / prev) * 100 : null;
  } catch { return null; }
}

async function refreshPctCache() {
  await Promise.allSettled(selected.map(async sym => {
    const pct = await fetchPctChange(sym);
    pctCache[sym] = pct; // null = tried but failed
  }));
  selected.forEach(sym => {
    const containerId = 'tv_' + sym.replace(/[^a-zA-Z0-9]/g, '_');
    const badge = document.getElementById('pct_' + containerId);
    if (!badge) return;
    const pct = pctCache[sym];
    if (pct == null) {
      if (YAHOO_MAP[sym]) {
        badge.textContent = '—';
        badge.className = 'pct-badge pct-na';
        badge.title = 'Price change unavailable';
      }
      return;
    }
    badge.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
    badge.className = 'pct-badge ' + (pct >= 0 ? 'pct-up' : 'pct-down');
    badge.title = '';
  });
}

// ---- CORRELATIONS ----
const CORR = {
  'SP:SPX':          { 'NASDAQ:NDX': 0.97, 'DJ:DJI': 0.94, 'TVC:VIX': -0.82, 'BITSTAMP:BTCUSD': 0.52 },
  'NASDAQ:NDX':      { 'SP:SPX': 0.97, 'DJ:DJI': 0.88, 'BITSTAMP:BTCUSD': 0.58, 'BITSTAMP:ETHUSD': 0.55 },
  'DJ:DJI':          { 'SP:SPX': 0.94, 'NASDAQ:NDX': 0.88 },
  'TVC:VIX':         { 'SP:SPX': -0.82, 'NASDAQ:NDX': -0.78 },
  'TVC:GOLD':        { 'TVC:SILVER': 0.88, 'TVC:DXY': -0.75, 'FX:EURUSD': 0.62, 'TVC:USOIL': 0.42 },
  'TVC:SILVER':      { 'TVC:GOLD': 0.88 },
  'TVC:PLATINUM':    { 'TVC:GOLD': 0.72, 'TVC:SILVER': 0.7 },
  'FX:EURUSD':       { 'TVC:DXY': -0.9, 'FX:GBPUSD': 0.78, 'TVC:GOLD': 0.62 },
  'FX:GBPUSD':       { 'FX:EURUSD': 0.78, 'TVC:DXY': -0.72 },
  'FX:USDJPY':       { 'TVC:DXY': 0.68 },
  'FX:USDCHF':       { 'TVC:DXY': 0.82, 'FX:EURUSD': -0.92 },
  'FX:AUDUSD':       { 'TVC:GOLD': 0.6, 'FX:EURUSD': 0.65 },
  'TVC:DXY':         { 'FX:EURUSD': -0.9, 'FX:GBPUSD': -0.72, 'TVC:GOLD': -0.75, 'FX:USDCHF': 0.82, 'FX:USDJPY': 0.68 },
  'BITSTAMP:BTCUSD': { 'BITSTAMP:ETHUSD': 0.93, 'BINANCE:SOLUSDT': 0.82, 'SP:SPX': 0.52, 'NASDAQ:NDX': 0.58 },
  'BITSTAMP:ETHUSD': { 'BITSTAMP:BTCUSD': 0.93, 'BINANCE:SOLUSDT': 0.85 },
  'BINANCE:SOLUSDT':  { 'BITSTAMP:BTCUSD': 0.82, 'BITSTAMP:ETHUSD': 0.85 },
  'TVC:USOIL':       { 'TVC:UKOIL': 0.97, 'TVC:GOLD': 0.42 },
  'TVC:UKOIL':       { 'TVC:USOIL': 0.97 },
};

function getCorrBadges(sym) {
  const map = CORR[sym] || {};
  return Object.entries(map)
    .filter(([s]) => selected.includes(s))
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 3)
    .map(([s, r]) => {
      const all  = allCatalogueItems();
      const meta = all.find(c => c.symbol === s);
      const lbl  = meta ? meta.label : s.split(':')[1] || s;
      const cls  = r >= 0.7 ? 'corr-pos' : r <= -0.7 ? 'corr-neg' : 'corr-mid';
      const sign = r >= 0 ? '↑' : '↓';
      return `<span class="corr-badge ${cls}" title="Historical correlation ≈ ${r > 0 ? '+' : ''}${r} (approximate)">${sign} ${lbl}</span>`;
    }).join('');
}

// ---- TOAST NOTIFICATIONS ----
function showToast(msg, type = 'success', duration = 2500) {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('toast-show')));
  setTimeout(() => {
    el.classList.remove('toast-show');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

function showUndoToast(msg, onUndo) {
  document.querySelectorAll('.toast-undo').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast toast-undo';
  el.innerHTML = `<span>${msg}</span><button class="toast-undo-btn">Undo</button>`;
  document.body.appendChild(el);
  let done = false;
  el.querySelector('.toast-undo-btn').addEventListener('click', () => {
    done = true;
    onUndo();
    el.classList.remove('toast-show');
    setTimeout(() => el.remove(), 300);
  });
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('toast-show')));
  setTimeout(() => {
    if (!done) {
      el.classList.remove('toast-show');
      setTimeout(() => el.remove(), 300);
    }
  }, 5000);
}

// ---- FULLSCREEN HINT ----
function showFullscreenHint(cell) {
  const existing = cell.querySelector('.fullscreen-hint');
  if (existing) existing.remove();
  const hint = document.createElement('div');
  hint.className = 'fullscreen-hint';
  hint.textContent = 'Double-click or ESC to exit';
  cell.appendChild(hint);
  setTimeout(() => hint.classList.add('fade-out'), 2000);
  setTimeout(() => hint.remove(), 2600);
}

// ---- FETCH & UPDATE SINGLE SYMBOL % CHANGE ----
async function fetchAndUpdatePct(sym) {
  const pct = await fetchPctChange(sym);
  pctCache[sym] = pct;
  const containerId = 'tv_' + sym.replace(/[^a-zA-Z0-9]/g, '_');
  const badge = document.getElementById('pct_' + containerId);
  if (!badge) return;
  if (pct == null) {
    if (YAHOO_MAP[sym]) { badge.textContent = '—'; badge.className = 'pct-badge pct-na'; badge.title = 'Price change unavailable'; }
    return;
  }
  badge.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
  badge.className = 'pct-badge ' + (pct >= 0 ? 'pct-up' : 'pct-down');
  badge.title = '';
}

// ---- RELOAD SINGLE CHART ----
function reloadChart(sym) {
  const containerId = 'tv_' + sym.replace(/[^a-zA-Z0-9]/g, '_');
  const container = document.getElementById(containerId);
  if (!container) return;
  container.dataset.mounted = '';
  container.innerHTML = '';
  const cellH = parseInt(container.closest('.chart-cell')?.style.minHeight || 420) - 40;
  if (typeof TradingView === 'undefined') { loadTvScript(() => reloadChart(sym)); return; }
  new TradingView.widget({
    container_id: containerId, symbol: sym, interval: activeTf, timezone: activeTz,
    theme: 'dark', style: '1', locale: 'en', toolbar_bg: '#0d0d0d',
    enable_publishing: false, allow_symbol_change: true,
    hide_top_toolbar: false, hide_legend: false, save_image: false,
    width: '100%', height: cellH,
  });
}

// ---- EXPORT / IMPORT DATA ----
function exportData() {
  const data = {
    selected:       JSON.parse(localStorage.getItem(STORAGE_KEY)          || '[]'),
    favs:           JSON.parse(localStorage.getItem(FAVS_KEY)             || '[]'),
    presets:        JSON.parse(localStorage.getItem(PRESETS_KEY)          || '[]'),
    customSymbols:  JSON.parse(localStorage.getItem(CUSTOM_SYM_KEY)       || '[]'),
    customSessions: JSON.parse(localStorage.getItem(CUSTOM_SESSIONS_KEY)  || '[]'),
    notes:          JSON.parse(localStorage.getItem(NOTES_KEY)            || '{}'),
    tz:     localStorage.getItem(TZ_KEY),
    tf:     localStorage.getItem(TF_KEY),
    cols:   localStorage.getItem(COLS_KEY),
    cat:    localStorage.getItem(CAT_KEY),
    height: localStorage.getItem(HEIGHT_KEY),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `tj-charts-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported!');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      if (d.selected)       localStorage.setItem(STORAGE_KEY,         JSON.stringify(d.selected));
      if (d.favs)           localStorage.setItem(FAVS_KEY,            JSON.stringify(d.favs));
      if (d.presets)        localStorage.setItem(PRESETS_KEY,         JSON.stringify(d.presets));
      if (d.customSymbols)  localStorage.setItem(CUSTOM_SYM_KEY,      JSON.stringify(d.customSymbols));
      if (d.customSessions) localStorage.setItem(CUSTOM_SESSIONS_KEY, JSON.stringify(d.customSessions));
      if (d.notes)          localStorage.setItem(NOTES_KEY,           JSON.stringify(d.notes));
      if (d.tz)     localStorage.setItem(TZ_KEY,     d.tz);
      if (d.tf)     localStorage.setItem(TF_KEY,     d.tf);
      if (d.cols)   localStorage.setItem(COLS_KEY,   d.cols);
      if (d.cat)    localStorage.setItem(CAT_KEY,    d.cat);
      if (d.height) localStorage.setItem(HEIGHT_KEY, d.height);
      showToast('Imported — reloading...');
      setTimeout(() => location.reload(), 1000);
    } catch { showToast('Import failed — invalid file', 'error'); }
  };
  reader.readAsText(file);
}

// ---- ESCAPE KEY (fullscreen exit) ----
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.chart-cell.chart-fullscreen').forEach(c => c.classList.remove('chart-fullscreen'));
    document.body.classList.remove('has-fullscreen');
  }
});

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {

  // Ticker widget
  initTickerWidget();

  // Sync initial UI state from saved preferences
  document.querySelectorAll('.tf-btn').forEach(b => b.classList.toggle('active', b.dataset.tf === activeTf));
  document.querySelectorAll('.layout-btn').forEach(b => b.classList.toggle('active', b.dataset.cols === String(activeCols)));
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === activeCat));
  const heightSelect = document.getElementById('height-select');
  if (heightSelect) heightSelect.value = activeHeight;

  // Timezone select
  const tzSelect = document.getElementById('tz-select');
  if (tzSelect) {
    tzSelect.value = activeTz;
    tzSelect.addEventListener('change', () => {
      activeTz = tzSelect.value;
      saveTz(activeTz);
      renderSessions();
      // Re-mount charts with new timezone
      document.querySelectorAll('.chart-cell-widget').forEach(el => {
        el.dataset.mounted = '';
        el.innerHTML = '';
      });
      const cellH = parseInt(document.querySelector('.chart-cell')?.style.minHeight || 420) - 40;
      mountWidgets(cellH);
    });
  }

  // Category tabs
  document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCat = tab.dataset.cat;
      localStorage.setItem(CAT_KEY, activeCat);
      renderChips();
    });
  });

  // Symbol search (debounced)
  const symSearch = document.getElementById('sym-search');
  if (symSearch) {
    let searchTimer = null;
    symSearch.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchQuery = symSearch.value.toLowerCase().trim();
        renderChips();
      }, 200);
    });
  }

  // Sort select
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.value = activeSort;
    sortSelect.addEventListener('change', () => {
      activeSort = sortSelect.value;
      localStorage.setItem('tj_charts_sort', activeSort);
      renderChips();
    });
  }

  // Custom symbol UI
  document.getElementById('btn-show-custom-sym')?.addEventListener('click', () => {
    const row = document.getElementById('custom-sym-row');
    if (row) {
      row.style.display = row.style.display === 'none' ? 'flex' : 'none';
      if (row.style.display === 'flex') {
        document.getElementById('sym-custom-input')?.focus();
      }
    }
  });

  document.getElementById('btn-sym-custom-cancel')?.addEventListener('click', () => {
    const row = document.getElementById('custom-sym-row');
    if (row) row.style.display = 'none';
    const inp = document.getElementById('sym-custom-input');
    if (inp) inp.value = '';
  });

  document.getElementById('btn-sym-custom-add')?.addEventListener('click', () => {
    const inp = document.getElementById('sym-custom-input');
    if (!inp) return;
    const raw = inp.value.trim();
    if (!raw) return;

    // Support comma-separated symbols
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    let added = 0;
    parts.forEach(part => {
      // Validate: must look like a symbol (has colon or is a plain ticker)
      const sym = part.toUpperCase();
      // Ensure it contains colon — if not, warn but still allow
      const alreadyExists = allCatalogueItems().some(c => c.symbol === sym);
      if (alreadyExists) return;
      const labelPart = sym.includes(':') ? sym.split(':')[1] : sym;
      customSymbols.push({
        symbol: sym,
        label: labelPart,
        cat: 'custom',
        desc: 'Custom Symbol',
      });
      added++;
    });

    if (added > 0) {
      saveCustomSymbols(customSymbols);
      inp.value = '';
      const row = document.getElementById('custom-sym-row');
      if (row) row.style.display = 'none';
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      document.querySelector('.cat-tab[data-cat="custom"]')?.classList.add('active');
      activeCat = 'custom';
      renderChips();
      showToast(`${added} symbol${added > 1 ? 's' : ''} added!`);
    }
  });

  // Tool panel toggles
  document.getElementById('btn-cal-toggle')?.addEventListener('click',      () => toggleToolPanel('cal'));
  document.getElementById('btn-heatmap-toggle')?.addEventListener('click',  () => toggleToolPanel('heatmap'));
  document.getElementById('btn-news-toggle')?.addEventListener('click',     () => toggleToolPanel('news'));
  document.getElementById('btn-screener-toggle')?.addEventListener('click', () => toggleToolPanel('screener'));

  // Fetch % changes async (pause when tab hidden)
  setTimeout(refreshPctCache, 1500);
  let pctInterval = setInterval(refreshPctCache, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(pctInterval);
    } else {
      refreshPctCache();
      pctInterval = setInterval(refreshPctCache, 60000);
    }
  });

  // Preset save button
  document.getElementById('btn-save-preset')?.addEventListener('click', saveCurrentAsPreset);

  // Timeframe buttons
  document.querySelectorAll('.tf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTf = btn.dataset.tf;
      localStorage.setItem(TF_KEY, activeTf);
      document.querySelectorAll('.chart-cell-widget').forEach(el => {
        el.dataset.mounted = '';
        el.innerHTML = '';
      });
      const cellH = parseInt(document.querySelector('.chart-cell')?.style.minHeight || 420) - 40;
      mountWidgets(cellH);
    });
  });

  // Layout buttons
  document.querySelectorAll('.layout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCols = parseInt(btn.dataset.cols);
      localStorage.setItem(COLS_KEY, activeCols);
      renderGrid();
    });
  });

  // Sessions — render immediately + update every 30s (pause when tab hidden)
  renderSessions();
  let sessionInterval = setInterval(renderSessions, 30000);

  // Separate 10s notification check (more responsive than the 30s UI tick)
  let notifCheckInterval = setInterval(() => {
    if (customSessions.length > 0) checkSessionNotifications(getUtcMinutes());
  }, 10000);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(sessionInterval);
      clearInterval(notifCheckInterval);
    } else {
      renderSessions();
      sessionInterval    = setInterval(renderSessions, 30000);
      notifCheckInterval = setInterval(() => {
        if (customSessions.length > 0) checkSessionNotifications(getUtcMinutes());
      }, 10000);
    }
  });

  // Custom session modal
  document.getElementById('close-modal-session')?.addEventListener('click', closeSessionModal);
  document.getElementById('cancel-session')?.addEventListener('click', closeSessionModal);
  document.getElementById('modal-session')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-session')) closeSessionModal();
  });

  document.querySelectorAll('.color-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('cs-color').value = btn.dataset.color;
    });
  });

  document.getElementById('form-session')?.addEventListener('submit', e => {
    e.preventDefault();
    const editId = e.target.dataset.editId;
    const label  = document.getElementById('cs-name').value.trim();
    const openT  = document.getElementById('cs-open').value;
    const closeT = document.getElementById('cs-close').value;
    const color  = document.getElementById('cs-color').value;
    if (!label || !openT || !closeT) return;

    const [oh, om] = openT.split(':').map(Number);
    const [ch, cm] = closeT.split(':').map(Number);
    const open  = oh * 60 + (om || 0);
    const close = ch * 60 + (cm || 0);

    if (editId) {
      customSessions = customSessions.map(s => s.id === editId
        ? { ...s, label, open, close, color }
        : s
      );
    } else {
      customSessions.push({
        id:    'custom_' + Date.now(),
        label, open, close, color,
      });
    }
    saveCustomSessions(customSessions);
    // Reset state so new/edited session is tracked fresh
    sessionStatesInitialized = false;
    closeSessionModal();
    renderSessions();
    // Ask for notification permission on first custom session save
    if (Notification.permission === 'default') requestNotifPermission();
  });

  // Height select
  if (heightSelect) {
    heightSelect.addEventListener('change', () => {
      activeHeight = heightSelect.value;
      localStorage.setItem(HEIGHT_KEY, activeHeight);
      renderGrid();
    });
  }

  // Screener market toggle
  document.querySelectorAll('.screener-market-btn').forEach(btn => {
    btn.addEventListener('click', () => switchScreenerMarket(btn.dataset.market));
  });

  // Preset modal
  document.getElementById('close-modal-preset')?.addEventListener('click', closePresetModal);
  document.getElementById('cancel-preset')?.addEventListener('click', closePresetModal);
  document.getElementById('modal-preset')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-preset')) closePresetModal();
  });
  document.getElementById('form-preset')?.addEventListener('submit', e => {
    e.preventDefault();
    submitPreset(document.getElementById('preset-name-input').value);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    switch (e.key) {
      case '1': case '2': case '3': {
        const cols = parseInt(e.key);
        document.querySelectorAll('.layout-btn').forEach(b => b.classList.toggle('active', b.dataset.cols === e.key));
        activeCols = cols;
        localStorage.setItem(COLS_KEY, activeCols);
        renderGrid();
        break;
      }
      case '/':
        e.preventDefault();
        document.getElementById('sym-search')?.focus();
        break;
    }
  });

  // Export / Import
  document.getElementById('btn-export')?.addEventListener('click', exportData);
  document.getElementById('import-file')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) { importData(file); e.target.value = ''; }
  });

  // Presets
  renderPresets();

  // Initial render
  renderChips();
  renderGrid();
});
