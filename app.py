from flask import Flask, render_template, send_file, request, redirect, url_for, session, flash
import os
import json
import base64
import smtplib
import ssl
import io
import uuid
from email.message import EmailMessage
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "fallback-dev-secret-key")

# Database Configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'portfolio.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    role = db.Column(db.String(100))
    location = db.Column(db.String(100))
    status = db.Column(db.String(50))
    email = db.Column(db.String(100))
    github = db.Column(db.String(255))
    linkedin = db.Column(db.String(255))
    resume_url = db.Column(db.String(255))
    bio_short = db.Column(db.Text)
    bio_long = db.Column(db.Text)

class Project(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100))
    title = db.Column(db.String(100))
    desc = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    stack = db.Column(db.String(255)) # comma separated
    github = db.Column(db.String(255))
    demo = db.Column(db.String(255))

class Experience(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    period = db.Column(db.String(100))
    company = db.Column(db.String(100))
    location = db.Column(db.String(100))
    roles = db.Column(db.Text) # JSON string

class Skill(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100))
    icon = db.Column(db.String(255))

# One-time migration function
def migrate_json_to_sql():
    if Profile.query.first() is not None:
        return

    print("Migrating JSON data to SQLite...")
    
    # Profile
    profile_file = os.path.join(basedir, 'profile.json')
    if os.path.exists(profile_file):
        with open(profile_file, 'r', encoding='utf-8') as f:
            p_data = json.load(f)
            profile = Profile(
                id=1,
                name=p_data.get("name"),
                role=p_data.get("role"),
                location=p_data.get("location"),
                status=p_data.get("status"),
                email=p_data.get("email"),
                github=p_data.get("github"),
                linkedin=p_data.get("linkedin"),
                resume_url=p_data.get("resume_url"),
                bio_short=p_data.get("bio_short"),
                bio_long=p_data.get("bio_long")
            )
            db.session.add(profile)

    # Projects
    proj_file = os.path.join(basedir, 'projects.json')
    if os.path.exists(proj_file):
        with open(proj_file, 'r', encoding='utf-8') as f:
            for d in json.load(f):
                db.session.add(Project(
                    id=d.get("id"),
                    name=d.get("name"),
                    title=d.get("title"),
                    desc=d.get("desc"),
                    image_url=d.get("image_url", ""),
                    stack=",".join(d.get("stack", [])),
                    github=d.get("github", "#"),
                    demo=d.get("demo", "#")
                ))

    # Experience
    exp_file = os.path.join(basedir, 'experience.json')
    if os.path.exists(exp_file):
        with open(exp_file, 'r', encoding='utf-8') as f:
            for d in json.load(f):
                db.session.add(Experience(
                    id=d.get("id"),
                    period=d.get("period"),
                    company=d.get("company"),
                    location=d.get("location"),
                    roles=json.dumps(d.get("roles", []))
                ))
                
    # Skills
    skill_file = os.path.join(basedir, 'skills.json')
    if os.path.exists(skill_file):
        with open(skill_file, 'r', encoding='utf-8') as f:
            for d in json.load(f):
                db.session.add(Skill(
                    id=d.get("id"),
                    name=d.get("name"),
                    icon=d.get("icon")
                ))

    db.session.commit()
    print("Migration complete!")

with app.app_context():
    db.create_all()
    migrate_json_to_sql()

# --- Helper to serialize items ---
def get_profile():
    p = Profile.query.first()
    if not p: return {}
    return {
        "name": p.name, "role": p.role, "location": p.location, "status": p.status,
        "email": p.email, "github": p.github, "linkedin": p.linkedin, "resume_url": p.resume_url,
        "bio_short": p.bio_short, "bio_long": p.bio_long
    }

def get_projects():
    return [{"id": p.id, "name": p.name, "title": p.title, "desc": p.desc, "image_url": p.image_url, "stack": p.stack.split(",") if p.stack else [], "github": p.github, "demo": p.demo} for p in Project.query.all()]

def get_experience():
    return [{"id": e.id, "period": e.period, "company": e.company, "location": e.location, "roles": json.loads(e.roles) if e.roles else []} for e in Experience.query.all()]

def get_skills():
    return [{"id": s.id, "name": s.name, "icon": s.icon} for s in Skill.query.all()]


# Routes
@app.route("/")
def index():
    experience = get_experience()
    for exp in experience:
        if "company" in exp:
            exp["company_b64"] = base64.b64encode(exp["company"].encode("utf-8")).decode("utf-8")
            
    return render_template(
        "index.html",
        profile=get_profile(),
        projects=get_projects(),
        skills=get_skills(),
        experience=experience,
    )

@app.route("/company-image/<b64_name>.png")
def company_image(b64_name):
    company_name = base64.b64decode(b64_name).decode("utf-8")
    
    image_width = 800
    image_height = 40
    background_color = (255, 255, 255, 0)
    text_color = (255, 255, 255, 255)
    
    image = Image.new("RGBA", (image_width, image_height), background_color)
    draw = ImageDraw.Draw(image)
    
    font_path = os.path.abspath(os.path.join(basedir, "static", "fonts", "InterTight-Bold.ttf"))
    try:
        font = ImageFont.truetype(font_path, 25)
    except:
        font = ImageFont.load_default()
        
    text_box = draw.textbbox((0, 2), company_name, font=font)
    text_width = text_box[2] - text_box[0]
    
    draw.text((0, 2), company_name, fill=text_color, font=font)
    if text_width > 0:
        image = image.crop((0, 0, text_width + 4, image_height))
        
    img_io = io.BytesIO()
    image.save(img_io, 'PNG')
    img_io.seek(0)
    
    return send_file(img_io, mimetype='image/png')

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        password = request.form.get("password")
        admin_pass = os.environ.get("ADMIN_PASSWORD", "admin123")
        if password == admin_pass:
            session["admin"] = True
            return redirect(url_for("admin"))
        else:
            return render_template("login.html", error="Invalid password", profile=get_profile())
    return render_template("login.html", profile=get_profile())

@app.route("/logout")
def logout():
    session.pop("admin", None)
    return redirect(url_for("index"))

@app.route("/admin", methods=["GET"])
def admin():
    if not session.get("admin"):
        return redirect(url_for("login"))
        
    return render_template(
        "admin.html", 
        profile=get_profile(),
        projects=get_projects(), 
        experience=get_experience(),
        skills=get_skills()
    )

@app.route("/admin/profile", methods=["POST"])
def admin_profile():
    if not session.get("admin"): return redirect(url_for("login"))
    
    p = Profile.query.first()
    if not p:
        p = Profile(id=1)
        db.session.add(p)
    
    p.name = request.form.get("name", p.name)
    p.role = request.form.get("role", p.role)
    p.location = request.form.get("location", p.location)
    p.email = request.form.get("email", p.email)
    p.github = request.form.get("github", p.github)
    p.linkedin = request.form.get("linkedin", p.linkedin)
    p.resume_url = request.form.get("resume_url", p.resume_url)
    p.bio_short = request.form.get("bio_short", p.bio_short)
    p.bio_long = request.form.get("bio_long", p.bio_long)
    
    db.session.commit()
    flash("Profile updated successfully!", "success")
    return redirect(url_for("admin"))

@app.route("/admin/projects", methods=["POST"])
def admin_projects():
    if not session.get("admin"): return redirect(url_for("login"))
    
    action = request.form.get("action")
    if action == "add":
        stack_str = ",".join([s.strip() for s in request.form.get("stack", "").split(",") if s.strip()])
        new_project = Project(
            id=uuid.uuid4().hex,
            name=request.form.get("name"),
            title=request.form.get("title"),
            desc=request.form.get("desc"),
            image_url=request.form.get("image_url"),
            stack=stack_str,
            github=request.form.get("github") or "#",
            demo=request.form.get("demo") or "#"
        )
        db.session.add(new_project)
        db.session.commit()
        flash("Project added successfully!", "success")
    elif action == "delete":
        proj_id = request.form.get("id")
        p = Project.query.get(proj_id)
        if p:
            db.session.delete(p)
            db.session.commit()
            flash("Project deleted!", "success")
            
    return redirect(url_for("admin"))

@app.route("/admin/experience", methods=["POST"])
def admin_experience():
    if not session.get("admin"): return redirect(url_for("login"))
    
    action = request.form.get("action")
    if action == "add":
        roles = [{"title": request.form.get("role_title"), "period": request.form.get("role_period")}]
        new_exp = Experience(
            id=uuid.uuid4().hex,
            period=request.form.get("period"),
            company=request.form.get("company"),
            location=request.form.get("location"),
            roles=json.dumps(roles)
        )
        db.session.add(new_exp)
        db.session.commit()
        flash("Experience added successfully!", "success")
    elif action == "delete":
        exp_id = request.form.get("id")
        e = Experience.query.get(exp_id)
        if e:
            db.session.delete(e)
            db.session.commit()
            flash("Experience deleted!", "success")
            
    return redirect(url_for("admin"))

@app.route("/admin/skills", methods=["POST"])
def admin_skills():
    if not session.get("admin"): return redirect(url_for("login"))
    
    action = request.form.get("action")
    if action == "add":
        new_skill = Skill(
            id=uuid.uuid4().hex,
            name=request.form.get("name"),
            icon=request.form.get("icon")
        )
        db.session.add(new_skill)
        db.session.commit()
        flash("Skill added successfully!", "success")
    elif action == "delete":
        skill_id = request.form.get("id")
        s = Skill.query.get(skill_id)
        if s:
            db.session.delete(s)
            db.session.commit()
            flash("Skill deleted!", "success")
            
    return redirect(url_for("admin"))

@app.route("/contact", methods=["POST"])
def contact():
    first_name = request.form.get("first_name", "")
    last_name = request.form.get("last_name", "")
    sender_email = request.form.get("email", "")
    subject = request.form.get("subject", "")
    message_body = request.form.get("message", "")
    
    hostinger_email = os.environ.get("HOSTINGER_EMAIL")
    hostinger_pwd = os.environ.get("HOSTINGER_PASSWORD")
    
    if not hostinger_email or not hostinger_pwd:
        return "Email credentials not configured in .env file", 500
        
    msg = EmailMessage()
    msg.set_content(f"Name: {first_name} {last_name}\nEmail: {sender_email}\n\nMessage:\n{message_body}")
    msg["Subject"] = f"Portfolio Contact: {subject}"
    msg["From"] = hostinger_email
    msg["To"] = hostinger_email
    
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.hostinger.com", 465, context=context) as server:
            server.login(hostinger_email, hostinger_pwd)
            server.send_message(msg)
        flash("Your message was sent successfully!", "success")
    except Exception as e:
        flash(f"Failed to send email: {str(e)}", "error")
        
    return redirect(url_for("index") + "#contact")

if __name__ == "__main__":
    app.run(port=8000, debug=True)
