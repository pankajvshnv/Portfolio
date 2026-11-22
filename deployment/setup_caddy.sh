#!/bin/bash
# ==============================================================================
# Oracle Cloud VPS (OPC / Ubuntu) + Caddy Server Setup Script
# ==============================================================================

set -e

echo "=========================================================="
echo "🌟 Setting up Pankaj Portfolio with CADDY on Oracle Cloud..."
echo "Current User: $USER"
echo "=========================================================="

# 1. Install Caddy & Dependencies
if command -v apt-get &> /dev/null; then
    echo "📦 Installing Python, Git & Caddy on Ubuntu/Debian..."
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y python3 python3-pip python3-venv git curl debian-keyring debian-archive-keyring apt-transport-https iptables-persistent netfilter-persistent
    
    # Official Caddy repository for Debian/Ubuntu
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt update
    sudo apt install -y caddy

elif command -v dnf &> /dev/null; then
    echo "📦 Installing Python, Git & Caddy on Oracle Linux / RHEL..."
    sudo dnf update -y
    sudo dnf install -y python3 python3-pip git curl firewalld
    sudo dnf install -y 'dnf-command(copr)' || true
    sudo dnf copr enable -y @caddy/caddy || true
    sudo dnf install -y caddy
    sudo systemctl enable --now firewalld
else
    echo "❌ Unsupported package manager."
    exit 1
fi

# 2. Configure Firewall for Oracle Cloud (Ports 80 & 443)
echo "🛡️ Opening firewall ports 80 & 443..."
if command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --zone=public --add-service=http
    sudo firewall-cmd --permanent --zone=public --add-service=https
    sudo firewall-cmd --permanent --zone=public --add-port=80/tcp
    sudo firewall-cmd --permanent --zone=public --add-port=443/tcp
    sudo firewall-cmd --reload
fi

if command -v iptables &> /dev/null; then
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
    if command -v netfilter-persistent &> /dev/null; then
        sudo netfilter-persistent save
    fi
fi

# Configure SELinux if active
if command -v getenforce &> /dev/null; then
    if [ "$(getenforce)" != "Disabled" ]; then
        sudo setsebool -P httpd_can_network_connect 1 || true
    fi
fi

# 3. Create Web Directory & Clone Repository
APP_DIR="/var/www/portfolio"
echo "📂 Setting up app directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

if [ ! -d "$APP_DIR/.git" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/pankajvshnv/Portfolio.git $APP_DIR
fi

cd $APP_DIR

# 4. Set up Python Virtual Environment
echo "🐍 Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 5. Initialize Database if Missing
mkdir -p static/uploads
chmod -R 755 static/uploads
if [ ! -f "portfolio.db" ]; then
    echo "🌱 Initializing database with seed data..."
    python seed_data.py
fi

# 6. Configure Systemd Service
echo "⚙️ Configuring systemd service for user '$USER'..."
sudo sed -i "s/User=www-data/User=$USER/g" deployment/portfolio.service
sudo sed -i "s/Group=www-data/Group=$USER/g" deployment/portfolio.service
sudo cp deployment/portfolio.service /etc/systemd/system/portfolio.service
sudo systemctl daemon-reload
sudo systemctl enable portfolio.service
sudo systemctl restart portfolio.service

# 7. Configure Caddy
echo "🌐 Configuring Caddyfile..."
sudo cp deployment/Caddyfile /etc/caddy/Caddyfile
sudo systemctl enable caddy
sudo systemctl restart caddy

# 8. Passwordless systemctl restart for GitHub Actions CI/CD
echo "🔑 Adding passwordless systemctl permissions for user '$USER'..."
echo "$USER ALL=(ALL) NOPASSWD: /bin/systemctl restart portfolio.service, /bin/systemctl is-active portfolio.service, /bin/systemctl reload caddy, /bin/systemctl restart caddy" | sudo tee /etc/sudoers.d/portfolio_cicd > /dev/null

echo "=========================================================="
echo "✅ Oracle Cloud + Caddy Setup Complete!"
echo "=========================================================="
echo "Next step: Put your domain in /etc/caddy/Caddyfile:"
echo "   sudo nano /etc/caddy/Caddyfile"
echo "Then reload Caddy (it automatically gets free SSL!):"
echo "   sudo systemctl reload caddy"
echo "=========================================================="
