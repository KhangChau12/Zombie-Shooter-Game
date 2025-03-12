# Zombie Apocalypse Shooter - Game with Cloud Save System

## Project Overview

This is a top-down zombie survival shooter game with user authentication and cloud save functionality. Players can register accounts, save their game progress to the cloud, and load saved games across different devices.

## Key Features

### Game Features
- Top-down action survival gameplay
- Territory claiming mechanics
- Weapon upgrade and customization system
- Multiple zombie types (Regular, Fast, Tank, Boss)
- Progressive difficulty with zombie evolution
- Resource management (ammo, health, torches)

### Save System Features
- User authentication (register/login)
- Cloud-based save system with 3 save slots per user
- Screenshot preview of saved games
- Save/load game progress from any device
- Delete saved games

## Project Structure

```
zombie-apocalypse-shooter/
├── client/                       # Frontend game files
│   ├── css/                      # CSS stylesheets
│   │   ├──styles.css             # Main game styles
│   │   ├──screen-flash.css       # Visual effect styles
│   │   └── homeScreen.css        # Styles for home and auth screens
│   ├── js/                       # JavaScript game logic
│   │   ├── auth.js               # Authentication functionality
│   │   ├── homeScreen.js         # Home screen and save/load UI
│   │   ├── config.js             # Game configuration
│   │   ├── game.js               # Main game loop
│   │   ├── player.js             # Player logic
│   │   ├── zombies.js            # Zombie logic
│   │   ├── map.js                # Map generation
│   │   ├── weapons.js            # Weapon systems
│   │   └── ui.js                 # Game UI
│   ├── index.html                # Main HTML file

│
├── server/                       # Backend files
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── controllers/
│   │   ├── auth.js               # Authentication logic
│   │   └── saves.js              # Save game management
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── models/
│   │   ├── User.js               # User data schema
│   │   └── Save.js               # Save game schema
│   ├── routes/
│   │   ├── auth.js               # Auth endpoints
│   │   └── saves.js              # Save game endpoints
│   └── server.js                 # Express server setup
│
├── .env                          # Environment variables (not in repo)
├── package.json                  # Project dependencies
├── Procfile                      # For Render deployment
└── README.md                     # Project documentation
```

## Technologies Used

### Frontend
- Vanilla JavaScript for game logic
- HTML5 Canvas for rendering
- CSS for styling

### Backend
- Node.js with Express
- MongoDB for database
- JWT for authentication
- Bcrypt for password encryption

## Game Controls

- **Movement**: W, A, S, D keys
- **Aim & Shoot**: Mouse cursor to aim, left-click to shoot
- **Reload**: R key
- **Open Shop**: E key
- **Open Upgrade Menu**: Tab key
- **Place Torch**: F key (for claiming territory)
- **Switch Weapons**: Q key, Mouse Wheel, or number keys 1-5
- **Interact with Chests**: Automatic when nearby

## Installation and Deployment Instructions

### Prerequisites
- Node.js (v14 or newer)
- MongoDB account (local or MongoDB Atlas)
- Git

### Local Development Setup

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/zombie-apocalypse-shooter.git
   cd zombie-apocalypse-shooter
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Create .env file**
   Create a `.env` file in the root directory with:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_here
   ```

4. **Set up MongoDB Atlas**
   - Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster (free tier works)
   - In "Database Access", create a new database user
   - In "Network Access", add your IP address or allow access from anywhere (0.0.0.0/0)
   - Get your connection string from "Connect" → "Connect your application"

5. **Start the development server**
   ```
   npm run dev
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

### Deployment to Render

1. **Create a Render account**
   Sign up at [render.com](https://render.com) if you don't have an account

2. **Push your code to GitHub**
   Make sure your project is in a GitHub repository

3. **Create a new Web Service on Render**
   - Click "New" → "Web Service"
   - Connect to your GitHub repository
   - Configure the service:
     - Name: Choose a name (e.g., zombie-apocalypse-game)
     - Runtime: Node
     - Build Command: `npm install`
     - Start Command: `npm start`

4. **Configure environment variables**
   Add the following environment variables:
   - `PORT`: 10000 (Render's default port)
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A strong random string
   - `NODE_ENV`: production

5. **Deploy**
   Click "Create Web Service" and wait for the deployment to complete

6. **Access your deployed application**
   Once deployment is complete, you can access your game at the URL provided by Render

## Important Notes

- The backend API URL in `client/js/auth.js` must match your deployment URL
- Make sure your MongoDB database is properly secured
- Keep your JWT_SECRET secure and never expose it in client-side code
- Regularly backup your database to prevent data loss

## License
This project is licensed under the MIT License - see the LICENSE file for details.