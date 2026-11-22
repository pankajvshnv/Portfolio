# Portfolio — VS Code style (FastAPI + Bootstrap)

A high-performance, lightweight portfolio styled like a modern code editor with an interactive Signal-style network graph background, activity bar, file-explorer sidebar, tabs, and admin dashboard.

## Tech Stack
- **Backend:** FastAPI (Python 3.10+)
- **Database:** SQLite via SQLAlchemy
- **Templates:** Jinja2
- **Production Server:** Uvicorn / Passenger WSGI (`a2wsgi`)

## Run Locally

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 app.py
```

Visit [http://127.0.0.1:8000](http://127.0.0.1:8000)

## Admin Dashboard
Visit `/admin` (Default password: `admin123` or set `ADMIN_PASSWORD` in `.env`) to manage:
- Profile details (Name, Role, Location, Bio, Social links)
- Projects (Add, edit, remove)
- Skills (Add Devicon icons, manage tech stack)
- Experience (Timeline & roles)

## Directory Structure

```
portfolio/
├── app.py                 # FastAPI application & API routes
├── passenger_wsgi.py      # Passenger WSGI adapter (a2wsgi) for Hostinger / cPanel
├── portfolio.db           # SQLite database
├── requirements.txt       # Minimal, lightweight dependencies
├── seed_data.py           # Database seeder script
├── templates/
│   ├── base.html          # Shell layout (editor tabs, sidebar, status bar)
│   ├── index.html         # Hero, projects, skills, experience, contact
│   ├── admin.html         # Admin management dashboard
│   └── login.html         # Admin login
└── static/
    ├── css/style.css      # Core IDE styles
    ├── images/profile.jpg # Profile photo
    └── js/
        ├── main.js        # Editor interactions, tab switching, clock
        └── network-bg.js  # Interactive Signal-style network graph canvas
```
