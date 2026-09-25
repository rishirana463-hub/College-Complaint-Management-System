import test from "node:test";
import assert from "node:assert/strict";
import {
  createGoogleAuthFlow,
  checkGoogleProvider,
} from "../src/services/googleAuthFlow.js";

function fixture(exchange) {
  const calls = { exchange: [], session: [] };
  const flow = createGoogleAuthFlow({
    getClient: async () => ({
      auth: {
        exchangeCodeForSession: async (code, options) => {
          calls.exchange.push([code, options]);
          return exchange
            ? exchange(code)
            : { data: { session: { access_token: `token-${code}` } } };
        },
      },
    }),
    createSession: async (token) => {
      calls.session.push(token);
      return { token };
    },
  });
  return { flow, calls };
}

test("StrictMode callers share one code exchange and app session", async () => {
  const { flow, calls } = fixture();
  const first = flow.complete("first", "flow-1");
  const duplicate = flow.complete("first", "flow-1");
  assert.equal(first, duplicate);
  assert.deepEqual(await first, { token: "token-first" });
  assert.deepEqual(calls.exchange, [["first", { flowId: "flow-1" }]]);
  assert.equal(calls.session.length, 1);
});

test("a later login gets its own session, not the previous result", async () => {
  const { flow, calls } = fixture();
  await flow.complete("first");
  assert.deepEqual(await flow.complete("second"), { token: "token-second" });
  assert.equal(calls.session.length, 2);
});

test("a failed exchange does not poison a new sign-in", async () => {
  const { flow, calls } = fixture((code) =>
    code === "expired"
      ? { error: new Error("Expired code") }
      : { data: { session: { access_token: "fresh" } } },
  );
  await assert.rejects(flow.complete("expired"), /Expired code/);
  await assert.rejects(flow.complete("expired"), /Expired code/);
  assert.deepEqual(await flow.complete("new"), { token: "fresh" });
  assert.equal(calls.exchange.length, 2);
});

test("missing codes never fall back to a cached provider session", async () => {
  const { flow, calls } = fixture();
  for (const code of [null, undefined, "", "  "])
    await assert.rejects(flow.complete(code), /expired/);
  assert.equal(calls.exchange.length, 0);
});

test("missing provider session cannot create an application login", async () => {
  const { flow, calls } = fixture(() => ({ data: { session: null } }));
  await assert.rejects(flow.complete("first"), /expired/);
  assert.equal(calls.session.length, 0);
});

test("sign-out invalidates a pending exchange", async () => {
  let finish;
  const { flow, calls } = fixture(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = flow.complete("first");
  const rejected = assert.rejects(pending, /cancelled/);
  await new Promise((resolve) => setImmediate(resolve));
  flow.reset();
  finish({ data: { session: { access_token: "old" } } });
  await rejected;
  assert.equal(calls.session.length, 0);
});

test("sign-out invalidates a pending backend completion", async () => {
  let finish;
  const flow = createGoogleAuthFlow({
    getClient: async () => ({
      auth: {
        exchangeCodeForSession: async () => ({
          data: { session: { access_token: "test" } },
        }),
      },
    }),
    createSession: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  const rejected = assert.rejects(flow.complete("first"), /cancelled/);
  await new Promise((resolve) => setImmediate(resolve));
  flow.reset();
  finish({ token: "old-app-session" });
  await rejected;
});

test("provider check accepts an enabled Google provider", async () => {
  await checkGoogleProvider(
    "https://auth.example/",
    "public-test-key",
    async (url, options) => {
      assert.equal(url, "https://auth.example/auth/v1/settings");
      assert.equal(options.headers.apikey, "public-test-key");
      return Response.json({ external: { google: true } });
    },
  );
});

test("provider configuration and availability failures are actionable", async () => {
  const cases = [
    [
      async () => {
        throw new TypeError("Failed to fetch");
      },
      /can't reach/,
    ],
    [async () => Response.json({}, { status: 401 }), /public key/],
    [async () => Response.json({}, { status: 503 }), /temporarily unavailable/],
    [async () => Response.json({ external: { google: false } }), /not enabled/],
    [async () => new Response("not-json"), /invalid response/],
  ];
  for (const [fetchImpl, message] of cases)
    await assert.rejects(
      checkGoogleProvider("https://auth.example", "public", fetchImpl),
      message,
    );
});
