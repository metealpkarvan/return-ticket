import test from "node:test";
import assert from "node:assert/strict";
import {
  empty,
  validate,
  makeTicket,
  transition,
  remaining,
  returnNote,
} from "../src/core.js";
const fields = {
  title: "Test",
  checkpoint: "At form",
  next: "Add label",
  url: "",
  minutes: 2,
};
const ticket = (id = "1") => makeTicket(fields, id, 1000);
test("empty state valid", () => assert.deepEqual(validate(empty()), empty()));
test("ticket requires checkpoint", () =>
  assert.throws(() => makeTicket({ ...fields, checkpoint: "" }, "1", 1)));
test("duration must be whole minutes", () =>
  assert.throws(() => makeTicket({ ...fields, minutes: 1.5 }, "1", 1)));
test("active session gets absolute deadline", () =>
  assert.equal(
    transition({ tickets: [ticket()] }, "1", "activate", 1000).tickets[0].dueAt,
    121000,
  ));
test("wall clock survives long frame gap", () => {
  const c = transition({ tickets: [ticket()] }, "1", "activate", 1000)
    .tickets[0];
  assert.equal(remaining(c, 61000), 60000);
});
test("remaining never negative", () =>
  assert.equal(remaining({ ...ticket(), dueAt: 100 }, 1000), 0));
test("pause freezes remaining", () => {
  let s = transition({ tickets: [ticket()] }, "1", "activate", 1000);
  s = transition(s, "1", "pause", 31000);
  assert.equal(remaining(s.tickets[0], 90000), 90000);
});
test("resume uses frozen remainder", () => {
  let s = transition({ tickets: [ticket()] }, "1", "activate", 1000);
  s = transition(s, "1", "pause", 31000);
  s = transition(s, "1", "resume", 91000);
  assert.equal(s.tickets[0].dueAt, 181000);
});
test("switching tickets parks previous active", () => {
  let s = transition(
    { tickets: [ticket("1"), ticket("2")] },
    "1",
    "activate",
    1000,
  );
  s = transition(s, "2", "activate", 31000);
  assert.equal(s.tickets[0].status, "parked");
  assert.equal(s.tickets[0].remainingMs, 90000);
  assert.equal(s.tickets[1].status, "active");
});
test("reset starts a full new session", () => {
  let s = transition({ tickets: [ticket()] }, "1", "activate", 1000);
  s = transition(s, "1", "reset", 61000);
  assert.equal(remaining(s.tickets[0], 61000), 120000);
});
test("completed ticket reopens with fresh time", () => {
  let s = transition({ tickets: [ticket()] }, "1", "done", 1000);
  s = transition(s, "1", "activate", 90000);
  assert.equal(remaining(s.tickets[0], 90000), 120000);
});
test("multiple active tickets rejected", () =>
  assert.throws(() =>
    validate({
      tickets: [
        { ...ticket("1"), status: "active" },
        { ...ticket("2"), status: "active" },
      ],
    }),
  ));
test("duplicate IDs rejected", () =>
  assert.throws(() => validate({ tickets: [ticket(), ticket()] })));
test("deadline on parked ticket rejected", () =>
  assert.throws(() => validate({ tickets: [{ ...ticket(), dueAt: 10000 }] })));
test("unsafe URL rejected", () =>
  assert.throws(() =>
    makeTicket({ ...fields, url: "javascript:alert(1)" }, "1", 1),
  ));
test("note contains exact return action", () =>
  assert.ok(returnNote(ticket()).includes("Add label")));
test("unknown action rejected", () =>
  assert.throws(() => transition({ tickets: [ticket()] }, "1", "jump", 1)));
test("missing ticket rejected", () =>
  assert.throws(() => transition(empty(), "no", "activate", 1)));
