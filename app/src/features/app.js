const STORAGE_KEY = "myhomework-task-overrides-v2";
const RANGE_MIDTERM = "\u0031\u5b66\u671f\u4e2d\u9593";
const RANGE_FINAL = "\u0031\u5b66\u671f\u671f\u672b";
const LABELS = {
  remaining: "\u672a\u5b8c\u4e86",
  completed: "\u5b8c\u4e86",
  remainingTasks: "\u6b8b\u3063\u3066\u3044\u308b\u8ab2\u984c",
  allTasks: "\u5b8c\u4e86\u542b\u3080\u8ab2\u984c",
  lessonScope: "\u6388\u696d\u6e08\u307f\u307e\u3067",
  finalScope: "\u671f\u672b\u7bc4\u56f2\u307e\u3067",
  finalOnly: "\u0031\u5b66\u671f\u671f\u672b\u306e\u307f",
  finalWithMidterm: "\u0031\u5b66\u671f\u671f\u672b\u002b\u0031\u5b66\u671f\u4e2d\u9593",
  todayOnly: "\u4eca\u65e5\u3084\u308b\u3084\u3064",
  today: "\u4eca\u65e5",
  unset: "\u672a\u8a2d\u5b9a",
  noTaskName: "\u8ab2\u984c\u540d\u306a\u3057",
  noMatch: "\u8a72\u5f53\u3059\u308b\u8ab2\u984c\u306f\u3042\u308a\u307e\u305b\u3093\u3002",
  itemUnit: "\u4ef6",
  status: "\u72b6\u614b",
  subject: "\u79d1\u76ee",
  scope: "\u7bc4\u56f2",
  testRange: "\u30c6\u30b9\u30c8\u7bc4\u56f2",
  textbookRange: "\u6559\u79d1\u66f8\u7bc4\u56f2",
  material: "\u6559\u6750",
  task: "\u8ab2\u984c",
  csvName: "\u5b66\u7fd2\u8ab2\u984c\u30ea\u30b9\u30c8.csv",
};

let items = applySavedStatus(normalizedHomeworkItems());

const elements = {
  scopeLesson: document.querySelector("#scopeLesson"),
  scopeFinal: document.querySelector("#scopeFinal"),
  completionRemaining: document.querySelector("#completionRemaining"),
  completionToday: document.querySelector("#completionToday"),
  completionAll: document.querySelector("#completionAll"),
  includeMidterm: document.querySelector("#includeMidterm"),
  visibleCount: document.querySelector("#visibleCount"),
  todayCount: document.querySelector("#todayCount"),
  remainingCount: document.querySelector("#remainingCount"),
  completedCount: document.querySelector("#completedCount"),
  rangeCount: document.querySelector("#rangeCount"),
  totalCount: document.querySelector("#totalCount"),
  listTitle: document.querySelector("#listTitle"),
  listSubtitle: document.querySelector("#listSubtitle"),
  taskList: document.querySelector("#taskList"),
};

function applySavedStatus(source) {
  const saved = readSavedStatus();
  return source.map((item) => ({ ...item, status: saved[item.id] || item.status }));
}

function normalizedHomeworkItems() {
  if (Array.isArray(window.HOMEWORK_ITEMS)) return window.HOMEWORK_ITEMS;
  if (!Array.isArray(window.APP_DATA)) return [];

  return window.APP_DATA.flatMap((subject) =>
    (subject.rows || []).flatMap((row) => {
      const materials = row.materials && row.materials.length ? row.materials : [{ id: row.id, type: "", title: row.item, status: "empty" }];
      return materials.map((material, index) => ({
        id: material.id || `${row.id}-${index}`,
        subject: subject.label || subject.id || "",
        lessonProgress: row.schoolStatus === "unlearned" ? "notYet" : "done",
        lessonProgressRaw: row.schoolStatus || "",
        textbook: row.unit || "",
        textbookRange: row.item || "",
        testRange: "",
        material: [material.type, material.unit].filter(Boolean).join(" "),
        task: material.title || row.item || "",
        status: material.status === "done" || material.status === "checked" ? "completed" : "remaining",
        rawStatus: material.status || "",
        plannedDate: "",
      }));
    })
  );
}

function readSavedStatus() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStatuses() {
  const changed = {};
  for (const item of items) changed[item.id] = item.status;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(changed));
}

function subjects() {
  return [...new Set(items.map((item) => item.subject).filter(Boolean))];
}

function subjectClass(subject) {
  const index = subjects().indexOf(subject);
  return [
    "subject-english",
    "subject-japanese",
    "subject-science",
    "subject-math",
    "subject-geography",
    "subject-history",
    "subject-practical",
    "subject-other",
  ][index] || "subject-default";
}

function statusLabel(status) {
  return status === "completed" ? LABELS.completed : LABELS.remaining;
}

function currentFilters() {
  return {
    scope: elements.scopeLesson.checked ? "lesson" : "final",
    completion: elements.completionToday.checked ? "today" : elements.completionRemaining.checked ? "remaining" : "all",
    includeMidterm: elements.includeMidterm.checked,
  };
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isPlannedToday(item) {
  return item.plannedDate === todayKey() && item.status === "remaining";
}

function scopeMatches(item, filters) {
  if (filters.scope === "lesson") return item.lessonProgress === "done";
  const isFinalRange = item.testRange === RANGE_FINAL;
  const isMidtermRange = item.testRange === RANGE_MIDTERM;
  return isFinalRange || (filters.includeMidterm && isMidtermRange);
}

function scopedItems() {
  const filters = currentFilters();
  return items.filter((item) => scopeMatches(item, filters));
}

function filteredItems() {
  const filters = currentFilters();
  return scopedItems().filter((item) => {
    if (filters.completion === "today") return isPlannedToday(item);
    return filters.completion === "all" || item.status === "remaining";
  });
}

function renderSummary(visible) {
  const scoped = scopedItems();
  const remaining = scoped.filter((item) => item.status === "remaining").length;
  const completed = scoped.filter((item) => item.status === "completed").length;
  const today = scoped.filter(isPlannedToday).length;
  elements.visibleCount.textContent = visible.length;
  elements.todayCount.textContent = today;
  elements.remainingCount.textContent = remaining;
  elements.completedCount.textContent = completed;
  elements.rangeCount.textContent = new Set(scoped.map((item) => item.testRange).filter(Boolean)).size;
  elements.totalCount.textContent = `${scoped.length}${LABELS.itemUnit}`;
}

function renderList(visible) {
  const filters = currentFilters();
  const scopeText = filters.scope === "lesson" ? LABELS.lessonScope : LABELS.finalScope;
  const completionText = filters.completion === "today" ? LABELS.todayOnly : filters.completion === "remaining" ? LABELS.remainingTasks : LABELS.allTasks;
  const midtermText = filters.scope === "final" ? ` / ${filters.includeMidterm ? LABELS.finalWithMidterm : LABELS.finalOnly}` : "";
  elements.listTitle.textContent = completionText;
  elements.listSubtitle.textContent = `${scopeText}${midtermText} / ${visible.length}${LABELS.itemUnit}`;

  if (!visible.length) {
    elements.taskList.className = "task-list empty";
    elements.taskList.textContent = LABELS.noMatch;
    return;
  }

  elements.taskList.className = "task-list row-mode";
  elements.taskList.innerHTML = groupedMarkup(visible);
}

function groupedMarkup(visible) {
  return subjects()
    .map((subject) => {
      const subjectItems = visible.filter((item) => item.subject === subject);
      if (!subjectItems.length) return "";
      const remaining = subjectItems.filter((item) => item.status === "remaining").length;
      return `
        <section class="subject-section ${subjectClass(subject)}">
          <header class="subject-heading">
            <span>${escapeHtml(subject)}</span>
            <b>${remaining}</b>
          </header>
          <div class="subject-rows">
            ${subjectItems.map(rowMarkup).join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function rowMarkup(item) {
  return `
    <article class="task-row ${subjectClass(item.subject)} ${item.status}">
      <button class="status-button ${item.status}" data-id="${escapeHtml(item.id)}" type="button">${statusLabel(item.status)}</button>
      <span class="range-pill ${isPlannedToday(item) ? "today" : ""}">${escapeHtml(scopeLabel(item))}</span>
      <span class="book-name">${escapeHtml(item.material || LABELS.unset)}</span>
      <span class="task-name">${escapeHtml(item.task || LABELS.noTaskName)}</span>
      <span class="textbook-range">${escapeHtml(item.textbookRange || LABELS.unset)}</span>
      <span class="test-range">${escapeHtml(item.testRange || LABELS.unset)}</span>
    </article>
  `;
}

function scopeLabel(item) {
  if (isPlannedToday(item)) return LABELS.today;
  if (item.lessonProgress === "done") return LABELS.lessonScope;
  return item.testRange || LABELS.unset;
}

function render() {
  const visible = filteredItems();
  renderSummary(visible);
  renderList(visible);
}

function toggleStatus(id) {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) return;
  item.status = item.status === "completed" ? "remaining" : "completed";
  saveStatuses();
  render();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelectorAll('input[name="scopeMode"], input[name="completionMode"]').forEach((input) => {
  input.addEventListener("change", render);
});
elements.includeMidterm.addEventListener("change", render);
elements.taskList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-id]");
  if (!button) return;
  toggleStatus(button.dataset.id);
});

render();
