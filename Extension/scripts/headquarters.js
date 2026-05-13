(async () => {
  let cachedCsrfName = null;
  let cachedCsrfToken = null;
  const facility_map = {
    manufacturing: 1,
    offices: 2,
    simulator: 3,
    technology: 7,
    design: 8,
    yda: 11,
  };
  
  const { delay } = await import(chrome.runtime.getURL('common/utility.js'));
  await delay(200); // sleep a bit, while page loads
   
  if (document.getElementById('condensed-hq-igplus')) return; // Already initialized

  const hqContainer = document.getElementById('hq-container');
  if (!hqContainer) return; // Wait for game page to be ready

  const parent = hqContainer.parentElement;

  // 1. Load preferences to see which tab was active last time
  const prefs = await new Promise(resolve => {
    chrome.storage.local.get(['igp_hq_prefs'], res => {
      resolve(res.igp_hq_prefs || { order:[], hidden: {}, activeTab: 'condensed-hq-igplus' });
    });
  });

  // 2. Create the Tab Switcher
  const tabSwitcher = document.createElement('div');
  tabSwitcher.id = 'hq-tab-switcher';
  tabSwitcher.innerHTML = `
    <button class="hq-tab-btn" data-target="hq-container">Original View</button>
    <button class="hq-tab-btn" data-target="condensed-hq-igplus">Condensed View</button>
  `;

  // 3. Insert Tabs above the 3D map
  parent.insertBefore(tabSwitcher, hqContainer);

  // 4. Build and insert the Condensed Panel as a sibling
  const facilityNames = Object.keys(facility_map);
  const panel = await buildFacilityPanel(facilityNames);
  hqContainer.insertAdjacentElement('afterend', panel);

 // 5. Tab Click Logic
  const btns = tabSwitcher.querySelectorAll('.hq-tab-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      
      // Update active button styling
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Grab the repair-all-bar dynamically in case the game re-renders it
      const repairAllBar = document.getElementById('repair-all-bar');

      // Toggle visibility
      if (targetId === 'hq-container') {
        hqContainer.style.display = ''; // Restores native layout
        panel.style.display = 'none';
        
        // Show the native repair bar
        if (repairAllBar) repairAllBar.style.display = ''; 
      } else {
        hqContainer.style.display = 'none';
        panel.style.display = 'flex'; // Use flex for our custom layout
        
        // Hide the native repair bar so it doesn't get in the way
        if (repairAllBar) repairAllBar.style.display = 'none'; 
      }

      // Save preference so it survives page reloads
      prefs.activeTab = targetId;
      chrome.storage.local.set({ igp_hq_prefs: prefs });
    });
  });

  // 6. Trigger a click on the saved (or default) tab to initialize state
  const savedTab = prefs.activeTab || 'condensed-hq-igplus';
  const targetBtn = tabSwitcher.querySelector(`[data-target="${savedTab}"]`);
  if (targetBtn) targetBtn.click();


  // ─── Function Definitions ─────────────────────────────────────────────────────

  async function addLevelLabels() {
    const { fetchBuildingInfo } = await import(chrome.runtime.getURL('common/fetcher.js'));

    if (document.getElementsByClassName('levelSpan').length > 0) return;

    const buildings = document.getElementById('hq-container')?.querySelectorAll('img:not([class])') ?? false;
    if (buildings == false) return;

    buildings.forEach(async (building) => {
      const levelDiv = document.createElement('span');
      levelDiv.classList.add('levelSpan');
      const name = extractPart(building.src);
      
      const data = await fetchBuildingInfo(facility_map[name]);
      if (!data) {
        console.warn(`No info about building with id ${name}`);
        return;
      }

      const { vars = {} } = data;
      levelDiv.innerHTML = `Level: ${vars?.level || ''}`;

      const label = building.nextSibling.querySelector('.building-name-overlay');
      if (label.querySelectorAll('.levelSpan').length == 0)
        label.prepend(levelDiv);
    });
  }

  function extractPart(url) {
    const match = url.match(/hq1-([^_]+)/);
    return match ? match[1] : null;
  }

  function makeFacilityCard(data, rawName,isAutoFix) {
    let name = data.name;
    let level = data.level;
    let condition = data.condition;
    let isConstructing = false;
    let endTime = null;
    let fType = data.type;

    let canMaintain = false;
    let canUpgrade = false;
    let upgradeCost = null;
    let repairCost = null;
    let fId = null;

    const card = document.createElement("div");
    card.className = "fac-card";

    card.dataset.facName = rawName; // Used for reordering and hiding


    let collectUrl = null;
    let collectContent = "";
    if (data.collectBubbleHtml) {
      const matchUrl = data.collectBubbleHtml.match(/data-href=['"]([^'"]+)['"]/);
      if (matchUrl) collectUrl = matchUrl[1];
      
      const valMatch = data.collectBubbleHtml.match(/<\/icon>\s*(\d+)/);
      const descMatch = data.collectBubbleHtml.match(/>([^<]+)<\/div>/);
      if(valMatch && descMatch) {
        collectContent = { value: Number(valMatch[1]), description: descMatch[1].trim() };
      }
    }

    if (!name && data.dialogSubhead) {
      const subDoc = new DOMParser().parseFromString(data.dialogSubhead, "text/html");
      const h1 = subDoc.querySelector("h1");
      if (h1) {
        name = Array.from(h1.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0)?.textContent.trim() || "Facility";
        level = h1.querySelector("span")?.textContent.trim() || "0";
      }
      const condSpan = subDoc.querySelector(".segmented-bar-container")?.parentElement?.nextElementSibling;
      condition = condSpan ? parseInt(condSpan.textContent) : 0;
      isConstructing = !!data.notice?.includes("under construction");
      
      if (data.facilityFooter) {
        const footDoc = new DOMParser().parseFromString(data.facilityFooter, "text/html");
        if (isConstructing) {
          endTime = footDoc.querySelector(".countdown")?.textContent;
        } else {
          const confirmBtn = footDoc.querySelector("a.confirm");
          if (confirmBtn) {
            const tip = confirmBtn.getAttribute("data-tip") || "";
            const fTypeMatch = tip.match(/fType=(\d+)/);
            if (fTypeMatch) {
              fType = fTypeMatch[1];
              canUpgrade = true;
            }
            const cashImg = confirmBtn.querySelector("img[src*='cash']");
            if (cashImg && cashImg.nextSibling) {
              upgradeCost = cashImg.nextSibling.textContent.trim();
            } else {
              const costMatch = confirmBtn.textContent.match(/[\d.]+[km]/i);
              if (costMatch) upgradeCost = costMatch[0];
            }
          }
        }
      }
    } else {
      level = typeof data.level === "string" ? data.level.replace(/<[^>]+>/g, "").trim() : data.level;
      condition = data.condition;
      fType = data.type;
      canMaintain = !data.repairBtn?.includes("disabled");
      canUpgrade  = !data.upgradeBtn?.includes("disabled");
      upgradeCost = data.upgradeCost ? data.upgradeCost.replace(/<[^>]+>/g, "").trim() : null;
      repairCost = parseRepairCost(data.repairBtn);
      fId = parseRepairAction(data.repairBtn);
    }

    condition = condition || 0;
    const condClass = condition >= 80 ? "green" : condition >= 40 ? "amber" : "red";
    const optionsEl = (isConstructing || level === "0") ? null : parseOptions(data);
    
    let levelButtonHtml;
    if (isConstructing && endTime) {
      levelButtonHtml = `Upgrading until ${formatUpgradeTime(endTime)}`;
    } else if (isConstructing) {
      levelButtonHtml = `Upgrading...`;
    } else if (level === "0") {
      levelButtonHtml = `Build${canUpgrade && upgradeCost ? ` <span class="upgrade-cost">↑ ${upgradeCost}</span>` : ""}`;
    } else {
      levelButtonHtml = `Lv ${level}${canUpgrade && upgradeCost ? ` <span class="upgrade-cost">↑ ${upgradeCost}</span>` : ""}`;
    }

    card.innerHTML = `
      <div class="fac-header">
        <div class="fac-title-row">
          <div class="fac-title-left">
            <!-- Persistent checkbox: NEVER disabled, represents user preference -->
            <input type="checkbox" 
       class="cb-fix-select" 
       title="Include in Bulk Fix" 
       data-fid="${fId}" 
       data-cost="${repairCost || ''}" 
       ${isAutoFix ? 'checked' : ''}>
            <span class="fac-name">${name}</span>
          </div>
          <button class="fac-level ${canUpgrade ? "can-upgrade" : ""}" ${canUpgrade ? "" : "disabled"}>
            ${levelButtonHtml}
          </button>
        </div>
        <div class="fac-cond">
          <div class="cond-bar">
            <div class="cond-fill ${condClass}" style="width: ${condition}%"></div>
          </div>
          <span class="cond-pct ${condClass}">${condition}%</span>
          <button class="btn-maintain" ${canMaintain ? "" : "disabled"}>
            Fix${repairCost ? ` <span class="maintain-cost">${repairCost}</span>` : ""}
          </button>
          ${collectUrl && collectContent ? `<button class="btn-collect">${collectContent.description}: ${collectContent.value}</button>` : ""}
        </div>
      </div>
      <div class="fac-options"></div>
    `;
    const fixCb = card.querySelector('.cb-fix-select');
    if (fixCb) {
      fixCb.addEventListener('change', (e) => {
        // Save preference directly to chrome.storage
        chrome.storage.local.get(['igp_hq_prefs'], res => {
          const p = res.igp_hq_prefs || { autoFix: {} };
          if (!p.autoFix) p.autoFix = {};
          p.autoFix[rawName] = e.target.checked;
          chrome.storage.local.set({ igp_hq_prefs: p });
        });
        // Recalculate total cost
        updateBulkRepair();
      });
    }

    const optionsContainer = card.querySelector(".fac-options");
    if (optionsEl) {
      optionsContainer.appendChild(optionsEl);
    } else if (isConstructing) {
      optionsContainer.innerHTML = `<div class="opts-stat-line" style="color:#d4890a;">Actions unavailable while under construction</div>`;
    } else if (level === "0") {
      optionsContainer.innerHTML = `<div class="opts-stat-line" style="color:#888;">Facility not built yet</div>`;
    }

    card.querySelector(".fac-level").addEventListener("click", () => {
      if (canUpgrade && fType) doUpgrade(fType, name, card);
    });

    card.querySelector(".btn-maintain").addEventListener("click", () => {
     if (canMaintain && fId) doMaintain(fId, name, card);
    });

    const collectBtn = card.querySelector(".btn-collect");
    if (collectBtn && collectUrl) {
      collectBtn.addEventListener("click", () => {
        doCollect(collectUrl, name, card);
      });
    }

    return card;
  }

  function parseRepairAction(repairBtn) {
    if (!repairBtn) return null;
    const match = repairBtn.match(/href="type=hqRepair&(?:amp;)?fId=(\d+)"/);
    return match ? match[1] : null;
  }

  function getCsrfTokens() {
    return {
      name:  cachedCsrfName ?? window.csrfName  ?? document.getElementById('cmsCsrfName')?.value,
      token: cachedCsrfToken ?? window.csrfToken ?? document.getElementById('cmsCsrfToken')?.value,
    };
  }

  async function doUpgrade(fType, name, cardEl) {
    const levelBtn = cardEl.querySelector(".fac-level");
    if (levelBtn) levelBtn.disabled = true;

    const { name: csrfName, token: csrfToken } = getCsrfTokens();

    try {
      const res = await fetch(
        `https://igpmanager.com/index.php?action=send&type=build&fType=${fType}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "x-requested-with": "XMLHttpRequest",
            ...(csrfName  && { "x-csrf-name":  csrfName  }),
            ...(csrfToken && { "x-csrf-token": csrfToken }),
          },
        }
      );
      
      const data = await res.json();
      
      if (data.hqFacilityPatch) {
        if (data.csrf && data.csrf.name && data.csrf.token) {
          cachedCsrfName = data.csrf.name;
          cachedCsrfToken = data.csrf.token;
        }

        if (levelBtn) {
          levelBtn.classList.remove("can-upgrade");
          const endEcma = data.hqFacilityPatch.endEcma;
          if (endEcma) {
            levelBtn.innerHTML = `Upgrading until ${formatUpgradeTime(endEcma)}`;
          } else {
            levelBtn.innerHTML = `Upgrading...`;
          }
        }

        const panel = document.getElementById("condensed-hq-igplus");
        if (panel) {
          const otherUpgradeBtns = panel.querySelectorAll(".fac-level.can-upgrade");
          otherUpgradeBtns.forEach(btn => {
            btn.classList.remove("can-upgrade");
            btn.disabled = true;
            const costSpan = btn.querySelector(".upgrade-cost");
            if (costSpan) costSpan.remove();
          });
        }
      } else {
        if (levelBtn) levelBtn.disabled = false;
      }
    } catch (err) {
      if (levelBtn) levelBtn.disabled = false;
    }
  }

  async function doCollect(url, name, cardEl) {
    const btn = cardEl.querySelector(".btn-collect");
    if (btn) btn.disabled = true;

    const { name: csrfName, token: csrfToken } = getCsrfTokens();

    try {
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "accept": "application/json, text/javascript, */*; q=0.01",
          "x-requested-with": "XMLHttpRequest",
          ...(csrfName  && { "x-csrf-name":  csrfName  }),
          ...(csrfToken && { "x-csrf-token": csrfToken }),
        },
      });
      
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch(e) { data = { success: true, raw: text }; }

      if (data.csrf && data.csrf.name && data.csrf.token) {
        cachedCsrfName = data.csrf.name;
        cachedCsrfToken = data.csrf.token;
      }

      const nativeBtn = document.querySelector(`.collectLink[data-href*="${url}"]`);
      if (nativeBtn && nativeBtn.parentElement) {
        nativeBtn.parentElement.style.display = "none";
      }

      if (btn) {
        btn.innerHTML = "Collected!";
        btn.classList.add("collected-success");
        setTimeout(() => {
          btn.style.transition = "opacity 0.5s ease";
          btn.style.opacity = "0";
          setTimeout(() => btn.remove(), 500);
        }, 1500);
      }
    } catch (err) {
      if (btn) btn.disabled = false;
    }
  }

  function formatUpgradeTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async function doMaintain(fId, name, cardEl) {
    const maintainBtn = cardEl.querySelector(".btn-maintain");
    if (maintainBtn) maintainBtn.disabled = true;

    const { name: csrfName, token: csrfToken } = getCsrfTokens();

    try {
      const res = await fetch(
        `https://igpmanager.com/index.php?action=send&type=hqRepair&fId=${fId}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "x-requested-with": "XMLHttpRequest",
            ...(csrfName  && { "x-csrf-name":  csrfName  }),
            ...(csrfToken && { "x-csrf-token": csrfToken }),
          },
        }
      );
      const data = await res.json();
      
      if (data.success) {
        if (data.csrf && data.csrf.name && data.csrf.token) {
          cachedCsrfName = data.csrf.name;
          cachedCsrfToken = data.csrf.token;
        }

        const condFill = cardEl.querySelector(".cond-fill");
        const condPct = cardEl.querySelector(".cond-pct");

        if (condFill) {
          condFill.style.width = "100%";
          condFill.classList.remove("amber", "red");
          condFill.classList.add("green");
        }

        if (condPct) {
          condPct.textContent = "100%";
          condPct.classList.remove("amber", "red");
          condPct.classList.add("green");
        }

        
      
        if (maintainBtn) {
          maintainBtn.innerHTML = "Fix"; 
          // Native logic disables the button automatically upon success, but we force it here just in case:
          maintainBtn.disabled = true; 
        }

        // Refresh the bulk total
        updateBulkRepair();
      } else {
        if (maintainBtn) maintainBtn.disabled = false;
      }
    } catch (err) {
      if (maintainBtn) maintainBtn.disabled = false;
    }
  }

  function parseOptions(data) {
    const type = parseInt(data.type);
    switch (type) {
      case 1:  return parseOptionsManufacturing(data);
      case 2:
      case 11: return parseOptionsRecruits(data);
      case 3:
      case 8:  return parseOptionsStat(data);
      case 7:  return parseOptionsTechnology(data);
      default: return null;
    }
  }

  function parseOptionsManufacturing(data) {
    const doc = new DOMParser().parseFromString(data.options, "text/html");
    const storage = doc.querySelector(".notice")?.textContent.trim() ?? "";
    const rows = doc.querySelectorAll(".grey > div");
    const stats = Array.from(rows).map(row => {
      const label = row.querySelector(".flex-1")?.textContent.trim() ?? "";
      const value = row.querySelector(".text-right")?.textContent.trim() ?? "";
      return { label, value };
    });

    const el = document.createElement("div");
    el.className = "opts-manufacturing";
    el.innerHTML = `
      <span class="opts-stat-line">${storage}</span>
      <div class="opts-kv-list">
        ${stats.map(s => `
          <div class="opts-kv">
            <span class="opts-kv-label">${s.label}</span>
            <span class="opts-kv-value">${s.value}</span>
          </div>
        `).join("")}
      </div>
    `;
    return el;
  }

  function parseOptionsStat(data) {
    const doc  = new DOMParser().parseFromString(data.options, "text/html");
    const text = doc.querySelector(".notice")?.textContent.trim() ?? "";
    if (!text) return null;

    const el = document.createElement("div");
    el.className = "opts-stat";
    el.textContent = text;
    return el;
  }

  function parseOptionsTechnology(data) {
    const doc  = new DOMParser().parseFromString(data.options, "text/html");
    const rows = doc.querySelectorAll("table tr:not(:first-child)");

    const items = Array.from(rows).map(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) return null;

      const rawName = cells[0];
      const name = [...rawName.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())?.textContent.trim();
      const link = cells[1].querySelector("a");
      if (!link) return null;

      const href = link.getAttribute("href") ?? "";
      const disabled = link.classList.contains("disabled");
      const tooltip = link.dataset.tip ?? "";
      const levelSpan = link.querySelector("span");
      const nextLevel = levelSpan?.textContent.trim() ?? "?";
      const cost = link.textContent.replace(/\s+/g, " ").trim().replace(/^Level\s*\d+\s*/, "").trim();

      return { name, href, disabled, tooltip, nextLevel, cost };
    }).filter(Boolean);

    if (!items.length) return null;

    const el = document.createElement("div");
    el.className = "opts-tech-list";
    items.forEach(item => {
      const btn = document.createElement("button");
      btn.className = `btn-tech${item.disabled ? " disabled" : ""}`;
      btn.disabled  = item.disabled;
      btn.title     = item.tooltip;
      btn.innerHTML = `
        <span class="tech-name">${item.name}</span>
        <span class="tech-meta">Lv ${item.nextLevel} · ${item.cost}</span>
      `;
      btn.addEventListener("click", () => console.log("tech upgrade", item.href));
      el.appendChild(btn);
    });
    return el;
  }

  function parseOptionsRecruits(data) {
    const doc = new DOMParser().parseFromString(data.options, "text/html");
    const rows = doc.querySelectorAll("#youthTable tbody tr");
    const type = parseInt(data.type);
    const deadline = doc.querySelector(".countdown")?.textContent.trim() ?? null;
    const deadlineStr = deadline ? formatDeadline(deadline) : "Scout";

    const recruits = Array.from(rows).map(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) return null;

      const hireCell = cells[cells.length - 1];
      const infoCell = cells[0];
      const hireLink = hireCell.querySelector("a");
      const hireHref = extractHireHref(hireLink?.dataset.tip ?? "");

      const hireText = hireCell.textContent.replace(/\s+/g, " ").trim();
      const cashMatch = hireText.match(/[\d]+k|[\d.]+m/i);
      const cash = cashMatch ? cashMatch[0] : "";
      const tokens = hireCell.querySelector(".token-cost")?.textContent.trim() ?? "";

      if (type === 11) {
        const nameRaw = infoCell.textContent.replace(/\s+/g, " ").trim();
        const name = nameRaw.split(/\d+yrs/)[0].trim();
        const talent = row.querySelector("td:nth-child(2)")?.textContent.replace(/\s+/g, "").trim() ?? "";
        return { kind: "driver", name, talent, cash, tokens, hireHref };
      } else {
        const role = infoCell.querySelector("span.block-grey")?.textContent.trim() ?? "";
        const rawText = infoCell.textContent.replace(/\s+/g, " ").trim();
        const talentMatch = rawText.match(/\((\d+%)\)/);
        const talent = talentMatch ? talentMatch[1] : "";
        const nameMatch = rawText.replace(role, "").trim().match(/^([A-Z]\s[\w]+)/);
        const name = nameMatch ? nameMatch[1] : rawText.split("(")[0].replace(role, "").trim();
        return { kind: "staff", role, name, talent, cash, tokens, hireHref };
      }
    }).filter(Boolean);

    const el = document.createElement("div");
    el.className = "opts-recruits";

    const header = document.createElement("button");
    header.className = "opts-recruit-toggle";
    header.innerHTML = `
      <span>Deadline: <span class="opts-deadline-time">${deadlineStr}</span></span>
      <span class="opts-recruit-chevron">▸</span>
    `;

    const list = document.createElement("div");
    list.className = "opts-recruit-list collapsed";

    recruits.forEach(r => {
      const row = document.createElement("div");
      row.className = "recruit-row";
      const label = r.kind === "staff"
        ? `<span class="recruit-role">${r.role}</span> ${r.name}`
        : r.name;

      row.innerHTML = `
        <span class="recruit-name">${label}</span>
        <span class="recruit-talent">${r.talent}</span>
        <button class="btn-hire" title="Hire ${r.name}">
          ${r.cash ? `<span>${r.cash}</span>` : ""}
          ${r.tokens ? `<span class="hire-tokens">🪙${r.tokens}</span>` : ""}
        </button>
      `;
      row.querySelector(".btn-hire").addEventListener("click", e => {
        e.stopPropagation();
        console.log("hire", r.name, r.hireHref);
      });
      list.appendChild(row);
    });

    header.addEventListener("click", () => {
      const open = list.classList.toggle("collapsed");
      header.querySelector(".opts-recruit-chevron").textContent = open ? "▸" : "▾";
    });

    el.appendChild(header);
    el.appendChild(list);
    return el;
  }

  function parseRepairCost(repairBtn) {
    if (!repairBtn) return null;
    const text = repairBtn.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const parts = text.split(" ").filter(Boolean);
    return parts[parts.length - 1] ?? null;
  }

  function extractHireHref(dataTip) {
    const match = dataTip.match(/href='([^']+)'/);
    return match ? match[1] : "";
  }

  function formatDeadline(isoString) {
    const date = new Date(isoString);
    const now  = new Date();
    const diff = date - now;
    if (diff <= 0) return "expired";

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
// Parses "1.9m" to 1900000, "100k" to 100000
function parseCostVal(costStr) {
  if (!costStr) return 0;
  const str = costStr.toLowerCase().replace(/[^0-9.km]/g, '');
  let val = parseFloat(str);
  if (str.includes('m')) val *= 1000000;
  else if (str.includes('k')) val *= 1000;
  return isNaN(val) ? 0 : val;
}

// Formats 1900000 to "1.9m"
function formatCostVal(val) {
  if (val === 0) return '';
  if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + 'm';
  if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
  return val.toString();
}

// Scans all cards, sums the valid repairs, and updates the header button
function updateBulkRepair() {
  const btn = document.querySelector('.btn-fix-selected');
  if (!btn) return;
  
  const cards = document.querySelectorAll('.fac-card');
  let totalCost = 0;
  let validCount = 0;
  
  cards.forEach(card => {
    const cb = card.querySelector('.cb-fix-select');
    const maintainBtn = card.querySelector('.btn-maintain');
    
    // Sum it UP ONLY if it is both checked AND needs fixing
    if (cb && cb.checked && maintainBtn && !maintainBtn.disabled) {
       totalCost += parseCostVal(cb.dataset.cost);
       validCount++;
    }
  });
  console.log(totalCost);
  if (validCount > 0) {
    btn.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = `Fix Selected <span class="maintain-cost">${formatCostVal(totalCost)}</span>`;
  } else {
    btn.classList.add('hidden');
    btn.disabled = true;
  }
}
  async function buildFacilityPanel(facilityNames) {
    const prefs = await new Promise(resolve => {
      chrome.storage.local.get(['igp_hq_prefs'], res => {
        resolve(res.igp_hq_prefs || { order:[], hidden: {}, activeTab: 'condensed-hq-igplus', autoFix: {} });
      });
    });
    if (!prefs.autoFix) prefs.autoFix = {};
    let hqMap = {};
    try {
      const hqJsonEl = document.getElementById('hq-json');
      if (hqJsonEl) {
        const hqData = JSON.parse(hqJsonEl.textContent);
        hqData.forEach(fac => { hqMap[fac.id] = fac; });
      }
    } catch (err) {
      console.error("Failed to parse hq-json", err);
    }

    const panel = document.createElement("div");
    panel.id = 'condensed-hq-igplus';

    const header = document.createElement("div");
    header.className = "hq-panel-header";
    header.innerHTML = `
      <span class="hq-panel-title">HQ Controls</span>
      <div class="hq-panel-actions">
        <button class="btn-fix-selected hidden"></button>
        <button class="btn-panel-settings" title="Toggle visibility">⚙️</button>
      </div>
    `;

    // Attach Bulk Repair execution logic
    header.querySelector('.btn-fix-selected').addEventListener('click', async () => {
      const btn = header.querySelector('.btn-fix-selected');
      btn.disabled = true;
      btn.innerHTML = 'Fixing...';
      
      const cards = document.querySelectorAll('.fac-card');
      for (const card of cards) {
        const cb = card.querySelector('.cb-fix-select');
        const maintainBtn = card.querySelector('.btn-maintain');
        
        // Execute ONLY if user opted-in AND the facility is degraded
        if (cb && cb.checked && maintainBtn && !maintainBtn.disabled) {
          const fId = cb.dataset.fid;
          const name = card.dataset.facName;
          if (fId) {
            await doMaintain(fId, name, card);
          }
        }
      }
    });

    const settingsMenu = document.createElement("div");
    settingsMenu.className = "hq-settings-menu hidden";

    const cardsContainer = document.createElement("div");
    cardsContainer.className = "hq-cards-container";

    panel.appendChild(header);
    panel.appendChild(settingsMenu);
    panel.appendChild(cardsContainer);

    header.querySelector('.btn-panel-settings').addEventListener('click', () => {
      settingsMenu.classList.toggle('hidden');
    });

    // Replace the old cardsContainer drag event listeners with these for settingsMenu
  settingsMenu.addEventListener('dragover', e => {
    e.preventDefault();
    const afterElement = getDragAfterElement(settingsMenu, e.clientY);
    const dragging = document.querySelector('.hq-setting-label.dragging');
    if (dragging) {
      if (afterElement == null) {
        settingsMenu.appendChild(dragging);
      } else {
        settingsMenu.insertBefore(dragging, afterElement);
      }
    }
  });

  settingsMenu.addEventListener('drop', e => {
    e.preventDefault();
    // Save new order to storage when dropped
    const newOrder = [...settingsMenu.querySelectorAll('.hq-setting-label')].map(c => c.dataset.facName);
    prefs.order = newOrder;
    chrome.storage.local.set({ igp_hq_prefs: prefs });

    // Instantly reorder the actual cards in the UI
    newOrder.forEach(name => {
      const card = cardsContainer.querySelector(`.fac-card[data-fac-name="${name}"]`);
      if (card) {
        cardsContainer.appendChild(card); // Appending an existing child moves it to the end
      }
    });
  });

  const sortedNames = [...facilityNames].sort((a, b) => {
    const indexA = prefs.order.indexOf(a);
    const indexB = prefs.order.indexOf(b);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const { fetchBuildingInfo } = await import(chrome.runtime.getURL('common/fetcher.js'));
  
  for (const name of sortedNames) {
    const facilityId = facility_map[name];
    const hqObj = hqMap[String(facilityId)];

    const isHidden = prefs.hidden[name];
    const label = document.createElement("label");
    label.className = "hq-setting-label";
    
    // NEW: Make the label draggable and store the name in the dataset
    label.draggable = true;
    label.dataset.facName = name; 
    
    // NEW: Added a drag handle (☰) icon
    label.innerHTML = `
      <span class="drag-handle">☰</span>
      <input type="checkbox" value="${name}" ${isHidden ? "" : "checked"}> 
      <span class="label-text" style="text-transform: capitalize;">${name}</span>
    `;
    
    // NEW: Drag events for the label
    label.addEventListener('dragstart', () => {
      setTimeout(() => label.classList.add('dragging'), 0);
    });
    label.addEventListener('dragend', () => {
      label.classList.remove('dragging');
    });

    label.querySelector("input").addEventListener("change", (e) => {
      prefs.hidden[name] = !e.target.checked;
      chrome.storage.local.set({ igp_hq_prefs: prefs });
      const card = cardsContainer.querySelector(`.fac-card[data-fac-name="${name}"]`);
      if (card) card.style.display = e.target.checked ? "block" : "none";
    });
    settingsMenu.appendChild(label);

    if (hqObj && hqObj.state === 0) continue; 

    const data = await fetchBuildingInfo(facilityId);
    if (data && data.vars) {
      data.vars.collectBubbleHtml = hqObj ? hqObj.collectBubble : "";
      const isAutoFix = !!prefs.autoFix[name];
      const card = makeFacilityCard(data.vars, name, isAutoFix); 
      
      if (isHidden) card.style.display = 'none';
      cardsContainer.appendChild(card);
    }
  }
    setTimeout(updateBulkRepair, 100);
    return panel;
  }

 function getDragAfterElement(container, y) {
    // Look for setting labels instead of fac-cards
    const draggableElements = [...container.querySelectorAll('.hq-setting-label:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // Parses "1.9m" to 1900000, "100k" to 100000
function parseCostVal(costStr) {
  if (!costStr) return 0;
  const str = costStr.toLowerCase().replace(/[^0-9.km]/g, '');
  let val = parseFloat(str);
  if (str.includes('m')) val *= 1000000;
  else if (str.includes('k')) val *= 1000;
  return isNaN(val) ? 0 : val;
}

// Formats 1900000 to "1.9m"
function formatCostVal(val) {
  if (val === 0) return '';
  if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + 'm';
  if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
  return val.toString();
}

function updateBulkRepair() {
  const btn = document.querySelector('.btn-fix-selected');
  if (!btn) return;
  
  const cards = document.querySelectorAll('.fac-card');
  let totalCost = 0;
  let repairableCount = 0;
  
  cards.forEach(card => {
    const cb = card.querySelector('.cb-fix-select');
    const maintainBtn = card.querySelector('.btn-maintain');
    
    // THE FIX:
    // 1. cb.checked -> Does the user WANT to fix this building automatically?
    // 2. !maintainBtn.disabled -> DOES the building actually need fixing right now?
    // (If the building is at 100%, the game disables this button automatically)
    if (cb && cb.checked && maintainBtn && !maintainBtn.disabled) {
       // Only add cost if it's a valid string (not "null" or empty)
       const costStr = cb.dataset.cost;
       if (costStr && costStr !== 'null') {
         totalCost += parseCostVal(costStr);
         repairableCount++;
       }
    }
  });
  
  // Only show the bulk button if there's at least one building 
  // that is both SELECTED by the user and DEGRADED.
  if (repairableCount > 0) {
    btn.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = `Fix Selected <span class="maintain-cost">${formatCostVal(totalCost)}</span>`;
  } else {
    btn.classList.add('hidden');
    btn.disabled = true;
  }
}

})();