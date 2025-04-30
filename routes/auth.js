const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { poolPromise } = require("../db");

const router = express.Router();

// Helper function
function generateAccessToken(user) {
  return jwt.sign(
    { 
        id: user.id, 
        username: user.username,
        userrank: user.userrank,
        usergroup: user.usergroup
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
}

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("username", username)
      .query("SELECT * FROM Users WHERE username = @username");

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: "User not found" }); // เปลี่ยนข้อความเป็น User not found
    }

    const user = result.recordset[0];
    const validPassword = await bcrypt.compare(
      password.toString(),
      user.password
    );
    if (!validPassword) {
      return res.status(400).json({ message: "Incorrect password" }); // ข้อความที่แตกต่างเมื่อรหัสผ่านผิด
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refreshToken to DB
    if (user.refreshToken !== refreshToken) {
      // ตรวจสอบ refreshToken ก่อนอัพเดต
      await pool
        .request()
        .input("id", user.id)
        .input("refreshToken", refreshToken)
        .query("UPDATE Users SET refreshToken = @refreshToken WHERE id = @id");
    }

    // Save into session
    req.session.userId = user.id;

    // ส่ง cookie refreshToken
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      path: "/api/auth/refresh-token",
    });

    res.json({
      accessToken,
      name: user.name,
      username: user.username,
      userrank: user.userrank,
      usergroup: user.usergroup
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = req.session.userId;

    if (userId) {
      // Clear refreshToken in DB
      await pool
        .request()
        .input("id", userId)
        .query("UPDATE Users SET refreshToken = NULL WHERE id = @id");
    }

    // Destroy session
    req.session.destroy(() => {
      res.clearCookie("refreshToken", { path: "/api/auth/refresh-token" });
      res.sendStatus(204); // No Content
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Refresh Token
router.post("/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("refreshToken", refreshToken)
      .query("SELECT * FROM Users WHERE refreshToken = @refreshToken");

    if (result.recordset.length === 0) {
      return res.sendStatus(403);
    }

    const user = result.recordset[0];

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err || user.id !== decoded.id) {
          return res.sendStatus(403);
        }

        const accessToken = generateAccessToken(user);
        res.json({ accessToken });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
