const STORAGE_KEY = "homework-progress-all-subjects-v1";

let subjects = applySavedState(structuredClone(window.APP_DATA || []));
let activeSubject = "all";
let schoolFilter = "nextTest";
let activeView = "tasks";

const elements = {
  summaryLine: document.querySelector("#summaryLine"),
  subjectTabs: document.querySelector("#subjectTabs"),
  schoolFilter: document.querySelector("#schoolFilter"),
  materialFilterWrap: document.querySelector("#materialFilterWrap"),
  materialFilter: document.querySelector("#materialFilter"),
  visibleCount: document.querySelector("#visibleCount"),
  progressBoard: document.querySelector("#progressBoard"),
  scopeSettingsButton: document.querySelector("#scopeSettingsButton"),
  doneSettingsButton: document.querySelector("#doneSettingsButton"),
  resetSampleButton: document.querySelector("#resetSampleButton"),
  exportButton: document.querySelector("#exportButton"),
};

function applySavedState(data) {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return data;
  try {
    const state = JSON.parse(saved);
    data.forEach((subject) => {
      subject.rows.forEach((row) => {
        const savedRow = state.rows?.[row.id];
        if (savedRow?.schoolStatus) row.schoolStatus = savedRow.schoolStatus;
        row.materials.forEach((material) => {
          const savedMaterial = state.materials?.[material.id];
          if (savedMaterial?.status) material.status = savedMaterial.status;
        });
      });
    });
  } catch {
    return data;
  }
  return data;
}

function saveState() {
  const rows = {};
  const materials = {};
  subjects.forEach((subject) => {
    subject.rows.forEach((row) => {
      rows[row.id] = { schoolStatus: row.schoolStatus };
      row.materials.forEach((material) => {
        materials[material.id] = { status: material.status };
      });
    });
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows, materials }));
}

function getActiveSubjects() {
  if (activeSubject === "all") return subjects;
  return subjects.filter((subject) => subject.id === activeSubject);
}

function getRows(sourceSubjects = getActiveSubjects()) {
  return sourceSubjects.flatMap((subject) => subject.rows.map((row) => ({ ...row, subjectLabel: subject.label })));
}

function getVisibleRows() {
  const materialMode = elements.materialFilter.value;
  return getRows().filter((row) => {
    if (schoolFilter === "nextTest" && !["learned", "test"].includes(row.schoolStatus)) return false;
    if (!["all", "nextTest"].includes(schoolFilter) && row.schoolStatus !== schoolFilter) return false;
    if (activeView === "tasks" && schoolFilter === "all" && row.schoolStatus === "unlearned") return false;
    if (materialMode === "unfinished" && !row.materials.some((material) => material.status !== "checked")) return false;
    if (materialMode === "checked" && !row.materials.length) return false;
    if (materialMode === "checked" && row.materials.some((material) => material.status !== "checked")) return false;
    return true;
  });
}

function allRows() {
  return getRows(subjects);
}

function allMaterials(rows = allRows()) {
  return rows.flatMap((row) => row.materials);
}

function renderSummary() {
  const rows = getRows();
  const materials = allMaterials(rows);
  const learned = rows.filter((row) => row.schoolStatus === "learned").length;
  const tests = rows.filter((row) => row.schoolStatus === "test").length;
  const checked = materials.filter((material) => material.status === "checked").length;
  const unfinished = materials.filter((material) => material.status !== "checked").length;
  const label = activeSubject === "all" ? "全部" : subjects.find((subject) => subject.id === activeSubject)?.label || "";
  const viewLabel = activeView === "scope" ? "範囲設定中" : "残課題";
  elements.summaryLine.textContent = `${viewLabel} | ${label} | 項目 ${rows.length} | 学習済 ${learned} | テスト範囲 ${tests} | 教材OK ${checked} | 教材未 ${unfinished}`;
}

function renderTabs() {
  elements.subjectTabs.innerHTML = "";
  const tabItems = [{ id: "all", label: "全部", icon: "全" }, ...subjects.map(({ id, label }) => ({ id, label, icon: subjectIcon(label) }))];
  tabItems.forEach((subject) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tab-button${activeSubject === subject.id ? " active" : ""}`;
    button.innerHTML = `<span class="tab-icon">${subject.icon}</span><span>${subject.label}</span>`;
    button.addEventListener("click", () => {
      activeSubject = subject.id;
      render();
    });
    elements.subjectTabs.appendChild(button);
  });
}

function updateSchoolFilterOptions() {
  const options = activeView === "tasks"
    ? [["all", "すべて"], ["nextTest", "次回テスト範囲まで"], ["learned", "学習済"], ["test", "テスト範囲"]]
    : [["all", "すべて"], ["unlearned", "未習"], ["learned", "学習済"], ["test", "テスト範囲"]];
  if (!options.some(([id]) => id === schoolFilter)) schoolFilter = options[0][0];
  elements.schoolFilter.innerHTML = "";
  options.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    elements.schoolFilter.appendChild(option);
  });
  elements.schoolFilter.value = schoolFilter;
}

function nextSchoolStatus(status) {
  if (status === "unlearned") return "learned";
  if (status === "learned") return "test";
  return "unlearned";
}

function schoolLabel(status) {
  if (status === "test") return "テスト";
  if (status === "learned") return "済";
  return "未習";
}

function subjectIcon(label) {
  if (label.startsWith("英")) return "英";
  if (label.startsWith("数")) return "数";
  if (label.startsWith("国")) return "国";
  if (label.startsWith("理")) return "理";
  if (label.startsWith("社")) return "社";
  return label.slice(0, 1);
}

function nextMaterialStatus(status) {
  if (status === "empty") return "done";
  if (status === "done") return "checked";
  return "empty";
}

function materialLabel(material) {
  if (material.kind === "memory") {
    if (material.status === "checked") return "OK";
    if (material.status === "done") return "見た";
    return "未";
  }
  if (material.status === "checked") return "丸";
  if (material.status === "done") return "済";
  return "未";
}

function findOriginalRow(rowId) {
  for (const subject of subjects) {
    const row = subject.rows.find((candidate) => candidate.id === rowId);
    if (row) return row;
  }
  return null;
}

function renderBoard() {
  const rows = getVisibleRows();
  elements.visibleCount.textContent = `${rows.length}件`;
  elements.progressBoard.innerHTML = "";

  const list = document.createElement("div");
  list.className = "block-list";
  const renderRows = activeView === "tasks" ? groupTaskRows(rows) : [{ group: "", rows: rows.map((row) => ({ row })) }];
  renderRows.forEach((group) => {
    if (group.group) {
      const title = document.createElement("div");
      title.className = "group-title";
      title.textContent = group.group;
      list.appendChild(title);
    }
    group.rows.forEach((entry) => {
    const row = entry.row;
    const original = findOriginalRow(row.id);
    const block = document.createElement("article");
    block.className = `study-block ${row.schoolStatus} ${activeView}`;

    const header = document.createElement("div");
    header.className = `study-header ${activeView === "tasks" ? "task-header" : ""}`;
    const schoolStatus = document.createElement("span");
    schoolStatus.className = `row-progress ${row.schoolStatus}`;
    schoolStatus.textContent = schoolLabel(row.schoolStatus);

    const schoolButton = document.createElement("button");
    schoolButton.type = "button";
    schoolButton.className = "change-button";
    schoolButton.textContent = "切替";
    schoolButton.addEventListener("click", () => {
      original.schoolStatus = nextSchoolStatus(original.schoolStatus);
      saveState();
      render();
    });

    const titleWrap = document.createElement("div");
    titleWrap.className = "study-title";
    const icon = document.createElement("span");
    icon.className = "subject-badge";
    icon.textContent = subjectIcon(row.subjectLabel);
    const meta = document.createElement("span");
    meta.className = "item-meta-line";
    meta.textContent = activeView === "tasks" ? `${schoolLabel(row.schoolStatus)} / ${activeSubject === "all" ? row.subjectLabel : row.unit}` : (activeSubject === "all" ? `${row.subjectLabel} / ${row.unit}` : row.unit);
    const title = document.createElement("span");
    title.className = "item-title-line";
    title.textContent = row.item;
    titleWrap.append(icon, meta, title);
    header.append(schoolStatus, titleWrap, schoolButton);
    block.appendChild(header);

    if (activeView === "tasks") {
      const materialGrid = document.createElement("div");
      materialGrid.className = "material-grid";
      const materialEntries = row.materials
        .map((material, index) => ({ material, index }))
        .filter(({ material }) => !entry.materialType || material.type === entry.materialType);
      materialEntries.forEach(({ material, index }) => {
        const item = document.createElement("div");
        item.className = `material-check ${material.status} ${material.kind === "memory" ? "memorize" : ""}`;
        item.title = `${material.type} / ${material.unit} / ${material.title}`;

        const type = document.createElement("span");
        type.className = "material-label";
        type.textContent = material.type;
        const state = document.createElement("span");
        state.className = "state";
        state.textContent = materialLabel(material);
        const text = document.createElement("span");
        text.className = "cell-text";
        text.textContent = material.title;
        const sub = document.createElement("span");
        sub.className = "cell-subtext";
        sub.textContent = material.unit || row.unit;
        const change = document.createElement("button");
        change.type = "button";
        change.className = "change-button material-change";
        change.textContent = "切替";
        change.addEventListener("click", () => {
          original.materials[index].status = nextMaterialStatus(original.materials[index].status);
          saveState();
          render();
        });
        item.append(type, state, text, sub, change);
        materialGrid.appendChild(item);
      });

      if (!row.materials.length) {
        const empty = document.createElement("div");
        empty.className = "no-materials";
        empty.textContent = "対応教材なし";
        materialGrid.appendChild(empty);
      }

      block.appendChild(materialGrid);
    }
    list.appendChild(block);
    });
  });
  elements.progressBoard.appendChild(list);
}

function groupTaskRows(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const types = row.materials.length ? [...new Set(row.materials.map((material) => material.type))] : ["対応教材なし"];
    types.forEach((type) => {
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type).push({ row, materialType: type === "対応教材なし" ? null : type });
    });
  });
  return [...groups.entries()].map(([group, groupRows]) => ({ group, rows: groupRows }));
}

function render() {
  renderSummary();
  renderTabs();
  updateSchoolFilterOptions();
  elements.materialFilterWrap.style.display = activeView === "tasks" ? "inline-flex" : "none";
  elements.doneSettingsButton.style.display = activeView === "scope" ? "inline-flex" : "none";
  elements.scopeSettingsButton.style.display = activeView === "tasks" ? "inline-flex" : "none";
  renderBoard();
}

elements.materialFilter.addEventListener("change", render);
elements.schoolFilter.addEventListener("change", () => {
  schoolFilter = elements.schoolFilter.value;
  render();
});

elements.scopeSettingsButton.addEventListener("click", () => {
  activeView = "scope";
  schoolFilter = "all";
  render();
});

elements.doneSettingsButton.addEventListener("click", () => {
  activeView = "tasks";
  schoolFilter = "nextTest";
  render();
});

elements.resetSampleButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  subjects = structuredClone(window.APP_DATA || []);
  render();
});

elements.exportButton.addEventListener("click", async () => {
  const text = JSON.stringify(subjects, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    elements.exportButton.textContent = "コピーしました";
    setTimeout(() => {
      elements.exportButton.textContent = "保存データを書き出す";
    }, 1400);
  } catch {
    const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(text)}`;
    window.open(dataUrl, "_blank");
  }
});

render();
