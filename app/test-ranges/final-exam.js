(() => {
  const exam = window.FINAL_EXAM;
  const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const dayLabel = (date) => exam.schedule.find((day) => day.date === date).label;
  const subjectLink = (name) => {
    const subject = exam.subjects.find((entry) => entry.name === name);
    return subject ? `<a href="#exam-${subject.id}">${escape(name)}</a>` : escape(name);
  };

  document.querySelector("#examSchedule").innerHTML = exam.schedule.map((day) => `
    <tr><th scope="row"><time datetime="${day.date}">${escape(day.label)}</time></th>
    ${day.periods.map((name) => `<td>${subjectLink(name)}</td>`).join("")}<td>あり</td></tr>
  `).join("");

  document.querySelector("#examSubjectLinks").innerHTML = exam.subjects.map((subject) =>
    `<a href="#exam-${subject.id}">${escape(subject.name)}</a>`).join("");

  document.querySelector("#examSubjects").innerHTML = exam.subjects.map((subject) => `
    <article class="exam-card" id="exam-${subject.id}" aria-labelledby="exam-title-${subject.id}">
      <header class="exam-card-header"><h3 id="exam-title-${subject.id}">${escape(subject.name)}</h3>
        <span>${escape(dayLabel(subject.date))} ${subject.period}限</span></header>
      <h4>テスト範囲</h4>
      <dl class="exam-ranges">${subject.ranges.map((range) =>
        `<div><dt>${escape(range.label)}</dt><dd>${escape(range.text)}</dd></div>`).join("")}</dl>
      ${subject.submissions.length ? `<section class="exam-submissions"><h4>提出物・締め切り</h4><ul>${subject.submissions.map((submission) => `
        <li><strong>${escape(submission.title)}</strong><p>${escape(submission.text)}</p>
          ${submission.warning ? `<p class="exam-warning"><strong>要確認</strong> ${escape(submission.warning)}</p>` : ""}</li>
      `).join("")}</ul></section>` : ""}
      ${subject.reminders.length ? `<section class="exam-reminders"><h4>持ち物・注意</h4><ul>${subject.reminders.map((note) => `<li>${escape(note)}</li>`).join("")}</ul></section>` : ""}
    </article>
  `).join("");
})();
