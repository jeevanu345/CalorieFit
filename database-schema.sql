-- CalorieFit Database Schema (Enhanced)

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    age INTEGER,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
    height DECIMAL(5,2), -- in cm
    weight DECIMAL(5,2), -- in kg
    bmi DECIMAL(5,2), -- optional: calculated using weight / (height/100)^2
    bmr DECIMAL(6,2), -- optional: Basal Metabolic Rate
    activity_level VARCHAR(50), -- optional: sedentary, light, moderate, active, very active
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Foods table
CREATE TABLE foods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    calories INTEGER NOT NULL,
    protein DECIMAL(5,2) NOT NULL, -- in grams
    carbs DECIMAL(5,2) NOT NULL,   -- in grams
    fats DECIMAL(5,2) NOT NULL,    -- in grams
    serving VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Food logs table
CREATE TABLE food_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    food_id INTEGER REFERENCES foods(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goals table (optional reference table)
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    goal_type VARCHAR(50) UNIQUE NOT NULL -- e.g., 'lose weight', 'maintain weight', 'gain weight'
);

-- User goals (per-user goal setting)
CREATE TABLE user_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goal_id INTEGER REFERENCES goals(id),
    target_weight DECIMAL(5,2), -- optional
    target_date DATE, -- optional
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, date);
CREATE INDEX idx_foods_name ON foods(name);

-- Sample food data
INSERT INTO foods (name, calories, protein, carbs, fats, serving) VALUES
('Apple', 95, 0.5, 25, 0.3, '1 medium (182g)'),
('Banana', 105, 1.3, 27, 0.4, '1 medium (118g)'),
('Chicken Breast', 165, 31, 0, 3.6, '100g'),
('White Rice', 130, 2.7, 28, 0.3, '100g cooked'),
('Broccoli', 55, 3.7, 11, 0.6, '100g'),
('Egg', 68, 5.5, 0.5, 4.8, '1 large (50g)'),
('Salmon', 208, 20, 0, 13, '100g'),
('Almonds', 164, 6, 6, 14, '1 oz (28g)'),
('Greek Yogurt', 100, 10, 6, 5, '100g'),
('Avocado', 160, 2, 9, 15, '100g'),
('Brown Rice', 112, 2.6, 23, 0.9, '100g cooked'),
('Sweet Potato', 86, 1.6, 20, 0.1, '100g'),
('Spinach', 23, 2.9, 3.6, 0.4, '100g'),
('Oats', 389, 16.9, 66, 6.9, '100g dry'),
('Tuna', 144, 30, 0, 0.8, '100g'),
('Quinoa', 120, 4.4, 22, 1.9, '100g cooked'),
('Lentils', 116, 9, 20, 0.4, '100g cooked'),
('Cottage Cheese', 98, 11, 3.4, 4.3, '100g'),
('Turkey Breast', 135, 30, 0, 1, '100g'),
('Blueberries', 57, 0.7, 14, 0.3, '100g');

-- Sample goal types
INSERT INTO goals (goal_type) VALUES ('lose weight'), ('maintain weight'), ('gain weight');
