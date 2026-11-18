// Equestre Tour - Application Logic
const operators = [
  { id: "op-admin", name: "Amministratore", role: "Amministratore", canBulk: true, password: "0000" },
  { id: "op-anna", name: "Anna Rossi", role: "Operatore", canBulk: true, password: "0000" },
  { id: "op-luca", name: "Luca Bianchi", role: "Operatore", canBulk: false, password: "0000" }
];

let activeOperator = operators[0];
let selectedId = null;
let currentFilter = "all";
let selectedRequests = new Set();

let requests = [
  {
    id: "REQ-1001",
    cliente: "Giulia Martini",
    email: "giulia.martini@example.com",
    telefono: "+39 333 111 2222",
    destinazione: "Grecia",
    periodo: "Agosto 2026",
    porto: "Venezia",
    cabina: "Esterna",
    adulti: "2",
    bambini: "1",
    etaBambini: "8",
    budget: "4500",
    note: "Preferenza nave con piscina",
    fonte: "Instagram Direct",
    status: "Completa",
    assignedTo: "op-anna",
    lockedBy: null,
    sent: false
  },
  {
    id: "REQ-1002",
    cliente: "Marco Verdi",
    email: "marco.verdi@example.com",
    telefono: "+39 340 999 8877",
    destinazione: "Fiordi Norvegesi",
    periodo: "",
    porto: "Amburgo",
    cabina: "Balcone",
    adulti: "2",
    bambini: "0",
    etaBambini: "",
    budget: "",
    note: "Manca periodo partenza",
    fonte: "CRM Facebook Lead Ads",
    status: "Dati mancanti",
    assignedTo: "op-luca",
    lockedBy: null,
    sent: false
  },
  {
    id: "REQ-1003",
    cliente: "Sara Costa",
    email: "sara.costa@example.com",
    telefono: "+39 347 222 9090",
    destinazione: "Mediterraneo Occidentale",
    periodo: "Settembre 2026",
    porto: "Genova",
    cabina: "Interna",
    adulti: "2",
    bambini: "0",
    etaBambini: "",
    budget: "2600",
    note: "Richiede alternative economiche",
    fonte: "WhatsApp Business",
    status: "Preventivo pronto",
    assignedTo: "op-admin",
    lockedBy: null,
    sent: false
  }
];

let sendLog = [];
let contactArchive = [];

let externalSources = [
  {
    id: "src-fb-lead",
    name: "Campagna Facebook Lead Ads (Crociere 2026)",
    type: "Facebook Lead Ads",
    url: "https://docs.google.com/spreadsheets/d/1DaPQRuq1zW0JDQa9bzBSKFISBWVwZHP65Qa5cR16YMY/edit?usp=sharing",
    lastSync: "25/08/2026, 14:15",
    totalImported: 14,
    status: "Attivo"
  },
  {
    id: "src-ig-form",
    name: "Modulo Richieste Instagram & TikTok",
    type: "Instagram",
    url: "https://docs.google.com/spreadsheets/d/1BhkM2Zv2orXXy398jHdkF9NSe6yeIZASrEx2kn6QIIw/edit?gid=1465858166#gid=1465858166",
    lastSync: "25/08/2026, 13:40",
    totalImported: 8,
    status: "Attivo"
  },
  {
    id: "src-wa-leads",
    name: "Campagna WhatsApp Chat & Landing",
    type: "WhatsApp",
    url: "",
    lastSync: "Mai",
    totalImported: 0,
    status: "In attesa di link"
  }
];

const equestreTourInventory = [
  { ship: "Costa Smeralda", route: "Mediterraneo Occidentale", port: "Genova", date: "2026-09-12", nights: 7, cabin: "Interna", fare: "Promo Equestre", price: 2380, score: 92, link: "https://www.equestretour.example/offerte/costa-smeralda-2026-09-12", availability: true },
  { ship: "MSC Fantasia", route: "Mediterraneo Occidentale", port: "Genova", date: "2026-09-19", nights: 7, cabin: "Esterna", fare: "Classic", price: 2690, score: 88, link: "https://www.equestretour.example/offerte/msc-fantasia-2026-09-19", availability: true },
  { ship: "Costa Deliziosa", route: "Grecia", port: "Venezia", date: "2026-08-09", nights: 8, cabin: "Esterna", fare: "Famiglia", price: 4190, score: 91, link: "https://www.equestretour.example/offerte/costa-deliziosa-2026-08-09", availability: true },
  { ship: "MSC Armonia", route: "Grecia", port: "Venezia", date: "2026-08-16", nights: 7, cabin: "Balcone", fare: "Best Price", price: 4720, score: 86, link: "https://www.equestretour.example/offerte/msc-armonia-2026-08-16", availability: true },
  { ship: "MSC Euribia", route: "Fiordi Norvegesi", port: "Amburgo", date: "2026-07-25", nights: 7, cabin: "Balcone", fare: "Fantastica", price: 3850, score: 94, link: "https://www.equestretour.example/offerte/msc-euribia-2026-07-25", availability: true },
  { ship: "Costa Favolosa", route: "Fiordi Norvegesi", port: "Amburgo", date: "2026-08-08", nights: 9, cabin: "Esterna", fare: "Classic", price: 3620, score: 87, link: "https://www.equestretour.example/offerte/costa-favolosa-2026-08-08", availability: true }
];

const el = (id) => document.getElementById(id);

function init() {
  try {
    restoreSources();
    restoreSyncedRequests();
    fillOperators();
    bindEvents();
    recalculateStatuses();
    renderAll();
    
    // Ascolto sincronizzazione real-time dal Funnel di Vendita EquestreTour
    window.addEventListener("storage", (e) => {
      if (e.key === "equestre_synced_requests") {
        restoreSyncedRequests();
        recalculateStatuses();
        renderAll();
      }
    });
  } catch (err) {
    console.error("Errore inizializzazione:", err);
  }
}

function restoreSyncedRequests() {
  const saved = localStorage.getItem("equestre_synced_requests");
  if (saved) {
    try {
      const extra = JSON.parse(saved);
      if (Array.isArray(extra) && extra.length > 0) {
        const existingIds = new Set(requests.map(r => r.id));
        extra.forEach(item => {
          if (!existingIds.has(item.id)) {
            requests.unshift(item);
          }
        });
      }
    } catch (e) {
      console.error("Errore lettura lead sincronizzati:", e);
    }
  }
}

function restoreSources() {
  const saved = localStorage.getItem("externalSources");
  if (saved) {
    try { externalSources = JSON.parse(saved); } catch (e) { localStorage.removeItem("externalSources"); }
  }
}

function saveSources() {
  localStorage.setItem("externalSources", JSON.stringify(externalSources));
}

function fillOperators() {
  const options = operators.map(op => `<option value="${op.id}">${op.name} (${op.role})</option>`).join("");
  if (el("operatorSelect")) el("operatorSelect").innerHTML = options;
  if (el("loginOperator")) el("loginOperator").innerHTML = options;
  if (el("roleHint")) el("roleHint").textContent = `${activeOperator.role} - invio massivo ${activeOperator.canBulk ? "abilitato" : "disabilitato"}`;
}

function bindEvents() {
  el("loginForm")?.addEventListener("submit", handleLogin);
  el("operatorSelect")?.addEventListener("change", (event) => {
    activeOperator = operators.find(op => op.id === event.target.value) || operators[0];
    if (el("roleHint")) el("roleHint").textContent = `${activeOperator.role} - invio massivo ${activeOperator.canBulk ? "abilitato" : "disabilitato"}`;
    renderAll();
  });

  document.querySelectorAll(".chip").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach(chip => chip.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.filter || "all";
      renderRequests();
    });
  });

  el("fileInput")?.addEventListener("change", handleFile);
  el("exportUnifiedCsv")?.addEventListener("click", exportUnifiedDatabase);
  el("downloadTemplate")?.addEventListener("click", downloadTemplate);
  el("openManual")?.addEventListener("click", () => el("manualDialog")?.showModal());
  el("closeManual")?.addEventListener("click", () => el("manualDialog")?.close());
  el("cancelManual")?.addEventListener("click", () => el("manualDialog")?.close());
  el("manualForm")?.addEventListener("submit", handleManualSubmit);
  el("runBotNow")?.addEventListener("click", runBot);
  el("deleteSelected")?.addEventListener("click", deleteSelectedRequests);
  el("deleteVisible")?.addEventListener("click", deleteVisibleRequests);
  el("selectAllRequests")?.addEventListener("change", toggleVisibleSelection);
  el("minAlt")?.addEventListener("change", renderAlternatives);
  el("maxAlt")?.addEventListener("change", renderAlternatives);
  el("sortMode")?.addEventListener("change", renderAlternatives);
  el("crmSearch")?.addEventListener("input", renderCrm);
  
  el("openAddSourceModal")?.addEventListener("click", () => openSourceModal());
  el("closeSourceModal")?.addEventListener("click", () => el("sourceModal")?.close());
  el("cancelSourceModal")?.addEventListener("click", () => el("sourceModal")?.close());
  el("sourceModalForm")?.addEventListener("submit", handleSaveSourceSubmit);
  el("syncAllSources")?.addEventListener("click", syncAllSources);
}

function handleLogin(event) {
  if (event) event.preventDefault();
  const opSelect = el("loginOperator");
  const passInput = el("loginPassword");
  const errorP = el("loginError");
  
  const selectedOpId = opSelect ? opSelect.value : operators[0].id;
  const operator = operators.find(op => op.id === selectedOpId) || operators[0];
  const enteredPass = passInput ? passInput.value.trim() : "";
  
  if (enteredPass !== operator.password) {
    if (errorP) errorP.textContent = "Password errata! (Password predefinita: 0000)";
    return;
  }
  
  activeOperator = operator;
  if (el("operatorSelect")) el("operatorSelect").value = operator.id;
  if (el("roleHint")) el("roleHint").textContent = `${activeOperator.role} - invio massivo ${activeOperator.canBulk ? "abilitato" : "disabilitato"}`;
  if (passInput) passInput.value = "";
  if (errorP) errorP.textContent = "";
  
  const screen = el("loginScreen");
  if (screen) screen.classList.add("hidden");
  renderAll();
}

function recalculateStatuses() {
  requests = requests.map(req => {
    if (req.sent) return req;
    const missing = missingFields(req);
    if (missing.length) return { ...req, status: "Dati mancanti" };
    if (req.status === "Nuova" || req.status === "Dati mancanti") return { ...req, status: "Completa" };
    return req;
  });
}

function renderAll() {
  renderMetrics();
  renderSourcesTable();
  renderRequests();
  renderSendLog();
  renderAlternatives();
  renderCrm();
}

function renderMetrics() {
  if (el("mTotal")) el("mTotal").textContent = requests.length;
  if (el("mIncomplete")) el("mIncomplete").textContent = requests.filter(r => r.status === "Dati mancanti").length;
  if (el("mComplete")) el("mComplete").textContent = requests.filter(r => ["Completa", "Preventivo pronto", "In lavorazione"].includes(r.status)).length;
  if (el("mReview")) el("mReview").textContent = requests.filter(r => r.status === "Da controllare" || r.status === "Errore").length;
  if (el("mSent")) el("mSent").textContent = requests.filter(r => r.status === "Inviato").length;
}

function renderSourcesTable() {
  const tbody = el("sourceTableRows");
  if (!tbody) return;

  tbody.innerHTML = externalSources.map(s => `
    <tr>
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td><span class="status s-work">${escapeHtml(s.type)}</span></td>
      <td>
        ${s.url ? `<a href="${s.url}" target="_blank" style="color:var(--primary); font-size:12px; word-break:break-all;">${escapeHtml(s.url.slice(0, 45))}... ↗</a>` : '<em style="color:var(--text-muted)">Nessun link configurato</em>'}
      </td>
      <td><strong style="color:var(--primary); font-size:14px;">${s.totalImported || 0}</strong> richieste</td>
      <td><small style="color:var(--text-muted); font-weight:600;">🕒 ${escapeHtml(s.lastSync || "Mai")}</small></td>
      <td><span class="status ${s.url ? 's-complete' : 's-missing'}">${escapeHtml(s.status)}</span></td>
      <td>
        <button class="primary" data-sync-source="${s.id}" style="padding: 5px 10px; font-size: 12px;">⬇ Scarica & Importa</button>
        <button class="ghost" data-edit-source="${s.id}" style="padding: 5px 8px; font-size: 12px;">Modifica</button>
        <button class="danger" data-delete-source="${s.id}" style="padding: 5px 8px; font-size: 12px;">Elimina</button>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-sync-source]").forEach(btn => {
    btn.addEventListener("click", () => syncSingleSource(btn.dataset.syncSource));
  });
  document.querySelectorAll("[data-edit-source]").forEach(btn => {
    btn.addEventListener("click", () => openSourceModal(btn.dataset.editSource));
  });
  document.querySelectorAll("[data-delete-source]").forEach(btn => {
    btn.addEventListener("click", () => deleteSource(btn.dataset.deleteSource));
  });
}

function openSourceModal(editId = null) {
  const modal = el("sourceModal");
  if (!modal) return;
  
  if (editId) {
    const s = externalSources.find(item => item.id === editId);
    if (s) {
      el("editSourceId").value = s.id;
      el("modalTitle").textContent = "✏️ Modifica Link e Campagna";
      el("newSourceName").value = s.name;
      el("newSourceType").value = s.type;
      el("newSourceUrl").value = s.url || "";
      el("saveSourceBtn").textContent = "Aggiorna Link";
    }
  } else {
    el("editSourceId").value = "";
    el("modalTitle").textContent = "🔗 Aggiungi Nuovo Link Campagna";
    el("newSourceName").value = "";
    el("newSourceType").value = "Facebook Lead Ads";
    el("newSourceUrl").value = "";
    el("saveSourceBtn").textContent = "Salva Link e Fonte";
  }
  
  modal.showModal();
}

function handleSaveSourceSubmit(event) {
  event.preventDefault();
  const editId = el("editSourceId")?.value;
  const name = el("newSourceName")?.value.trim();
  const type = el("newSourceType")?.value || "Altro";
  const url = el("newSourceUrl")?.value.trim();

  if (!name || !url) {
    alert("Compila sia il nome che il link della campagna.");
    return;
  }

  if (editId) {
    const s = externalSources.find(item => item.id === editId);
    if (s) {
      s.name = name;
      s.type = type;
      s.url = url;
      s.status = "Attivo";
    }
    alert(`✅ Campagna '${name}' aggiornata!`);
  } else {
    const newSource = {
      id: `src-${Date.now()}`,
      name,
      type,
      url,
      lastSync: "Non ancora scaricato",
      totalImported: 0,
      status: "Attivo"
    };
    externalSources.push(newSource);
    alert(`✅ Campagna '${name}' aggiunta con successo alla piattaforma! Ora puoi cliccare su 'Scarica & Importa'.`);
  }

  saveSources();
  renderSourcesTable();
  el("sourceModal")?.close();
}

function deleteSource(id) {
  const source = externalSources.find(s => s.id === id);
  if (!source) return;
  if (!confirm(`Vuoi rimuovere '${source.name}' dalla piattaforma?`)) return;
  externalSources = externalSources.filter(s => s.id !== id);
  saveSources();
  renderSourcesTable();
}

async function syncSingleSource(id) {
  const source = externalSources.find(s => s.id === id);
  if (!source || !source.url) {
    alert("Questa fonte non ha ancora un link configurato. Clicca su 'Modifica' per inserirlo.");
    return;
  }

  try {
    const text = await fetchGoogleSheetCsv(source.url);
    const rows = parseCsv(text);
    const imported = rows.map(r => normalizeRow(r, source.name)).filter(row => row.cliente || row.email || row.telefono || row.note);
    
    requests = requests.concat(imported);
    source.totalImported = (source.totalImported || 0) + imported.length;
    source.lastSync = new Date().toLocaleString("it-IT");
    source.status = "Sincronizzato";
    saveSources();
    recalculateStatuses();
    renderAll();
    
    // Scroll immediato verso l'elenco richieste per visualizzarle
    el("richieste")?.scrollIntoView({ behavior: "smooth" });
    
    alert(`🎉 Scarico & Importazione completati per '${source.name}'!\n\nImportate: ${imported.length} nuove richieste direttamente nel gestionale!\nTotale storico tracciato: ${source.totalImported}`);
  } catch (error) {
    alert(`Non è stato possibile scaricare direttamente dal link.\n\nAssicurati che il foglio Google sia impostato su 'Chiunque abbia il link può visualizzare'.\nIn alternativa puoi scaricare il file CSV e caricarlo dalla sezione sottostante.\n\nDettaglio: ${error.message}`);
  }
}

async function syncAllSources() {
  const activeSources = externalSources.filter(s => s.url);
  if (!activeSources.length) {
    alert("Nessun link configurato.");
    return;
  }
  let total = 0;
  for (const source of activeSources) {
    try {
      const text = await fetchGoogleSheetCsv(source.url);
      const rows = parseCsv(text);
      const imported = rows.map(r => normalizeRow(r, source.name)).filter(row => row.cliente || row.email || row.telefono || row.note);
      requests = requests.concat(imported);
      source.totalImported = (source.totalImported || 0) + imported.length;
      source.lastSync = new Date().toLocaleString("it-IT");
      total += imported.length;
    } catch (e) {
      console.warn("Errore sync fonte", source.name, e);
    }
  }
  saveSources();
  recalculateStatuses();
  renderAll();
  
  el("richieste")?.scrollIntoView({ behavior: "smooth" });
  alert(`⚡ Sincronizzazione globale completata!\n\nTotale nuove richieste scaricate e importate: ${total}`);
}

function googleSheetCsvUrl(url) {
  if (/output=csv|tqx=out:csv/.test(url)) return url;
  const idMatch = url.match(/\/spreadsheets\/d\/([^\/]+)/);
  if (!idMatch) return url;
  const id = idMatch[1];
  const gidMatch = url.match(/[?#&]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&id=${id}&gid=${gid}`;
}

async function fetchGoogleSheetCsv(url) {
  const csvUrl = googleSheetCsvUrl(url);
  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  if (/<!doctype html|<html/i.test(text)) throw new Error("Il link richiede accesso con login a Google (impostare su 'Chiunque abbia il link')");
  return text;
}

function renderRequests() {
  const rows = requests.filter(canSeeRequest).filter(req => currentFilter === "all" || req.status === currentFilter);
  const tbody = el("requestRows");
  if (!tbody) return;

  tbody.innerHTML = rows.map(req => `
    <tr>
      <td><input type="checkbox" data-select-request="${req.id}" ${selectedRequests.has(req.id) ? "checked" : ""} aria-label="Seleziona richiesta ${escapeHtml(req.id)}"></td>
      <td><strong>${escapeHtml(req.cliente || "Cliente senza nome")}</strong><br><small style="color:var(--text-muted)">${req.id} ${req.fonte ? `• ${escapeHtml(req.fonte)}` : ""}</small></td>
      <td>${escapeHtml(req.email || "Email mancante")}<br><small style="color:var(--text-muted)">${escapeHtml(req.telefono || "Telefono mancante")}</small></td>
      <td>${escapeHtml(displayRequest(req))}</td>
      <td><span class="status ${statusClass(req.status)}">${req.lockedBy ? `In lavorazione (${operatorName(req.lockedBy)})` : req.status}</span></td>
      <td>${operatorName(req.assignedTo)}</td>
      <td>
        <button class="ghost" data-open="${req.id}" style="padding: 4px 8px; font-size: 12px;">Apri</button>
        <button class="danger" data-delete-request="${req.id}" style="padding: 4px 8px; font-size: 12px;">Elimina</button>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-open]").forEach(button => {
    button.addEventListener("click", () => openRequest(button.dataset.open));
  });
  document.querySelectorAll("[data-select-request]").forEach(box => {
    box.addEventListener("change", () => {
      if (box.checked) selectedRequests.add(box.dataset.selectRequest);
      else selectedRequests.delete(box.dataset.selectRequest);
      syncSelectAll(rows);
    });
  });
  document.querySelectorAll("[data-delete-request]").forEach(button => {
    button.addEventListener("click", () => deleteRequest(button.dataset.deleteRequest));
  });
  syncSelectAll(rows);

  if (selectedId) renderDetail();
}

function renderDetail() {
  const req = requests.find(item => item.id === selectedId);
  const detail = el("requestDetail");
  if (!req || !detail) return;
  const missing = missingFields(req);
  const present = presentFields(req);
  const readyMessage = missing.length ? missingMessage(req, missing) : quoteMessage(req);
  const previous = previousRequests(req);

  const presentHtml = present.length
    ? present.map(f => `<span class="tag-badge tag-present">✓ ${escapeHtml(labelFor(f))}</span>`).join(" ")
    : "Nessun dato obbligatorio completo";

  const missingHtml = missing.length
    ? missing.map(f => `<span class="tag-badge tag-missing">✕ ${escapeHtml(labelFor(f))}</span>`).join(" ")
    : `<span class="tag-badge tag-present">✓ Tutti i dati sono presenti!</span>`;

  detail.innerHTML = `
    <h3>${escapeHtml(req.cliente)} ${req.fonte ? `<small style="font-size:12px; color:var(--text-muted); font-weight:normal;">(${escapeHtml(req.fonte)})</small>` : ""}</h3>
    <dl>
      <dt>Riepilogo</dt><dd>${escapeHtml(summary(req))}</dd>
      <dt>Dati presenti</dt><dd>${presentHtml}</dd>
      <dt>Dati mancanti</dt><dd>${missingHtml}</dd>
      <dt>Stato attuale</dt><dd><span class="status ${statusClass(req.status)}">${escapeHtml(req.status)}</span></dd>
    </dl>
    <h3>Richieste precedenti cliente</h3>
    ${previous.length ? `
      <ul class="history-list">
        ${previous.map(item => `<li><strong>${escapeHtml(item.id)}</strong> - ${escapeHtml(item.status)}<br>${escapeHtml(summary(item))}</li>`).join("")}
      </ul>
    ` : `<p class="empty" style="padding:6px 0;">Nessun record precedente per questo contatto.</p>`}
    <h3>Messaggio WhatsApp / E-mail pronto</h3>
    <textarea class="message-editor" id="editableMessage">${escapeHtml(readyMessage)}</textarea>
    <div class="detail-actions">
      <button class="primary" id="openWhatsApp">💬 Invia WhatsApp</button>
      <button class="ghost" id="singleSend">✉️ Invia Email</button>
      <button class="ghost" id="unlockRequest">Chiudi scheda</button>
    </div>
  `;
  el("openWhatsApp")?.addEventListener("click", () => openWhatsApp(req.id));
  el("singleSend")?.addEventListener("click", () => sendOne(req.id, "Email singola"));
  el("unlockRequest")?.addEventListener("click", () => {
    updateRequest(req.id, { lockedBy: null, status: missing.length ? "Dati mancanti" : "Completa" });
  });
}

function openRequest(id) {
  const req = requests.find(item => item.id === id);
  if (!req) return;
  if (req.lockedBy && req.lockedBy !== activeOperator.id) {
    alert(`Richiesta già in lavorazione da ${operatorName(req.lockedBy)}.`);
    return;
  }
  selectedId = id;
  updateRequest(id, { lockedBy: activeOperator.id, status: "In lavorazione" });
}

function renderAlternatives() {
  const altList = el("alternativesList");
  if (!altList) return;
  const req = requests.find(item => item.id === selectedId);
  if (!req || missingFields(req).length) {
    altList.innerHTML = `<p class="empty">Apri una richiesta completa per generare le alternative compatibili.</p>`;
    return;
  }

  const min = clamp(Number(el("minAlt")?.value || 1), 1, 6);
  const max = clamp(Number(el("maxAlt")?.value || 6), min, 6);
  const alternatives = findAlternatives(req, max);

  altList.innerHTML = alternatives.map((alt, index) => `
    <article class="alternative-card">
      <h3>Proposta ${index + 1}</h3>
      <p><strong>${escapeHtml(alt.ship)}</strong> — ${escapeHtml(alt.route)}</p>
      <dl>
        <dt>Porto</dt><dd>${escapeHtml(alt.port)}</dd>
        <dt>Data</dt><dd>${escapeHtml(alt.date)}</dd>
        <dt>Durata</dt><dd>${alt.nights} notti</dd>
        <dt>Cabina</dt><dd>${escapeHtml(alt.cabin)}</dd>
        <dt>Tariffa</dt><dd>${escapeHtml(alt.fare)}</dd>
      </dl>
      <strong>€ ${formatMoney(alt.price)}</strong>
      <a href="${alt.link}" target="_blank" rel="noreferrer">Scheda offerta Equestre Tour ↗</a>
    </article>
  `).join("");
}

function runBot() {
  const botStatus = el("botStatus");
  if (botStatus) botStatus.textContent = "In esecuzione...";

  let completeCount = 0;
  let missingCount = 0;

  requests.forEach(req => {
    if (req.sent) return;
    const missing = missingFields(req);
    if (missing.length === 0) {
      sendOne(req.id, "Robotino Automatico (Preventivo)");
      completeCount++;
    } else {
      const phone = whatsappPhone(req.telefono);
      const recipient = phone || req.email;
      if (recipient) {
        sendLog.unshift(logEntry(req, "Robotino (Richiesta Dati)", `Inviata richiesta: ${missing.join(', ')}`, null));
        missingCount++;
      }
    }
  });

  if (botStatus) botStatus.textContent = "Completato!";
  renderAll();
  alert(`🤖 Robotino completato!\n\n✅ Preventivi inviati a richieste complete: ${completeCount}\n⚠️ Messaggi di richiesta dati mancanti inviati: ${missingCount}`);
}

function exportUnifiedDatabase() {
  if (!requests.length) {
    alert("Nessuna richiesta da esportare.");
    return;
  }

  const headers = [
    "ID", "Fonte", "Cliente", "Telefono", "Email", "Destinazione", "Periodo", "Porto",
    "Cabina", "Adulti", "Minori", "Eta_Minori", "Budget", "Note", "Stato", "Dati_Mancanti", "Messaggio_Pronto"
  ];

  const rows = requests.map(r => {
    const missing = missingFields(r).map(labelFor).join(" - ");
    const msg = (missingFields(r).length ? missingMessage(r, missingFields(r)) : quoteMessage(r)).replace(/\r?\n/g, " ");
    return [
      r.id,
      r.fonte || "Manuale",
      `"${(r.cliente || '').replace(/"/g, '""')}"`,
      `"${(r.telefono || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${(r.destinazione || '').replace(/"/g, '""')}"`,
      `"${(r.periodo || '').replace(/"/g, '""')}"`,
      `"${(r.porto || '').replace(/"/g, '""')}"`,
      `"${(r.cabina || '').replace(/"/g, '""')}"`,
      r.adulti || "",
      r.bambini || "",
      `"${(r.etaBambini || '').replace(/"/g, '""')}"`,
      r.budget || "",
      `"${(r.note || '').replace(/"/g, '""')}"`,
      r.status,
      `"${missing.replace(/"/g, '""')}"`,
      `"${msg.replace(/"/g, '""')}"`
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `database-unificato-equestre-tour-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const rows = file.name.match(/\.xlsx?$/i) && window.XLSX ? parseXlsx(reader.result) : parseCsv(String(reader.result));
      const sourceName = file.name;
      const imported = rows.map(r => normalizeRow(r, sourceName)).filter(row => row.cliente || row.email || row.telefono || row.note);
      requests = requests.concat(imported);
      recalculateStatuses();
      renderAll();
      el("richieste")?.scrollIntoView({ behavior: "smooth" });
      alert(`🎉 ${imported.length} richieste importate con successo nel Database Unificato!`);
    } catch (error) {
      alert(`Errore nel caricamento del file: ${error.message}`);
    } finally {
      event.target.value = "";
    }
  };
  if (file.name.match(/\.xlsx?$/i)) reader.readAsArrayBuffer(file);
  else reader.readAsText(file);
}

function normalizeRow(row, sourceName = "File Esterno") {
  const cleaned = {};
  Object.entries(row).forEach(([key, value]) => {
    cleaned[cleanKey(key)] = String(value || "").trim();
  });
  const rawPhone = firstValue(cleaned, ["telefono", "cellulare", "numero_di_telefono", "phone", "phone_number", "mobile", "whatsapp"]);
  const telefono = cleanPhone(rawPhone);
  const cliente = firstValue(cleaned, ["cliente", "nome_cliente", "nome", "nominativo", "full_name", "nome_completo", "nome_e_cognome", "name"]) || clientNameFromPhone(telefono);
  const email = firstValue(cleaned, ["email", "e_mail", "indirizzo_email", "mail", "email_address"]);
  const destinazione = firstValue(cleaned, ["destinazione", "itinerario", "meta", "area", "crociera", "dove_vuoi_andare", "destinazione_preferita", "1"]);
  const periodo = firstValue(cleaned, ["periodo", "data", "mese", "partenza", "partire", "data_partenza", "quando_vuoi_partire", "quando_vorresti_partire", "periodo_preferito", "0"]);
  const porto = firstValue(cleaned, ["porto", "porto_partenza", "porto_di_partenza", "partenza_da", "partire_da", "da_dove_vuoi_partire", "2"]);
  const cabina = firstValue(cleaned, ["cabina", "tipologia_cabina", "tipo_cabina", "sistemazione"]);
  const paxSource = firstValue(cleaned, ["adulti", "numero_adulti", "passeggeri_adulti", "n_adulti", "ospiti_adulti", "numero_persone", "persone", "partecipanti", "quante_persone", "3"]);
  const adulti = paxSource || inferAdults(cleaned);
  const bambini = firstValue(cleaned, ["bambini", "numero_bambini", "minori", "ragazzi", "n_bambini", "ospiti_bambini", "figli"]) || inferChildren(cleaned);
  const etaBambini = firstValue(cleaned, ["eta_bambini", "eta_minori", "eta_dei_bambini", "anni_bambini", "anni_minori"]) || inferChildAges(cleaned);
  const budget = firstValue(cleaned, ["budget", "prezzo", "spesa", "fascia_budget", "budget_indicativo"]);
  const note = [
    firstValue(cleaned, ["note", "richiesta", "messaggio", "commento", "domande", "preferenze"]),
    collectLeadContext(cleaned)
  ].filter(Boolean).join(" | ");

  return {
    id: `REQ-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 899 + 100)}`,
    cliente,
    email,
    telefono,
    destinazione,
    periodo,
    porto,
    cabina,
    adulti: normalizeAdults(adulti),
    bambini: normalizeChildren(bambini),
    etaBambini,
    budget,
    note,
    fonte: sourceName,
    status: "Nuova",
    assignedTo: activeOperator.id,
    lockedBy: null,
    sent: false
  };
}

function parseCsv(text) {
  const cleanText = text.replace(/^\uFEFF/, "");
  const lines = cleanText.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const delimiter = detectDelimiter(lines[0] || "");
  const headers = splitCsvLine(lines.shift(), delimiter).map(cleanKey);
  return lines.map(line => {
    const values = splitCsvLine(line, delimiter);
    return headers.reduce((row, key, index) => ({ ...row, [key]: values[index] || "" }), {});
  });
}

function detectDelimiter(headerLine) {
  const candidates = [",", ";", "\t"];
  return candidates
    .map(delimiter => ({ delimiter, count: splitCsvLine(headerLine, delimiter).length }))
    .sort((a, b) => b.count - a.count)[0].delimiter;
}

function splitCsvLine(line, delimiter = ",") {
  const result = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) {
      result.push(current.trim());
      current = "";
    } else current += char;
  }
  result.push(current.trim());
  return result.map(value => value.replace(/^"|"$/g, ""));
}

function parseXlsx(buffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

function firstValue(row, keys) {
  for (const key of keys) {
    if (row[key]) return row[key];
  }
  const fuzzyKey = Object.keys(row).find(existing => keys.some(key => existing.includes(key) || key.includes(existing)));
  return fuzzyKey ? row[fuzzyKey] : "";
}

function collectLeadContext(row) {
  const usefulPrefixes = ["campaign", "campagna", "ad_", "annuncio", "form", "created", "data_creazione", "source", "origine"];
  return Object.entries(row)
    .filter(([key, value]) => value && usefulPrefixes.some(prefix => key.startsWith(prefix) || key.includes(prefix)))
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
}

function inferAdults(row) {
  const text = Object.values(row).join(" ").toLowerCase();
  const adults = text.match(/(\d+)\s*(adulti|adulto)/);
  if (adults) return adults[1];
  const ages = extractAges(text);
  if (ages.length >= 2) return String(ages.filter(age => age >= 18).length || ages.length);
  const genericPeople = text.match(/(\d+)\s*(persone|partecipanti|pax)/);
  if (genericPeople) return genericPeople[1];
  const couple = text.match(/\b(coppia|due persone|2 persone)\b/);
  if (couple) return "2";
  if (/\btre\b/.test(text)) return "3";
  return "";
}

function inferChildren(row) {
  const text = Object.values(row).join(" ").toLowerCase();
  const minors = text.match(/(\d+)\s*(minori|bimbi|bambini|bambino|ragazzi|figli)/);
  if (minors) return minors[1];
  const ages = extractAges(text);
  if (ages.length >= 2) return String(ages.filter(age => age < 18).length);
  return "";
}

function inferChildAges(row) {
  const text = Object.values(row).join(" ").toLowerCase();
  const explicit = text.match(/(?:eta|anni)\s*(?:bambini|minori|bimbi)?\s*[:\-]?\s*([\d,\s]+)\s*(?:anni)?/);
  if (explicit) return explicit[1].split(/[,\s]+/).filter(Boolean).join(", ");
  const ages = extractAges(text).filter(age => age < 18);
  return ages.length ? ages.join(", ") : "";
}

function normalizeAdults(value) {
  const text = String(value || "").toLowerCase().trim();
  if (!text || text === "0") return "";
  const directAdults = text.match(/(\d+)\s*(adulti|adulto)/);
  if (directAdults) return directAdults[1];
  const ages = extractAges(text);
  if (ages.length >= 2) return String(ages.filter(age => age >= 18).length || ages.length);
  if (/\btre\b/.test(text)) return "3";
  const number = text.match(/\d+/);
  return number ? number[0] : text;
}

function normalizeChildren(value) {
  const text = String(value || "").toLowerCase().trim();
  if (!text) return "0";
  const minors = text.match(/(\d+)\s*(minori|bimbi|bambini|bambino|ragazzi|figli)/);
  if (minors) return minors[1];
  const ages = extractAges(text);
  if (ages.length >= 2) return String(ages.filter(age => age < 18).length);
  return "0";
}

function extractAges(text) {
  return String(text || "")
    .split(/[,\-/\s]+/)
    .map(part => Number(part))
    .filter(value => Number.isInteger(value) && value > 0 && value < 100);
}

function cleanPhone(value) {
  return String(value || "").replace(/^p:/i, "").replace(/\s+/g, "").trim();
}

function whatsappPhone(value) {
  const phone = cleanPhone(value).replace(/[^\d+]/g, "");
  if (!phone) return "";
  const normalized = phone.startsWith("+") ? phone.slice(1) : phone;
  return normalized.length >= 8 ? normalized : "";
}

function clientNameFromPhone(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return `Cliente ${digits.slice(-4) || phone}`;
}

function missingFields(req) {
  const missing = [];
  if (!String(req.cliente || "").trim()) missing.push("cliente");
  if (!validEmail(req.email) && !whatsappPhone(req.telefono)) missing.push("email o telefono");
  if (!String(req.destinazione || "").trim()) missing.push("destinazione");
  if (!String(req.periodo || "").trim()) missing.push("periodo");
  if (!String(req.porto || "").trim()) missing.push("porto");
  if (!String(req.adulti || "").trim()) missing.push("adulti");
  if (parsePeopleCount(req.bambini) > 0 && !String(req.etaBambini || "").trim()) missing.push("eta_bambini");
  if (!String(req.cabina || "").trim()) missing.push("cabina");
  return missing;
}

function presentFields(req) {
  const present = [];
  if (String(req.cliente || "").trim()) present.push("cliente");
  if (validEmail(req.email)) present.push("email");
  if (whatsappPhone(req.telefono)) present.push("telefono");
  if (String(req.destinazione || "").trim()) present.push("destinazione");
  if (String(req.periodo || "").trim()) present.push("periodo");
  if (String(req.porto || "").trim()) present.push("porto");
  if (String(req.adulti || "").trim()) present.push("adulti");
  if (parsePeopleCount(req.bambini) > 0 && String(req.etaBambini || "").trim()) present.push("eta_bambini");
  if (String(req.cabina || "").trim()) present.push("cabina");
  return present;
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

function missingMessage(req, missing) {
  const parts = missing.map(labelFor).join(", ");
  return `Ciao ${req.cliente || ""}, grazie per la richiesta a Equestre Tour!\nPer preparare il tuo preventivo personalizzato ci manca solo: ${parts}.\nPuoi inviarci questi dettagli qui? Non ti richiederemo i dati che ci hai già comunicato.`;
}

function quoteMessage(req) {
  const alternatives = findAlternatives(req, 4);
  const rows = alternatives.length ? alternatives.map((alt, index) => `${index + 1}. ${alt.ship}, ${alt.route}, partenza ${alt.date} da ${alt.port}, ${alt.nights} notti, cabina ${alt.cabin}, tariffa ${alt.fare}, totale € ${formatMoney(alt.price)}. ${alt.link}`).join("\n") : "Offerta su misura in fase di conferma tariffa.";
  return `Ciao ${req.cliente}, abbiamo preparato le migliori proposte per la tua crociera Equestre Tour:\n\n${rows}\n\nLa tariffa e la disponibilità dovranno essere riconfermate al momento della prenotazione.`;
}

function displayRequest(req) {
  const structured = [
    req.destinazione,
    req.periodo,
    req.porto,
    req.cabina,
    paxText(req)
  ].filter(Boolean).join(" - ");
  return structured || req.note || "Richiesta da verificare";
}

function findAlternatives(req, limit = 4) {
  const destination = String(req.destinazione || "").toLowerCase();
  const port = String(req.porto || "").toLowerCase();
  const cabin = String(req.cabina || "").toLowerCase();
  const matches = equestreTourInventory.filter(item => {
    return item.availability
      && (!destination || item.route.toLowerCase().includes(destination) || destination.includes(item.route.toLowerCase()))
      && (!port || item.port.toLowerCase() === port)
      && (!cabin || item.cabin.toLowerCase() === cabin || item.cabin.toLowerCase().includes(cabin));
  });
  const sorted = matches.sort((a, b) => el("sortMode")?.value === "value" ? b.score - a.score || a.price - b.price : a.price - b.price);
  return sorted.slice(0, limit);
}

function sendOne(id, channel) {
  const req = requests.find(item => item.id === id);
  if (!req) return;
  const quoteUrl = createQuoteUrl(req);
  updateRequest(id, { status: "Inviato", sent: true, lockedBy: null });
  sendLog.unshift(logEntry(req, channel, "Inviato", quoteUrl));
  archiveContact(req, quoteUrl);
  renderAll();
}

function openWhatsApp(id) {
  const req = requests.find(item => item.id === id);
  if (!req) return;
  const phone = whatsappPhone(req.telefono);
  if (!phone) {
    alert("Per inviare su WhatsApp serve un numero di telefono valido.");
    return;
  }
  const message = el("editableMessage")?.value?.trim() || (missingFields(req).length ? missingMessage(req, missingFields(req)) : quoteMessage(req));
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  sendLog.unshift(logEntry(req, "WhatsApp Web", "Messaggio WhatsApp preparato", null));
  renderSendLog();
}

function createQuoteUrl(req) {
  const alternatives = findAlternatives(req, 4);
  const cards = alternatives.map((alt, index) => `
    <section style="border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin:12px 0;">
      <h2 style="color:#0284c7;">Proposta ${index + 1}: ${escapeHtml(alt.ship)}</h2>
      <p><strong>Itinerario:</strong> ${escapeHtml(alt.route)}</p>
      <p><strong>Porto:</strong> ${escapeHtml(alt.port)} | <strong>Data:</strong> ${escapeHtml(alt.date)} | <strong>Durata:</strong> ${alt.nights} notti</p>
      <p><strong>Cabina:</strong> ${escapeHtml(alt.cabin)} | <strong>Tariffa:</strong> ${escapeHtml(alt.fare)} | <strong>Totale:</strong> € ${formatMoney(alt.price)}</p>
      <p><a href="${alt.link}" style="color:#0284c7;">Vedi offerta sul sito Equestre Tour</a></p>
    </section>
  `).join("");
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Preventivo ${escapeHtml(req.cliente)}</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#0f172a}</style></head><body><h1>Preventivo Equestre Tour</h1><p>Cliente: <strong>${escapeHtml(req.cliente)}</strong></p>${cards}<p><small>Tariffa e disponibilità da riconfermare al momento della prenotazione.</small></p></body></html>`;
  return URL.createObjectURL(new Blob([html], { type: "text/html" }));
}

function handleManualSubmit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  requests.unshift(normalizeRow(data, "Manuale"));
  event.target.reset();
  el("manualDialog")?.close();
  recalculateStatuses();
  renderAll();
  alert("Richiesta inserita con successo!");
}

function downloadTemplate() {
  const csv = [
    "cliente,email,telefono,destinazione,periodo,porto,cabina,adulti,bambini,eta_bambini,budget,note",
    "Giulia Martini,giulia.martini@example.com,+39 333 111 2222,Grecia,Agosto 2026,Venezia,Esterna,2,1,8,4500,Preferenza nave con piscina"
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template-richieste-equestre-tour.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function deleteRequest(id) {
  const req = requests.find(item => item.id === id);
  if (!req) return;
  if (!confirm(`Cancellare la richiesta di ${req.cliente || "questo cliente"}?`)) return;
  removeRequestsById([id]);
  renderAll();
}

function deleteSelectedRequests() {
  const ids = [...selectedRequests].filter(id => requests.some(req => req.id === id && canSeeRequest(req)));
  if (!ids.length) {
    alert("Seleziona almeno una richiesta da cancellare.");
    return;
  }
  if (!confirm(`Cancellare le ${ids.length} richieste selezionate?`)) return;
  removeRequestsById(ids);
  renderAll();
}

function deleteVisibleRequests() {
  const visible = requests
    .filter(canSeeRequest)
    .filter(req => currentFilter === "all" || req.status === currentFilter)
    .map(req => req.id);
  if (!visible.length) {
    alert("Non ci sono richieste visibili da cancellare.");
    return;
  }
  if (!confirm(`Cancellare tutte le ${visible.length} richieste dell'elenco visibile?`)) return;
  removeRequestsById(visible);
  renderAll();
}

function removeRequestsById(ids) {
  const idSet = new Set(ids);
  requests = requests.filter(item => !idSet.has(item.id));
  sendLog = sendLog.filter(log => !idSet.has(log.requestId));
  contactArchive.forEach(contact => {
    contact.requests = contact.requests.filter(entry => !idSet.has(entry.requestId));
  });
  contactArchive = contactArchive.filter(contact => contact.requests.length);
  ids.forEach(id => selectedRequests.delete(id));
  if (selectedId && idSet.has(selectedId)) {
    selectedId = null;
    const detail = el("requestDetail");
    if (detail) detail.innerHTML = `<p class="empty">Seleziona una richiesta per vedere dati presenti, dati mancanti e messaggio pronto.</p>`;
  }
}

function toggleVisibleSelection(event) {
  const visible = requests.filter(canSeeRequest).filter(req => currentFilter === "all" || req.status === currentFilter);
  visible.forEach(req => {
    if (event.target.checked) selectedRequests.add(req.id);
    else selectedRequests.delete(req.id);
  });
  renderRequests();
}

function syncSelectAll(visibleRows) {
  const selectAll = el("selectAllRequests");
  if (!selectAll) return;
  const selectable = visibleRows.map(req => req.id);
  const checked = selectable.filter(id => selectedRequests.has(id)).length;
  selectAll.checked = selectable.length > 0 && checked === selectable.length;
  selectAll.indeterminate = checked > 0 && checked < selectable.length;
}

function renderSendLog() {
  const logTable = el("sendLog");
  if (!logTable) return;
  logTable.innerHTML = sendLog.length ? sendLog.map(log => `
    <tr>
      <td><strong>${escapeHtml(log.cliente)}</strong></td>
      <td>${escapeHtml(log.destinatario)}</td>
      <td>${escapeHtml(log.operatore)}</td>
      <td>${escapeHtml(log.canale)}</td>
      <td><span class="status s-sent">${escapeHtml(log.esito)}</span></td>
      <td>${log.quoteUrl ? `<a href="${log.quoteUrl}" target="_blank">Visualizza</a>` : "N/D"}</td>
      <td><small style="color:var(--text-muted)">${escapeHtml(log.when)}</small></td>
    </tr>
  `).join("") : `<tr><td colspan="7" class="empty">Nessun invio registrato finora.</td></tr>`;
}

function renderCrm() {
  const admin = activeOperator.role === "Amministratore";
  if (el("adminOnlyNotice")) el("adminOnlyNotice").classList.toggle("hidden", admin);
  if (el("crmWrap")) el("crmWrap").classList.toggle("hidden", !admin);
  if (el("crmSearch")) el("crmSearch").disabled = !admin;
  if (!admin || !el("crmRows")) return;

  const query = el("crmSearch")?.value.toLowerCase().trim() || "";
  const contacts = buildContactArchive().filter(contact => {
    if (!query) return true;
    return [contact.cliente, contact.email, contact.telefono].join(" ").toLowerCase().includes(query);
  });

  el("crmRows").innerHTML = contacts.length ? contacts.map(contact => `
    <tr>
      <td><strong>${escapeHtml(contact.cliente || "Cliente senza nome")}</strong></td>
      <td>${escapeHtml(contact.email || "Email mancante")}<br><small style="color:var(--text-muted)">${escapeHtml(contact.telefono || "Telefono mancante")}</small></td>
      <td><strong>${contact.requests.length}</strong></td>
      <td><span class="status ${statusClass(contact.lastStatus)}">${escapeHtml(contact.lastStatus)}</span></td>
      <td>${escapeHtml(contact.lastSentAt || "Nessun invio")}</td>
      <td><button class="danger" data-delete-contact="${contact.key}" style="padding: 4px 8px; font-size: 12px;">Elimina</button></td>
    </tr>
  `).join("") : `<tr><td colspan="6" class="empty">Nessun cliente presente in archivio.</td></tr>`;

  document.querySelectorAll("[data-delete-contact]").forEach(button => {
    button.addEventListener("click", () => deleteContact(button.dataset.deleteContact));
  });
}

function updateRequest(id, patch) {
  requests = requests.map(req => req.id === id ? { ...req, ...patch } : req);
  renderMetrics();
  renderRequests();
  renderDetail();
  renderAlternatives();
}

function canSeeRequest(req) {
  return activeOperator.role === "Amministratore" || req.assignedTo === activeOperator.id;
}

function summary(req) { return displayRequest(req); }

function paxText(req) {
  const adults = parsePeopleCount(req.adulti);
  const children = parsePeopleCount(req.bambini);
  if (!adults && !children) return "";
  const parts = [];
  if (adults) parts.push(`${adults} adulti`);
  if (children) parts.push(`${children} bambini${req.etaBambini ? ` (${req.etaBambini} anni)` : ""}`);
  return parts.join(", ");
}

function parsePeopleCount(value) {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function logEntry(req, channel, outcome, quoteUrl) {
  return {
    requestId: req.id,
    cliente: req.cliente,
    destinatario: req.email || req.telefono,
    operatore: activeOperator.name,
    canale: channel,
    esito: outcome,
    quoteUrl,
    when: new Date().toLocaleString("it-IT")
  };
}

function operatorName(id) {
  return operators.find(op => op.id === id)?.name || "Non assegnato";
}

function labelFor(field) {
  const labels = {
    cliente: "nome cliente",
    email: "indirizzo email",
    telefono: "telefono / WhatsApp",
    destinazione: "destinazione",
    periodo: "periodo / mese",
    porto: "porto di imbarco",
    eta_bambini: "età dei bambini",
    cabina: "tipologia cabina",
    adulti: "numero adulti"
  };
  return labels[field] || field;
}

function statusClass(status) {
  if (status === "Dati mancanti" || status === "In attesa del cliente") return "s-missing";
  if (status === "Completa" || status === "Preventivo pronto") return "s-complete";
  if (status === "In lavorazione") return "s-work";
  if (status === "Da controllare" || status === "Errore") return "s-review";
  if (status === "Inviato" || status === "Confermato") return "s-sent";
  return "s-new";
}

function cleanKey(key) {
  return String(key || "")
    .toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_").replace(/[^\w]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function formatMoney(value) { return Number(value).toLocaleString("it-IT"); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function previousRequests(req) {
  const key = contactKey(req);
  return requests.filter(item => item.id !== req.id && contactKey(item) === key);
}

function contactKey(req) {
  return String(req.email || req.telefono || req.cliente || "").toLowerCase().replace(/\s+/g, "");
}

function archiveContact(req, quoteUrl) {
  const key = contactKey(req);
  const existing = contactArchive.find(contact => contact.key === key);
  const entry = {
    requestId: req.id,
    status: "Inviato",
    quoteUrl,
    sentAt: new Date().toLocaleString("it-IT"),
    operator: activeOperator.name,
    summary: summary(req)
  };
  if (existing) {
    existing.cliente = req.cliente || existing.cliente;
    existing.email = req.email || existing.email;
    existing.telefono = req.telefono || existing.telefono;
    existing.requests.unshift(entry);
  } else {
    contactArchive.unshift({
      key, cliente: req.cliente, email: req.email, telefono: req.telefono, requests: [entry]
    });
  }
}

function buildContactArchive() {
  const map = new Map();
  requests.forEach(req => {
    const key = contactKey(req);
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, {
        key, cliente: req.cliente, email: req.email, telefono: req.telefono, requests: [], lastStatus: req.status, lastSentAt: "", lastQuoteUrl: ""
      });
    }
    const contact = map.get(key);
    contact.requests.push({ requestId: req.id, status: req.status, summary: summary(req) });
    contact.lastStatus = req.status;
  });
  return [...map.values()].sort((a, b) => (a.cliente || "").localeCompare(b.cliente || ""));
}

function deleteContact(key) {
  const contact = buildContactArchive().find(item => item.key === key);
  if (!contact) return;
  if (!confirm(`Cancellare il contatto ${contact.cliente || "selezionato"}?`)) return;
  const linkedIds = new Set(contact.requests.map(item => item.requestId));
  requests = requests.filter(req => !linkedIds.has(req.id) && contactKey(req) !== key);
  if (selectedId && !requests.some(req => req.id === selectedId)) {
    selectedId = null;
    const detail = el("requestDetail");
    if (detail) detail.innerHTML = `<p class="empty">Seleziona una richiesta per vedere dati presenti, dati mancanti e messaggio pronto.</p>`;
  }
  renderAll();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
