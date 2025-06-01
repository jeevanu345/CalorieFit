const express = require("express")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { Pool } = require("pg")
const path = require("path")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3000

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, "public"))) // Serve static files

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]
   
  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" })
    }
    req.user = user
    next()
  })
}

// Initialize database tables
async function initDatabase() {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        age INTEGER,
        gender VARCHAR(20),
        height DECIMAL(5,2),
        weight DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Foods table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS foods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        calories INTEGER NOT NULL,
        protein DECIMAL(5,2) NOT NULL,
        carbs DECIMAL(5,2) NOT NULL,
        fats DECIMAL(5,2) NOT NULL,
        serving VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Food logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS food_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        food_id INTEGER REFERENCES foods(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Insert sample foods if table is empty
    const foodCount = await pool.query("SELECT COUNT(*) FROM foods")
    if (Number.parseInt(foodCount.rows[0].count) === 0) {
      const sampleFoods = [
        { name: "Apple", calories: 95, protein: 0.5, carbs: 25, fats: 0.3, serving: "1 medium (182g)" },
        { name: "Banana", calories: 105, protein: 1.3, carbs: 27, fats: 0.4, serving: "1 medium (118g)" },
        { name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fats: 3.6, serving: "100g" },
        { name: "White Rice", calories: 130, protein: 2.7, carbs: 28, fats: 0.3, serving: "100g cooked" },
        { name: "Broccoli", calories: 55, protein: 3.7, carbs: 11, fats: 0.6, serving: "100g" },
        { name: "Egg", calories: 68, protein: 5.5, carbs: 0.5, fats: 4.8, serving: "1 large (50g)" },
        { name: "Salmon", calories: 208, protein: 20, carbs: 0, fats: 13, serving: "100g" },
        { name: "Almonds", calories: 164, protein: 6, carbs: 6, fats: 14, serving: "1 oz (28g)" },
        { name: "Greek Yogurt", calories: 100, protein: 10, carbs: 6, fats: 5, serving: "100g" },
        { name: "Avocado", calories: 160, protein: 2, carbs: 9, fats: 15, serving: "100g" },
        { name: "Brown Rice", calories: 112, protein: 2.6, carbs: 23, fats: 0.9, serving: "100g cooked" },
        { name: "Sweet Potato", calories: 86, protein: 1.6, carbs: 20, fats: 0.1, serving: "100g" },
        { name: "Spinach", calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, serving: "100g" },
        { name: "Oats", calories: 389, protein: 16.9, carbs: 66, fats: 6.9, serving: "100g dry" },
        { name: "Tuna", calories: 144, protein: 30, carbs: 0, fats: 0.8, serving: "100g" },
        { name: "Quinoa", calories: 120, protein: 4.4, carbs: 22, fats: 1.9, serving: "100g cooked" },
        { name: "Lentils", calories: 116, protein: 9, carbs: 20, fats: 0.4, serving: "100g cooked" },
        { name: "Cottage Cheese", calories: 98, protein: 11, carbs: 3.4, fats: 4.3, serving: "100g" },
        { name: "Turkey Breast", calories: 135, protein: 30, carbs: 0, fats: 1, serving: "100g" },
        { name: "Blueberries", calories: 57, protein: 0.7, carbs: 14, fats: 0.3, serving: "100g" },
      ]

      for (const food of sampleFoods) {
        await pool.query(
          "INSERT INTO foods (name, calories, protein, carbs, fats, serving) VALUES ($1, $2, $3, $4, $5, $6)",
          [food.name, food.calories, food.protein, food.carbs, food.fats, food.serving],
        )
      }
    }

    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Database initialization error:", error)
  }
}

// Routes

// Auth Routes
app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" })
    }

    // Check if user already exists
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email])
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists with this email" })
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const result = await pool.query("INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, name", [
      email,
      hashedPassword,
    ])

    const user = result.rows[0]

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" })

    res.status(201).json({
      message: "User created successfully",
      token,
      user: { id: user.id, email: user.email, name: user.name },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    // Find user
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email])
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    const user = result.rows[0]

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" })

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.post("/logout", (req, res) => {
  // Since we're using JWT, logout is handled client-side by removing the token
  res.json({ message: "Logout successful" })
})

// Profile Routes
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, email, name, age, gender, height, weight FROM users WHERE id = $1", [
      req.user.userId,
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Profile fetch error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.put("/api/profile", authenticateToken, async (req, res) => {
  try {
    const { name, age, gender, height, weight } = req.body

    if (!name || !age || !gender || !height || !weight) {
      return res.status(400).json({ error: "All profile fields are required" })
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = $1, age = $2, gender = $3, height = $4, weight = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 
       RETURNING id, email, name, age, gender, height, weight`,
      [name, age, gender, height, weight, req.user.userId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Profile update error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Food Routes
app.get("/api/foods/search", async (req, res) => {
  try {
    const { q } = req.query
    let query = "SELECT * FROM foods"
    let params = []

    if (q && q.trim()) {
      query += " WHERE LOWER(name) LIKE LOWER($1)"
      params = [`%${q.trim()}%`]
    }

    query += " ORDER BY name LIMIT 50"

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error("Food search error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Food Log Routes
app.post("/api/food-log", authenticateToken, async (req, res) => {
  try {
    const { foodId, date } = req.body

    if (!foodId || !date) {
      return res.status(400).json({ error: "Food ID and date are required" })
    }

    // Verify food exists
    const foodResult = await pool.query("SELECT * FROM foods WHERE id = $1", [foodId])
    if (foodResult.rows.length === 0) {
      return res.status(404).json({ error: "Food not found" })
    }

    // Add to food log
    const result = await pool.query("INSERT INTO food_logs (user_id, food_id, date) VALUES ($1, $2, $3) RETURNING *", [
      req.user.userId,
      foodId,
      date,
    ])

    // Return the log entry with food details
    const logWithFood = await pool.query(
      `
      SELECT fl.*, f.name, f.calories, f.protein, f.carbs, f.fats, f.serving
      FROM food_logs fl
      JOIN foods f ON fl.food_id = f.id
      WHERE fl.id = $1
    `,
      [result.rows[0].id],
    )

    res.status(201).json(logWithFood.rows[0])
  } catch (error) {
    console.error("Food log creation error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.get("/api/food-log", authenticateToken, async (req, res) => {
  try {
    const { date } = req.query

    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" })
    }

    const result = await pool.query(
      `
      SELECT fl.id, fl.date, fl.logged_at, f.id as food_id, f.name, f.calories, f.protein, f.carbs, f.fats, f.serving
      FROM food_logs fl
      JOIN foods f ON fl.food_id = f.id
      WHERE fl.user_id = $1 AND fl.date = $2
      ORDER BY fl.logged_at DESC
    `,
      [req.user.userId, date],
    )

    res.json(result.rows)
  } catch (error) {
    console.error("Food log fetch error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.delete("/api/food-log/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("DELETE FROM food_logs WHERE id = $1 AND user_id = $2 RETURNING *", [
      id,
      req.user.userId,
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Food log entry not found" })
    }

    res.json({ message: "Food log entry deleted successfully" })
  } catch (error) {
    console.error("Food log deletion error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Serve frontend files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: "Something went wrong!" })
})

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API route not found" })
})

// Serve frontend for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await initDatabase()
})

module.exports = app
