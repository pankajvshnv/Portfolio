"""
One-time script to seed the portfolio database with Pankaj Bairagi's resume data.
Run from the portfolio directory: python seed_data.py
"""
import sys, os, json, uuid
sys.path.insert(0, os.path.dirname(__file__))

DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons"

SKILLS = [
    ("Python",      f"{DEVICON}/python/python-original.svg"),
    ("SQL",         f"{DEVICON}/azuresqldatabase/azuresqldatabase-original.svg"),
    ("PostgreSQL",  f"{DEVICON}/postgresql/postgresql-original.svg"),
    ("Flask",       f"{DEVICON}/flask/flask-original.svg"),
    ("FastAPI",     f"{DEVICON}/fastapi/fastapi-original.svg"),
    ("TensorFlow",  f"{DEVICON}/tensorflow/tensorflow-original.svg"),
    ("Scikit-learn",f"{DEVICON}/scikitlearn/scikitlearn-original.svg"),
    ("Pandas",      f"{DEVICON}/pandas/pandas-original.svg"),
    ("NumPy",       f"{DEVICON}/numpy/numpy-original.svg"),
    ("Git",         f"{DEVICON}/git/git-original.svg"),
    ("GitHub",      f"{DEVICON}/github/github-original.svg"),
    ("Docker",      f"{DEVICON}/docker/docker-original.svg"),
    ("GCP",         f"{DEVICON}/googlecloud/googlecloud-original.svg"),
    ("Terraform",   f"{DEVICON}/terraform/terraform-original.svg"),
    ("React Native",f"{DEVICON}/react/react-original.svg"),
    ("JavaScript",  f"{DEVICON}/javascript/javascript-original.svg"),
    ("HTML/CSS",    f"{DEVICON}/html5/html5-original.svg"),
]

EXPERIENCE = [
    {
        "id":       "zoibit",
        "period":   "Sep 2025 – Present",
        "company":  "Zoibit",
        "location": "Remote",
        "roles": [
            {
                "title":  "AI/ML Intern",
                "period": "Sep 2025 – Present",
                "bullets": [
                    "Developing and optimizing ML models using Python, NumPy, Pandas, and Scikit-learn for real-world applications.",
                    "Performing data preprocessing, feature engineering, analysis, and working with SQL and PostgreSQL.",
                    "Building AI solutions and experimenting with LLMs and Generative AI for intelligent applications.",
                    "Developing REST APIs using FastAPI and Flask to integrate and deploy AI/ML solutions.",
                ]
            }
        ]
    },
    {
        "id":       "dreweb",
        "period":   "Apr 2024 – Present",
        "company":  "Dreweb",
        "location": "Remote",
        "roles": [
            {
                "title":  "Freelance Web Developer",
                "period": "Apr 2024 – Present",
                "bullets": [
                    "Building Python backends, REST APIs, and database-driven applications using Flask, FastAPI, SQL, and PostgreSQL.",
                    "Developing AI-powered tools, chatbots, LLM, automation workflows using modern AI technologies.",
                    "Managing projects from development to deployment using Git, GitHub, Docker, and DevOps.",
                ]
            }
        ]
    }
]

PROJECTS = [
    {
        "id":        "rag-teaching-assistant",
        "name":      "rag_assistant.py",
        "title":     "RAG-Based AI Teaching Assistant",
        "desc":      "Built an AI teaching assistant that converts educational videos into a searchable knowledge base using Whisper-based transcription, timestamped chunking, embeddings, and semantic retrieval. Implemented a full RAG pipeline to retrieve relevant video content and generate contextual responses using LLMs.",
        "image_url": "",
        "stack":     "Python,Whisper,Pandas,Embeddings,RAG,LLM,Joblib,NLP",
        "github":    "#",
        "demo":      "#",
    },
    {
        "id":        "ai-crm",
        "name":      "ai_crm.py",
        "title":     "AI-Powered CRM",
        "desc":      "Developed an AI-powered CRM to automate customer management and business workflows, reducing manual work by 60% and efficiently handling 3,000+ records. Built scalable backend services and AI-driven features with REST API integration.",
        "image_url": "",
        "stack":     "Python,Flask,FastAPI,REST API,HTML,CSS,JavaScript,SQL,PostgreSQL",
        "github":    "#",
        "demo":      "#",
    },
    {
        "id":        "habit-tracker",
        "name":      "habit_tracker.py",
        "title":     "Daily Habit Tracker App",
        "desc":      "Developed an AI-powered habit tracking application for monitoring daily activities and providing intelligent insights to improve user consistency and productivity. Built the mobile interface and integrated Python-based backend services for AI-driven functionality.",
        "image_url": "",
        "stack":     "React Native,Python,Flask,REST API,AI",
        "github":    "#",
        "demo":      "#",
    },
]

PROFILE = {
    "name":       "Pankaj Bairagi",
    "role":       "AI Engineer",
    "location":   "Indore, India",
    "status":     "Open to work",
    "email":      "nickvshnv@gmail.com",
    "github":     "https://github.com/pankajvshnv",
    "linkedin":   "https://linkedin.com/in/pankajvshnv",
    "resume_url": "#",
    "bio_short":  "AI/ML Engineer and Full-Stack Developer specialising in Python, Flask, LLMs, RAG pipelines, and cloud-native deployments.",
    "bio_long":   (
        "self.name       = \"Pankaj Bairagi\"\n"
        "self.education  = \"B.Tech @ LNCT Indore (2024–2027)\"\n"
        "self.focus      = [\"ML/AI\", \"LLMs\", \"RAG\", \"Backend\", \"DevOps\"]\n"
        "self.building   = \"AI-powered products that actually ship\"\n"
        "self.contact    = \"nickvshnv@gmail.com  |  +91 62610 29938\""
    ),
}

# ── Run ───────────────────────────────────────────────────────────
from app import db_session, Profile, Project, Experience, Skill

with db_session() as db:
    # Profile
    p = db.query(Profile).first()
    if not p:
        p = Profile(id=1)
        db.add(p)
    for k, v in PROFILE.items():
        setattr(p, k, v)

    # Skills — wipe & re-seed
    db.query(Skill).delete()
    for name, icon in SKILLS:
        db.add(Skill(id=uuid.uuid4().hex, name=name, icon=icon))

    # Experience — wipe & re-seed
    db.query(Experience).delete()
    for e in EXPERIENCE:
        db.add(Experience(
            id=e["id"],
            period=e["period"],
            company=e["company"],
            location=e["location"],
            roles=json.dumps(e["roles"])
        ))

    # Projects — wipe & re-seed
    db.query(Project).delete()
    for pr in PROJECTS:
        db.add(Project(
            id=pr["id"],
            name=pr["name"],
            title=pr["title"],
            desc=pr["desc"],
            image_url=pr.get("image_url", ""),
            stack=pr["stack"],
            github=pr.get("github", "#"),
            demo=pr.get("demo", "#"),
        ))

    db.commit()
    print("✅  Database seeded successfully!")
    print(f"   Profile : {p.name}")
    print(f"   Skills  : {db.query(Skill).count()}")
    print(f"   Projects: {db.query(Project).count()}")
    print(f"   Exp     : {db.query(Experience).count()}")

