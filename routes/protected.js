const express = require("express");
const bcrypt = require("bcrypt");

const {
  authenticateToken,
  authorizeAdmin,
} = require("../middleware/authMiddleware");
const { poolPromise } = require("../db");
const router = express.Router();

// Protected Route
router.get("/", authenticateToken, (req, res) => {
  res.json({
    message: `Hello ${req.user.username}, you have accessed a protected route!`,
  });
});

// Protected route เฉพาะ Admin
router.get("/admin", authenticateToken, authorizeAdmin, (req, res) => {
  res.json({
    message: `Hello ${req.user.username}, you have accessed an ADMIN route!`,
  });
});

// Protected route เฉพาะ Admin: ดู Users ทั้งหมด
router.get(
  "/admin/users",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const pool = await poolPromise;
      const users_result = await pool
        .request()
        .query(
          `SELECT id, name, username, userrank, usergroup, SYSCREATE, SYSUPDATE FROM Users`
        );
      if (users_result.recordset.length === 0) {
        return res.status(400).json({ message: "No users found" });
      }

      const group_result = await pool
        .request()
        .query(
          `SELECT id, name_short, name_en, name_th, description FROM userGroup`
        );
      const rank_result = await pool
        .request()
        .query(
          `SELECT id, name_short, name_en, name_th, description FROM userRank`
        );

      res.json({
        users: users_result.recordset,
        group: group_result.recordset,
        rank: rank_result.recordset,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Protected route เฉพาะ Admin: อัปเดตข้อมูล User ได้
router.post(
  "/admin/user/update",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    const { name, username, userrank, usergroup, id } = req.body;

    // Validation เบื้องต้น
    if (!id || !username || !userrank || !usergroup) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("name", name || null)
        .input("username", username)
        .input("userrank", userrank)
        .input("usergroup", usergroup)
        .input("id", id).query(`
            UPDATE Users
                SET
                    name = @name, 
                    username = @username, 
                    userrank = @userrank, 
                    usergroup = @usergroup, 
                    SYSUPDATE = GETDATE()
                WHERE id = @id
            `);

      if (result.rowsAffected[0] === 0) {
        return res
          .status(404)
          .json({ message: "User not found or nothing updated" });
      }

      res.json({ message: "User updated successfully" });
    } catch (err) {
      console.error("Update Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Protected route เฉพาะ Admin: Register User ได้
router.post(
  "/admin/user/register",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    const { username, password, name, rank, group } = req.body;
    try {
      const pool = await poolPromise;
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool
        .request()
        .input("username", username)
        .query("SELECT * FROM Users WHERE username = @username");

      if (result.recordset.length > 0) {
        return res.status(400).json({ message: "Username already exists" });
      }

      await pool
        .request()
        .input("username", username)
        .input("password", hashedPassword)
        .input("name", name)
        .input("userrank", rank)
        .input("usergroup", group)
        .query(
          `INSERT INTO Users (username, password, name, userrank, usergroup, SYSCREATE, SYSUPDATE) VALUES (@username, @password, @name, @userrank, @usergroup, GETDATE(), GETDATE())`
        );

      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      res.status(500).json({ message: `Server error ${err.message}` });
    }
  }
);

module.exports = router;
