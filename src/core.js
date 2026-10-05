import { text, array, safeUrl } from "./ui.js";
export const empty = () => ({ tickets: [] });
export function validateTicket(ticket) {
  if (!ticket || !["parked", "active", "done"].includes(ticket.status))
    throw new Error("Invalid ticket state");
  const c = {
    id: text(ticket.id, 100),
    title: text(ticket.title, 120),
    checkpoint: text(ticket.checkpoint, 3000),
    next: text(ticket.next, 1000),
    url: text(ticket.url, 2000),
    minutes: ticket.minutes,
    status: ticket.status,
    createdAt: ticket.createdAt,
    remainingMs: ticket.remainingMs,
    dueAt: ticket.dueAt,
  };
  if (!c.title.trim() || !c.checkpoint.trim() || !c.next.trim())
    throw new Error("A title, checkpoint and next action are required");
  if (c.url && !safeUrl(c.url))
    throw new Error("Use an http/https URL without credentials");
  if (!Number.isInteger(c.minutes) || c.minutes < 1 || c.minutes > 120)
    throw new Error("Use 1–120 whole minutes");
  if (
    !Number.isFinite(c.createdAt) ||
    c.createdAt < 0 ||
    !Number.isFinite(c.remainingMs) ||
    c.remainingMs < 0 ||
    c.remainingMs > 7200000
  )
    throw new Error("Invalid timing data");
  if (
    c.dueAt !== null &&
    (!Number.isFinite(c.dueAt) || c.dueAt < 0 || c.status !== "active")
  )
    throw new Error("Invalid deadline");
  return c;
}
export function validate(data) {
  if (!data) throw new Error("Invalid ticket file");
  const tickets = array(data.tickets, 100).map(validateTicket);
  if (
    new Set(tickets.map((c) => c.id)).size !== tickets.length ||
    tickets.filter((c) => c.status === "active").length > 1
  )
    throw new Error("Duplicate tickets or multiple active sessions");
  return { tickets };
}
export function makeTicket(fields, id, now) {
  return validateTicket({
    ...fields,
    id,
    createdAt: now,
    status: "parked",
    dueAt: null,
    remainingMs: fields.minutes * 60000,
  });
}
export function remaining(ticket, now) {
  return Math.max(
    0,
    ticket.dueAt === null ? ticket.remainingMs : ticket.dueAt - now,
  );
}
export function transition(state, id, action, now) {
  if (!Number.isFinite(now) || now < 0) throw new Error("Invalid clock");
  if (!state.tickets.some((t) => t.id === id))
    throw new Error("Ticket not found");
  if (
    !["activate", "pause", "resume", "park", "reset", "done"].includes(action)
  )
    throw new Error("Invalid action");
  const tickets = state.tickets.map((t) => {
    if (action === "activate" && t.status === "active" && t.id !== id)
      return {
        ...t,
        status: "parked",
        remainingMs: remaining(t, now),
        dueAt: null,
      };
    if (t.id !== id) return { ...t };
    const left = remaining(t, now);
    if (action === "activate")
      return {
        ...t,
        status: "active",
        remainingMs: t.status === "done" ? t.minutes * 60000 : left,
        dueAt: now + (t.status === "done" ? t.minutes * 60000 : left),
      };
    if (action === "done")
      return { ...t, status: "done", remainingMs: left, dueAt: null };
    if (action === "park")
      return { ...t, status: "parked", remainingMs: left, dueAt: null };
    if (t.status !== "active")
      throw new Error("This action needs an active ticket");
    if (action === "pause") return { ...t, remainingMs: left, dueAt: null };
    if (action === "resume") return { ...t, dueAt: now + left };
    return {
      ...t,
      remainingMs: t.minutes * 60000,
      dueAt: now + t.minutes * 60000,
    };
  });
  return validate({ tickets });
}
export function returnNote(ticket) {
  return (
    "# Return Ticket: " +
    ticket.title +
    "\n\nStopped at:\n" +
    ticket.checkpoint +
    "\n\nFirst small action:\n" +
    ticket.next +
    "\n\nOpen: " +
    (ticket.url || "(not set)") +
    "\n\nReturn session: " +
    ticket.minutes +
    " minutes\n"
  );
}
