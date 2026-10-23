# Portfolio — VS Code style (Flask + Bootstrap)

A single-page portfolio styled like a code editor: activity bar, file-explorer
sidebar, tabs, a line-gutter on each "file", and a terminal-style contact form.

## Run it locally

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 app.py
```

Visit http://127.0.0.1:5000

## Customize your content

Everything you need to edit lives at the top of **app.py**:
- `PROFILE` — name, role, bio, links, resume URL
- `PROJECTS` — add/remove project dicts (name, title, desc, stack, github, demo)
- `SKILLS` — name + proficiency (0–100)
- `TIMELINE` — your career history

The templates (`templates/base.html`, `templates/index.html`) just loop over
this data, so you rarely need to touch HTML for content changes.

## Wire up the contact form for real

Right now `POST /contact` in `app.py` just prints the message to the console.
To actually send email, install Flask-Mail:

```bash
pip install Flask-Mail
```

and in `app.py`:

```python
from flask_mail import Mail, Message

app.config.update(
    MAIL_SERVER="smtp.gmail.com",
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USERNAME="you@gmail.com",
    MAIL_PASSWORD="your-app-password",   # use a Gmail App Password, not your real password
)
mail = Mail(app)

# inside contact():
msg = Message("New portfolio message", sender=email, recipients=["you@gmail.com"])
msg.body = f"From: {name} <{email}>\n\n{message}"
mail.send(msg)
```

Never commit real credentials — use environment variables
(`os.environ.get("MAIL_PASSWORD")`) and a `.env` file (add it to `.gitignore`).

## Styling

All design tokens (colors, fonts) are CSS variables at the top of
`static/css/style.css` — change `--accent` to swap the teal highlight for any
color, or adjust `--bg-editor` / `--bg-sidebar` for a different editor theme
(e.g. a lighter "VS Code Light" or Dracula palette).

## Deploy

Any host that runs Python works. Quick options:

**Render.com**
1. Push this repo to GitHub
2. New → Web Service → connect the repo
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`

**Railway.app** — same idea, auto-detects the Procfile-less Flask app if you
add a `Procfile` with: `web: gunicorn app:app`

Remember to set a real `app.secret_key` via environment variable before
deploying (don't leave the placeholder in `app.py`).

## Structure

```
portfolio/
├── app.py                 # Flask app + your content
├── requirements.txt
├── templates/
│   ├── base.html          # IDE chrome: activity bar, sidebar, tabs
│   └── index.html         # about / projects / skills / experience / contact
└── static/
    ├── css/style.css
    └── js/main.js          # clock, scrollspy, mobile sidebar toggle
```
