import { COLLECTIONS, COLLECTION_BY_ID, PARCOURS, THEMES } from "./schema.js";
import {
  downloadFile,
  formatDateFr,
  isEmail,
  isUrl,
  itemLinks,
  itemThemes,
  loadCatalog,
  matchesQuery,
  nextId,
  prettyUrl,
  resetCatalog,
  saveCatalog,
  todayIso,
  toCsv,
  toHref,
  totalCount,
  uniqueValues,
} from "./utils.js";

const root = document.getElementById("app");
const CONTACT = "formation.innovation@universite-paris-saclay.fr";

const state = {
  seed: null,
  catalog: null,
  page: "home",
  query: "",
  parcours: "",
  typeId: "",
  themeId: "",
  etablissement: "",
  selected: null,
  editing: false,
  draft: null,
};

function excerpt(text, n = 140) {
  if (!text) return "";
  const clean = String(text).replace(/\s+/g, " ").trim();
  return clean.length > n ? `${clean.slice(0, n)}…` : clean;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function titleOf(col, item) {
  return item[col.titleField] || "Sans titre";
}

function allRecords() {
  return COLLECTIONS.flatMap((col) =>
    state.catalog.collections[col.id].map((item) => ({ col, item }))
  );
}

function parcoursOf(colId) {
  return PARCOURS.find((p) => p.collections.includes(colId));
}

function filteredRecords() {
  const parcours = PARCOURS.find((p) => p.id === state.parcours);
  return allRecords().filter(({ col, item }) => {
    if (parcours && !parcours.collections.includes(col.id)) return false;
    if (state.typeId && col.id !== state.typeId) return false;
    if (state.etablissement && String(item.etablissement || "").trim() !== state.etablissement) {
      return false;
    }
    if (state.themeId && !itemThemes(item).includes(state.themeId)) return false;
    if (state.query && !matchesQuery(item, state.query, col.searchFields)) return false;
    return true;
  });
}

function relatedRecords(colId, item) {
  const etab = String(item.etablissement || "").trim();
  if (!etab) return [];
  return allRecords()
    .filter(({ col, item: other }) => col.id !== colId && String(other.etablissement || "").trim() === etab)
    .slice(0, 5);
}

function cardLinkHtml(item) {
  const links = itemLinks(item);
  if (!links.length) return "";
  return `<div class="card-links">${links
    .map((value) => {
      if (isUrl(value)) {
        return `<a class="card-link" href="${escapeHtml(toHref(value))}" target="_blank" rel="noreferrer">${escapeHtml(prettyUrl(value))}</a>`;
      }
      return `<span class="card-link">${escapeHtml(excerpt(value, 70))}</span>`;
    })
    .join("")}</div>`;
}

function fieldHtml(field, value) {
  if (value == null || value === "") return `<span>—</span>`;
  const text = String(value);
  if (field.type === "url" && isUrl(text)) {
    return `<a class="card-link" href="${escapeHtml(toHref(text))}" target="_blank" rel="noreferrer">${escapeHtml(text)}</a>`;
  }
  if (field.type === "email" && isEmail(text)) {
    return `<a class="card-link" href="mailto:${escapeHtml(text)}">${escapeHtml(text)}</a>`;
  }
  return `<div>${escapeHtml(text)}</div>`;
}

function persist() {
  saveCatalog(state.catalog);
}

function go(page, extra = {}) {
  Object.assign(state, extra, { page });
  if (page !== "fiche") {
    state.selected = null;
    state.editing = false;
    state.draft = null;
  }
  render();
  window.scrollTo(0, 0);
}

function openFiche(colId, item, edit = false) {
  state.page = "fiche";
  state.selected = { colId, item };
  state.draft = { ...item };
  state.editing = edit;
  render();
  window.scrollTo(0, 0);
}

function saveItem() {
  if (!state.selected || !state.draft) return;
  const col = COLLECTION_BY_ID[state.selected.colId];
  const required = col.fields.find((f) => f.required);
  if (required && !String(state.draft[required.key] || "").trim()) {
    window.alert(`Le champ « ${required.label} » est obligatoire.`);
    return;
  }
  const list = [...state.catalog.collections[state.selected.colId]];
  const idx = list.findIndex((i) => i.id === state.draft.id);
  const nextItem = { ...state.draft };
  if (idx >= 0) list[idx] = nextItem;
  else list.unshift(nextItem);
  state.catalog = {
    ...state.catalog,
    meta: { ...state.catalog.meta, dateMiseAJour: todayIso() },
    collections: { ...state.catalog.collections, [state.selected.colId]: list },
  };
  state.selected = { colId: state.selected.colId, item: nextItem };
  state.editing = false;
  persist();
  render();
}

function deleteItem() {
  if (!state.selected) return;
  if (!window.confirm("Supprimer cette fiche ?")) return;
  const { colId, item } = state.selected;
  state.catalog = {
    ...state.catalog,
    meta: { ...state.catalog.meta, dateMiseAJour: todayIso() },
    collections: {
      ...state.catalog.collections,
      [colId]: state.catalog.collections[colId].filter((i) => i.id !== item.id),
    },
  };
  persist();
  go("explorer");
}

function createItem() {
  const colId = state.typeId || (PARCOURS.find((p) => p.id === state.parcours)?.collections[0]) || "formationsPui";
  const col = COLLECTION_BY_ID[colId];
  const blank = { id: nextId(state.catalog.collections[colId]) };
  col.fields.forEach((f) => {
    blank[f.key] = "";
  });
  openFiche(colId, blank, true);
}

function restoreSeed() {
  if (!window.confirm("Revenir aux données importées du fichier Excel ?")) return;
  resetCatalog();
  state.catalog = structuredClone(state.seed);
  persist();
  go("home");
}

function wordmarkHtml(extraClass = "") {
  return `
    <span class="wordmark ${extraClass}" aria-label="Compas Inno">
      <span class="wordmark-name" aria-hidden="true">C<span class="wordmark-o">${compassSvg()}</span>mpas</span>
      <span class="wordmark-sub" aria-hidden="true">Inno</span>
    </span>`;
}

function compassSvg() {
  return `<svg class="wordmark-rose" viewBox="0 0 32 32" focusable="false">
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" stroke-width="1.7"/>
      <polygon points="16,2.5 18.4,14.2 13.6,14.2" fill="#f37320"/>
      <polygon points="16,29.5 18.4,17.8 13.6,17.8" fill="currentColor"/>
      <polygon points="29.5,16 17.8,18.4 17.8,13.6" fill="currentColor"/>
      <polygon points="2.5,16 14.2,18.4 14.2,13.6" fill="currentColor"/>
      <circle cx="16" cy="16" r="2.15" fill="#c60b46"/>
    </svg>`;
}

function header() {
  return `
    <header class="site-header">
      <div class="header-inner">
        <a class="brand-lockup" href="#" data-go="home" aria-label="Accueil Compas Inno">
          <img class="logo-ups" src="assets/logo-upsaclay.png" alt="Université Paris-Saclay" />
          <span class="brand-sep" aria-hidden="true"></span>
          <img class="logo-oser" src="assets/logo-oser-signature.png" alt="Oser pour innover" />
          <span class="brand-sep" aria-hidden="true"></span>
          ${wordmarkHtml()}
        </a>
        <nav class="nav">
          <button data-go="home" class="${state.page === "home" ? "active" : ""}">Accueil</button>
          <button data-go="explorer" class="${state.page === "explorer" ? "active" : ""}">Explorer</button>
          <button data-go="apropos" class="${state.page === "apropos" ? "active" : ""}">Le catalogue</button>
        </nav>
        <button class="header-cta" data-go="orienter">Être orienté</button>
      </div>
    </header>`;
}

function footer() {
  return `
    <footer class="site-footer">
      <div class="wrap footer-grid">
        <div>
          ${wordmarkHtml("wordmark--on-dark")}
          <p>Le compagnon pour s’orienter parmi les ressources d’innovation et d’entrepreneuriat — Pôle universitaire d’innovation.</p>
        </div>
        <div>
          <strong>Contact</strong>
          <p><a href="mailto:${CONTACT}" style="color:#fff">${CONTACT}</a></p>
          <p>Mise à jour ${formatDateFr(state.catalog.meta.dateMiseAJour)}</p>
        </div>
        <div>
          <strong>Contributeurs</strong>
          <p>
            <button class="btn ghost" data-action="json">Exporter JSON</button>
            <button class="btn ghost" data-action="restore">Restaurer Excel</button>
          </p>
        </div>
      </div>
    </footer>`;
}

function renderHome() {
  const counts = {
    former: PARCOURS[0].collections.reduce((n, id) => n + state.catalog.collections[id].length, 0),
    faire: PARCOURS[1].collections.reduce((n, id) => n + state.catalog.collections[id].length, 0),
    appuyer: PARCOURS[2].collections.reduce((n, id) => n + state.catalog.collections[id].length, 0),
  };
  return `
    <section class="wrap hero">
      <p class="kicker">Pôle universitaire d’innovation</p>
      ${wordmarkHtml("wordmark--hero")}
      <h1>Le compagnon pour s’orienter.</h1>
      <p>Trouver la bonne ressource, au bon moment — formations, lieux, personnes, outils et financements du périmètre Paris-Saclay.</p>
      <form class="search-bar" data-search>
        <input name="q" value="${escapeHtml(state.query)}" placeholder="Une formation, un fablab, un appel à projets, un contact…" />
        <button type="submit">Rechercher</button>
      </form>
    </section>
    <div class="wrap">
      <div class="portes">
        ${PARCOURS.map(
          (p) => `
          <button class="porte" data-parcours="${p.id}">
            <span class="num">${p.kicker}</span>
            <h2>${escapeHtml(p.label)}</h2>
            <p>${escapeHtml(p.lead)}</p>
          </button>`
        ).join("")}
      </div>
    </div>
    <section class="band">
      <div class="wrap kpis">
        <button class="kpi" data-go="explorer"><span class="n">${totalCount(state.catalog)}</span><span class="l">ressources</span></button>
        <button class="kpi" data-parcours="former"><span class="n">${counts.former}</span><span class="l">pour se former</span></button>
        <button class="kpi" data-parcours="faire"><span class="n">${counts.faire}</span><span class="l">pour concevoir</span></button>
        <button class="kpi" data-parcours="appuyer"><span class="n">${counts.appuyer}</span><span class="l">pour s’appuyer</span></button>
        <button class="kpi" data-go="orienter"><span class="n">→</span><span class="l">être orienté</span></button>
      </div>
    </section>
    <section class="wrap section">
      <h2>À quoi sert Compas Inno</h2>
      <p style="max-width:70ch;color:var(--slate);line-height:1.55">C’est un <strong>compagnon</strong> pour s’orienter : pas un annuaire de laboratoires, mais le recueil de ce dont on a besoin pour <strong>former et innover</strong> — dispositifs, personnes, lieux, outils et leviers de financement.</p>
    </section>`;
}

function renderExplorer() {
  const records = filteredRecords();
  const etabs = uniqueValues(
    allRecords().map(({ item }) => item),
    "etablissement"
  ).filter((v) => v.length < 70 && !v.includes("@") && !/^\d{4}-\d{2}/.test(v));
  const typeOptions = COLLECTIONS.filter((c) => {
    if (!state.parcours) return true;
    return PARCOURS.find((p) => p.id === state.parcours)?.collections.includes(c.id);
  });
  const parcours = PARCOURS.find((p) => p.id === state.parcours);
  const typeCol = COLLECTION_BY_ID[state.typeId];
  const kicker = parcours ? `${parcours.kicker} · ${parcours.label}` : typeCol ? "Type de ressource" : "Explorer";
  const title = parcours ? parcours.label : typeCol ? typeCol.label : "Toutes les ressources";
  const lead = parcours
    ? parcours.lead
    : typeCol
      ? "Fiches de ce type. Vous pouvez affiner par thématique ou établissement."
      : "Filtrez par besoin, type de ressource ou thématique.";
  return `
    <div class="wrap page-head">
      <p class="kicker">${escapeHtml(kicker)}</p>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(lead)}</p>
    </div>
    <div class="wrap filters-layout">
      <aside class="filters">
        <h3>Affiner</h3>
        <form data-search>
          <input name="q" value="${escapeHtml(state.query)}" placeholder="Mot-clé" style="width:100%;border:var(--line);padding:8px" />
        </form>
        <label>Parcours</label>
        <select data-filter="parcours">
          <option value="">Tous</option>
          ${PARCOURS.map((p) => `<option value="${p.id}" ${state.parcours === p.id ? "selected" : ""}>${escapeHtml(p.label)}</option>`).join("")}
        </select>
        <label>Type de ressource</label>
        <select data-filter="typeId">
          <option value="">Tous</option>
          ${typeOptions.map((c) => `<option value="${c.id}" ${state.typeId === c.id ? "selected" : ""}>${escapeHtml(c.label)}</option>`).join("")}
        </select>
        <label>Thématique</label>
        <select data-filter="themeId">
          <option value="">Toutes</option>
          ${THEMES.map((t) => `<option value="${t.id}" ${state.themeId === t.id ? "selected" : ""}>${escapeHtml(t.label)}</option>`).join("")}
        </select>
        <label>Établissement</label>
        <select data-filter="etablissement">
          <option value="">Tous</option>
          ${etabs.map((v) => `<option value="${escapeHtml(v)}" ${state.etablissement === v ? "selected" : ""}>${escapeHtml(v)}</option>`).join("")}
        </select>
      </aside>
      <div>
        <div class="toolbar">
          <span class="hint">${records.length} ressource${records.length > 1 ? "s" : ""}</span>
          <div>
            <button class="btn ghost" data-action="csv">Export CSV</button>
            <button class="btn" data-action="create">Ajouter une fiche</button>
          </div>
        </div>
        ${
          records.length
            ? `<div class="cards">${records
                .map(({ col, item }) => {
                  const themes = itemThemes(item)
                    .slice(0, 3)
                    .map((id) => THEMES.find((t) => t.id === id)?.label)
                    .filter(Boolean);
                  return `
                  <article class="card" data-open="${col.id}:${item.id}">
                    <span class="type">${escapeHtml(col.label)}</span>
                    <h3>${escapeHtml(titleOf(col, item))}</h3>
                    ${item[col.subtitleField] ? `<div class="sub">${escapeHtml(item[col.subtitleField])}</div>` : ""}
                    <div class="excerpt">${escapeHtml(excerpt(item.objectifs || item.description || item.notes || item.programme || ""))}</div>
                    ${cardLinkHtml(item)}
                    <div class="chips">${themes.map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join("")}</div>
                  </article>`;
                })
                .join("")}</div>`
            : `<div class="empty">Aucune ressource ne correspond. <button class="btn ghost" data-go="orienter">Demander une orientation</button></div>`
        }
      </div>
    </div>`;
}

function renderFiche() {
  const { colId, item } = state.selected;
  const col = COLLECTION_BY_ID[colId];
  const source = state.editing ? state.draft : item;
  const parcours = parcoursOf(colId);
  const related = relatedRecords(colId, item);
  const mail = source.mail || CONTACT;
  const fields = col.fields
    .map((field) => {
      if (state.editing) {
        const value = source[field.key] || "";
        const control =
          field.type === "textarea"
            ? `<textarea data-field="${field.key}">${escapeHtml(value)}</textarea>`
            : `<input data-field="${field.key}" value="${escapeHtml(value)}" />`;
        return `<div class="field"><label>${escapeHtml(field.label)}</label>${control}</div>`;
      }
      if (source[field.key] == null || source[field.key] === "") return "";
      return `<div class="field"><label>${escapeHtml(field.label)}</label>${fieldHtml(field, source[field.key])}</div>`;
    })
    .join("");

  return `
    <div class="wrap page-head">
      <p class="kicker">${parcours ? escapeHtml(parcours.label) : "Ressource"}</p>
      <span class="badge">${escapeHtml(col.label)}</span>
      <h1>${escapeHtml(titleOf(col, source))}</h1>
    </div>
    <div class="wrap fiche">
      <div>
        <div class="block">
          <h2>${state.editing ? "Modifier la fiche" : "Présentation"}</h2>
          ${fields || "<p>Pas de détail renseigné.</p>"}
        </div>
      </div>
      <aside class="side">
        <div class="block">
          <h2>Actions</h2>
          <p>
            <a class="btn" href="mailto:${escapeHtml(mail)}?subject=${encodeURIComponent("Catalogue innovation — " + titleOf(col, source))}">Contacter</a>
          </p>
          <p style="margin-top:10px">
            ${
              state.editing
                ? `<button class="btn" data-action="save">Enregistrer</button>`
                : `<button class="btn ghost" data-action="edit">Modifier</button>`
            }
            <button class="btn ghost" data-go="explorer">Retour</button>
          </p>
          <p style="margin-top:10px"><button class="btn danger" data-action="delete">Supprimer</button></p>
        </div>
        ${
          related.length
            ? `<div class="block related">
                <h2>Dans le même établissement</h2>
                ${related
                  .map(
                    ({ col: c, item: it }) =>
                      `<button data-open="${c.id}:${it.id}"><strong>${escapeHtml(titleOf(c, it))}</strong><br /><span class="hint">${escapeHtml(c.label)}</span></button>`
                  )
                  .join("")}
              </div>`
            : ""
        }
      </aside>
    </div>`;
}

function renderOrienter() {
  return `
    <div class="wrap page-head">
      <p class="kicker">Orientation</p>
      <h1>Vous ne trouvez pas la ressource ?</h1>
      <p>Décrivez le besoin. L’équipe formation innovation vous oriente vers la formation, le lieu ou l’expert adapté.</p>
    </div>
    <div class="wrap form-page">
      <div class="steps">
        <div><strong>1.</strong> Je précise le public et l’objectif pédagogique.</div>
        <div><strong>2.</strong> Je situe le besoin (se former, prototyper, financer).</div>
        <div><strong>3.</strong> L’équipe PUI me recontacte.</div>
      </div>
      <form class="block" data-orienter>
        <div class="field"><label>Objectif</label><textarea name="objectif" required placeholder="Ex. sensibiliser des doctorants à la PI"></textarea></div>
        <div class="field"><label>Public</label><input name="public" placeholder="Doctorants, personnels, étudiants…" /></div>
        <div class="field"><label>Votre mail</label><input name="mail" type="email" required /></div>
        <button class="btn" type="submit">Envoyer la demande</button>
      </form>
    </div>`;
}

function renderApropos() {
  return `
    <div class="wrap page-head">
      <p class="kicker">Compas Inno</p>
      <h1>Les types de ressources</h1>
      <p>Les familles de fiches pour s’orienter : formations, accompagnement, lieux, outils, financements. Cliquez un type pour ouvrir la liste correspondante dans Explorer.</p>
    </div>
    <div class="wrap section">
      <div class="defs">
        ${state.catalog.definitions
          .map((d) => {
            const col = COLLECTION_BY_ID[d.cle];
            const title = col
              ? `<button type="button" class="def-link" data-type="${escapeHtml(d.cle)}">${escapeHtml(d.libelle)}</button>`
              : `<strong>${escapeHtml(d.libelle)}</strong>`;
            return `<div class="def">${title}<span>${escapeHtml(d.texte)}</span></div>`;
          })
          .join("")}
      </div>
    </div>`;
}

function render() {
  const body =
    state.page === "home"
      ? renderHome()
      : state.page === "explorer"
        ? renderExplorer()
        : state.page === "fiche"
          ? renderFiche()
          : state.page === "orienter"
            ? renderOrienter()
            : renderApropos();
  root.innerHTML = `${header()}${body}${footer()}`;
  bind();
}

function bind() {
  document.querySelectorAll("[data-go]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (el.dataset.go === "explorer") {
        go("explorer");
      } else {
        go(el.dataset.go, el.dataset.go === "home" ? { query: "", parcours: "", typeId: "", themeId: "", etablissement: "" } : {});
      }
    });
  });

  document.querySelectorAll("[data-parcours]").forEach((el) => {
    el.addEventListener("click", () => {
      go("explorer", { parcours: el.dataset.parcours, typeId: "", query: state.page === "home" ? "" : state.query });
    });
  });

  document.querySelectorAll("[data-type]").forEach((el) => {
    el.addEventListener("click", () => {
      go("explorer", {
        typeId: el.dataset.type,
        parcours: "",
        themeId: "",
        etablissement: "",
        query: "",
      });
    });
  });

  document.querySelectorAll("[data-search]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = form.querySelector("[name=q]")?.value || "";
      go("explorer", { query: q });
    });
  });

  document.querySelectorAll("[data-filter]").forEach((el) => {
    el.addEventListener("change", () => {
      state[el.dataset.filter] = el.value;
      if (el.dataset.filter === "parcours") state.typeId = "";
      render();
    });
  });

  document.querySelectorAll("[data-open]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      const [colId, id] = el.dataset.open.split(":");
      const item = state.catalog.collections[colId].find((i) => String(i.id) === id);
      if (item) openFiche(colId, item);
    });
  });

  document.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", () => {
      const a = el.dataset.action;
      if (a === "create") createItem();
      if (a === "edit") {
        state.editing = true;
        state.draft = { ...state.selected.item };
        render();
      }
      if (a === "save") saveItem();
      if (a === "delete") deleteItem();
      if (a === "json") {
        downloadFile("catalogue-ressources-innovation.json", JSON.stringify(state.catalog, null, 2), "application/json");
      }
      if (a === "csv") {
        const recs = filteredRecords();
        const col = COLLECTION_BY_ID[state.typeId] || recs[0]?.col;
        if (!col) return;
        const items = recs.filter((r) => r.col.id === col.id).map((r) => r.item);
        downloadFile(`${col.id}.csv`, toCsv(items.length ? items : recs.map((r) => r.item), col.fields), "text/csv;charset=utf-8");
      }
      if (a === "restore") restoreSeed();
    });
  });

  document.querySelectorAll("[data-field]").forEach((el) => {
    el.addEventListener("input", () => {
      state.draft[el.dataset.field] = el.value;
    });
  });

  const orienter = document.querySelector("[data-orienter]");
  if (orienter) {
    orienter.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(orienter);
      const body = `Objectif : ${data.get("objectif")}\nPublic : ${data.get("public")}\nMail : ${data.get("mail")}`;
      window.location.href = `mailto:${CONTACT}?subject=${encodeURIComponent("Orientation catalogue innovation")}&body=${encodeURIComponent(body)}`;
    });
  }
}

async function boot() {
  const res = await fetch("data/catalog.json");
  state.seed = await res.json();
  state.catalog = loadCatalog(state.seed);
  render();
}

boot();
