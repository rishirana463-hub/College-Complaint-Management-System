import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app.js";
import { seedTestWorkspace } from "./fixtures.js";
import { verifyGoogleIdentity } from "../services/googleIdentity.js";
import User from "../models/User.js";
const nativeFetch = globalThis.fetch;
let memory, server, url, fixtures;
const tokens = {};
async function request(path, { method = "GET", body, token } = {}) {
  const result = await nativeFetch(url + "/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: result.status, data: await result.json() };
}
before(async () => {
  process.env.JWT_SECRET = "isolated-integration-test-secret";
  process.env.EMAIL_ENABLED = "false";
  memory = await MongoMemoryServer.create();
  await mongoose.connect(memory.getUri("campusdesk-api-tests"));
  fixtures = await seedTestWorkspace();
  server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  url = "http://127.0.0.1:" + server.address().port;
  for (const [role, email, password] of [
    ["student", "rahul@test.college", "student123"],
    ["admin", "admin@test.college", "admin123"],
    ["faculty", "faculty@test.college", "faculty123"],
    ["other", "other@test.college", "faculty123"],
  ]) {
    const login = await request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    assert.equal(login.status, 200);
    tokens[role] = login.data.token;
  }
});
after(async () => {
  globalThis.fetch = nativeFetch;
  server?.closeAllConnections();
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await memory?.stop();
});
test("public registration always creates a student and returns a safe profile", async () => {
  const response = await request("/auth/register", {
    method: "POST",
    body: {
      name: "New Student",
      email: "new@test.college",
      password: "student123",
      role: "admin",
    },
  });
  assert.equal(response.status, 201);
  assert.equal(response.data.user.role, "student");
  const profile = await request("/auth/profile", {
    token: response.data.token,
  });
  assert.equal(profile.data.email, "new@test.college");
  assert.equal(profile.data.password, undefined);
  assert.equal(profile.data.supabaseId, undefined);
});
test("invalid credentials, malformed input, and expired sessions fail cleanly", async () => {
  assert.equal(
    (
      await request("/auth/login", {
        method: "POST",
        body: { email: "rahul@test.college", password: "wrong" },
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request("/auth/login", {
        method: "POST",
        body: { email: { $ne: null }, password: "student123" },
      })
    ).status,
    400,
  );
  assert.equal(
    (await request("/auth/profile", { token: "invalid" })).status,
    401,
  );
  assert.equal((await request("/tickets")).status, 401);
});
test("student and faculty scopes hold for lists, private details, updates, and comments", async () => {
  const privateTicket = fixtures.tickets.find(
    (ticket) => ticket.category === "Faculty",
  );
  assert.equal(
    (await request("/tickets", { token: tokens.faculty })).data.length,
    1,
  );
  assert.equal(
    (await request("/tickets", { token: tokens.other })).data.length,
    0,
  );
  assert.equal(
    (await request("/tickets/" + privateTicket._id, { token: tokens.other }))
      .status,
    403,
  );
  assert.equal(
    (
      await request("/tickets/" + privateTicket._id, {
        method: "PUT",
        body: { status: "Resolved" },
        token: tokens.other,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/tickets/" + privateTicket._id + "/comments", {
        method: "POST",
        body: { message: "unauthorized" },
        token: tokens.other,
      })
    ).status,
    403,
  );
  assert.equal(
    (await request("/tickets/summary/admin", { token: tokens.student })).status,
    403,
  );
  assert.equal(
    (await request("/tickets/summary/admin", { token: tokens.admin })).status,
    200,
  );
});
test("complaint creation, filtering, management, and replies still work", async () => {
  const created = await request("/tickets", {
    method: "POST",
    token: tokens.student,
    body: {
      title: "Test network issue",
      description: "A detailed test report",
      category: "IT",
    },
  });
  assert.equal(created.status, 201);
  const id = created.data._id;
  assert.equal(
    (
      await request("/tickets?search=Test%20network&category=IT", {
        token: tokens.student,
      })
    ).data.length,
    1,
  );
  const updated = await request("/tickets/" + id, {
    method: "PUT",
    token: tokens.admin,
    body: { status: "In Progress", priority: "High" },
  });
  assert.equal(updated.data.status, "In Progress");
  assert.equal(updated.data.priority, "High");
  const reply = await request("/tickets/" + id + "/comments", {
    method: "POST",
    token: tokens.student,
    body: { message: "More details" },
  });
  assert.equal(reply.data.comments.at(-1).message, "More details");
  assert.equal(
    (await request("/tickets/" + id, { method: "DELETE", token: tokens.admin }))
      .status,
    200,
  );
});
test("faculty assignment is required and validated", async () => {
  assert.equal(
    (
      await request("/tickets", {
        method: "POST",
        token: tokens.student,
        body: {
          title: "Question",
          description: "Details",
          category: "Faculty",
        },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/tickets", {
        method: "POST",
        token: tokens.student,
        body: {
          title: "Question",
          description: "Details",
          category: "Faculty",
          assignedFaculty: fixtures.student._id,
        },
      })
    ).status,
    400,
  );
});
test("search treats punctuation literally rather than executing a user regex", async () => {
  const response = await request("/tickets?search=%5B", {
    token: tokens.student,
  });
  assert.equal(response.status, 200);
  assert.deepEqual(response.data, []);
  assert.equal(
    (
      await request("/tickets?search%5B%24ne%5D=test", {
        token: tokens.student,
      })
    ).status,
    400,
  );
});
test("Google verification rejects missing configuration, unverified identities and expired tokens", async () => {
  await assert.rejects(verifyGoogleIdentity("token", { url: "", key: "" }), {
    status: 503,
  });
  await assert.rejects(
    verifyGoogleIdentity("token", {
      url: "https://auth.test",
      key: "public",
      fetchImpl: async () => ({ ok: false, status: 401 }),
    }),
    { status: 401 },
  );
  await assert.rejects(
    verifyGoogleIdentity("token", {
      url: "https://auth.test",
      key: "public",
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({
          id: "id",
          email: "user@test.college",
          email_confirmed_at: new Date().toISOString(),
          identities: [{ provider: "email" }],
        }),
      }),
    }),
    { status: 401 },
  );
});
test("verified Google sign-in provisions once, persists roles, and requires ownership to link", async () => {
  process.env.SUPABASE_URL = "https://auth.example.test";
  process.env.SUPABASE_PUBLISHABLE_KEY = "public-test-key";
  const identityFor = (id, email) => ({
    id,
    email,
    email_confirmed_at: new Date().toISOString(),
    identities: [
      {
        provider: "google",
        identity_data: {
          email,
          email_verified: true,
          full_name: "Google Student",
        },
      },
    ],
  });
  const identities = {
    fresh: identityFor("google-new-id", "google@test.college"),
    existing: identityFor("google-admin-id", "admin@test.college"),
  };
  globalThis.fetch = async (target, options) => {
    if (String(target).startsWith(process.env.SUPABASE_URL)) {
      const identity =
        identities[options.headers.Authorization.replace("Bearer ", "")];
      return {
        ok: Boolean(identity),
        status: identity ? 200 : 401,
        json: async () => identity,
      };
    }
    return nativeFetch(target, options);
  };
  const first = await request("/auth/google", {
    method: "POST",
    body: { accessToken: "fresh", role: "admin" },
  });
  assert.equal(first.status, 200);
  assert.equal(first.data.user.role, "student");
  assert.equal(first.data.user.googleConnected, true);
  const second = await request("/auth/google", {
    method: "POST",
    body: { accessToken: "fresh" },
  });
  assert.equal(first.data.user.id, second.data.user.id);
  assert.equal(await User.countDocuments({ supabaseId: "google-new-id" }), 1);
  assert.equal(
    (await request("/auth/profile", { token: first.data.token })).status,
    200,
  );
  assert.equal(
    (
      await request("/auth/google", {
        method: "POST",
        body: { accessToken: "existing" },
      })
    ).status,
    409,
  );
  const linked = await request("/auth/google", {
    method: "POST",
    body: { accessToken: "existing" },
    token: tokens.admin,
  });
  assert.equal(linked.status, 200);
  assert.equal(linked.data.user.role, "admin");
  assert.equal(
    (
      await request("/auth/google", {
        method: "POST",
        body: { accessToken: "expired" },
      })
    ).status,
    401,
  );
  globalThis.fetch = nativeFetch;
});

test("deadlines and status changes are audited, and reopening clears resolution time", async () => {
  const created = await request("/tickets", {
    method: "POST",
    token: tokens.student,
    body: {
      title: "Audited request",
      description: "The room needs a repair",
      category: "Infrastructure",
      location: "Block B, room 201",
    },
  });
  assert.equal(created.status, 201);
  const id = created.data._id;
  assert.equal(created.data.activity[0].kind, "created");
  assert.equal(created.data.location, "Block B, room 201");
  const deadline = "2025-01-01T12:00:00.000Z";
  const updated = await request("/tickets/" + id, {
    method: "PUT",
    token: tokens.admin,
    body: { dueAt: deadline, status: "Resolved" },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.dueAt, deadline);
  assert.ok(updated.data.resolvedAt);
  assert.match(
    updated.data.activity.at(-1).summary,
    /Status: Pending -> Resolved/,
  );
  assert.equal(updated.data.activity.at(-1).actorRole, "admin");
  const reopened = await request("/tickets/" + id, {
    method: "PUT",
    token: tokens.admin,
    body: { status: "Pending" },
  });
  assert.equal(reopened.data.resolvedAt, null);
  const before = reopened.data.activity.length;
  const noop = await request("/tickets/" + id, {
    method: "PUT",
    token: tokens.admin,
    body: { status: "Pending" },
  });
  assert.equal(noop.data.activity.length, before);
  assert.equal(
    (
      await request("/tickets/" + id, {
        method: "PUT",
        token: tokens.student,
        body: { dueAt: deadline },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/tickets/" + id, {
        method: "PUT",
        token: tokens.admin,
        body: { dueAt: "not-a-date" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/tickets/" + id, {
        method: "POST",
        token: tokens.student,
        body: {},
      })
    ).status,
    404,
  );
  await request("/tickets/" + id, { method: "DELETE", token: tokens.admin });
});

test("inbox read receipts persist per user and private activity follows reassignment", async () => {
  const originalFaculty = await User.findOne({ email: "faculty@test.college" });
  const otherFaculty = await User.findOne({ email: "other@test.college" });
  const created = await request("/tickets", {
    method: "POST",
    token: tokens.student,
    body: {
      title: "Private handoff",
      description: "A private matter",
      category: "Faculty",
      assignedFaculty: String(originalFaculty._id),
    },
  });
  assert.equal(created.status, 201);
  const id = created.data._id;
  const eventId = created.data.activity[0]._id;
  const inbox = await request("/tickets/inbox", { token: tokens.faculty });
  assert.equal(inbox.data.find((e) => e._id === eventId).read, false);
  assert.equal(
    (
      await request("/tickets/inbox/read", {
        method: "POST",
        token: tokens.other,
        body: { ids: [eventId] },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/tickets/inbox/read", {
        method: "POST",
        token: tokens.faculty,
        body: { ids: [eventId] },
      })
    ).status,
    200,
  );
  assert.equal(
    (await request("/tickets/inbox", { token: tokens.faculty })).data.find(
      (e) => e._id === eventId,
    ).read,
    true,
  );
  assert.equal(
    (await request("/tickets/inbox", { token: tokens.admin })).data.find(
      (e) => e._id === eventId,
    ).read,
    false,
  );
  const changed = await request("/tickets/" + id, {
    method: "PUT",
    token: tokens.admin,
    body: { assignedFaculty: String(otherFaculty._id) },
  });
  assert.equal(changed.status, 200);
  assert.equal(
    (await request("/tickets/activity", { token: tokens.faculty })).data.some(
      (e) => e.ticketId === id,
    ),
    false,
  );
  assert.equal(
    (await request("/tickets/inbox", { token: tokens.faculty })).data.some(
      (e) => e.ticketId === id,
    ),
    false,
  );
  assert.equal(
    (await request("/tickets/inbox", { token: tokens.other })).data.some(
      (e) => e.ticketId === id,
    ),
    true,
  );
  assert.equal(
    (
      await request("/tickets/inbox/read", {
        method: "POST",
        token: tokens.faculty,
        body: { ids: [eventId] },
      })
    ).status,
    403,
  );
  await request("/tickets/" + id, { method: "DELETE", token: tokens.admin });
});

test("invalid fields and private category changes cannot bypass validation", async () => {
  const created = await request("/tickets", {
    method: "POST",
    token: tokens.student,
    body: { title: "Field validation", description: "Details", category: "IT" },
  });
  const id = created.data._id;
  for (const body of [
    { category: "Faculty" },
    { category: "Unknown" },
    { status: "Done" },
    { location: { x: 1 } },
  ]) {
    assert.equal(
      (
        await request("/tickets/" + id, {
          method: "PUT",
          token: tokens.admin,
          body,
        })
      ).status,
      400,
    );
  }
  assert.equal(
    (
      await request("/tickets/" + id + "/comments", {
        method: "POST",
        token: tokens.student,
        body: { message: { toString: "attack" } },
      })
    ).status,
    400,
  );
  assert.equal(
    (await request("/tickets?status[$ne]=Resolved", { token: tokens.student }))
      .status,
    400,
  );
  assert.equal(
    (await request("/tickets/not-an-id", { token: tokens.admin })).status,
    400,
  );
  assert.equal(
    (
      await request("/tickets/inbox/read", {
        method: "POST",
        token: tokens.admin,
        body: { ids: ["not-an-id"] },
      })
    ).status,
    400,
  );
  await request("/tickets/" + id, { method: "DELETE", token: tokens.admin });
});
