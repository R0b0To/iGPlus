(async () => {
  // Safe DOM Element builder to replace innerHTML assignments
  function el(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined) continue;

      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        for (const [dKey, dVal] of Object.entries(value)) {
          element.dataset[dKey] = dVal;
        }
      } else if (key === 'style') {
        if (typeof value === 'object') {
          Object.assign(element.style, value);
        } else {
          element.style.cssText = value;
        }
      } else if (key === 'htmlFor') {
        element.htmlFor = value;
      } else if (['textContent', 'id', 'type', 'title', 'checked', 'disabled', 'value'].includes(key)) {
        element[key] = value;
      } else {
        element.setAttribute(key, value);
      }
    }

    for (const child of children) {
      if (child === null || child === undefined) continue;
      if (typeof child === 'string' || typeof child === 'number') {
        element.appendChild(document.createTextNode(String(child)));
      } else if (Array.isArray(child)) {
        child.forEach(c => {
          if (c) element.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
        });
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    }
    return element;
  }

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
  const { iconsSVG } = await import(chrome.runtime.getURL('common/config.js'));
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

  // 2. Create the Tab Switcher safely
  const tabSwitcher = el('div', { id: 'hq-tab-switcher' },
    el('button', { className: 'hq-tab-btn', dataset: { target: 'hq-container' }, title: '3D Facility View' },
      el('span', { className: 'tab-icon', textContent: '⊞' })
    ),
    el('button', { className: 'hq-tab-btn', dataset: { target: 'condensed-hq-igplus' }, title: 'Card View' },
      el('span', { className: 'tab-icon', textContent: '≡' })
    )
  );

  // safe append
  if(!document.getElementById('hq-tab-switcher')){
    // 3. Insert Tabs above the 3D map
    parent.insertBefore(tabSwitcher, hqContainer);
  } else return

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
      levelDiv.textContent = `Level: ${vars?.level || ''}`;

      const label = building.nextSibling.querySelector('.building-name-overlay');
      if (label.querySelectorAll('.levelSpan').length == 0)
        label.prepend(levelDiv);
    });
  }

  function extractPart(url) {
    const match = url.match(/hq1-([^_]+)/);
    return match ? match[1] : null;
  }

  function makeFacilityCard(data, rawName, isAutoFix) {
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

    let collectUrl = null;
    let collectContentDesc = "";
    let collectContentNodes = [];

    if (data.collectBubbleHtml) {
      const matchUrl = data.collectBubbleHtml.match(/data-href=['"]([^'"]+)['"]/);
      if (matchUrl) collectUrl = matchUrl[1];
      
      const valMatch = data.collectBubbleHtml.match(
        /<icon(?:\s+[^>]*)?>([^<]+)<\/icon>\s*(\d+)(?:\s*<icon(?:\s+[^>]*)?>([^<]+)<\/icon>\s*(\d+))?/
      );
      const descMatch = data.collectBubbleHtml.match(/>([^<]+)<\/div>/);

      if (valMatch && descMatch) {
        const firstIcon = valMatch[1];
        const firstValue = valMatch[2];
        const secondIcon = valMatch[3];
        const secondValue = valMatch[4];

        const renderIcon = (iconName) => {
          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("class", "inline-block pointer-events-none align-middle h-[26px] w-[26px]");
          const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
          use.setAttributeNS("http://www.w3.org/1999/xlink", "href", `design/icon/symbol-defs.svg#${iconName}`);
          svg.appendChild(use);
          return svg;
        };

        collectContentDesc = descMatch[1].trim();
        collectContentNodes.push(renderIcon(firstIcon), ` ${firstValue} `);
        if (secondIcon) collectContentNodes.push(renderIcon(secondIcon), ` ${secondValue}`);
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
    
    // Build controls safely
    const cbFix = el('input', {
      type: 'checkbox',
      id: `cb-fix-${rawName}`,
      className: 'cb-fix-select',
      title: 'Include in Bulk Fix',
      dataset: { fid: fId || '', cost: repairCost || '' },
      checked: isAutoFix
    });

    cbFix.addEventListener('change', (e) => {
      chrome.storage.local.get(['igp_hq_prefs'], res => {
        const p = res.igp_hq_prefs || { autoFix: {} };
        if (!p.autoFix) p.autoFix = {};
        p.autoFix[rawName] = e.target.checked;
        chrome.storage.local.set({ igp_hq_prefs: p });
      });
      updateBulkRepair();
    });

    const card = el('div', { className: 'fac-card', dataset: { facName: rawName } });

    const facLevelBtn = el('button', {
        className: `fac-level ${canUpgrade ? "can-upgrade" : ""}`,
        disabled: !canUpgrade
      },
      ...(() => {
        if (isConstructing && endTime) return [`Upgrading until ${formatUpgradeTime(endTime)}`];
        if (isConstructing) return [`Upgrading...`];
        const baseTxt = level === "0" ? "Build" : `Lv ${level}`;
        if (canUpgrade && upgradeCost) return [`${baseTxt} `, el('span', { className: 'upgrade-cost', textContent: `↑ ${upgradeCost}` })];
        return [baseTxt];
      })()
    );
facLevelBtn.addEventListener("click", () => {
  const confirmed = confirm("Are you sure you want to upgrade?");

  if (confirmed && canUpgrade && fType) {
    doUpgrade(fType, name, card);
  }
});

    const btnMaintain = el('button', { className: 'btn-maintain', disabled: !canMaintain },
      "Fix",
      repairCost ? el('span', { className: 'maintain-cost', textContent: ` ${repairCost}` }) : null
    );
    btnMaintain.addEventListener("click", () => {
     if (canMaintain && fId) doMaintain(fId, name, card);
    });

    const collectBtn = (collectUrl && collectContentDesc) ? el('button', { className: 'btn-collect' },
      `${collectContentDesc}: `, ...collectContentNodes
    ) : null;
    if (collectBtn) {
      collectBtn.addEventListener("click", () => {
        doCollect(collectUrl, name, card);
      });
    }

    const facHeader = el('div', { className: 'fac-header' },
      el('div', { className: 'fac-title-row' },
        el('div', { className: 'fac-title-left' },
          el('div', { className: 'checkbox-wrapper' },
            cbFix,
            el('label', { htmlFor: `cb-fix-${rawName}` }, el('div', { className: 'tick_mark' }))
          ),
          el('span', { className: 'fac-name', textContent: name })
        ),
        facLevelBtn
      ),
      el('div', { className: 'fac-cond' },
        el('div', { className: 'cond-bar' },
          el('div', { className: `cond-fill ${condClass}`, style: { width: `${condition}%` } })
        ),
        el('span', { className: `cond-pct ${condClass}`, textContent: `${condition}%` }),
        btnMaintain,
        collectBtn
      )
    );

    const optionsContainer = el('div', { className: 'fac-options' });
    if (optionsEl) {
      optionsContainer.appendChild(optionsEl);
    } else if (isConstructing) {
      optionsContainer.appendChild(el('div', { className: 'opts-stat-line', style: { color: '#d4890a' }, textContent: 'Actions unavailable while under construction' }));
    } else if (level === "0") {
      optionsContainer.appendChild(el('div', { className: 'opts-stat-line', style: { color: '#888' }, textContent: 'Facility not built yet' }));
    }

    card.appendChild(facHeader);
    card.appendChild(optionsContainer);
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
          levelBtn.textContent = endEcma ? `Upgrading until ${formatUpgradeTime(endEcma)}` : `Upgrading...`;
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
        btn.textContent = "Collected!";
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
          maintainBtn.textContent = "Fix"; 
          maintainBtn.disabled = true; 
        }

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

    return el('div', { className: 'opts-manufacturing' },
      el('span', { className: 'opts-stat-line', textContent: storage }),
      el('div', { className: 'opts-kv-list' },
        ...stats.map(s => el('div', { className: 'opts-kv' },
          el('span', { className: 'opts-kv-label', textContent: s.label }),
          el('span', { className: 'opts-kv-value', textContent: s.value })
        ))
      )
    );
  }

  function parseOptionsStat(data) {
    const doc  = new DOMParser().parseFromString(data.options, "text/html");
    const text = doc.querySelector(".notice")?.textContent.trim() ?? "";
    if (!text) return null;
    return el('div', { className: 'opts-stat', textContent: text });
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

    const elContainer = el('div', { className: 'opts-tech-list' });
    items.forEach(item => {
      const btn = el('button', {
        className: `btn-tech${item.disabled ? " disabled" : ""}`,
        disabled: item.disabled,
        title: item.tooltip
      },
        el('span', { className: 'tech-name', textContent: item.name }),
        el('span', { className: 'tech-meta', textContent: `Lv ${item.nextLevel} · ${item.cost}` })
      );
      btn.addEventListener("click", () => console.log("tech upgrade", item.href));
      elContainer.appendChild(btn);
    });
    return elContainer;
  }

  function extractSkillIcons(infoCell) {
    const strengthSpan = infoCell.querySelector(".block-green");
    const weaknessSpan = infoCell.querySelector(".block-red");

    const strength = strengthSpan?.querySelector("icon")?.textContent.trim() ?? null;
    const weakness = weaknessSpan?.querySelector("icon")?.textContent.trim() ?? null;

    return { strength, weakness };
  }

  function createSkillLabelSmall(skill, type) {
    if (!skill || !iconsSVG[skill]) return null;

    const span = el('span', { className: `skill-label ${type === 'strength' ? 'strength-label' : 'weakness-label'}` });
    Object.assign(span.style, {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      height: '14px', width: '14px', marginLeft: '4px', borderRadius: '3px', padding: '2px',
      backgroundColor: type === 'strength' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
      flexShrink: 0
    });

    // Safely parse SVG string
    const parser = new DOMParser();
    const doc = parser.parseFromString(iconsSVG[skill], 'image/svg+xml');
    const innerSvg = doc.documentElement;
    
    if (innerSvg && innerSvg.tagName.toLowerCase() === 'svg') {
      innerSvg.style.width = '14px';
      innerSvg.style.height = '14px';
      innerSvg.style.display = 'inline-flex';
      
      const firstChild = innerSvg.firstElementChild;
      if (firstChild) {
        firstChild.style.fill = type === 'strength' ? '#4caf50' : '#f44336';
      }
      span.appendChild(innerSvg);
    }
    return span;
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
        const statsMatch = nameRaw.match(/(?<age>\d+)yrs\s+(?<height>(?:[\d.]+(?:cm|m))|(?:\d+ft\s*\d+in))\s+(?<weight>\d+)(?<weightUnit>kg|lbs)/i);
        const age = statsMatch ? statsMatch.groups.age : null;
        const height = statsMatch ? `${statsMatch.groups.height}` : null;
        const weight = statsMatch ? `${statsMatch.groups.weight}${statsMatch.groups.weightUnit}` : null;

        const talentCell = row.querySelector("td:nth-child(2)");
        const talent = talentCell?.textContent.replace(/\s+/g, " ").trim() ?? "";

        return { kind: "driver", name, talent, age, height, weight, cash, tokens, hireHref };
      } else {
        const role = infoCell.querySelector("span.block-grey")?.textContent.trim() ?? "";
        const rawText = infoCell.textContent.replace(/\s+/g, " ").trim();
        const talentMatch = rawText.match(/\((\d+%)\)/);
        const talent = talentMatch ? talentMatch[1] : "";
        const nameMatch = rawText.replace(role, "").trim().match(/^([A-Z]\s[\w]+)/);
        const name = nameMatch ? nameMatch[1] : rawText.split("(")[0].replace(role, "").trim();
        const { strength, weakness } = extractSkillIcons(infoCell);
        return { kind: "staff", role, name, talent, cash, tokens, hireHref, strength, weakness };
      }
    }).filter(Boolean);

    const elContainer = el('div', { className: 'opts-recruits' });

    const header = el('button', { className: 'opts-recruit-toggle' },
      el('span', {}, "Deadline: ", el('span', { className: 'opts-deadline-time', textContent: deadlineStr })),
      el('span', { className: 'opts-recruit-chevron', textContent: '▸' })
    );

    const list = el('div', { className: 'opts-recruit-list collapsed' });

    recruits.forEach(r => {
      const row = el('div', { className: 'recruit-row' });

      if (r.kind === "driver") {
        row.appendChild(el('span', { className: 'recruit-name' },
          r.name, document.createElement('br'),
          el('span', { className: 'recruit-stats', textContent: `${r.age}yrs • ${r.height} • ${r.weight}` })
        ));
      } else {
        const nameSpan = el('span', { className: 'recruit-name' },
          el('span', { className: 'recruit-role', textContent: r.role }),
          ` ${r.name}`
        );
        if (r.strength) {
          const strengthLabel = createSkillLabelSmall(r.strength, 'strength');
          if (strengthLabel) nameSpan.appendChild(strengthLabel);
        }
        if (r.weakness) {
          const weaknessLabel = createSkillLabelSmall(r.weakness, 'weakness');
          if (weaknessLabel) nameSpan.appendChild(weaknessLabel);
        }
        row.appendChild(nameSpan);
      }

      row.appendChild(el('span', { className: 'recruit-talent', textContent: r.talent }));

      const btnHire = el('button', { className: 'btn-hire' });
      if (r.cash) btnHire.appendChild(el('span', { textContent: r.cash }));
      if (r.tokens) btnHire.appendChild(el('span', { className: 'hire-tokens', textContent: `🪙${r.tokens}` }));
      
      btnHire.addEventListener("click", e => {
        e.stopPropagation();
        console.log("hire", r.name, r.hireHref);
      });
      row.appendChild(btnHire);

      list.appendChild(row);
    });

    header.addEventListener("click", () => {
      const open = list.classList.toggle("collapsed");
      header.querySelector(".opts-recruit-chevron").textContent = open ? "▸" : "▾";
    });

    elContainer.appendChild(header);
    elContainer.appendChild(list);
    return elContainer;
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

  function updateBulkRepair() {
    const btn = document.querySelector('.btn-fix-selected');
    if (!btn) return;
    
    const cards = document.querySelectorAll('.fac-card');
    let totalCost = 0;
    let repairableCount = 0;
    
    cards.forEach(card => {
      const cb = card.querySelector('.cb-fix-select');
      const maintainBtn = card.querySelector('.btn-maintain');
      
      if (cb && cb.checked && maintainBtn && !maintainBtn.disabled) {
         const costStr = cb.dataset.cost;
         if (costStr && costStr !== 'null') {
           totalCost += parseCostVal(costStr);
           repairableCount++;
         }
      }
    });
    
    if (repairableCount > 0) {
      btn.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = "Fix Selected ";
      btn.appendChild(el('span', { className: 'maintain-cost', textContent: formatCostVal(totalCost) }));
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

    const panel = el('div', { id: 'condensed-hq-igplus' });

    const header = el('div', { className: 'hq-panel-header' },
      el('span', { className: 'hq-panel-title', textContent: 'HQ Controls' }),
      el('div', { className: 'hq-panel-actions' },
        el('button', { className: 'btn-fix-selected hidden' }),
        el('button', { className: 'btn-panel-settings', title: 'Toggle visibility', textContent: '⚙️' })
      )
    );

    // Attach Bulk Repair execution logic
    header.querySelector('.btn-fix-selected').addEventListener('click', async () => {
      const btn = header.querySelector('.btn-fix-selected');
      btn.disabled = true;
      btn.textContent = 'Fixing...';
      
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

    const settingsMenu = el('div', { className: 'hq-settings-menu hidden' });
    const cardsContainer = el('div', { className: 'hq-cards-container' });

    panel.appendChild(header);
    panel.appendChild(settingsMenu);
    panel.appendChild(cardsContainer);

    header.querySelector('.btn-panel-settings').addEventListener('click', () => {
      settingsMenu.classList.toggle('hidden');
    });

    let draggedLabel = null;
    let draggedItem = null;

    document.addEventListener('pointermove', (e) => {
      if (!draggedItem) return;
      e.preventDefault();

      const elementFound = document.elementFromPoint(e.clientX, e.clientY);
      const target = elementFound?.closest?.('.hq-setting-item');

      [...settingsMenu.querySelectorAll('.hq-setting-item')].forEach(item => {
        if (item === target && item !== draggedItem) {
          const rect = item.getBoundingClientRect();
          const isLowerHalf = e.clientY > rect.top + rect.height / 2;
          item.classList.add('is-dragover');
          item.classList.toggle('is-dragover-top', !isLowerHalf);
          item.classList.toggle('is-dragover-bottom', isLowerHalf);
        } else {
          item.classList.remove('is-dragover', 'is-dragover-top', 'is-dragover-bottom');
        }
      });
    });

    document.addEventListener('pointerup', (e) => {
      if (!draggedItem) return;
      e.preventDefault();

      // Release the pointer capture
      if (draggedLabel && e.pointerId) {
        try { draggedLabel.releasePointerCapture(e.pointerId); } catch(err) {}
      }

      const elementFound = document.elementFromPoint(e.clientX, e.clientY);
      const target = elementFound?.closest?.('.hq-setting-item');

      draggedItem.classList.remove('is-dragging');
      [...settingsMenu.querySelectorAll('.hq-setting-item')].forEach(item => {
        item.classList.remove('is-dragover', 'is-dragover-top', 'is-dragover-bottom');
      });

      if (target && target !== draggedItem && target.parentElement === settingsMenu) {
        const rect = target.getBoundingClientRect();
        const isLowerHalf = e.clientY > rect.top + rect.height / 2;
        const insertRef = isLowerHalf ? target.nextElementSibling : target;

        if (insertRef) {
          settingsMenu.insertBefore(draggedItem, insertRef);
        } else {
          settingsMenu.appendChild(draggedItem);
        }

        const newOrder = [...settingsMenu.querySelectorAll('.hq-setting-item')].map(c => c.dataset.facName);
        prefs.order = newOrder;
        chrome.storage.local.set({ igp_hq_prefs: prefs });

        newOrder.forEach(name => {
          const card = cardsContainer.querySelector(`.fac-card[data-fac-name="${name}"]`);
          if (card) cardsContainer.appendChild(card);
        });
      }

      draggedLabel = null;
      draggedItem = null;
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

      const label = el('label', { className: 'hq-setting-label', dataset: { facName: name },style: { touchAction: 'none', userSelect: 'none' } },
        el('span', { className: 'drag-handle', textContent: '☰' }),
        el('span', { className: 'label-text', style: { textTransform: 'capitalize' }, textContent: name })
      );

      const visibilityBtn = el('button', {
        className: 'btn-visibility',
        type: 'button',
        title: 'Toggle visibility',
        textContent: isHidden ? '🚫' : '👁️'
      });

      const itemContainer = el('div', { className: 'hq-setting-item', dataset: { facName: name } }, label, visibilityBtn);

      label.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (e.pointerId) {
          label.setPointerCapture(e.pointerId);
        }
        draggedLabel = label;
        draggedItem = itemContainer;
        itemContainer.classList.add('is-dragging');
      });

      visibilityBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isNowHidden = !prefs.hidden[name];
        prefs.hidden[name] = isNowHidden;
        chrome.storage.local.set({ igp_hq_prefs: prefs });
        const card = cardsContainer.querySelector(`.fac-card[data-fac-name="${name}"]`);
        if (card) card.style.display = isNowHidden ? "none" : "block";
        visibilityBtn.textContent = isNowHidden ? '🚫' : '👁️';
      });

      label.querySelector("input")?.addEventListener("change", (e) => {
        prefs.hidden[name] = !e.target.checked;
        chrome.storage.local.set({ igp_hq_prefs: prefs });
        const card = cardsContainer.querySelector(`.fac-card[data-fac-name="${name}"]`);
        if (card) card.style.display = e.target.checked ? "block" : "none";
      });
      settingsMenu.appendChild(itemContainer);

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
})();