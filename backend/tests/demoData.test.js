import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { seedDemoData } from "../utils/demoData.js";
import bootstrapData from "../utils/bootstrapData.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";

let database;
before(async () => {
  database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri("demo-seed-tests"));
});
after(async () => {
  await mongoose.disconnect();
  await database?.stop();
});

test("example complaints cover categories, roles, statuses, and coherent history", async () => {
  const now = new Date("2026-09-25T12:00:00Z");
  assert.deepEqual(await seedDemoData({ now }), { added: 12, examples: 12 });
  const tickets = await Ticket.find().populate("userId assignedFaculty");
  assert.equal(tickets.length, 12);
  assert.equal(new Set(tickets.map((t) => t.category)).size, 8);
  assert.equal(new Set(tickets.map((t) => t.status)).size, 3);
  assert.equal(new Set(tickets.map((t) => t.priority)).size, 3);
  assert(tickets.some((t) => t.status !== "Resolved" && t.dueAt < now));
  for (const ticket of tickets) {
    assert.equal(ticket.userId.role, "student");
    assert.match(ticket.description, /^\[Demo example\]/);
    assert(ticket.activity.length >= 1);
    assert(ticket.comments.length >= 1);
    if (ticket.category === "Faculty")
      assert.equal(ticket.assignedFaculty.role, "faculty");
    else assert.equal(ticket.assignedFaculty, null);
    if (ticket.status === "Resolved") {
      assert(ticket.resolvedAt >= ticket.createdAt);
      assert(ticket.resolvedAt <= ticket.dueAt);
    } else assert.equal(ticket.resolvedAt, null);
  }
});

test("reseed preserves edited examples and unrelated users and complaints", async () => {
  const user = await User.create({
    name: "Existing Student",
    email: "existing@example.test",
    password: "unrelated123",
    role: "student",
  });
  const real = await Ticket.create({
    title: "Existing complaint",
    description: "Do not change",
    category: "IT",
    userId: user._id,
  });
  const sample = await Ticket.findOne({ demoKey: "campusdesk-example-v1-1" });
  sample.title = "Edited by demo operator";
  await sample.save();
  const snapshot = JSON.stringify(await Ticket.find().sort({ _id: 1 }).lean());
  assert.equal((await seedDemoData()).added, 0);
  assert.equal(
    JSON.stringify(await Ticket.find().sort({ _id: 1 }).lean()),
    snapshot,
  );
  assert.equal(await User.countDocuments(), 5);
  assert(await Ticket.exists({ _id: real._id }));
});

test("demo seeding rejects account conflicts without changing data", async () => {
  const admin = await User.findOne({ email: "admin@college.com" });
  admin.password = "changed-by-owner";
  await admin.save();
  const before = JSON.stringify(await User.find().lean());
  await assert.rejects(seedDemoData(), /Demo account conflict/);
  assert.equal(JSON.stringify(await User.find().lean()), before);
  assert.equal(await Ticket.countDocuments(), 13);
});

test("production and persistent startup never provision public demo accounts", async () => {
  const previous = { mode: process.env.NODE_ENV, uri: process.env.MONGO_URI };
  try {
    process.env.NODE_ENV = "production";
    await assert.rejects(seedDemoData(), /disabled in production/);
    await bootstrapData();
    process.env.NODE_ENV = "development";
    process.env.MONGO_URI = "configured-development-database";
    await bootstrapData();
    assert.equal(await User.countDocuments(), 5);
    assert.equal(await Ticket.countDocuments(), 13);
  } finally {
    for (const [key, value] of [
      ["NODE_ENV", previous.mode],
      ["MONGO_URI", previous.uri],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
