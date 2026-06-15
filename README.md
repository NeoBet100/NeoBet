# NeoBet - Modern Gaming Platform

A professional, secure gaming platform built with Node.js, Express, MongoDB, and vanilla JavaScript. Features modern dark theme UI, JWT authentication, and separate admin/user dashboards.

## Features

### User Features
- ✅ User registration and login with JWT authentication
- ✅ Personal dashboard with balance display
- ✅ Deposit funds securely
- ✅ View transaction history
- ✅ Play available games
- ✅ View game history and wins/losses

### Admin Features
- ✅ Manage matches (add, edit, delete)
- ✅ Set match odds
- ✅ View all registered users
- ✅ View and approve deposits
- ✅ Monitor platform statistics

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing, dotenv for environment variables

## Project Structure

```
NeoBet/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Match.js
│   │   ├── Deposit.js
│   │   └── GameHistory.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── admin.js
│   │   └── games.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── adminController.js
│   │   └── gameController.js
│   ├── .env.example
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── auth/
│   │   ├── register.html
│   │   ├── login.html
│   │   └── auth.js
│   ├── user/
│   │   ├── dashboard.html
│   │   ├── games.html
│   │   ├── history.html
│   │   └── user.js
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── matches.html
│   │   ├── users.html
│   │   ├── deposits.html
│   │   └── admin.js
│   ├── css/
│   │   ├── style.css
│   │   ├── responsive.css
│   │   └── theme.css
│   └── js/
│       ├── api.js
│       ├── utils.js
│       └── storage.js
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Configure your MongoDB connection in `.env`

5. Start the server:
```bash
npm start
```

Server runs on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Serve files using a local server (e.g., Live Server, http-server)
```bash
npx http-server .
```

Frontend runs on `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### User Routes
- `GET /api/user/profile` - Get user profile
- `GET /api/user/balance` - Get current balance
- `POST /api/user/deposit` - Create deposit request
- `GET /api/user/history` - Get transaction history
- `GET /api/user/games` - Get available games
- `POST /api/user/play` - Play a game

### Admin Routes
- `GET /api/admin/users` - Get all users
- `GET /api/admin/deposits` - Get all deposits
- `POST /api/admin/deposits/approve/:id` - Approve deposit
- `GET /api/admin/matches` - Get all matches
- `POST /api/admin/matches` - Create new match
- `PUT /api/admin/matches/:id` - Update match
- `DELETE /api/admin/matches/:id` - Delete match

## Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- Protected routes with authentication middleware
- Role-based access control (User/Admin)
- Environment variable protection
- Input validation and sanitization
- CORS configuration

## Environment Variables

Create `.env` file in backend directory:
```
MONGODB_URI=mongodb://localhost:27017/neobet
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
PORT=5000
```

## Development

### Backend Development
```bash
cd backend
npm install
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
- Open frontend files directly in browser or use Live Server
- All frontend code is vanilla JavaScript (no build process required)

## Testing

Run API tests:
```bash
cd backend
npm test
```

## Deployment

### Backend (Heroku)
```bash
heroku create neobet-app
git push heroku main
```

### Frontend (GitHub Pages or Netlify)
- Deploy frontend directory to your hosting service

## License

MIT License - feel free to use this project for educational and commercial purposes.

## Support

For issues and feature requests, please create an issue in the repository.

---

Built with ❤️ for modern gaming enthusiasts.
