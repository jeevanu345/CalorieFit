# CalorieFit

A full-stack ready backend service built using Node.js, Express, and PostgreSQL that allows users to register, log in, update their profile, search for foods, and maintain a daily food log. JWT-based authentication ensures secure access to user-specific endpoints.

## Features

- User registration and login with hashed passwords
- JWT-based authentication
- Profile management (name, age, gender, height, weight)
- Food database with macro-nutrient details
- Daily food logging and calorie tracking
- RESTful API design
- PostgreSQL database with schema initialization and sample data
- CORS and static file support for frontend integration

## Technologies Used

- Node.js
- Express.js
- PostgreSQL
- bcryptjs (for password hashing)
- jsonwebtoken (for JWT auth)
- dotenv (for environment variable support)
- cors
- pg (node-postgres)

## Getting Started

### Prerequisites

- Node.js (v14 or above)
- PostgreSQL database

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/nutrition-tracker-api.git
   cd nutrition-tracker-api](https://github.com/jeevanu345/CalorieFit.git)


2.	Install dependencies:

         npm install

3.	Create a .env file in the root directory with the following content:
4.       PORT=3000
         DATABASE_URL=postgres://youruser:yourpassword@localhost:5432/yourdbname
        JWT_SECRET=your_jwt_secret
          NODE_ENV=development
5.	Start the server:
6.	          npm start
