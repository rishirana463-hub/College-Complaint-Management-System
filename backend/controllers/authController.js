import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { verifyGoogleIdentity } from "../services/googleIdentity.js";

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  googleConnected: Boolean(user.supabaseId),
});
const session = (user) => ({
  token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
    algorithm: "HS256",
  }),
  user: publicUser(user),
});
const validEmail = (email) =>
  typeof email === "string" &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
  email.length <= 254;

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      !validEmail(typeof email === "string" ? email.trim() : email) ||
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password) > 72
    ) {
      return res
        .status(400)
        .json({
          message:
            "Enter a name, a valid email, and a password of at least 8 characters (at most 72 bytes).",
        });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail }))
      return res
        .status(409)
        .json({
          message: "An account with this email already exists. Please sign in.",
        });
    // Public signup must never grant staff permissions from browser input.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "student",
    });
    return res.status(201).json(session(user));
  } catch (error) {
    return res
      .status(error.code === 11000 ? 409 : 500)
      .json({
        message:
          error.code === 11000
            ? "An account with this email already exists."
            : "Registration failed. Please try again.",
      });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      !validEmail(typeof email === "string" ? email.trim() : email) ||
      typeof password !== "string" ||
      !password ||
      Buffer.byteLength(password) > 72
    )
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid email or password." });
    return res.json(session(user));
  } catch {
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const identity = await verifyGoogleIdentity(req.body.accessToken);
    let user = await User.findOne({ supabaseId: identity.id });
    if (!user) {
      user = await User.findOne({ email: identity.email });
      if (user) {
        // Existing accounts must prove ownership before linking, especially staff accounts.
        let owner;
        try {
          owner = jwt.verify(
            req.headers.authorization?.replace(/^Bearer /, "") || "",
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] },
          );
        } catch {
          /* Return the same linking guidance for invalid or missing sessions. */
        }
        if (
          owner?.id !== user._id.toString() ||
          (user.supabaseId && user.supabaseId !== identity.id)
        )
          return res
            .status(409)
            .json({
              message:
                "This email already has an account. Sign in with your password, then choose Connect Google in your account menu.",
            });
        user.supabaseId = identity.id;
        await user.save();
      } else {
        user = await User.create({
          name: String(identity.name).slice(0, 100),
          email: identity.email,
          supabaseId: identity.id,
          role: "student",
        });
      }
    }
    return res.json(session(user));
  } catch (error) {
    return res
      .status(error.status || (error.code === 11000 ? 409 : 500))
      .json({
        message: error.status
          ? error.message
          : error.code === 11000
            ? "Your account was just created. Please sign in again."
            : "Google sign-in failed. Please try again.",
      });
  }
};
export const getProfile = async (req, res) => res.json(publicUser(req.user));
