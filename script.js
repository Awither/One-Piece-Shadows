// ---------- CONFIG & CONSTANTS ----------

const STORAGE_KEY = "shadowFruitState_v2";

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

// Buff catalog (now with more detailed mechanics)
const BUFFS = [
  {
    id: "temp_hp_20",
    name: "+20 Temp HP",
    cost: 8,
    minAsp: 0,
    description:
      "Gain +20 temporary HP. These HP are from dense shadow mass and are lost first when you take damage."
  },
  {
    id: "temp_hp_50",
    name: "+50 Temp HP",
    cost: 20,
    minAsp: 100,
    description:
      "Gain +50 temporary HP. Represent a heavy layered shell of shadow; excellent for frontline brawling or tanking boss hits."
  },
  {
    id: "ac_plus_2",
    name: "+2 AC (Shadow Carapace)",
    cost: 15,
    minAsp: 60,
    description:
      "Your body is wrapped in hardened shadow plates. Gain +2 bonus to AC (stacks with armor and shields, DM permitting)."
  },
  {
    id: "speed_plus_10",
    name: "+10 ft Movement",
    cost: 10,
    minAsp: 30,
    description:
      "Shadow-slick footing accelerates you. Increase your walking speed by +10 feet. This can also apply to other movement modes at DM discretion."
  },
  {
    id: "adv_dex_saves",
    name: "Advantage on DEX Saves",
    cost: 12,
    minAsp: 50,
    description:
      "Shadows pre-echo danger. You gain advantage on Dexterity saving throws against effects you can perceive."
  },
  {
    id: "adv_str_checks",
    name: "Advantage on STR Checks",
    cost: 10,
    minAsp: 40,
    description:
      "Shadow muscle reinforces you. You gain advantage on Strength checks (grapples, shoves, forced entries, etc.)."
  },
  {
    id: "str_plus_2",
    name: "+2 STR (Shadow Muscles)",
    cost: 18,
    minAsp: 80,
    description:
      "Thick cords of shadow coil around your limbs. Increase your Strength score by +2 (not above any campaign cap)."
  },
  {
    id: "dex_plus_2",
    name: "+2 DEX (Shadow Reflexes)",
    cost: 18,
    minAsp: 80,
    description:
      "Your movements blur with murky afterimages. Increase your Dexterity score by +2 (not above any campaign cap)."
  },
  {
    id: "con_plus_2",
    name: "+2 CON (Shadow Fortification)",
    cost: 20,
    minAsp: 100,
    description:
      "Your body is packed with shadow density. Increase your Constitution score by +2, and treat this as a supernatural enhancement."
  },
  {
    id: "resist_nonmagical",
    name: "Resistance to Non-magical Weapon Damage",
    cost: 25,
    minAsp: 120,
    description:
      "Normal blades and bullets pass through half-shadow. You take half damage from non-magical weapon attacks."
  },
  {
    id: "shadow_step",
    name: "Shadow Step (15–30 ft)",
    cost: 15,
    minAsp: 70,
    description:
      "As a bonus action, you teleport between areas of dim light or darkness within 15–30 ft. Uses per rest as agreed with the DM (e.g., 3–5 times)."
  },
  {
    id: "shadow_weapon",
    name: "Shadow Weapon",
    cost: 14,
    minAsp: 60,
    description:
      "Manifest a melee weapon of condensed shadow. Attack uses your normal attack bonus. On hit: weapon’s normal damage + 1d8–2d8 necrotic (scales by level). Counts as magical for overcoming resistance."
  },
  {
    id: "shadow_clone_minor",
    name: "Minor Shadow Clone (AC 14, 25 HP)",
    cost: 18,
    minAsp: 80,
    description:
      "Summon a minor clone: AC 14, 25 HP, Speed 30 ft. Attack: +5 to hit, 1d8+3 necrotic (shadow strike). It obeys your commands and vanishes at 0 HP or when dismissed."
  },
  {
    id: "shadow_form_overdrive",
    name: "Shadow Overdrive Form",
    cost: 35,
    minAsp: 150,
    description:
      "Short burst transformation (about 1 minute): +2 STR, +2 DEX, +20 temp HP, +10 ft speed, and advantage on one type of physical saves (STR or DEX)."
  },
  {
    id: "night_emperor_form",
    name: "Night Emperor Form",
    cost: 60,
    minAsp: 300,
    description:
      "Medium-scale transformation. Appearance: tall, regal silhouette with flowing shadow cloak. Gains: +2 STR, +2 CON, +2 AC, +40 temp HP, and one powerful shadow technique (big AOE or battlefield control)."
  },
  {
    id: "shadow_asgard_form",
    name: "Shadow Asgard Colossus",
    cost: 120,
    minAsp: 700,
    description:
      "Massive form inspired by Moria’s Shadow Asgard. Become Huge, gain +4 STR, +4 CON, +5 AC, +100 temp HP, and resistance to all damage except radiant/force for a short duration (about 1 minute). You also gain a devastating signature attack and enhanced reach."
  }
];

// ---------- STATE ----------

let state = {
  // each shadow: { id, name, rawMight, ptValue, ptLabel, ttValue, ttLabel, shadowLevel, shadowPower, active }
  shadows: [],
  selectedBuffIds: []
};

// ---------- UTILITIES ----------

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

// Shadow Level: SL = clamp(floor(RMR / 2) + PT + TT, 1, 10)
// Shadow Power Units (SPU) = SL^3
function computeShadowLevel(rawMight, ptValue, ttValue) {
  const base = Math.floor(rawMight / 2);
  const slRaw = base + ptValue + ttValue;
  return clamp(slRaw, 1, 10);
}

function computeShadowPower(shadowLevel) {
  return Math.pow(shadowLevel, 3); // civilians: 1, gods: 1000
}

function getShadowTotals() {
  const totalAsp = state.shadows.reduce(
    (sum, s) => sum + (s.active ? s.shadowPower : 0),
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

function renderCorpseShadowCustomSelect() {
  const sel = document.getElementById("corpse-shadow-custom");
  if (!sel) return;
  sel.innerHTML = "";
  state.shadows.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name || "(Unnamed)"} (SL ${s.shadowLevel}, ${s.shadowPower} SPU)`;
    sel.appendChild(opt);
  });
}

function renderShadowList() {
  const listEl = document.getElementById("shadow-list");
  const emptyEl = document.getElementById("shadow-list-empty");

  listEl.innerHTML = "";

  if (!state.shadows.length) {
    emptyEl.style.display = "block";
    renderCorpseShadowCustomSelect();
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
      `SL ${shadow.shadowLevel} | SPU ${shadow.shadowPower} | Raw Might ${shadow.rawMight} | ` +
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
      renderBuffList();
      renderSelectedBuffs();
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
      saveState();
      renderShadowList();
      renderTotals();
      renderBuffList();
      renderSelectedBuffs();
      updateSummary();
    });
    controls.appendChild(removeBtn);

    card.appendChild(main);
    card.appendChild(controls);

    listEl.appendChild(card);
  });

  renderCorpseShadowCustomSelect();
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
    costEl.textContent = `${buff.cost} SPU`;

    header.appendChild(nameEl);
    header.appendChild(costEl);

    const desc = document.createElement("div");
    desc.className = "buff-desc";
    desc.textContent = buff.description;

    const meta = document.createElement("div");
    meta.className = "buff-meta";
    meta.textContent = `Requires total SPU ≥ ${buff.minAsp}`;

    const btn = document.createElement("button");
    btn.className = "btn secondary";
    btn.textContent = selected ? "Remove Buff" : "Add Buff";

    if (!canAfford || !meetsMin) {
      btn.disabled = true;
      btn.title = "Not enough SPU or requirement not met.";
    }

    btn.addEventListener("click", () => {
      if (selected) {
        state.selectedBuffIds = state.selectedBuffIds.filter(
          (id) => id !== buff.id
        );
      } else {
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

    const card = document.createElement("div");
    card.className = "selected-buff-card";

    const main = document.createElement("div");
    main.className = "selected-buff-main";

    const nameEl = document.createElement("div");
    nameEl.className = "selected-buff-name";
    nameEl.textContent = buff.name;

    const metaEl = document.createElement("div");
    metaEl.className = "selected-buff-meta";
    metaEl.textContent = `${buff.cost} SPU • ${buff.description.slice(
      0,
      80
    )}${buff.description.length > 80 ? "..." : ""}`;

    main.appendChild(nameEl);
    main.appendChild(metaEl);

    const removeBtn = document.createElement("button");
    removeBtn.className = "selected-buff-remove";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      state.selectedBuffIds = state.selectedBuffIds.filter((id) => id !== buffId);
      saveState();
      renderTotals();
      renderBuffList();
      renderSelectedBuffs();
      updateSummary();
    });

    card.appendChild(main);
    card.appendChild(removeBtn);
    container.appendChild(card);
  });
}

function updateSummary() {
  const out = document.getElementById("summary-output");
  if (!out) return;
  const { totalAsp, spentAsp, availableAsp } = getShadowTotals();

  let lines = [];

  lines.push("=== SHADOW SUMMARY ===");
  lines.push(`Total Shadow Power (SPU): ${totalAsp}`);
  lines.push(`Spent SPU on buffs: ${spentAsp}`);
  lines.push(`Available SPU: ${availableAsp}`);
  lines.push("");

  if (!state.shadows.length) {
    lines.push("No shadows collected yet.");
  } else {
    lines.push("Collected Shadows:");
    state.shadows.forEach((s) => {
      lines.push(
        `- ${s.name || "(Unnamed)"} | SL ${s.shadowLevel} | SPU ${
          s.shadowPower
        } | Raw Might ${s.rawMight} | ${s.ptLabel} | ${s.ttLabel} | Active: ${
          s.active ? "Yes" : "No"
        }`
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
        lines.push(`- ${buff.name} (${buff.cost} SPU): ${buff.description}`);
      }
    });
  }

  out.value = lines.join("\n");
}

// ---------- REANIMATION ----------

function generateReanimationProfile() {
  const corpseName = document.getElementById("corpse-name").value.trim();
  const corpseDurability = Number(
    document.getElementById("corpse-durability").value
  );
  const mode = document.getElementById("corpse-shadow-mode").value;
  const customSel = document.getElementById("corpse-shadow-custom");

  let usedShadows = [];
  if (mode === "active") {
    usedShadows = state.shadows.filter((s) => s.active);
  } else if (mode === "all") {
    usedShadows = [...state.shadows];
  } else if (mode === "custom" && customSel) {
    const ids = Array.from(customSel.selectedOptions).map((o) => o.value);
    usedShadows = state.shadows.filter((s) => ids.includes(s.id));
  }

  const outEl = document.getElementById("reanimation-output");

  if (!corpseName || !usedShadows.length) {
    outEl.value =
      "You need a corpse name and at least one shadow (active, stored, or selected) to reanimate.";
    return;
  }

  const totalSL = usedShadows.reduce((sum, s) => sum + s.shadowLevel, 0);
  const totalSPU = usedShadows.reduce((sum, s) => sum + s.shadowPower, 0);

  // Rough stat estimation
  const size =
    totalSL >= 25 ? "Huge" : totalSL >= 15 ? "Large" : totalSL >= 8 ? "Medium" : "Medium";
  const acBase = 10 + Math.floor(corpseDurability / 2) + Math.floor(totalSL / 5);
  const hpBase = 10 * corpseDurability + 8 * totalSL;
  const speed = 30 + (totalSL >= 15 ? 10 : 0);

  const str = 10 + corpseDurability + Math.floor(totalSL / 2);
  const dex = 8 + Math.floor(totalSL / 3);
  const con = 10 + corpseDurability;
  const intStat = 6 + Math.floor(totalSL / 4);
  const wis = 8 + Math.floor(totalSL / 4);
  const cha = 8 + Math.floor(totalSL / 4);

  const powerTier =
    totalSL >= 30
      ? "Mythic Reanimated Titan"
      : totalSL >= 18
      ? "Elite Reanimated Champion"
      : totalSL >= 10
      ? "Reanimated Knight"
      : "Lesser Shadow Puppet";

  let lines = [];

  lines.push(`=== ${corpseName.toUpperCase()} ===`);
  lines.push(`${powerTier} • ${size} undead (shadow-animated)`);
  lines.push("");
  lines.push(`Armor Class: ${acBase} (shadow-reinforced hide)`);
  lines.push(`Hit Points: ~${hpBase} (DM can convert to dice)`);
  lines.push(`Speed: ${speed} ft.`);
  lines.push("");
  lines.push(
    `STR ${str}   DEX ${dex}   CON ${con}   INT ${intStat}   WIS ${wis}   CHA ${cha}`
  );
  lines.push("");
  lines.push(
    `Saving Throws: STR +${Math.floor((str - 10) / 2) + 2}, CON +${
      Math.floor((con - 10) / 2) + 2
    }`
  );
  lines.push("Skills: Perception +?, Intimidation +?");
  lines.push("Damage Resistances: necrotic; bludgeoning, piercing, and slashing from non-magical attacks (optional).");
  lines.push("Condition Immunities: charmed, frightened, poisoned (DM option).");
  lines.push("Senses: darkvision 60 ft., passive Perception ??.");
  lines.push("Languages: understands the languages it knew in life (if any); obeys the shadow fruit user.");
  lines.push("");

  lines.push("TRAITS");
  lines.push(
    `• Corpse Durability. Built from a Durability Tier ${corpseDurability} body; it is physically tough and hard to dismantle.`
  );
  lines.push(
    `• Infused Shadows. Infused with ${usedShadows.length} shadow(s), total SL ${totalSL}, total SPU ${totalSPU}. Its combat instincts are influenced by those shadows.`
  );
  if (totalSL >= 15) {
    lines.push(
      "• Shadow Instincts. Gains advantage on one type of save (STR, DEX, or CON) chosen when created."
    );
  }
  if (totalSL >= 20) {
    lines.push(
      "• Shadow Resilience. Once per rest, when reduced to 0 HP, it instead drops to 1 HP and shreds away part of its shadow mass."
    );
  }
  lines.push("");

  lines.push("ACTIONS");
  lines.push(
    "• Multiattack. The reanimated corpse makes two attacks: one Slam and one Shadow Lash (or two Slams)."
  );
  lines.push(
    `• Slam. Melee Weapon Attack: +${Math.floor((str - 10) / 2) + 4} to hit, reach 5 ft., one target. Hit: 1d10 + ${Math.floor(
      (str - 10) / 2
    )} bludgeoning.`
  );
  if (totalSL >= 10) {
    lines.push(
      `• Shadow Lash. Melee Spell Attack or special attack: +${
        5 + Math.floor(totalSL / 3)
      } to hit, reach 10 ft., one target. Hit: 2d8 necrotic, and the target must succeed on a STR or DEX save (DC ~${10 +
        Math.floor(totalSL / 2)}) or be grappled by shadow chains.`
    );
  }
  if (totalSL >= 18) {
    lines.push(
      `• Shadow Burst (Recharge 5–6). The corpse erupts in a wave of shadow. Creatures within 15 ft. must make a CON save (DC ~${12 +
        Math.floor(totalSL / 3)}) or take 3d8 necrotic damage (half on a success).`
    );
  }

  lines.push("");
  lines.push("INFUSED SHADOWS");
  usedShadows.forEach((s) => {
    lines.push(
      `• ${s.name || "(Unnamed)"} – SL ${s.shadowLevel}, SPU ${
        s.shadowPower
      }, Template: ${s.ttLabel}`
    );
  });

  outEl.value = lines.join("\n");
}

// ---------- AI INTEGRATION ----------

async function callAI() {
  const statusEl = document.getElementById("ai-status");
  const outEl = document.getElementById("ai-output");
  statusEl.textContent = "Calling the shadows (AI)...";
  outEl.value = "";

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
    outEl.value = data.text || "(No output returned from AI.)";
    statusEl.textContent = "AI response received.";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error contacting AI.";
    outEl.value = String(err);
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
    const spu = computeShadowPower(sl);
    outEl.textContent =
      `Shadow Level: ${sl} | Shadow Power Units: ${spu} ` +
      `(from Raw Might ${rawMight}, ${ptLabel}, ${ttLabel})`;
    addBtn.disabled = false;

    addBtn.dataset.lastCalc = JSON.stringify({
      name,
      rawMight,
      ptValue,
      ptLabel,
      ttValue,
      ttLabel,
      shadowLevel: sl,
      shadowPower: spu
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
      shadowPower: payload.shadowPower,
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

  document
    .getElementById("btn-print-summary")
    .addEventListener("click", () => {
      const summary = document.getElementById("summary-output").value || "";
      const win = window.open("", "_blank", "width=800,height=600");
      if (!win) return;
      win.document.write(
        `<pre style="font-family: ui-monospace, monospace; white-space: pre-wrap; font-size: 14px; line-height: 1.4; padding: 1rem;">${summary
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</pre>`
      );
      win.document.close();
      win.focus();
      win.print();
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
    const reOut = document.getElementById("reanimation-output");
    const aiOut = document.getElementById("ai-output");
    const aiStatus = document.getElementById("ai-status");
    if (reOut) reOut.value = "";
    if (aiOut) aiOut.value = "";
    if (aiStatus) aiStatus.textContent = "";
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
