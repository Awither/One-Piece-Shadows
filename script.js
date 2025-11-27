// ---------- CONFIG & CONSTANTS ----------

const STORAGE_KEY = "shadowFruitState_v1";

// Proficiency tiers 0–10
const PROFICIENCY_TIERS = [
  { value: 0, label: "0 – Untrained (civilian, fodder)" },
  { value: 1, label: "1 – Basic Training (guards, recruits)" },
  { value: 2, label: "2 – Adept (skilled regulars)" },
  { value: 3, label: "3 – Competent (solid fighters)" },
  { value: 4, label: "4 – Veteran (elite unit fighters)" },
  { value: 5, label: "5 – Specialist (captains, bounty hunters)" },
  { value: 6, label: "6 – Master (high-level fighters)" },
  { value: 7, label: "7 – Ace (commanders, top pirates)" },
  { value: 8, label: "8 – Heroic (warlord / top commander)" },
  { value: 9, label: "9 – Legendary (admiral / emperor-level)" },
  { value: 10, label: "10 – Divine (endgame monsters)" }
];

// Template tiers 0–7
const TEMPLATE_TIERS = [
  { value: 0, label: "0 – Ordinary Human" },
  { value: 1, label: "1 – Trained Human" },
  { value: 2, label: "2 – Devil Fruit User" },
  { value: 3, label: "3 – Advanced Fighter (Haki / master)" },
  { value: 4, label: "4 – Devil Fruit + Advanced Fighter" },
  { value: 5, label: "5 – Mythical Devil Fruit User" },
  { value: 6, label: "6 – Big Boss" },
  { value: 7, label: "7 – Final World Boss" }
];

// Buff catalog (you can tweak costs & text)
const BUFFS = [
  {
    id: "temp_hp_20",
    name: "+20 Temp HP",
    cost: 4,
    minAsp: 0,
    description: "Gain +20 temporary HP as shadow resilience."
  },
  {
    id: "temp_hp_50",
    name: "+50 Temp HP",
    cost: 10,
    minAsp: 10,
    description: "Gain +50 temporary HP from dense shadow mass."
  },
  {
    id: "ac_plus_2",
    name: "+2 AC (Shadow Carapace)",
    cost: 8,
    minAsp: 8,
    description: "Armor of condensed shadow surrounds you, bolstering defense."
  },
  {
    id: "speed_plus_10",
    name: "+10 ft Movement",
    cost: 6,
    minAsp: 6,
    description: "Shadow-slick footing increases your speed."
  },
  {
    id: "adv_dex_saves",
    name: "Advantage on DEX Saves",
    cost: 8,
    minAsp: 8,
    description: "Shadows pre-echo danger, sharpening your reflexes."
  },
  {
    id: "adv_str_checks",
    name: "Advantage on STR Checks",
    cost: 6,
    minAsp: 6,
    description: "Shadow muscle reinforces your physical power."
  },
  {
    id: "str_plus_2",
    name: "+2 STR (Shadow Muscles)",
    cost: 10,
    minAsp: 10,
    description: "Shadow mass coils around you, boosting raw strength."
  },
  {
    id: "dex_plus_2",
    name: "+2 DEX (Shadow Reflexes)",
    cost: 10,
    minAsp: 10,
    description: "Shadows anticipate movement, enhancing agility."
  },
  {
    id: "con_plus_2",
    name: "+2 CON (Shadow Fortification)",
    cost: 12,
    minAsp: 12,
    description: "Your form becomes unnaturally robust and hard to kill."
  },
  {
    id: "resist_nonmagical",
    name: "Resistance to Non-magical Weapon Damage",
    cost: 12,
    minAsp: 12,
    description: "Shadows disperse incoming mundane blows."
  },
  {
    id: "shadow_step",
    name: "Shadow Step (10–20 ft)",
    cost: 8,
    minAsp: 8,
    description: "Short-range teleport between patches of shadow."
  },
  {
    id: "shadow_weapon",
    name: "Shadow Weapon",
    cost: 8,
    minAsp: 8,
    description: "Manifest a shadow weapon that deals extra necrotic damage."
  },
  {
    id: "shadow_clone_minor",
    name: "Minor Shadow Clone",
    cost: 10,
    minAsp: 10,
    description: "Create a minor shadow clone that can fight or assist."
  },
  {
    id: "shadow_form_overdrive",
    name: "Shadow Overdrive Form",
    cost: 18,
    minAsp: 18,
    description: "+2 STR, +2 DEX, +20 temp HP, +10 ft speed for a short duration."
  },
  {
    id: "shadow_asgard_like",
    name: "Night Emperor / Shadow Asgard Mode",
    cost: 40,
    minAsp: 40,
    description: "Huge transformation, massive temp HP and resistances. Once per major scene."
  }
];

// ---------- STATE ----------

let state = {
  shadows: [], // { id, name, rawMight, ptValue, ptLabel, ttValue, ttLabel, shadowLevel, active }
  selectedBuffIds: [] // array of buff.id
};

// ---------- UTILITIES ----------

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function computeShadowLevel(rawMight, ptValue, ttValue) {
  const base = Math.floor(rawMight / 2);
  const slRaw = base + ptValue + ttValue;
  return clamp(slRaw, 1, 10);
}

function getShadowTotals() {
  const totalAsp = state.shadows.reduce(
    (sum, s) => sum + (s.active ? s.shadowLevel : 0),
    0
  );
  const spentAsp = state.selectedBuffIds.reduce((sum, buffId) => {
    const buff = BUFFS.find((b) => b.id === buffId);
    return buff ? sum + buff.cost : sum;
  }, 0);
  const availableAsp = Math.max(0, totalAsp - spentAsp);
  return { totalAsp, spentAsp, availableAsp };
}

function saveState() {
  try {
    const toSave = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, toSave);
  } catch (err) {
    console.error("Error saving state:", err);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      state = {
        shadows: Array.isArray(parsed.shadows) ? parsed.shadows : [],
        selectedBuffIds: Array.isArray(parsed.selectedBuffIds)
          ? parsed.selectedBuffIds
          : []
      };
    }
  } catch (err) {
    console.error("Error loading state:", err);
  }
}

// ---------- RENDER FUNCTIONS ----------

function populateSelectOptions() {
  const profSel = document.getElementById("proficiency-tier");
  const templSel = document.getElementById("template-tier");

  PROFICIENCY_TIERS.forEach((pt) => {
    const opt = document.createElement("option");
    opt.value = pt.value;
    opt.textContent = pt.label;
    profSel.appendChild(opt);
  });

  TEMPLATE_TIERS.forEach((tt) => {
    const opt = document.createElement("option");
    opt.value = tt.value;
    opt.textContent = tt.label;
    templSel.appendChild(opt);
  });
}

function renderShadowList() {
  const listEl = document.getElementById("shadow-list");
  const emptyEl = document.getElementById("shadow-list-empty");

  listEl.innerHTML = "";

  if (!state.shadows.length) {
    emptyEl.style.display = "block";
    return;
  }

  emptyEl.style.display = "none";

  state.shadows.forEach((shadow) => {
    const card = document.createElement("div");
    card.className = "shadow-card";

    const main = document.createElement("div");
    main.className = "shadow-main";

    const title = document.createElement("strong");
    title.textContent = shadow.name || "(Unnamed Shadow)";
    main.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "shadow-meta";
    meta.textContent =
      `SL ${shadow.shadowLevel} | Raw Might ${shadow.rawMight} | ` +
      `${shadow.ptLabel} | ${shadow.ttLabel}`;
    main.appendChild(meta);

    const controls = document.createElement("div");
    controls.className = "shadow-controls";

    // Active toggle
    const activeLabel = document.createElement("label");
    const activeCheckbox = document.createElement("input");
    activeCheckbox.type = "checkbox";
    activeCheckbox.checked = shadow.active;
    activeCheckbox.addEventListener("change", () => {
      shadow.active = activeCheckbox.checked;
      saveState();
      renderTotals();
      updateSummary();
    });
    activeLabel.appendChild(activeCheckbox);
    activeLabel.appendChild(document.createTextNode("Active"));
    controls.appendChild(activeLabel);

    // Remove button
    const removeBtn = document.createElement("button");
    removeBtn.className = "btn danger";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      state.shadows = state.shadows.filter((s) => s.id !== shadow.id);
      // Also clear buffs if you want auto-reset when big changes happen – here we keep them
      saveState();
      renderShadowList();
      renderTotals();
      updateSummary();
    });
    controls.appendChild(removeBtn);

    card.appendChild(main);
    card.appendChild(controls);

    listEl.appendChild(card);
  });
}

function renderTotals() {
  const { totalAsp, spentAsp, availableAsp } = getShadowTotals();
  document.getElementById("total-asp").textContent = totalAsp;
  document.getElementById("spent-asp").textContent = spentAsp;
  document.getElementById("available-asp").textContent = availableAsp;
}

function renderBuffList() {
  const listEl = document.getElementById("buff-list");
  listEl.innerHTML = "";

  const { totalAsp, availableAsp } = getShadowTotals();

  BUFFS.forEach((buff) => {
    const selected = state.selectedBuffIds.includes(buff.id);
    const canAfford = availableAsp >= buff.cost || selected;
    const meetsMin = totalAsp >= buff.minAsp || selected;

    const card = document.createElement("div");
    card.className = "buff-card";

    const header = document.createElement("div");
    header.className = "buff-card-header";

    const nameEl = document.createElement("div");
    nameEl.className = "buff-name";
    nameEl.textContent = buff.name;

    const costEl = document.createElement("div");
    costEl.className = "buff-cost";
    costEl.textContent = `${buff.cost} ASP`;

    header.appendChild(nameEl);
    header.appendChild(costEl);

    const desc = document.createElement("div");
    desc.className = "buff-desc";
    desc.textContent = buff.description;

    const meta = document.createElement("div");
    meta.className = "buff-meta";
    meta.textContent = `Requires total ASP ≥ ${buff.minAsp}`;

    const btn = document.createElement("button");
    btn.className = "btn secondary";
    btn.textContent = selected ? "Remove Buff" : "Add Buff";

    if (!canAfford || !meetsMin) {
      btn.disabled = true;
      btn.title = "Not enough ASP or requirement not met.";
    }

    btn.addEventListener("click", () => {
      if (selected) {
        state.selectedBuffIds = state.selectedBuffIds.filter(
          (id) => id !== buff.id
        );
      } else {
        // Recompute fresh to avoid stale values
        const { availableAsp: currentAvail } = getShadowTotals();
        if (currentAvail < buff.cost) return;
        state.selectedBuffIds.push(buff.id);
      }
      saveState();
      renderTotals();
      renderBuffList();
      renderSelectedBuffs();
      updateSummary();
    });

    card.appendChild(header);
    card.appendChild(desc);
    card.appendChild(meta);
    card.appendChild(btn);

    listEl.appendChild(card);
  });
}

function renderSelectedBuffs() {
  const container = document.getElementById("selected-buffs");
  container.innerHTML = "";

  if (!state.selectedBuffIds.length) {
    container.textContent = "No buffs selected yet.";
    return;
  }

  state.selectedBuffIds.forEach((buffId) => {
    const buff = BUFFS.find((b) => b.id === buffId);
    if (!buff) return;
    const pill = document.createElement("span");
    pill.className = "selected-buff-pill";
    pill.textContent = buff.name + " ";

    const xBtn = document.createElement("button");
    xBtn.type = "button";
    xBtn.textContent = "×";
    xBtn.addEventListener("click", () => {
      state.selectedBuffIds = state.selectedBuffIds.filter((id) => id !== buffId);
      saveState();
      renderTotals();
      renderBuffList();
      renderSelectedBuffs();
      updateSummary();
    });

    pill.appendChild(xBtn);
    container.appendChild(pill);
  });
}

function updateSummary() {
  const out = document.getElementById("summary-output");
  const { totalAsp, spentAsp, availableAsp } = getShadowTotals();

  let lines = [];

  lines.push("=== SHADOW SUMMARY ===");
  lines.push(`Total ASP: ${totalAsp}`);
  lines.push(`Spent ASP: ${spentAsp}`);
  lines.push(`Available ASP: ${availableAsp}`);
  lines.push("");

  if (!state.shadows.length) {
    lines.push("No shadows collected yet.");
  } else {
    lines.push("Collected Shadows:");
    state.shadows.forEach((s) => {
      lines.push(
        `- ${s.name || "(Unnamed)"} | SL ${s.shadowLevel} | Raw Might ${
          s.rawMight
        } | ${s.ptLabel} | ${s.ttLabel} | Active: ${s.active ? "Yes" : "No"}`
      );
    });
  }

  lines.push("");
  if (!state.selectedBuffIds.length) {
    lines.push("No buffs selected.");
  } else {
    lines.push("Active Buffs:");
    state.selectedBuffIds.forEach((buffId) => {
      const buff = BUFFS.find((b) => b.id === buffId);
      if (buff) {
        lines.push(`- ${buff.name} (${buff.cost} ASP): ${buff.description}`);
      }
    });
  }

  out.textContent = lines.join("\n");
}

// ---------- REANIMATION ----------

function generateReanimationProfile() {
  const corpseName = document.getElementById("corpse-name").value.trim();
  const corpseDurability = Number(
    document.getElementById("corpse-durability").value
  );
  const mode = document.getElementById("corpse-shadow-mode").value;

  let usedShadows = [];
  if (mode === "active") {
    usedShadows = state.shadows.filter((s) => s.active);
  } else {
    usedShadows = [...state.shadows];
  }

  const outEl = document.getElementById("reanimation-output");

  if (!corpseName || !usedShadows.length) {
    outEl.textContent =
      "You need a corpse name and at least one shadow (active or stored) to reanimate.";
    return;
  }

  const totalShadowLevel = usedShadows.reduce(
    (sum, s) => sum + s.shadowLevel,
    0
  );

  const effectiveDurability = clamp(
    corpseDurability + Math.floor(totalShadowLevel / 3),
    1,
    15
  );

  const roughHP = 10 * corpseDurability + 5 * totalShadowLevel;
  const powerTier =
    totalShadowLevel >= 30
      ? "Mythic Reanimated Titan"
      : totalShadowLevel >= 18
      ? "Elite Reanimated Champion"
      : totalShadowLevel >= 10
      ? "Reanimated Knight"
      : "Lesser Shadow Puppet";

  let lines = [];
  lines.push(`=== REANIMATED CORPSE PROFILE ===`);
  lines.push(`Corpse: ${corpseName}`);
  lines.push(`Corpse Durability Tier: ${corpseDurability}`);
  lines.push(`Shadows Used: ${usedShadows.length}`);
  lines.push(`Total Shadow Level (sum): ${totalShadowLevel}`);
  lines.push(`Effective Durability Tier: ${effectiveDurability}`);
  lines.push(`Approx HP Benchmark: ~${roughHP}`);
  lines.push(`Role: ${powerTier}`);
  lines.push("");

  lines.push("Suggested Traits:");
  lines.push(
    `- Gains durability and toughness based on the corpse (Tier ${corpseDurability}) plus the infused shadow levels.`
  );
  lines.push(
    `- Uses physical stats and resilience from the corpse, but combat instincts and abilities influenced by the strongest shadows used.`
  );
  if (totalShadowLevel >= 15) {
    lines.push(
      `- Can manifest at least one shadow technique (e.g., Shadow Grasp, Shadow Step, or a unique named attack).`
    );
  }
  if (totalShadowLevel >= 25) {
    lines.push(
      `- May gain a minor transformation or partial Shadow Overdrive form, especially if high-tier shadows are included.`
    );
  }

  lines.push("");
  lines.push("Infused Shadows:");
  usedShadows.forEach((s) => {
    lines.push(
      `- ${s.name || "(Unnamed)"} | SL ${s.shadowLevel} | Template: ${s.ttLabel}`
    );
  });

  outEl.textContent = lines.join("\n");
}

// ---------- AI INTEGRATION ----------

async function callAI() {
  const statusEl = document.getElementById("ai-status");
  const outEl = document.getElementById("ai-output");
  statusEl.textContent = "Calling the shadows (AI)...";
  outEl.textContent = "";

  const notes = document.getElementById("ai-notes").value || "";

  const { totalAsp, spentAsp, availableAsp } = getShadowTotals();

  const payload = {
    shadows: state.shadows,
    totalAsp,
    spentAsp,
    availableAsp,
    selectedBuffIds: state.selectedBuffIds,
    notes
  };

  try {
    const res = await fetch("/api/generate-shadow-abilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Request failed.");
    }

    const data = await res.json();
    outEl.textContent = data.text || "(No output returned from AI.)";
    statusEl.textContent = "AI response received.";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error contacting AI.";
    outEl.textContent = String(err);
  }
}

// ---------- EVENT HOOKUP ----------

function initEvents() {
  const calcBtn = document.getElementById("btn-calc-shadow");
  const addBtn = document.getElementById("btn-add-shadow");
  const outEl = document.getElementById("shadow-calc-output");

  calcBtn.addEventListener("click", () => {
    const name = document.getElementById("shadow-name").value.trim();
    const rawMight = Number(document.getElementById("raw-might").value);
    const ptSel = document.getElementById("proficiency-tier");
    const ttSel = document.getElementById("template-tier");

    const ptValue = Number(ptSel.value);
    const ptLabel = ptSel.options[ptSel.selectedIndex].textContent;
    const ttValue = Number(ttSel.value);
    const ttLabel = ttSel.options[ttSel.selectedIndex].textContent;

    if (isNaN(rawMight) || rawMight < 0 || rawMight > 20) {
      outEl.textContent = "Raw Might Rating must be between 0 and 20.";
      addBtn.disabled = true;
      return;
    }

    const sl = computeShadowLevel(rawMight, ptValue, ttValue);
    outEl.textContent =
      `Shadow Level: ${sl} (from Raw Might ${rawMight}, ${ptLabel}, ${ttLabel})`;
    addBtn.disabled = false;

    // Save last calc in a temporary property on the button
    addBtn.dataset.lastCalc = JSON.stringify({
      name,
      rawMight,
      ptValue,
      ptLabel,
      ttValue,
      ttLabel,
      shadowLevel: sl
    });
  });

  addBtn.addEventListener("click", () => {
    const payloadRaw = document
      .getElementById("btn-add-shadow")
      .dataset.lastCalc;
    if (!payloadRaw) return;

    const payload = JSON.parse(payloadRaw);
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);

    state.shadows.push({
      id,
      name: payload.name || "(Unnamed Shadow)",
      rawMight: payload.rawMight,
      ptValue: payload.ptValue,
      ptLabel: payload.ptLabel,
      ttValue: payload.ttValue,
      ttLabel: payload.ttLabel,
      shadowLevel: payload.shadowLevel,
      active: true
    });

    document.getElementById("shadow-name").value = "";
    document.getElementById("btn-add-shadow").disabled = true;
    document.getElementById("shadow-calc-output").textContent =
      "Shadow added to your collection.";

    saveState();
    renderShadowList();
    renderTotals();
    renderBuffList();
    renderSelectedBuffs();
    updateSummary();
  });

  document
    .getElementById("btn-generate-reanimation")
    .addEventListener("click", generateReanimationProfile);

  document
    .getElementById("btn-ai-generate")
    .addEventListener("click", callAI);

  document.getElementById("btn-force-save").addEventListener("click", () => {
    saveState();
    updateSummary();
  });

  document.getElementById("btn-reset-all").addEventListener("click", () => {
    if (!confirm("Reset all shadows and buffs?")) return;
    state = { shadows: [], selectedBuffIds: [] };
    saveState();
    renderShadowList();
    renderTotals();
    renderBuffList();
    renderSelectedBuffs();
    updateSummary();
    document.getElementById("reanimation-output").textContent = "";
    document.getElementById("ai-output").textContent = "";
    document.getElementById("ai-status").textContent = "";
  });
}

// ---------- INIT ----------

document.addEventListener("DOMContentLoaded", () => {
  populateSelectOptions();
  loadState();
  renderShadowList();
  renderTotals();
  renderBuffList();
  renderSelectedBuffs();
  updateSummary();
  initEvents();
});
