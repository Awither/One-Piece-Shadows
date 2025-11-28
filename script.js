// ---------- Constants & initial data ----------

const PROFICIENCY_TIERS = [
  { id: 0, label: "0 – Untrained (civilian, fodder)" },
  { id: 1, label: "1 – Basic training" },
  { id: 2, label: "2 – Guard / town watch" },
  { id: 3, label: "3 – Veteran soldier" },
  { id: 4, label: "4 – Elite fighter" },
  { id: 5, label: "5 – Squad leader" },
  { id: 6, label: "6 – Commander / elite captain" },
  { id: 7, label: "7 – Warlord-level fighter" },
  { id: 8, label: "8 – Top commander of an emperor" },
  { id: 9, label: "9 – Legendary master" }
];

const TEMPLATE_TIERS = [
  { id: 0, label: "0 – Ordinary Human" },
  { id: 1, label: "1 – Trained Fighter" },
  { id: 2, label: "2 – Devil Fruit User" },
  { id: 3, label: "3 – Advanced Fighter (basic Haki)" },
  { id: 4, label: "4 – Advanced Fighter + Devil Fruit" },
  { id: 5, label: "5 – Mythical Devil Fruit User" },
  { id: 6, label: "6 – Big Boss" },
  { id: 7, label: "7 – Final World Boss" }
];

// Buff templates with simple metadata for totals
const DEFAULT_BUFFS = [
  {
    id: "temp_hp_20",
    name: "+20 Temp HP",
    baseCost: 10,
    description: "Gain +20 temporary HP per stack.",
    effect: { type: "tempHP", perStack: 20 }
  },
  {
    id: "temp_hp_50",
    name: "+50 Temp HP",
    baseCost: 20,
    description: "Gain +50 temporary HP per stack.",
    effect: { type: "tempHP", perStack: 50 }
  },
  {
    id: "speed_10",
    name: "+10 ft Movement",
    baseCost: 7,
    description: "Increase your speed by +10 ft per stack.",
    effect: { type: "speed", perStack: 10 }
  },
  {
    id: "str_save",
    name: "+2 STR Save Bonus",
    baseCost: 12,
    description: "+2 bonus to Strength saving throws per stack.",
    effect: { type: "save", stat: "STR", perStack: 2 }
  },
  {
    id: "dex_save",
    name: "+2 DEX Save Bonus",
    baseCost: 12,
    description: "+2 bonus to Dexterity saving throws per stack.",
    effect: { type: "save", stat: "DEX", perStack: 2 }
  },
  {
    id: "con_save",
    name: "+2 CON Save Bonus",
    baseCost: 12,
    description: "+2 bonus to Constitution saving throws per stack.",
    effect: { type: "save", stat: "CON", perStack: 2 }
  },
  {
    id: "shadow_guard",
    name: "Shadow Guard (AC in Darkness)",
    baseCost: 15,
    description: "While in dim light or darkness, gain +1 AC per stack.",
    effect: { type: "ac_dark", perStack: 1 }
  },
  {
    id: "shadow_dash",
    name: "Shadow Dash",
    baseCost: 10,
    description: "Once per turn, you can move an additional 10 ft as part of your movement per stack.",
    effect: { type: "dash", perStack: 10 }
  },
  {
    id: "shadow_redirect",
    name: "Shadow Redirect",
    baseCost: 15,
    description: "Once per round, reduce damage from a hit by 1d8 + SL; more stacks add more uses per round.",
    effect: { type: "custom", perStack: 1 }
  },
  {
    id: "shadow_weapon",
    name: "Shadow Weapon",
    baseCost: 14,
    description: "Conjure a magical shadow weapon. Treat as your best martial weapon; DM decides damage.",
    effect: { type: "weapon", perStack: 1 }
  }
];

const STORAGE_KEY = "shadowFruitSystem_v2";

// ---------- Global state ----------

let state = {
  shadows: [], // {id,name,raw,profTier,templateTier,sl,spu,active,techniquesText}
  corpses: [], // {id,name,durability,shadowIds,slSum,spuSum,stats}
  buffs: {}, // buffTemplates by id (includes custom)
  buffTargets: {}, // {targetId: {id,name,type, buffs: {buffId:count}}}
  abilities: [], // ability cards
  ui: {
    collapsedPanels: {},
    currentBuffTargetId: "self",
    lastDC: null
  }
};

// ---------- Utilities ----------

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state = Object.assign(state, parsed);
  } catch (e) {
    console.error("Failed to load state", e);
  }
}

// ---------- Initialization ----------

document.addEventListener("DOMContentLoaded", () => {
  // Load state and set defaults
  loadState();

  // Ensure buffs dictionary exists
  if (!state.buffs || Object.keys(state.buffs).length === 0) {
    state.buffs = {};
    DEFAULT_BUFFS.forEach(b => {
      state.buffs[b.id] = b;
    });
  }

  // Ensure buffTargets, with self target
  if (!state.buffTargets || Object.keys(state.buffTargets).length === 0) {
    const selfTarget = {
      id: "self",
      name: "Elren (Primary User)",
      type: "self",
      buffs: {}
    };
    state.buffTargets = { self: selfTarget };
    state.ui.currentBuffTargetId = "self";
  }

  // Build dropdown options
  initDropdowns();

  // Attach handlers
  initPanelToggles();
  initShadowPanel();
  renderShadows();
  initBuffPanel();
  renderBuffPanel();
  initCorpsePanel();
  initAIPanel();
  renderSummary();

  // Update totals SPU etc.
  updateShadowTotals();
});

// ---------- Collapsible panels ----------

function initPanelToggles() {
  const cards = document.querySelectorAll(".card-collapsible");
  cards.forEach(card => {
    const id = card.dataset.cardId;
    const toggle = card.querySelector(".card-toggle");
    if (!toggle) return;

    // Restore collapsed state
    if (state.ui.collapsedPanels[id]) {
      card.classList.add("collapsed");
    }

    toggle.addEventListener("click", () => {
      card.classList.toggle("collapsed");
      state.ui.collapsedPanels[id] = card.classList.contains("collapsed");
      saveState();
    });
  });
}

// ---------- Dropdowns & targets ----------

function initDropdowns() {
  // Proficiency tiers
  const profSelect = document.getElementById("proficiency-tier");
  PROFICIENCY_TIERS.forEach(t => {
    const opt = document.createElement("option");
    opt.value = String(t.id);
    opt.textContent = t.label;
    profSelect.appendChild(opt);
  });
  profSelect.value = "0";

  // Template tiers
  const templateSelect = document.getElementById("template-tier");
  TEMPLATE_TIERS.forEach(t => {
    const opt = document.createElement("option");
    opt.value = String(t.id);
    opt.textContent = t.label;
    templateSelect.appendChild(opt);
  });
  templateSelect.value = "0";

  updateBuffTargetSelects();
}

function updateBuffTargetSelects() {
  const targetSelect = document.getElementById("buff-target-select");
  const abilityTarget = document.getElementById("ability-target-select");
  if (!targetSelect || !abilityTarget) return;

  [targetSelect, abilityTarget].forEach(sel => {
    sel.innerHTML = "";
    Object.values(state.buffTargets).forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent =
        t.type === "self"
          ? "Elren (Primary User)"
          : t.type === "corpse"
          ? `Corpse: ${t.name}`
          : `Ally: ${t.name}`;
      sel.appendChild(opt);
    });
  });

  targetSelect.value = state.ui.currentBuffTargetId || "self";
  abilityTarget.value = state.ui.currentBuffTargetId || "self";
}

// ---------- Shadow panel (1 & 2) ----------

function initShadowPanel() {
  const btnCalc = document.getElementById("btn-calc-shadow");
  const btnAdd = document.getElementById("btn-add-shadow");

  btnCalc.addEventListener("click", () => {
    const nameInput = document.getElementById("shadow-name");
    const rawInput = document.getElementById("raw-might");
    const profSelect = document.getElementById("proficiency-tier");
    const templateSelect = document.getElementById("template-tier");
    const output = document.getElementById("shadow-calc-output");

    const name = nameInput.value.trim() || "Unnamed Shadow";
    const raw = Math.max(0, Math.min(20, Number(rawInput.value) || 0));
    const profId = Number(profSelect.value);
    const templateId = Number(templateSelect.value);

    const { sl, spu, scoreBreakdown } = calculateShadowPower(raw, profId, templateId);

    output.innerHTML = `
      <strong>${name}</strong><br/>
      Shadow Level (SL): <strong>${sl}</strong><br/>
      Shadow Power Units (SPU): <strong>${spu}</strong><br/>
      <span class="shadow-breakdown">${scoreBreakdown}</span>
    `;

    btnAdd.disabled = false;
    btnAdd.dataset.pendingName = name;
    btnAdd.dataset.pendingRaw = raw;
    btnAdd.dataset.pendingProf = profId;
    btnAdd.dataset.pendingTemplate = templateId;
    btnAdd.dataset.pendingSL = sl;
    btnAdd.dataset.pendingSPU = spu;
  });

  btnAdd.addEventListener("click", () => {
    if (btnAdd.disabled) return;
    const id = uid("shadow");
    const newShadow = {
      id,
      name: btnAdd.dataset.pendingName,
      raw: Number(btnAdd.dataset.pendingRaw),
      profTier: Number(btnAdd.dataset.pendingProf),
      templateTier: Number(btnAdd.dataset.pendingTemplate),
      sl: Number(btnAdd.dataset.pendingSL),
      spu: Number(btnAdd.dataset.pendingSPU),
      active: true,
      techniquesText: ""
    };
    state.shadows.push(newShadow);
    saveState();
    renderShadows();
    updateShadowTotals();

    // Reset add button
    btnAdd.disabled = true;
  });
}

function calculateShadowPower(raw, profId, templateId) {
  const maxProf = PROFICIENCY_TIERS[PROFICIENCY_TIERS.length - 1].id || 9;
  const maxTemplate = TEMPLATE_TIERS[TEMPLATE_TIERS.length - 1].id || 7;

  const rawNorm = raw / 20;
  const profNorm = profId / maxProf;
  const templNorm = templateId / maxTemplate;

  // Multiplicative, with floor factors to keep civilians >0
  const rawFactor = 0.4 + 0.6 * rawNorm;
  const profFactor = 0.4 + 0.6 * profNorm;
  const templFactor = 0.4 + 0.6 * templNorm;

  const overall = rawFactor * profFactor * templFactor; // 0.064 to 1

  // Square to give bigger gap at the top end
  const scaled = overall * overall; // ~0 to 1

  const spu = Math.max(1, Math.round(scaled * 1000)); // 1 – 1000
  const sl = Math.max(1, Math.round(overall * 10)); // 1 – 10

  const scoreBreakdown = `
    Raw Might contribution: ${(rawNorm * 100).toFixed(0)}%<br/>
    Training contribution: ${(profNorm * 100).toFixed(0)}%<br/>
    Template contribution: ${(templNorm * 100).toFixed(0)}%<br/>
    Overall Shadow Score: ${(overall * 100).toFixed(1)}% of maximum.
  `;

  return { sl, spu, scoreBreakdown };
}

function renderShadows() {
  const list = document.getElementById("shadow-list");
  const emptyState = document.getElementById("shadow-list-empty");
  const corpseSelect = document.getElementById("corpse-shadow-select");

  list.innerHTML = "";
  corpseSelect.innerHTML = "";

  if (!state.shadows.length) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }

  state.shadows.forEach(shadow => {
    // list item
    const card = document.createElement("div");
    card.className = "shadow-card";

    const header = document.createElement("div");
    header.className = "shadow-card-header";

    const title = document.createElement("h3");
    title.textContent = shadow.name;
    header.appendChild(title);

    const tag = document.createElement("span");
    tag.className = "shadow-tag";
    tag.textContent = `SL ${shadow.sl} | ${shadow.spu} SPU`;
    header.appendChild(tag);

    const main = document.createElement("div");
    main.className = "shadow-card-main";
    main.innerHTML = `
      <span><strong>Raw:</strong> ${shadow.raw}/20</span>
      <span><strong>Prof:</strong> ${PROFICIENCY_TIERS.find(p => p.id === shadow.profTier)?.id ?? shadow.profTier}</span>
      <span><strong>Template:</strong> ${
        TEMPLATE_TIERS.find(t => t.id === shadow.templateTier)?.label ?? shadow.templateTier
      }</span>
    `;

    const tools = document.createElement("div");
    tools.className = "shadow-card-tools";

    const left = document.createElement("div");
    left.className = "shadow-card-tools-left";

    const activeLabel = document.createElement("label");
    activeLabel.style.display = "flex";
    activeLabel.style.alignItems = "center";
    activeLabel.style.gap = "4px";

    const activeCheckbox = document.createElement("input");
    activeCheckbox.type = "checkbox";
    activeCheckbox.checked = shadow.active;
    activeCheckbox.addEventListener("change", () => {
      shadow.active = activeCheckbox.checked;
      saveState();
      updateShadowTotals();
    });
    activeLabel.appendChild(activeCheckbox);
    const span = document.createElement("span");
    span.textContent = "Active";
    activeLabel.appendChild(span);

    left.appendChild(activeLabel);

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn danger btn-sm";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      state.shadows = state.shadows.filter(s => s.id !== shadow.id);
      saveState();
      renderShadows();
      updateShadowTotals();
    });

    tools.appendChild(left);
    tools.appendChild(removeBtn);

    const ta = document.createElement("textarea");
    ta.placeholder = "Known abilities / attacks (1 per line). Used for inherited techniques on corpses.";
    ta.value = shadow.techniquesText || "";
    ta.addEventListener("input", () => {
      shadow.techniquesText = ta.value;
      saveState();
    });

    card.appendChild(header);
    card.appendChild(main);
    card.appendChild(tools);
    card.appendChild(ta);

    list.appendChild(card);

    // corpse multi-select
    const opt = document.createElement("option");
    opt.value = shadow.id;
    opt.textContent = `${shadow.name} (SL ${shadow.sl}, ${shadow.spu} SPU)`;
    corpseSelect.appendChild(opt);
  });
}

function updateShadowTotals() {
  const total = state.shadows.reduce((sum, s) => sum + s.spu, 0);
  const spent = computeTotalSpentSPU();
  const available = Math.max(0, total - spent);

  document.getElementById("total-asp").textContent = total;
  document.getElementById("spent-asp").textContent = spent;
  document.getElementById("available-asp").textContent = available;

  renderSelectedBuffs();
  renderSummary();
  saveState();
}

// ---------- Buff panel (3) ----------

function initBuffPanel() {
  const targetSelect = document.getElementById("buff-target-select");
  const addAllyBtn = document.getElementById("btn-add-ally-target");
  const addCustomBtn = document.getElementById("btn-add-custom-buff");
  const calcDCBtn = document.getElementById("btn-calc-dc");

  targetSelect.addEventListener("change", () => {
    state.ui.currentBuffTargetId = targetSelect.value;
    saveState();
    renderSelectedBuffs();
    renderSummary();
  });

  addAllyBtn.addEventListener("click", () => {
    const name = prompt("Ally name?");
    if (!name) return;
    const id = uid("ally");
    state.buffTargets[id] = {
      id,
      name,
      type: "ally",
      buffs: {}
    };
    saveState();
    updateBuffTargetSelects();
    renderSelectedBuffs();
    renderSummary();
  });

  addCustomBtn.addEventListener("click", () => {
    const nameInput = document.getElementById("custom-buff-name");
    const costInput = document.getElementById("custom-buff-cost");
    const descInput = document.getElementById("custom-buff-desc");

    const name = nameInput.value.trim();
    const cost = Math.max(1, Number(costInput.value) || 1);
    const desc = descInput.value.trim();

    if (!name) {
      alert("Please enter a buff name.");
      return;
    }

    const id = uid("buff");
    state.buffs[id] = {
      id,
      name,
      baseCost: cost,
      description: desc || "Custom buff.",
      effect: { type: "custom", perStack: 1 }
    };

    nameInput.value = "";
    descInput.value = "";
    renderBuffPanel();
    saveState();
  });

  calcDCBtn.addEventListener("click", () => {
    const sl = Number(document.getElementById("dc-shadow-level").value) || 1;
    const prof = Number(document.getElementById("dc-prof-bonus").value) || 0;
    const mod = Number(document.getElementById("dc-ability-mod").value) || 0;
    const bonusFromShadow = Math.floor(sl / 2);
    const dc = 8 + prof + mod + bonusFromShadow;
    state.ui.lastDC = dc;
    saveState();

    document.getElementById("dc-output").textContent =
      `Suggested DC: ${dc} (8 + prof ${prof} + mod ${mod} + shadow bonus ${bonusFromShadow})`;

    renderSummary();
  });
}

function renderBuffPanel() {
  const container = document.getElementById("buff-list");
  container.innerHTML = "";

  Object.values(state.buffs).forEach(buff => {
    const card = document.createElement("div");
    card.className = "buff-card";

    const header = document.createElement("div");
    header.className = "buff-card-header";

    const name = document.createElement("h3");
    name.textContent = buff.name;
    header.appendChild(name);

    const cost = document.createElement("span");
    cost.textContent = `${buff.baseCost} SPU (base)`;
    cost.style.fontSize = "0.78rem";
    cost.style.color = "#c2b8ff";
    header.appendChild(cost);

    const body = document.createElement("div");
    body.className = "buff-card-body";

    const p = document.createElement("p");
    p.textContent = buff.description;
    body.appendChild(p);

    const meta = document.createElement("div");
    meta.className = "buff-card-meta";
    meta.innerHTML = `<strong>Stacking:</strong> each extra copy costs more but increases the total effect.`;
    body.appendChild(meta);

    const controls = document.createElement("div");
    controls.className = "buff-stack-controls";

    const targetId = state.ui.currentBuffTargetId || "self";
    const target = state.buffTargets[targetId];
    const currentCount = (target?.buffs?.[buff.id]) || 0;

    const countSpan = document.createElement("span");
    countSpan.textContent = `Copies: ${currentCount}`;
    controls.appendChild(countSpan);

    const btnRow = document.createElement("div");
    btnRow.className = "stack-buttons";

    const decBtn = document.createElement("button");
    decBtn.className = "stack-btn";
    decBtn.textContent = "−";
    decBtn.addEventListener("click", () => adjustBuffStacks(buff.id, -1));
    const incBtn = document.createElement("button");
    incBtn.className = "stack-btn";
    incBtn.textContent = "+";
    incBtn.addEventListener("click", () => adjustBuffStacks(buff.id, 1));

    btnRow.appendChild(decBtn);
    btnRow.appendChild(incBtn);
    controls.appendChild(btnRow);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(controls);

    container.appendChild(card);
  });

  renderSelectedBuffs();
}

function buffStackCost(baseCost, stacks) {
  // First copy costs base.
  // After that, costs grow quadratically: base * (1 + (n-1)^2 * 0.5)
  if (stacks <= 0) return 0;
  let total = 0;
  for (let i = 1; i <= stacks; i++) {
    if (i === 1) total += baseCost;
    else total += Math.round(baseCost * (1 + 0.5 * Math.pow(i - 1, 2)));
  }
  return total;
}

function adjustBuffStacks(buffId, delta) {
  const targetId = state.ui.currentBuffTargetId || "self";
  const target = state.buffTargets[targetId];
  if (!target) return;

  const prev = target.buffs[buffId] || 0;
  let next = prev + delta;
  if (next < 0) next = 0;

  target.buffs[buffId] = next;
  if (next === 0) {
    delete target.buffs[buffId];
  }

  saveState();
  renderBuffPanel();
  updateShadowTotals();
}

function computeTotalSpentSPU() {
  let total = 0;
  Object.values(state.buffTargets).forEach(t => {
    Object.entries(t.buffs || {}).forEach(([buffId, count]) => {
      const buff = state.buffs[buffId];
      if (!buff) return;
      total += buffStackCost(buff.baseCost, count);
    });
  });
  return total;
}

function renderSelectedBuffs() {
  const container = document.getElementById("selected-buffs");
  if (!container) return;

  const targetId = state.ui.currentBuffTargetId || "self";
  const target = state.buffTargets[targetId];
  container.innerHTML = "";

  if (!target || !Object.keys(target.buffs || {}).length) {
    container.classList.add("empty");
    container.textContent = "No buffs selected for this target yet.";
    return;
  }

  container.classList.remove("empty");

  // show totals per buff
  Object.entries(target.buffs).forEach(([buffId, count]) => {
    const buff = state.buffs[buffId];
    if (!buff) return;
    const effect = buff.effect || {};
    const totalCost = buffStackCost(buff.baseCost, count);
    const div = document.createElement("div");
    div.className = "selected-buff-item";

    let effectLine = "";
    if (effect.type === "tempHP") {
      effectLine = `Total: +${effect.perStack * count} temporary HP.`;
    } else if (effect.type === "speed") {
      effectLine = `Total: +${effect.perStack * count} ft speed.`;
    } else if (effect.type === "save") {
      effectLine = `Total: +${effect.perStack * count} to ${effect.stat} saving throws.`;
    } else if (effect.type === "ac_dark") {
      effectLine = `Total: +${effect.perStack * count} AC in dim light/darkness.`;
    } else if (effect.type === "dash") {
      effectLine = `Total: ${effect.perStack * count} extra ft of dash movement per turn.`;
    } else {
      effectLine = `Stacks: ${count}.`;
    }

    div.innerHTML = `
      <strong>${buff.name}</strong> ×${count}<br/>
      ${effectLine}<br/>
      SPU spent on this buff: ${totalCost}
    `;
    container.appendChild(div);
  });
}

// ---------- Corpse panel (4) ----------

function initCorpsePanel() {
  const btn = document.getElementById("btn-generate-corpse");
  const modeSelect = document.getElementById("corpse-shadow-mode");

  modeSelect.addEventListener("change", () => {
    const customSelect = document.getElementById("corpse-shadow-select");
    customSelect.disabled = modeSelect.value !== "custom";
  });

  btn.addEventListener("click", () => {
    generateCorpseStatBlock();
  });
}

function generateCorpseStatBlock() {
  const name = document.getElementById("corpse-name").value.trim() || "Unnamed Corpse";
  const durability = Math.max(1, Math.min(10, Number(document.getElementById("corpse-durability").value) || 1));
  const mode = document.getElementById("corpse-shadow-mode").value;
  const customSel = document.getElementById("corpse-shadow-select");
  const outputContainer = document.getElementById("corpse-output-container");
  const buffsContainer = document.getElementById("corpse-buffs-container");
  const buffsSummary = document.getElementById("corpse-buffs-summary");

  let usedShadows = [];
  if (mode === "active") {
    usedShadows = state.shadows.filter(s => s.active);
  } else if (mode === "all") {
    usedShadows = [...state.shadows];
  } else {
    const selectedIds = Array.from(customSel.selectedOptions).map(o => o.value);
    usedShadows = state.shadows.filter(s => selectedIds.includes(s.id));
  }

  const slSum = usedShadows.reduce((sum, s) => sum + s.sl, 0);
  const spuSum = usedShadows.reduce((sum, s) => sum + s.spu, 0);

  // Basic stat derivation using durability & shadow power
  const baseAC = 10 + Math.floor(durability / 2);
  const acFromShadows = Math.floor(slSum / 3);
  const armorClass = baseAC + acFromShadows;

  const hp = Math.max(20, durability * 10 + Math.floor(spuSum / 8));
  const speed = 20 + Math.min(40, Math.floor(slSum / 2) * 5);

  const str = 10 + durability + Math.floor(slSum / 3);
  const dex = 8 + Math.floor(slSum / 4);
  const con = 10 + durability;
  const int = 6 + Math.floor(slSum / 5);
  const wis = 8 + Math.floor(slSum / 6);
  const cha = 8 + Math.floor(slSum / 6);

  // Traits text
  const traitsText = [
    "Corpse Durability.",
    `  Built from a Durability Tier ${durability} body; it is extremely hard to destroy.`,
    "",
    "Infused Shadows.",
    `  Infused with ${usedShadows.length || 0} shadow(s), total SL ${slSum}, total ${spuSum} SPU.`,
    "",
    "Shadow Instincts.",
    "  Gains advantage on one type of save (STR, DEX, or CON), chosen when created.",
    "",
    "Shadow Resilience.",
    "  Once per rest, when reduced to 0 HP, it can instead drop to 1 HP (DM option).",
    "",
    "Damage Resistances.",
    "  necrotic; bludgeoning, piercing, and slashing from non-magical attacks (DM option).",
    "",
    "Condition Immunities.",
    "  charmed, frightened, poisoned (DM option).",
    "",
    "Senses.",
    "  darkvision 60 ft., passive Perception ??; understands languages it knew in life;",
    "  obeys the shadow fruit user."
  ].join("\n");

  const meleeBonus = Math.floor((str - 10) / 2) + 5;
  const meleeDamageBonus = Math.floor((str - 10) / 2);

  const actionsText = [
    "Multiattack.",
    "  The reanimated corpse makes two attacks: one Slam and one Shadow Lash (or two Slams).",
    "",
    "Slam.",
    `  Melee Weapon Attack: +${meleeBonus} to hit, reach 5 ft., one target.`,
    `  Hit: 1d10 + ${meleeDamageBonus} bludgeoning damage.`,
    "",
    "Shadow Lash.",
    "  Melee spell-like attack: +? to hit, reach 10 ft., one target.",
    "  Hit: 2d8 necrotic damage, and the target must succeed on a STR or DEX save",
    "  (DC based on your shadow DC helper) or be grappled by writhing shadow chains."
  ].join("\n");

  // Infused shadows & inherited techniques
  const infusedLines = [];
  usedShadows.forEach(sh => {
    infusedLines.push(
      `• ${sh.name} – SL ${sh.sl}, ${sh.spu} SPU, Template: ${
        TEMPLATE_TIERS.find(t => t.id === sh.templateTier)?.label ?? sh.templateTier
      }`
    );
  });

  const inheritedTechniqueNames = [];
  usedShadows.forEach(sh => {
    const lines = (sh.techniquesText || "")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);
    lines.forEach(l => {
      if (!inheritedTechniqueNames.includes(l)) {
        inheritedTechniqueNames.push(l);
      }
    });
  });

  const infusedText = infusedLines.length ? infusedLines.join("\n") : "• None";
  const techniquesTextList = inheritedTechniqueNames.length
    ? inheritedTechniqueNames.map(t => `• ${t}`).join("\n")
    : "• None recorded. Add techniques to the powering shadows in panel 2.";

  outputContainer.innerHTML = "";

  const card = document.createElement("div");
  card.className = "corpse-card";

  const header = document.createElement("div");
  header.className = "corpse-card-header";

  const title = document.createElement("h3");
  title.textContent = name.toUpperCase();
  header.appendChild(title);

  const tag = document.createElement("span");
  tag.className = "corpse-tag";
  tag.textContent = `Tier: Reanimated Corpse (SL sum ${slSum}, ${spuSum} SPU)`;
  header.appendChild(tag);

  const statRow = document.createElement("div");
  statRow.className = "corpse-stat-row";
  statRow.innerHTML = `
    <div class="corpse-stat-pill"><strong>Armor Class</strong><span>${armorClass} (shadow-reinforced hide)</span></div>
    <div class="corpse-stat-pill"><strong>Hit Points</strong><span>~${hp} (DM can convert to dice)</span></div>
    <div class="corpse-stat-pill"><strong>Speed</strong><span>${speed} ft.</span></div>
    <div class="corpse-stat-pill"><strong>STR / DEX / CON</strong><span>${str} / ${dex} / ${con}</span></div>
    <div class="corpse-stat-pill"><strong>INT / WIS / CHA</strong><span>${int} / ${wis} / ${cha}</span></div>
  `;

  const traitsSection = document.createElement("div");
  traitsSection.className = "corpse-section";
  traitsSection.innerHTML = `<h4>Traits</h4><pre>${traitsText}</pre>`;

  const actionsSection = document.createElement("div");
  actionsSection.className = "corpse-section";
  actionsSection.innerHTML = `<h4>Actions</h4><pre>${actionsText}</pre>`;

  const infusedSection = document.createElement("div");
  infusedSection.className = "corpse-section";
  infusedSection.innerHTML = `
    <h4>Infused Shadows</h4>
    <pre>${infusedText}</pre>
    <h4>Inherited Techniques (from powering shadows)</h4>
    <pre>${techniquesTextList}</pre>
  `;

  const abilityGrid = document.createElement("div");
  abilityGrid.className = "corpse-ability-grid";
  abilityGrid.appendChild(traitsSection);
  abilityGrid.appendChild(actionsSection);
  abilityGrid.appendChild(infusedSection);

  card.appendChild(header);
  card.appendChild(statRow);
  card.appendChild(abilityGrid);

  outputContainer.appendChild(card);

  // Save corpse into state and link as buff target
  const id = uid("corpse");
  const corpseObj = {
    id,
    name,
    durability,
    shadowIds: usedShadows.map(s => s.id),
    slSum,
    spuSum,
    stats: { armorClass, hp, speed, str, dex, con, int, wis, cha }
  };
  state.corpses.push(corpseObj);

  // Make or update buff target
  state.buffTargets[id] = state.buffTargets[id] || {
    id,
    name,
    type: "corpse",
    buffs: {}
  };
  state.buffTargets[id].name = name;

  saveState();
  updateBuffTargetSelects();
  renderSelectedBuffs();

  // Show buffs summary area
  buffsContainer.classList.remove("hidden");
  buffsSummary.textContent =
    "Buffs for this corpse are shown in panel 3 when you select it as a buff target, and summarized in panel 6.";

  const editBtn = document.getElementById("btn-edit-corpse-buffs");
  editBtn.onclick = () => {
    state.ui.currentBuffTargetId = id;
    saveState();
    updateBuffTargetSelects();
    renderBuffPanel();
    // Scroll to panel 3
    document.querySelector('[data-card-id="panel3"]').scrollIntoView({ behavior: "smooth" });
  };

  renderSummary();
}

// ---------- AI panel (5) ----------

function initAIPanel() {
  const btnGenerate = document.getElementById("btn-generate-ai");
  const btnAddEmpty = document.getElementById("btn-add-empty-ability");
  const abilityTargetSelect = document.getElementById("ability-target-select");

  abilityTargetSelect.addEventListener("change", () => {
    state.ui.currentBuffTargetId = abilityTargetSelect.value;
    saveState();
  });

  btnAddEmpty.addEventListener("click", () => {
    createAbilityCard({
      name: "",
      role: "",
      summary: "",
      action: "",
      range: "",
      target: "",
      save: "",
      dc: "",
      damage: "",
      effect: "",
      combo: "",
      targetId: state.ui.currentBuffTargetId || "self"
    });
  });

  btnGenerate.addEventListener("click", () => {
    generateAbilitiesWithAI();
  });

  renderAbilities();
}

function generateAbilitiesWithAI() {
  const notes = document.getElementById("ai-notes").value.trim();
  const container = document.getElementById("ai-abilities-container");
  container.innerHTML = "<p>Contacting AI and parsing abilities… (You will plug in your API logic here.)</p>";

  // This is just a stub so the UI works without a backend.
  // You can replace this with a real fetch() to your Vercel function.
  setTimeout(() => {
    // Example fake response
    const fakeAbilitiesText = [
      {
        name: "Shadow Gale Barrage",
        summary: "A flurry of razor-sharp shadow blades that slice enemies in an arc.",
        action: "Action",
        range: "30 ft cone",
        target: "All creatures in cone",
        save: "Dexterity save",
        dc: state.ui.lastDC || 16,
        damage: "6d8 slashing + 4d8 necrotic",
        effect: "On a failed save, full damage; on success, half damage.",
        combo: "Works well after restraining targets with Shadow Bind."
      },
      {
        name: "Shadow Asgard Ascendant",
        summary: "Medium-large transformation; body swells with roaring shadow aura.",
        action: "Action",
        range: "Self",
        target: "Self",
        save: "-",
        dc: "",
        damage: "-",
        effect: "Gain big boost to STR, CON, AC and temp HP for 1 minute (DM sets exact numbers).",
        combo: "Consumes large SPU; best used for boss fights."
      },
      {
        name: "Grasping Coffin",
        summary: "Shadows erupt as coffins that clamp around enemies.",
        action: "Action",
        range: "60 ft",
        target: "Up to 3 creatures",
        save: "Strength save",
        dc: state.ui.lastDC || 16,
        damage: "3d8 bludgeoning + restrained on fail",
        effect: "Restrained while coffins hold; they can repeat the save at end of turns.",
        combo: "Sets up advantage for your melee or corpses’ attacks."
      }
    ];

    // Clear old AI-generated abilities
    state.abilities = [];

    fakeAbilitiesText.forEach(a => {
      state.abilities.push({
        id: uid("ability"),
        ...a,
        role: "Offense / Control",
        targetId: state.ui.currentBuffTargetId || "self"
      });
    });

    saveState();
    renderAbilities();
    renderSummary();
  }, 600);
}

function createAbilityCard(data) {
  const ability = {
    id: data.id || uid("ability"),
    name: data.name || "",
    role: data.role || "",
    summary: data.summary || "",
    action: data.action || "",
    range: data.range || "",
    target: data.target || "",
    save: data.save || "",
    dc: data.dc || "",
    damage: data.damage || "",
    effect: data.effect || "",
    combo: data.combo || "",
    targetId: data.targetId || "self"
  };
  state.abilities.push(ability);
  saveState();
  renderAbilities();
  renderSummary();
}

function renderAbilities() {
  const container = document.getElementById("ai-abilities-container");
  container.innerHTML = "";

  state.abilities.forEach(ability => {
    const card = document.createElement("div");
    card.className = "ability-card";

    const header = document.createElement("div");
    header.className = "ability-card-header";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = ability.name;
    nameInput.placeholder = "Ability Name";
    nameInput.addEventListener("input", () => {
      ability.name = nameInput.value;
      saveState();
      renderSummary();
    });

    const tag = document.createElement("span");
    tag.className = "ability-tag";
    tag.textContent = "Shadow Ability";

    header.appendChild(nameInput);
    header.appendChild(tag);

    const body = document.createElement("div");
    body.className = "ability-card-body";

    const roleLine = document.createElement("div");
    roleLine.className = "ability-subtitle";
    roleLine.textContent = "Role: Offense / Defense / Support / Control / Utility";
    body.appendChild(roleLine);

    const targetRow = document.createElement("div");
    targetRow.className = "form-group";
    const targetLabel = document.createElement("label");
    targetLabel.textContent = "Assigned to";
    const targetSelect = document.createElement("select");
    Object.values(state.buffTargets).forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent =
        t.type === "self"
          ? "Elren (Primary User)"
          : t.type === "corpse"
          ? `Corpse: ${t.name}`
          : `Ally: ${t.name}`;
      targetSelect.appendChild(opt);
    });
    targetSelect.value = ability.targetId || "self";
    targetSelect.addEventListener("change", () => {
      ability.targetId = targetSelect.value;
      saveState();
      renderSummary();
    });
    targetRow.appendChild(targetLabel);
    targetRow.appendChild(targetSelect);
    body.appendChild(targetRow);

    const summaryTA = document.createElement("textarea");
    summaryTA.placeholder = "Short description / visuals.";
    summaryTA.value = ability.summary;
    summaryTA.addEventListener("input", () => {
      ability.summary = summaryTA.value;
      saveState();
      renderSummary();
    });
    body.appendChild(summaryTA);

    const miniGrid = document.createElement("div");
    miniGrid.className = "ability-mini-grid";

    const fields = [
      { key: "action", label: "Action" },
      { key: "range", label: "Range" },
      { key: "target", label: "Target" },
      { key: "save", label: "Save" },
      { key: "dc", label: "DC" },
      { key: "damage", label: "Damage" }
    ];

    fields.forEach(f => {
      const fg = document.createElement("div");
      fg.className = "form-group";
      const lab = document.createElement("label");
      lab.textContent = f.label;
      const inp = document.createElement("input");
      inp.type = "text";
      inp.value = ability[f.key] || "";
      inp.addEventListener("input", () => {
        ability[f.key] = inp.value;
        saveState();
      });
      fg.appendChild(lab);
      fg.appendChild(inp);
      miniGrid.appendChild(fg);
    });

    body.appendChild(miniGrid);

    const effectTA = document.createElement("textarea");
    effectTA.placeholder = "Mechanical effect: what happens on hit / failed save.";
    effectTA.value = ability.effect;
    effectTA.addEventListener("input", () => {
      ability.effect = effectTA.value;
      saveState();
      renderSummary();
    });
    body.appendChild(effectTA);

    const comboTA = document.createElement("textarea");
    comboTA.placeholder = "Optional: how this interacts with other powers / combo logic.";
    comboTA.value = ability.combo;
    comboTA.addEventListener("input", () => {
      ability.combo = comboTA.value;
      saveState();
    });
    body.appendChild(comboTA);

    const footer = document.createElement("div");
    footer.className = "ability-footer-row";

    const leftBtns = document.createElement("div");
    const rerollBtn = document.createElement("button");
    rerollBtn.className = "btn secondary btn-sm";
    rerollBtn.textContent = "Reroll";
    rerollBtn.addEventListener("click", () => {
      // For now we just randomize some text stub.
      ability.summary = ability.summary || "Shadow ability reshaped by reroll.";
      ability.effect =
        ability.effect ||
        "On a failed save, targets take heavy damage; on success, half as much.";
      saveState();
      renderAbilities();
      renderSummary();
    });
    const copyBtn = document.createElement("button");
    copyBtn.className = "btn secondary btn-sm";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", async () => {
      const text =
        `${ability.name}\n\n${ability.summary}\n\nAction: ${ability.action}\nRange: ${ability.range}\n` +
        `Target: ${ability.target}\nSave: ${ability.save} (DC ${ability.dc})\nDamage: ${ability.damage}\n\nEffect:\n${ability.effect}`;
      try {
        await navigator.clipboard.writeText(text);
        alert("Ability copied to clipboard.");
      } catch (e) {
        console.error(e);
      }
    });
    leftBtns.appendChild(copyBtn);
    leftBtns.appendChild(rerollBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn danger btn-sm";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      state.abilities = state.abilities.filter(a => a.id !== ability.id);
      saveState();
      renderAbilities();
      renderSummary();
    });

    footer.appendChild(leftBtns);
    footer.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);

    container.appendChild(card);
  });
}

// ---------- Summary panel (6) ----------

function renderSummary() {
  const container = document.getElementById("summary-cards");
  if (!container) return;
  container.innerHTML = "";

  // Build a combined view of targets
  const targets = Object.values(state.buffTargets);

  targets.forEach(target => {
    const card = document.createElement("div");
    card.className = "summary-card";

    const header = document.createElement("div");
    header.className = "summary-card-header";

    const title = document.createElement("h3");
    title.textContent =
      target.type === "self"
        ? "Elren (Primary User)"
        : target.type === "corpse"
        ? `Corpse: ${target.name}`
        : `Ally: ${target.name}`;
    header.appendChild(title);

    const tag = document.createElement("span");
    tag.className = "summary-tag";
    tag.textContent =
      target.type === "self" ? "SELF" : target.type === "corpse" ? "CORPSE" : "ALLY";
    header.appendChild(tag);

    card.appendChild(header);

    const statRow = document.createElement("div");
    statRow.className = "summary-stat-row";

    // Shadow power info
    const totalShadows = state.shadows.length;
    const totalSPU = state.shadows.reduce((sum, s) => sum + (s.active ? s.spu : 0), 0);

    // For corpses, look up corpse stats
    let corpseStats = null;
    if (target.type === "corpse") {
      corpseStats = state.corpses.find(c => c.id === target.id) || null;
    }

    const acVal =
      target.type === "corpse" && corpseStats
        ? corpseStats.stats.armorClass
        : "—";
    const hpVal =
      target.type === "corpse" && corpseStats
        ? `~${corpseStats.stats.hp} (base, plus temp HP from buffs)`
        : "DM / character sheet";
    const speedVal =
      target.type === "corpse" && corpseStats
        ? `${corpseStats.stats.speed} ft (before buffs)`
        : "—";

    const dcVal = state.ui.lastDC ? state.ui.lastDC : "—";

    statRow.innerHTML = `
      <div class="summary-stat-pill"><strong>AC</strong><span>${acVal}</span></div>
      <div class="summary-stat-pill"><strong>HP</strong><span>${hpVal}</span></div>
      <div class="summary-stat-pill"><strong>Speed</strong><span>${speedVal}</span></div>
      <div class="summary-stat-pill"><strong>Shadow Pool</strong><span>${totalShadows} shadow(s), ${totalSPU} SPU active</span></div>
      <div class="summary-stat-pill"><strong>Key DC</strong><span>${dcVal}</span></div>
    `;
    card.appendChild(statRow);

    // Buff summary for this target
    const buffsSection = document.createElement("div");
    buffsSection.className = "summary-section";
    buffsSection.innerHTML = `<h4>Shadow Buffs</h4>`;

    const buffsList = document.createElement("ul");
    const buffs = target.buffs || {};
    if (!Object.keys(buffs).length) {
      const li = document.createElement("li");
      li.textContent = "None.";
      buffsList.appendChild(li);
    } else {
      Object.entries(buffs).forEach(([buffId, count]) => {
        const buff = state.buffs[buffId];
        if (!buff) return;
        const effect = buff.effect || {};
        let line = `${buff.name} ×${count} — `;
        if (effect.type === "tempHP") {
          line += `Total +${effect.perStack * count} temporary HP.`;
        } else if (effect.type === "speed") {
          line += `Total +${effect.perStack * count} ft speed.`;
        } else if (effect.type === "save") {
          line += `Total +${effect.perStack * count} to ${effect.stat} saves.`;
        } else if (effect.type === "ac_dark") {
          line += `Total +${effect.perStack * count} AC in dim light/darkness.`;
        } else {
          line += `Stacks: ${count}.`;
        }
        const li = document.createElement("li");
        li.textContent = line;
        buffsList.appendChild(li);
      });
    }
    buffsSection.appendChild(buffsList);
    card.appendChild(buffsSection);

    // Abilities for this target
    const abilitiesSection = document.createElement("div");
    abilitiesSection.className = "summary-section";
    abilitiesSection.innerHTML = `<h4>Abilities & Techniques</h4>`;

    const abilitiesList = document.createElement("ul");
    const abilitiesForTarget = state.abilities.filter(a => a.targetId === target.id);
    if (!abilitiesForTarget.length) {
      const li = document.createElement("li");
      li.textContent = "No AI ability cards assigned yet.";
      abilitiesList.appendChild(li);
    } else {
      abilitiesForTarget.forEach(a => {
        const li = document.createElement("li");
        li.textContent = `${a.name || "Unnamed Ability"} – Action: ${a.action || "?"}, Range: ${
          a.range || "?"
        }, Save: ${a.save || "-"}${a.dc ? ` (DC ${a.dc})` : ""}, Damage: ${a.damage || "-"}.`;
        abilitiesList.appendChild(li);
      });
    }
    abilitiesSection.appendChild(abilitiesList);
    card.appendChild(abilitiesSection);

    // For corpses, show inherited techniques list
    if (target.type === "corpse" && corpseStats) {
      const corpseTechSection = document.createElement("div");
      corpseTechSection.className = "summary-section";
      corpseTechSection.innerHTML = `<h4>Inherited Techniques</h4>`;
      const ul = document.createElement("ul");

      const usedShadows = state.shadows.filter(s =>
        (corpseStats.shadowIds || []).includes(s.id)
      );
      const techniques = [];
      usedShadows.forEach(sh => {
        (sh.techniquesText || "")
          .split("\n")
          .map(x => x.trim())
          .filter(Boolean)
          .forEach(t => {
            if (!techniques.includes(t)) techniques.push(t);
          });
      });
      if (!techniques.length) {
        const li = document.createElement("li");
        li.textContent = "None recorded. Fill techniques on shadows in panel 2.";
        ul.appendChild(li);
      } else {
        techniques.forEach(t => {
          const li = document.createElement("li");
          li.textContent = t;
          ul.appendChild(li);
        });
      }
      corpseTechSection.appendChild(ul);
      card.appendChild(corpseTechSection);
    }

    // Notes
    const notesSection = document.createElement("div");
    notesSection.className = "summary-section";
    notesSection.innerHTML = `<h4>Notes</h4>`;
    const notesDiv = document.createElement("div");
    notesDiv.className = "summary-notes";
    notesDiv.setAttribute("contenteditable", "true");
    notesDiv.dataset.targetId = target.id;
    notesDiv.textContent =
      target.notes ||
      (target.type === "self"
        ? "Use this for quick rulings or reminders about Elren’s current form."
        : "Use this for conditions, vulnerabilities, or GM tweaks.");
    notesDiv.addEventListener("input", () => {
      target.notes = notesDiv.textContent;
      saveState();
    });
    notesSection.appendChild(notesDiv);
    card.appendChild(notesSection);

    container.appendChild(card);
  });

  // Summary buttons
  const btnSave = document.getElementById("btn-save");
  const btnPrint = document.getElementById("btn-print");
  const btnReset = document.getElementById("btn-reset");

  btnSave.onclick = () => {
    saveState();
    alert("Shadow Fruit data saved.");
  };
  btnPrint.onclick = () => {
    window.print();
  };
  btnReset.onclick = () => {
    if (!confirm("Reset all Shadow Fruit data in this browser?")) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  };
}
