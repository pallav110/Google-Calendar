// End-to-end test of the live Calora API: register -> auth -> event lifecycle.
const B = process.env.BASE || "https://calora-calendar.vercel.app";
const jar = new Map();

function storeCookies(res) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
}
const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");

let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ FAIL: ${name} ${extra}`); }
}

async function req(method, path, body, form = false) {
  const headers = { cookie: cookieHeader() };
  let payload;
  if (form) { headers["content-type"] = "application/x-www-form-urlencoded"; payload = new URLSearchParams(body).toString(); }
  else if (body) { headers["content-type"] = "application/json"; payload = JSON.stringify(body); }
  const res = await fetch(B + path, { method, headers, body: payload, redirect: "manual" });
  storeCookies(res);
  return res;
}

const email = `calora-e2e-${Date.now()}@example.com`;
const password = "testpass123";

console.log(`\nTarget: ${B}`);
console.log(`Test user: ${email}\n`);

console.log("── Auth flow ──");
let r = await req("POST", "/api/register", { name: "E2E", email, password });
check("register new user -> 201", r.status === 201, `(got ${r.status})`);

r = await req("GET", "/api/auth/csrf");
const { csrfToken } = await r.json();
check("fetch CSRF token", Boolean(csrfToken));

await req("POST", "/api/auth/callback/credentials", { csrfToken, email, password, callbackUrl: B }, true);
r = await req("GET", "/api/auth/session");
const session = await r.json();
check("authenticated session established", session?.user?.email === email, `(got ${JSON.stringify(session)})`);

console.log("\n── Unauthorized guard ──");
{
  const res = await fetch(B + "/api/events?from=2026-06-01T00:00:00.000Z&to=2026-06-30T23:59:59.000Z", { redirect: "manual" });
  check("no-cookie request to /api/events -> 401", res.status === 401, `(got ${res.status})`);
}

const FROM = "2026-06-01T00:00:00.000Z";
const TO = "2026-06-30T23:59:59.000Z";
const list = async () => (await (await req("GET", `/api/events?from=${FROM}&to=${TO}`)).json()).events;

console.log("\n── Event creation ──");
r = await req("POST", "/api/events", {
  title: "E2E One-off", start: "2026-06-27T09:00:00.000Z", end: "2026-06-27T10:00:00.000Z",
  allDay: false, color: "blue", timezone: "Asia/Kolkata",
});
check("create one-off event -> 201", r.status === 201, `(got ${r.status})`);

r = await req("POST", "/api/events", {
  title: "E2E Weekly", start: "2026-06-01T05:00:00.000Z", end: "2026-06-01T05:30:00.000Z",
  allDay: false, color: "green", timezone: "UTC", rrule: "FREQ=WEEKLY",
});
const weekly = (await r.json()).event;
check("create recurring (weekly) event -> 201", r.status === 201, `(got ${r.status})`);

console.log("\n── Guests + reminders ──");
r = await req("POST", "/api/events", {
  title: "E2E Guests", start: "2026-06-10T05:00:00.000Z", end: "2026-06-10T06:00:00.000Z",
  allDay: false, color: "red", timezone: "UTC",
  guests: "alice@example.com,bob@example.com", reminderMinutes: 30,
});
const guestEv = (await r.json()).event;
check("create event with guests + reminder -> 201", r.status === 201, `(got ${r.status})`);
{
  const found = (await list()).find((e) => e.title === "E2E Guests");
  check("guests persisted round-trip", found?.guests === "alice@example.com,bob@example.com", `(got ${found?.guests})`);
  check("reminderMinutes persisted round-trip", found?.reminderMinutes === 30, `(got ${found?.reminderMinutes})`);
}
await req("DELETE", `/api/events/${guestEv.id}?scope=all`);
check("guests event cleaned up", !(await list()).some((e) => e.title === "E2E Guests"));

console.log("\n── Read + recurrence expansion ──");
let events = await list();
const oneOffs = events.filter((e) => e.title === "E2E One-off");
const weeklies = events.filter((e) => e.title === "E2E Weekly");
check("one-off returned exactly once", oneOffs.length === 1, `(got ${oneOffs.length})`);
check("weekly expanded to 5 June occurrences", weeklies.length === 5, `(got ${weeklies.length})`);
check("timestamps are UTC ISO (Z-suffixed)", events.every((e) => e.start.endsWith("Z")));
check("occurrenceStart unique across weekly series", new Set(weeklies.map((w) => w.occurrenceStart)).size === 5);

console.log("\n── Edit a single recurring instance ──");
const target = weeklies.find((w) => w.occurrenceStart === "2026-06-08T05:00:00.000Z");
r = await req("PATCH", `/api/events/${weekly.id}`, {
  title: "E2E Weekly (moved)", start: "2026-06-08T09:00:00.000Z", end: "2026-06-08T09:30:00.000Z",
  allDay: false, color: "green", timezone: "UTC", rrule: "FREQ=WEEKLY",
  scope: "single", occurrenceStart: target.occurrenceStart, overrideId: target.overrideId,
});
check("patch single occurrence -> ok", r.ok, `(got ${r.status})`);
events = await list();
const moved = events.find((e) => e.occurrenceStart === "2026-06-08T05:00:00.000Z");
check("series still has 5 occurrences after single edit", events.filter((e) => e.title.startsWith("E2E Weekly")).length === 5);
check("edited instance moved to 09:00 UTC", moved && new Date(moved.start).getUTCHours() === 9, `(got ${moved && moved.start})`);
check("edited instance title applied to that one only", moved?.title === "E2E Weekly (moved)");
check("other instances unchanged", events.some((e) => e.title === "E2E Weekly" && e.occurrenceStart === "2026-06-15T05:00:00.000Z"));

console.log("\n── Delete a single recurring instance ──");
const toCancel = events.find((e) => e.occurrenceStart === "2026-06-22T05:00:00.000Z");
r = await req("DELETE", `/api/events/${weekly.id}?scope=single&occurrenceStart=${encodeURIComponent(toCancel.occurrenceStart)}`);
check("delete single occurrence -> ok", r.ok, `(got ${r.status})`);
events = await list();
check("series now has 4 occurrences", events.filter((e) => e.title.startsWith("E2E Weekly")).length === 4);
check("cancelled Jun-22 instance is gone", !events.some((e) => e.occurrenceStart === "2026-06-22T05:00:00.000Z"));

console.log("\n── Cleanup (delete whole series + one-off) ──");
r = await req("DELETE", `/api/events/${weekly.id}?scope=all`);
check("delete whole series -> ok", r.ok, `(got ${r.status})`);
const oneOff = (await list()).find((e) => e.title === "E2E One-off");
if (oneOff) {
  r = await req("DELETE", `/api/events/${oneOff.seriesId}?scope=all`);
  check("delete one-off -> ok", r.ok, `(got ${r.status})`);
}
events = await list();
check("calendar empty after cleanup", events.length === 0, `(got ${events.length})`);

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
