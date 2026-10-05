import {
  $,
  esc,
  t,
  uid,
  init,
  notify,
  load,
  save,
  backup,
  bindImport,
  copy,
  safeUrl,
} from "./ui.js";
import {
  empty,
  validate,
  makeTicket,
  transition,
  remaining,
  returnNote,
} from "./core.js";
const KEY = "return-ticket:v1";
let state = load(KEY, empty(), validate),
  editing = null;
function clock() {
  const active = state.tickets.find((c) => c.status === "active");
  if (!active || !$("clock")) return;
  const seconds = Math.ceil(remaining(active, Date.now()) / 1000);
  $("clock").textContent =
    String(Math.floor(seconds / 60)).padStart(2, "0") +
    ":" +
    String(seconds % 60).padStart(2, "0");
  $("clock-state").textContent =
    seconds === 0
      ? t(
          "Tur bitti. Sonraki adımını gözden geçir.",
          "Session ended. Review your next step.",
        )
      : active.dueAt === null
        ? t("Duraklatıldı", "Paused")
        : t("Dönüş turu sürüyor", "Return session running");
}
function render() {
  const c = state.tickets.find((c) => c.status === "active");
  $("active").innerHTML = c
    ? '<article class="ticket"><div class="ticket-head"><div class="eyebrow ticket-eyebrow">RETURN / ' +
      esc(c.id.slice(0, 8)) +
      "</div><h2>" +
      esc(c.title) +
      '</h2></div><div class="ticket-body"><div class="timer" id="clock"></div><p id="clock-state" class="hint"></p><h3>' +
      t("Kaldığın nokta", "Checkpoint") +
      "</h3><p>" +
      esc(c.checkpoint) +
      "</p><h3>" +
      t("İlk hareket", "First action") +
      "</h3><p>" +
      esc(c.next) +
      "</p>" +
      (safeUrl(c.url)
        ? '<a href="' +
          esc(safeUrl(c.url)) +
          '" target="_blank" rel="noopener noreferrer">' +
          t("Çalışma alanını aç", "Open workspace") +
          " ↗</a>"
        : "") +
      '</div><div class="stub actions"><button data-action="' +
      (c.dueAt === null ? "resume" : "pause") +
      '" data-id="' +
      esc(c.id) +
      '">' +
      (c.dueAt === null ? t("Devam", "Resume") : t("Duraklat", "Pause")) +
      '</button><button data-action="reset" data-id="' +
      esc(c.id) +
      '">' +
      t("Yeni tur", "Fresh session") +
      '</button><button data-action="park" data-id="' +
      esc(c.id) +
      '">' +
      t("Tekrar bırak", "Park again") +
      '</button><button class="primary" data-action="done" data-id="' +
      esc(c.id) +
      '">' +
      t("Tamamlandı", "Complete") +
      '</button><button data-copy="' +
      esc(c.id) +
      '">' +
      t("Dönüş notunu kopyala", "Copy return note") +
      "</button></div></article>"
    : '<div class="panel empty"><div class="number">↩</div><h2>' +
      t("Dönüş kapısı açık", "Your return gate is ready") +
      "</h2><p>" +
      t(
        "Bir bilet bırak veya aşağıdaki işlerden birine dön. Burada tek bir sonraki hareket görünür.",
        "Park a ticket or resume one below. One next action will appear here.",
      ) +
      "</p></div>";
  const visible = state.tickets.filter(
    (c) =>
      c.status !== "active" && ($("show-done").checked || c.status !== "done"),
  );
  $("tickets").innerHTML =
    visible
      .map(
        (c) =>
          '<article class="record"><div class="meta"><span>' +
          t(
            c.status === "done" ? "Tamamlandı" : "Bırakıldı",
            c.status === "done" ? "Completed" : "Parked",
          ) +
          "</span><span>" +
          c.minutes +
          " min</span></div><h3>" +
          esc(c.title) +
          "</h3><p>" +
          esc(c.next) +
          '</p><div class="actions"><button class="primary" data-action="activate" data-id="' +
          esc(c.id) +
          '">' +
          t(
            c.status === "done" ? "Yeniden aç" : "İşe dön",
            c.status === "done" ? "Reopen" : "Return",
          ) +
          '</button><button data-edit="' +
          esc(c.id) +
          '">' +
          t("Düzenle", "Edit") +
          '</button><button class="quiet danger" data-delete="' +
          esc(c.id) +
          '">' +
          t("Sil", "Delete") +
          "</button></div></article>",
      )
      .join("") ||
    '<div class="empty wide">' +
      t("Bu görünümde bilet yok.", "No tickets in this view.") +
      "</div>";
  clock();
}
function action(event) {
  const b = event.target.closest("button");
  if (!b) return;
  if (b.dataset.action) {
    try {
      state = transition(state, b.dataset.id, b.dataset.action, Date.now());
      save(KEY, state);
      render();
    } catch (error) {
      notify(error.message);
    }
  }
  if (b.dataset.copy)
    copy(returnNote(state.tickets.find((c) => c.id === b.dataset.copy)));
  if (b.dataset.delete) {
    state.tickets = state.tickets.filter((c) => c.id !== b.dataset.delete);
    save(KEY, state);
    render();
  }
  if (b.dataset.edit) {
    const c = state.tickets.find((c) => c.id === b.dataset.edit);
    editing = c.id;
    for (const k of ["title", "checkpoint", "next", "url", "minutes"])
      $(k).value = c[k];
    $("cancel-edit").hidden = false;
    $("add").textContent = t("Bileti güncelle", "Update ticket");
    $("title").focus();
  }
}
$("active").onclick = action;
$("tickets").onclick = action;
$("show-done").onchange = render;
function reset() {
  editing = null;
  $("ticket-form").reset();
  $("cancel-edit").hidden = true;
  $("add").textContent = t("Bileti bırak", "Park ticket");
}
$("cancel-edit").onclick = reset;
$("ticket-form").onsubmit = (event) => {
  event.preventDefault();
  try {
    if (!editing && state.tickets.length >= 100)
      throw new Error("Maximum 100 tickets");
    const fields = {};
    for (const k of ["title", "checkpoint", "next", "url"])
      fields[k] = $(k).value.trim();
    fields.minutes = Number($("minutes").value);
    const c = makeTicket(fields, editing || uid(), Date.now());
    if (editing) {
      const old = state.tickets.find((c) => c.id === editing);
      c.createdAt = old.createdAt;
      c.status = old.status;
      c.remainingMs =
        old.minutes === c.minutes
          ? remaining(old, Date.now())
          : c.minutes * 60000;
      state.tickets = state.tickets.map((old) =>
        old.id === editing ? c : old,
      );
    } else state.tickets.push(c);
    save(KEY, state);
    reset();
    render();
  } catch (error) {
    notify(error.message);
  }
};
$("backup").onclick = () => backup("return-ticket", state);
function apply(next) {
  state = next;
  reset();
  save(KEY, state);
  render();
}
bindImport("return-ticket", validate, apply);
$("clear").onclick = () => {
  if (confirm(t("Tüm biletler silinsin mi?", "Clear all tickets?")))
    apply(empty());
};
$("demo").onclick = () => {
  if (
    state.tickets.length &&
    !confirm(
      t(
        "Kurgusal örnekle değiştirilsin mi?",
        "Replace with a fictional sample?",
      ),
    )
  )
    return;
  const now = Date.now();
  const tickets = [
    makeTicket(
      {
        title: "Seed library page",
        checkpoint:
          "The availability form is drawn. Validation is still missing.",
        next: "Add an empty-name error to the form.",
        url: "",
        minutes: 12,
      },
      uid(),
      now,
    ),
    makeTicket(
      {
        title: "Weekend trip",
        checkpoint: "Two possible routes are saved.",
        next: "Compare the last bus times.",
        url: "",
        minutes: 8,
      },
      uid(),
      now,
    ),
  ];
  apply(transition({ tickets }, tickets[0].id, "activate", now));
};
setInterval(clock, 1000);
init(render);
