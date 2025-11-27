// ---------- CONFIG & CONSTANTS ----------

const STORAGE_KEY = "shadowFruitState_v4";

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

const TEMPLATE_TIERS = [
  { value: 0, label: "0 – Ordinary Human" },
  { value: 1, label: "1 – Trained Human" },
  { value: 2, label: "2 – Devil Fruit User" },
  { value: 3, label: "3 – Advanced Fighter (basic Haki)" },
  { value: 4, label: "4 – Devil Fruit + Advanced Fighter" },
  { value: 5, label: "5 – Mythical Devil Fruit User" },
  { value: 6, label: "6 – Big Boss" },
  { value: 7, label: "7 – Final World Boss" }
];

const BASE_BUFFS = [
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
      "Gain +50 temporary HP. Represents a heavy layered shell of shadow; great for frontline brawling or tanking boss hits."
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
      "Shadow-slick footing accelerates you. Increase your walking speed by +10 feet. Can also apply to other movement modes at DM discretion."
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
      "Your body is packed with shadow density. Increase your Constitution score by +2 (not above any campaign cap)."
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
      "As a bonus action, you teleport between areas of dim light or darkness within 15–30 ft. 3–5 uses per rest (DM choice)."
  },
  {
    id: "shadow_weapon",
    name: "Shadow Weapon",
    cost: 14,
    minAsp: 60,
    description:
      "Manifest a melee weapon of condensed shadow. Attack uses your normal attack bonus. On hit: weapon’s normal damage + 1d8–2d8 necrotic (scales by level). Counts as magical."
  },
  {
    id: "shadow_clone_minor",
    name: "Minor Shadow Clone (AC 14, 25 HP)",
    cost: 18,
    minAsp: 80,
    description:
      "Summon a minor clone: AC 14, 25 HP, Speed 30 ft. Attack: +5 to hit, 1d8+3 necrotic (shadow strike). Follows your commands and vanishes at 0 HP."
  },
  {
    id: "shadow_form_overdrive",
    name: "Shadow Overdrive Form",
    cost: 35,
    minAsp: 150,
    description:
      "Short burst transformation (~1 minute): +2 STR, +2 DEX, +20 temp HP, +10 ft speed, and advantage on STR or DEX saves (chosen when activated)."
  },
  {
    id: "night_emperor_form",
    name: "Night Emperor Form",
    cost: 60,
    minAsp: 300,
    description:
      "Medium-scale transformation. Appearance: tall, regal silhouette with a flowing shadow cloak. Gains: +2 STR, +2 CON, +2 AC, +40 temp HP, and one powerful battlefield-control technique (large AOE, fear, or restraining shadows)."
  },
  {
    id: "shadow_asgard_form",
    name: "Shadow Asgard Colossus",
    cost: 120,
    minAsp: 700,
    description:
      "Massive form inspired by Moria’s Shadow Asgard: become Huge, gain +4 STR, +4 CON, +5 AC, +100 temp HP, and resistance to all damage except radiant/force for ~1 minute. You also gain a devastating signature attack with extended reach."
  }
];

// ---------- STATE ----------

let state = {
  shadows: [],          // { id, name, rawMight, ptValue, ptLabel, ttValue, ttLabel, shadowLevel, shadowPower, active, techniques[] }
  selectedBuffs: {},    // id -> count
  customBuffs: [],      // custom buff objects
  aiAbilities: []       // array of ability card objects
};

// ---------- UTILS ----------

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

// New normalized formula
function computeShadowLevel(rawMight, ptValue, ttValue) {
  const r = clamp(rawMight, 0, 20) / 20;   // 0–1
  const p = clamp(ptValue, 0, 10) / 10;    // 0–1
  const t = clamp(ttValue, 0, 7) / 7;      // 0–1

  const score = 0.45 * r + 0.30 * p + 0.25 * t; // 0–1
  const sl = 1 + Math.floor(clamp(score, 0, 1) * 9); // 1–10
  return sl;
}

function computeShadowPower(shadowLevel) {
  return Math.pow(clamp(shadowLevel, 1, 10), 3); // 1–1000
}

function getAllBuffs() {
  return [...BASE_BUFFS, ...state.customBuffs];
}

// stacking costs
function getCopyCost(baseCost, copyIndex) {
  if (copyIndex <= 1) return baseCost;
  if (copyIndex === 2) return Math.round(baseCost * 1.5);
  return Math.round(baseCost * Math.pow(2, copyIndex - 2));
}

function getTotalCostForBuff(baseCost, count) {
  let total = 0;
  for (let i = 1; i <= count; i++) total += getCopyCost(baseCost, i);
  return total;
}

function getShadowTotals() {
  const totalAsp = state.shadows.reduce(
    (sum, s) => sum + (s.active ? s.shadowPower : 0),
    0
  );

  const buffMap = Object.fromEntries(getAllBuffs().map((b) => [b.id, b]));

  const spentAsp = Object.entries(state.selectedBuffs).reduce(
    (sum, [buffId, count]) => {
      const buff = buffMap[buffId];
      if (!buff || count <= 0) return sum;
      return sum + getTotalCostForBuff(buff.cost, count);
    },
    0
  );

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
        selectedBuffs:
          parsed.selectedBuffs && typeof parsed.selectedBuffs === "object"
            ? parsed.selectedBuffs
            : {},
        customBuffs: Array.isArray(parsed.customBuffs) ? parsed.customBuffs : [],
        aiAbilities: Array.isArray(parsed.aiAbilities) ? parsed.aiAbilities : []
      };
    }
  } catch (err) {
    console.error("Error loading state:", err);
  }
}

// ---------- RENDER: SELECT OPTIONS ----------

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

// ---------- RENDER: SHADOW LIST ----------

function renderCorpseShadowCustomSelect() {
  const sel = document.getElementById("corpse-shadow-custom");
  if (!sel) return;
  sel.innerHTML = "";
  state.shadows.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name || "(Unnamed)"} (SL ${s.shadowLevel}, ${
      s.shadowPower
    } SPU)`;
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

    const techLabel = document.createElement("div");
    techLabel.className = "shadow-tech-label";
    techLabel.textContent = "Named Techniques (1 per line):";
    main.appendChild(techLabel);

    const techArea = document.createElement("textarea");
    techArea.className = "shadow-tech-input";
    techArea.value = Array.isArray(shadow.techniques)
      ? shadow.techniques.join("\n")
      : "";
    techArea.addEventListener("change", () => {
      const lines = techArea.value
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean);
      shadow.techniques = lines;
      saveState();
      updateSummary();
    });
    main.appendChild(techArea);

    const controls = document.createElement("div");
    controls.className = "shadow-controls";

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

// ---------- RENDER: BUFFS ----------

function renderBuffList() {
  const listEl = document.getElementById("buff-list");
  listEl.innerHTML = "";

  const allBuffs = getAllBuffs();
  const { totalAsp, availableAsp } = getShadowTotals();

  allBuffs.forEach((buff) => {
    const count = state.selectedBuffs[buff.id] || 0;
    const totalCostForThisBuff = getTotalCostForBuff(buff.cost, count);
    const nextCopyCost = getCopyCost(buff.cost, count + 1);

    const canAffordNext = availableAsp >= nextCopyCost;
    const meetsMin = totalAsp >= buff.minAsp;

    const card = document.createElement("div");
    card.className = "buff-card";

    const header = document.createElement("div");
    header.className = "buff-card-header";

    const nameEl = document.createElement("div");
    nameEl.className = "buff-name";
    nameEl.textContent = buff.name;

    const costEl = document.createElement("div");
    costEl.className = "buff-cost";
    costEl.textContent = `${buff.cost} SPU (base)`;

    header.appendChild(nameEl);
    header.appendChild(costEl);

    const desc = document.createElement("div");
    desc.className = "buff-desc";
    desc.textContent = buff.description;

    const meta = document.createElement("div");
    meta.className = "buff-meta";
    meta.textContent = `Requires total SPU ≥ ${buff.minAsp}`;

    const controls = document.createElement("div");
    controls.className = "buff-controls";

    const countInfo = document.createElement("div");
    countInfo.className = "buff-count";
    if (count === 0) {
      countInfo.textContent = "Copies: 0";
    } else {
      countInfo.textContent = `Copies: ${count} • Total cost: ${totalCostForThisBuff} SPU • Next: ${nextCopyCost} SPU`;
    }

    const stepper = document.createElement("div");
    stepper.className = "buff-stepper";

    const minusBtn = document.createElement("button");
    minusBtn.className = "btn secondary";
    minusBtn.textContent = "−";
    minusBtn.disabled = count === 0;
    minusBtn.addEventListener("click", () => {
      const current = state.selectedBuffs[buff.id] || 0;
      if (current <= 1) {
        delete state.selectedBuffs[buff.id];
      } else {
        state.selectedBuffs[buff.id] = current - 1;
      }
      saveState();
      renderTotals();
      renderBuffList();
      renderSelectedBuffs();
      updateSummary();
    });

    const plusBtn = document.createElement("button");
    plusBtn.className = "btn secondary";
    plusBtn.textContent = "+";
    plusBtn.disabled = !meetsMin || !canAffordNext;
    plusBtn.title =
      meetsMin && canAffordNext
        ? ""
        : "Not enough SPU or minimum total SPU not met.";
    plusBtn.addEventListener("click", () => {
      const current = state.selectedBuffs[buff.id] || 0;
      const { availableAsp: currentAvail } = getShadowTotals();
      const needed = getCopyCost(buff.cost, current + 1);
      if (currentAvail < needed || !meetsMin) return;
      state.selectedBuffs[buff.id] = current + 1;
      saveState();
      renderTotals();
      renderBuffList();
      renderSelectedBuffs();
      updateSummary();
    });

    stepper.appendChild(minusBtn);
    stepper.appendChild(plusBtn);

    controls.appendChild(countInfo);
    controls.appendChild(stepper);

    card.appendChild(header);
    card.appendChild(desc);
    card.appendChild(meta);
    card.appendChild(controls);

    listEl.appendChild(card);
  });
}

function renderSelectedBuffs() {
  const container = document.getElementById("selected-buffs");
  container.innerHTML = "";

  const allBuffs = getAllBuffs();
  const buffMap = Object.fromEntries(allBuffs.map((b) => [b.id, b]));

  const entries = Object.entries(state.selectedBuffs).filter(
    ([, count]) => count > 0
  );

  if (!entries.length) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "selected-buffs-empty";
    emptyEl.textContent = "No buffs selected yet.";
    container.appendChild(emptyEl);
    return;
  }

  entries.forEach(([buffId, count]) => {
    const buff = buffMap[buffId];
    if (!buff) return;

    const totalCost = getTotalCostForBuff(buff.cost, count);

    const card = document.createElement("div");
    card.className = "selected-buff-card";

    const main = document.createElement("div");
    main.className = "selected-buff-main";

    const nameEl = document.createElement("div");
    nameEl.className = "selected-buff-name";
    nameEl.textContent = `${buff.name} ×${count}`;

    const metaEl = document.createElement("div");
    metaEl.className = "selected-buff-meta";
    metaEl.textContent = `Total cost: ${totalCost} SPU • ${buff.description}`;

    main.appendChild(nameEl);
    main.appendChild(metaEl);

    const removeBtn = document.createElement("button");
    removeBtn.className = "selected-buff-remove";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      delete state.selectedBuffs[buffId];
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

// ---------- SUMMARY ----------

function updateSummary() {
  const out = document.getElementById("summary-output");
  if (!out) return;

  const { totalAsp, spentAsp, availableAsp } = getShadowTotals();
  const allBuffs = getAllBuffs();
  const buffMap = Object.fromEntries(allBuffs.map((b) => [b.id, b]));

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
      if (Array.isArray(s.techniques) && s.techniques.length) {
        lines.push("    Techniques:");
        s.techniques.forEach((t) => lines.push(`      • ${t}`));
      }
    });
  }

  lines.push("");
  const buffEntries = Object.entries(state.selectedBuffs).filter(
    ([, count]) => count > 0
  );
  if (!buffEntries.length) {
    lines.push("No buffs selected.");
  } else {
    lines.push("Active Buffs:");
    buffEntries.forEach(([buffId, count]) => {
      const buff = buffMap[buffId];
      if (buff) {
        lines.push(
          `- ${buff.name} ×${count} (base ${buff.cost} SPU): ${buff.description}`
        );
      }
    });
  }

  out.value = lines.join("\n");
}

// ---------- REANIMATION CARD ----------

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

  // Ad-hoc shadow
  const adhocName = document
    .getElementById("corpse-extra-shadow-name")
    .value.trim();
  const adhocSL = Number(
    document.getElementById("corpse-extra-shadow-sl").value
  );
  let adhocShadow = null;
  if (adhocName && !isNaN(adhocSL) && adhocSL >= 1) {
    adhocShadow = {
      name: adhocName,
      shadowLevel: clamp(adhocSL, 1, 10),
      shadowPower: computeShadowPower(adhocSL),
      ttLabel: "Ad-hoc Shadow"
    };
    usedShadows.push(adhocShadow);
  }

  if (!corpseName || !usedShadows.length) {
    alert("You need a corpse name and at least one shadow to reanimate.");
    return;
  }

  const totalSL = usedShadows.reduce((sum, s) => sum + s.shadowLevel, 0);
  const totalSPU = usedShadows.reduce((sum, s) => sum + s.shadowPower, 0);

  const size =
    totalSL >= 25 ? "Huge" : totalSL >= 15 ? "Large" : totalSL >= 8 ? "Medium" : "Medium";

  const acBase =
    10 + Math.floor(corpseDurability / 2) + Math.floor(totalSL / 5);
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

  // Fill card inputs
  document.getElementById("monster-name").value =
    corpseName || "Reanimated Corpse";
  document.getElementById(
    "monster-tier"
  ).textContent = `Tier: ${powerTier} (SL sum ${totalSL}, ${totalSPU} SPU)`;
  document.getElementById("monster-subtitle").textContent =
    `${size} undead (shadow-animated)`;

  document.getElementById(
    "monster-ac"
  ).value = `${acBase} (shadow-reinforced hide)`;
  document.getElementById(
    "monster-hp"
  ).value = `~${hpBase} (DM can convert to dice)`;
  document.getElementById("monster-speed").value = `${speed} ft.`;

  document.getElementById("monster-str").value = str;
  document.getElementById("monster-dex").value = dex;
  document.getElementById("monster-con").value = con;
  document.getElementById("monster-int").value = intStat;
  document.getElementById("monster-wis").value = wis;
  document.getElementById("monster-cha").value = cha;

  const saveStr = Math.floor((str - 10) / 2) + 2;
  const saveCon = Math.floor((con - 10) / 2) + 2;

  const traitsLines = [];
  traitsLines.push(
    `Corpse Durability. Built from a Durability Tier ${corpseDurability} body; it is physically tough and hard to dismantle.`
  );
  traitsLines.push(
    `Infused Shadows. Infused with ${usedShadows.length} shadow(s), total SL ${totalSL}, total SPU ${totalSPU}. Its instincts and aggression are shaped by those shadows.`
  );
  if (totalSL >= 15) {
    traitsLines.push(
      "Shadow Instincts. Gains advantage on one type of save (STR, DEX, or CON) chosen when created."
    );
  }
  if (totalSL >= 20) {
    traitsLines.push(
      "Shadow Resilience. Once per rest, when reduced to 0 HP, it instead drops to 1 HP and shreds away part of its shadow mass."
    );
  }
  traitsLines.push(
    "Damage Resistances: necrotic; bludgeoning, piercing, and slashing from non-magical attacks (optional)."
  );
  traitsLines.push(
    "Condition Immunities: charmed, frightened, poisoned (DM option)."
  );
  traitsLines.push(
    "Senses: darkvision 60 ft., passive Perception ??. Languages: understands its languages in life (if any); obeys the shadow fruit user."
  );
  document.getElementById("monster-traits").value = traitsLines.join("\n");

  const actionsLines = [];
  actionsLines.push(
    "Multiattack. The reanimated corpse makes two attacks: one Slam and one Shadow Lash (or two Slams)."
  );
  actionsLines.push(
    `Slam. Melee Weapon Attack: +${Math.floor((str - 10) / 2) + 4} to hit, reach 5 ft., one target. Hit: 1d10 + ${Math.floor(
      (str - 10) / 2
    )} bludgeoning damage.`
  );
  if (totalSL >= 10) {
    actionsLines.push(
      `Shadow Lash. Melee spell-like attack: +${
        5 + Math.floor(totalSL / 3)
      } to hit, reach 10 ft., one target. Hit: 2d8 necrotic damage, and the target must succeed on a STR or DEX save (DC ~${10 +
        Math.floor(totalSL / 2)}) or be grappled by writhing shadow chains.`
    );
  }
  if (totalSL >= 18) {
    actionsLines.push(
      `Shadow Burst (Recharge 5–6). The corpse erupts in a wave of shadow. Creatures within 15 ft. must make a CON save (DC ~${12 +
        Math.floor(totalSL / 3)}) or take 3d8 necrotic damage (half on a success).`
    );
  }
  document.getElementById("monster-actions").value = actionsLines.join("\n");

  const infusedLines = [];
  usedShadows.forEach((s) => {
    infusedLines.push(
      `• ${s.name || "(Unnamed)"} – SL ${s.shadowLevel}, SPU ${
        s.shadowPower
      }, Template: ${s.ttLabel || "—"}`
    );
  });
  document.getElementById("monster-shadows").value = infusedLines.join("\n");
}

// ---------- DC HELPER ----------

function calcDC() {
  const sl = Number(document.getElementById("dc-shadow-level").value);
  const mod = Number(document.getElementById("dc-spell-mod").value);
  const prof = Number(document.getElementById("dc-prof").value);

  const shadowBonus = Math.floor(clamp(sl, 1, 10) / 2); // 0–5
  const dc = 8 + (isNaN(mod) ? 0 : mod) + (isNaN(prof) ? 0 : prof) + shadowBonus;

  const out = document.getElementById("dc-output");
  out.textContent = `Suggested DC: ${dc}  (8 + mod ${mod || 0} + prof ${prof ||
    0} + shadow bonus ${shadowBonus})`;
}

// ---------- AI ABILITIES (PANEL 5) ----------

function renderAbilities() {
  const container = document.getElementById("ai-abilities");
  container.innerHTML = "";

  if (!state.aiAbilities.length) {
    const empty = document.createElement("div");
    empty.className = "status-text";
    empty.textContent =
      "No abilities yet. Click “Generate Abilities with AI” or “Add Empty Ability Card.”";
    container.appendChild(empty);
    return;
  }

  state.aiAbilities.forEach((ab, index) => {
    const card = document.createElement("div");
    card.className = "ability-card";

    const header = document.createElement("div");
    header.className = "ability-header";

    const nameInput = document.createElement("input");
    nameInput.className = "ability-name-input";
    nameInput.value = ab.name || "";
    nameInput.placeholder = "Ability Name";
    nameInput.addEventListener("input", () => {
      ab.name = nameInput.value;
      saveState();
    });

    const tierBadge = document.createElement("div");
    tierBadge.className = "ability-tier-badge";
    tierBadge.innerHTML = `<div>${ab.tier || "SL"}</div><div>${ab.shadowLevel ||
      "-"}</div>`;

    header.appendChild(nameInput);
    header.appendChild(tierBadge);

    const tags = document.createElement("div");
    tags.className = "ability-tags";
    tags.textContent =
      ab.role || "Role: Offense / Defense / Support / Control / Utility";

    const shortDesc = document.createElement("textarea");
    shortDesc.className = "ability-short-desc";
    shortDesc.value = ab.shortDesc || "";
    shortDesc.placeholder =
      "Short one-sentence summary of what this ability does.";
    shortDesc.addEventListener("input", () => {
      ab.shortDesc = shortDesc.value;
      saveState();
    });

    const longDesc = document.createElement("textarea");
    longDesc.className = "ability-long-desc";
    longDesc.value = ab.longDesc || "";
    longDesc.placeholder =
      "Longer flavor + mechanical description of the ability.";
    longDesc.addEventListener("input", () => {
      ab.longDesc = longDesc.value;
      saveState();
    });

    const fieldsGrid = document.createElement("div");
    fieldsGrid.className = "ability-fields-grid";

    function makeField(label, key) {
      const wrap = document.createElement("div");
      wrap.className = "ability-field";
      const l = document.createElement("div");
      l.className = "label";
      l.textContent = label;
      const input = document.createElement("input");
      input.value = ab[key] || "";
      input.addEventListener("input", () => {
        ab[key] = input.value;
        saveState();
      });
      wrap.appendChild(l);
      wrap.appendChild(input);
      return wrap;
    }

    fieldsGrid.appendChild(makeField("Action", "action"));
    fieldsGrid.appendChild(makeField("Range", "range"));
    fieldsGrid.appendChild(makeField("Target", "target"));
    fieldsGrid.appendChild(makeField("Save", "save"));
    fieldsGrid.appendChild(makeField("DC", "dc"));
    fieldsGrid.appendChild(makeField("Damage", "damage"));

    const effect = document.createElement("textarea");
    effect.className = "ability-effect";
    effect.value = ab.effect || "";
    effect.placeholder = "Mechanical effect: what happens on hit / failed save.";
    effect.addEventListener("input", () => {
      ab.effect = effect.value;
      saveState();
    });

    const notes = document.createElement("textarea");
    notes.className = "ability-notes";
    notes.value = ab.notes || "";
    notes.placeholder = "Optional: how this interacts with other powers / combo logic.";
    notes.addEventListener("input", () => {
      ab.notes = notes.value;
      saveState();
    });

    const buttons = document.createElement("div");
    buttons.className = "ability-buttons";

    const copyBtn = document.createElement("button");
    copyBtn.className = "btn secondary";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", async () => {
      const text = buildAbilityText(ab);
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // ignore errors
      }
    });

    const rerollBtn = document.createElement("button");
    rerollBtn.className = "btn secondary";
    rerollBtn.textContent = "Reroll";
    rerollBtn.addEventListener("click", () => {
      callAI(index);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      state.aiAbilities.splice(index, 1);
      saveState();
      renderAbilities();
    });

    buttons.appendChild(copyBtn);
    buttons.appendChild(rerollBtn);
    buttons.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(tags);
    card.appendChild(shortDesc);
    card.appendChild(longDesc);
    card.appendChild(fieldsGrid);
    card.appendChild(effect);
    card.appendChild(notes);
    card.appendChild(buttons);

    container.appendChild(card);
  });
}

function buildAbilityText(ab) {
  return [
    `Name: ${ab.name || ""}`,
    ab.role ? `Role: ${ab.role}` : "",
    "",
    ab.shortDesc || "",
    "",
    ab.longDesc || "",
    "",
    `Action: ${ab.action || ""}`,
    `Range: ${ab.range || ""}`,
    `Target: ${ab.target || ""}`,
    `Save: ${ab.save || ""}`,
    `DC: ${ab.dc || ""}`,
    `Damage: ${ab.damage || ""}`,
    "",
    `Effect: ${ab.effect || ""}`,
    ab.notes ? `Notes: ${ab.notes}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

// very simple parser: split text by lines starting with "### "
function parseAbilitiesFromText(text) {
  if (!text || typeof text !== "string") return [];

  const lines = text.split("\n");
  const sections = [];
  let current = [];

  for (const line of lines) {
    if (line.trim().startsWith("### ")) {
      if (current.length) sections.push(current.join("\n").trim());
      current = [line.trim()];
    } else {
      current.push(line);
    }
  }
  if (current.length) sections.push(current.join("\n").trim());

  if (!sections.length) sections.push(text.trim());

  return sections.map((block, idx) => {
    const bLines = block.split("\n");
    let name = `Shadow Ability ${idx + 1}`;
    if (bLines[0].startsWith("### ")) {
      name = bLines[0].replace(/^###\s*/, "").trim() || name;
      bLines.shift();
    }
    const body = bLines.join("\n").trim();

    return {
      name,
      role: "",
      tier: "PL",
      shadowLevel: "",
      shortDesc: body.split("\n")[0] || "",
      longDesc: body,
      action: "",
      range: "",
      target: "",
      save: "",
      dc: "",
      damage: "",
      effect: "",
      notes: ""
    };
  });
}

async function callAI(focusIndex = null) {
  const statusEl = document.getElementById("ai-status");
  statusEl.textContent = "Calling the shadows (AI)...";

  const notes = document.getElementById("ai-notes").value || "";
  const { totalAsp, spentAsp, availableAsp } = getShadowTotals();

  const payload = {
    shadows: state.shadows,
    totalAsp,
    spentAsp,
    availableAsp,
    selectedBuffIds: Object.keys(state.selectedBuffs),
    selectedBuffs: state.selectedBuffs,
    notes,
    focusIndex
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
    const text = data.text || "";

    const abilities = parseAbilitiesFromText(text);
    if (!abilities.length) {
      statusEl.textContent = "AI responded, but no abilities were parsed.";
      return;
    }

    if (focusIndex != null && focusIndex >= 0 && focusIndex < state.aiAbilities.length) {
      // replace just the one ability with the first parsed
      state.aiAbilities[focusIndex] = abilities[0];
    } else {
      state.aiAbilities = abilities;
    }

    saveState();
    renderAbilities();
    statusEl.textContent = "AI response received.";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error contacting AI.";
  }
}

// ---------- EVENTS ----------

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
    const payloadRaw = addBtn.dataset.lastCalc;
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
      active: true,
      techniques: []
    });

    document.getElementById("shadow-name").value = "";
    addBtn.disabled = true;
    outEl.textContent = "Shadow added to your collection.";

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
    .addEventListener("click", () => callAI(null));

  document
    .getElementById("btn-ai-add-empty")
    .addEventListener("click", () => {
      state.aiAbilities.push({
        name: "",
        role: "",
        tier: "PL",
        shadowLevel: "",
        shortDesc: "",
        longDesc: "",
        action: "",
        range: "",
        target: "",
        save: "",
        dc: "",
        damage: "",
        effect: "",
        notes: ""
      });
      saveState();
      renderAbilities();
    });

  document.getElementById("btn-calc-dc").addEventListener("click", calcDC);

  document.getElementById("btn-add-custom-buff").addEventListener("click", () => {
    const name = document.getElementById("custom-buff-name").value.trim();
    const cost = Number(
      document.getElementById("custom-buff-cost").value || "0"
    );
    const minAsp = Number(
      document.getElementById("custom-buff-minAsp").value || "0"
    );
    const desc = document.getElementById("custom-buff-desc").value.trim();

    if (!name || isNaN(cost) || cost <= 0) {
      alert("Custom buff needs a name and a positive base cost.");
      return;
    }

    const id = "custom_" + Date.now().toString(36);
    const buff = {
      id,
      name,
      cost,
      minAsp: isNaN(minAsp) ? 0 : minAsp,
      description: desc || "Custom buff (details not specified)."
    };

    state.customBuffs.push(buff);

    document.getElementById("custom-buff-name").value = "";
    document.getElementById("custom-buff-cost").value = "10";
    document.getElementById("custom-buff-minAsp").value = "0";
    document.getElementById("custom-buff-desc").value = "";

    saveState();
    renderBuffList();
    renderSelectedBuffs();
    updateSummary();
  });

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
    if (!confirm("Reset all shadows, buffs, abilities, and custom buffs?")) return;
    state = {
      shadows: [],
      selectedBuffs: {},
      customBuffs: [],
      aiAbilities: []
    };
    saveState();
    renderShadowList();
    renderTotals();
    renderBuffList();
    renderSelectedBuffs();
    renderAbilities();
    updateSummary();
    document.getElementById("dc-output").textContent = "";
    document.getElementById("ai-status").textContent = "";
    document.getElementById("monster-name").value = "";
    document.getElementById("monster-tier").textContent = "Tier: –";
    document.getElementById("monster-subtitle").textContent =
      "Reanimated undead (shadow-animated)";
    document.getElementById("monster-ac").value = "";
    document.getElementById("monster-hp").value = "";
    document.getElementById("monster-speed").value = "";
    document.getElementById("monster-str").value = "";
    document.getElementById("monster-dex").value = "";
    document.getElementById("monster-con").value = "";
    document.getElementById("monster-int").value = "";
    document.getElementById("monster-wis").value = "";
    document.getElementById("monster-cha").value = "";
    document.getElementById("monster-traits").value = "";
    document.getElementById("monster-actions").value = "";
    document.getElementById("monster-shadows").value = "";
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
  renderAbilities();
  updateSummary();
  initEvents();
});
