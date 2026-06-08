# 🗂️ TaskMaster — Smart Task Management System

A full-stack task management web application built with **Flask**, **PostgreSQL**, **Pandas/NumPy**, and **WebSockets**.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Authentication** | Register, Login, Logout with hashed passwords (bcrypt) |
| **REST API** | Full CRUD for tasks (GET / POST / PUT / DELETE) |
| **PostgreSQL** | Relational DB for users & tasks with proper indexes |
| **Analytics** | Live stats powered by Pandas & NumPy |
| **WebSockets** | Real-time task notifications via Flask-SocketIO |
| **Frontend** | Responsive dark-theme UI (HTML/CSS/Vanilla JS) |

---

## 🛠️ Tech Stack

- **Backend:** Python 3.10+, Flask 3.x
- **Database:** PostgreSQL + SQLAlchemy ORM
- **Auth:** Flask-Login + Flask-Bcrypt
- **Analytics:** Pandas + NumPy
- **WebSockets:** Flask-SocketIO + Socket.IO (client)
- **Frontend:** HTML5, CSS3 (custom), Vanilla JS

---

## 📂 Project Structure

```
taskmaster/
├── app/
│   ├── __init__.py          # App factory
│   ├── models.py            # SQLAlchemy models (User, Task)
│   ├── sockets.py           # WebSocket event handlers
│   ├── routes/
│   │   ├── auth.py          # Register, Login, Logout
│   │   ├── tasks.py         # REST API CRUD
│   │   ├── analytics.py     # Pandas/NumPy analytics
│   │   └── main.py          # Dashboard route
│   ├── templates/
│   │   ├── base.html
│   │   ├── dashboard.html
│   │   └── auth/
│   │       ├── login.html
│   │       └── register.html
│   └── static/
│       ├── css/main.css
│       └── js/dashboard.js
├── config.py                # Configuration classes
├── run.py                   # Entry point
├── schema.sql               # PostgreSQL schema
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites

- Python 3.10+
- PostgreSQL 13+
- pip

### Step 1 — Clone / Unzip

```bash
unzip taskmaster.zip
cd taskmaster
```

### Step 2 — Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows
```

### Step 3 — Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4 — Set Up PostgreSQL

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE taskmaster;"

# Apply the schema
psql -U postgres -d taskmaster -f schema.sql
```

### Step 5 — Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```
SECRET_KEY=your-random-secret-key
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/taskmaster
```

### Step 6 — Run the App

```bash
python run.py
```

Visit **http://localhost:5000** in your browser.

---

## 🌐 REST API Reference

All task endpoints require authentication (session cookie).

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks/` | Get all tasks (supports `?status=`, `?priority=`, `?search=`) |
| `POST` | `/api/tasks/` | Create new task |
| `GET` | `/api/tasks/<id>` | Get single task |
| `PUT` | `/api/tasks/<id>` | Update task |
| `DELETE` | `/api/tasks/<id>` | Delete task |

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login |
| `GET` | `/auth/logout` | Logout |
| `GET` | `/auth/me` | Current user info |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/summary` | Full analytics summary |
| `GET` | `/api/analytics/trends` | Daily task creation trends |

### Task Schema

```json
{
  "title": "Fix login bug",
  "description": "Users can't log in on mobile",
  "priority": "high",      // low | medium | high | critical
  "status": "pending"      // pending | in_progress | completed | cancelled
}
```

---

## ⚡ WebSocket Events

The app uses Socket.IO for real-time notifications. Events are scoped per user.

| Event (server → client) | Payload | Description |
|---|---|---|
| `connected` | `{message, user_id, room}` | Fired on socket connect |
| `task_created` | `{task}` | New task was created |
| `task_updated` | `{task}` | Task was modified |
| `task_deleted` | `{task_id}` | Task was deleted |
| `refresh_tasks` | — | Server requests client refresh |

---

## 📊 Analytics Module

Built with **Pandas** and **NumPy**:

- Total, completed, pending, in-progress, cancelled task counts  
- Completion percentage  
- Productivity score (weighted formula)  
- Status & priority breakdowns with percentages  
- Daily task creation trends  

---

## 🔐 Security Notes

- Passwords hashed with bcrypt (cost factor 12)
- Sessions managed via Flask-Login
- User data fully isolated (tasks scoped to logged-in user)
- For production: set `SECRET_KEY` to a strong random value and use HTTPS

---

## 🧪 Development Tips

- Press `N` on the dashboard to quickly open the "New Task" modal
- Press `Escape` to close any modal
- The WebSocket indicator (bottom-left of sidebar) shows live connection status

---

## 📄 License

MIT — free to use, modify, and distribute.
