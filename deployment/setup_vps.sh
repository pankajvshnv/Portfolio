#!/bin/bash
# ==============================================================================
# Oracle Cloud (OCI / OPC) & Ubuntu VPS Setup Script for Pankaj's Portfolio
# Compatible with: Oracle Linux 8/9 (user: opc) & Ubuntu 22.04/24.04 (user: ubuntu/root)
# ==============================================================================

set -e

echo "=========================================================="
echo "🌟 Setting up Pankaj Portfolio on Oracle Cloud VPS..."
echo "Current User: $USER"
echo "=========================================================="

# 1. Detect Package Manager and Install Dependencies
if command -v apt-get &> /dev/null; then
    echo "📦 Detected Debian/Ubuntu system..."
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y python3 python3-pip python3-venv git nginx certbot python3-certbot-nginx curl iptables-persistent netfilter-persistent
elif command -v dnf &> /dev/null; then
    echo "📦 Detected Oracle Linux / RHEL / CentOS (dnf)..."
    sudo dnf update -y
    sudo dnf install -y python3 python3-pip git nginx certbot python3-certbot-nginx curl firewalld
    sudo systemctl enable --now firewalld
else
    echo "❌ Unsupported package manager. Please use Ubuntu or Oracle Linux."
    exit 1
fi

# 2. Configure OS Firewall specifically for Oracle Cloud
echo "🛡️ Configuring Oracle Cloud Firewall (Ports 80 & 443)..."
if command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --zone=public --add-service=http
    sudo firewall-cmd --permanent --zone=public --add-service=https
    sudo firewall-cmd --permanent --zone=public --add-port=80/tcp
    sudo firewall-cmd --permanent --zone=public --add-port=443/tcp
    sudo firewall-cmd --reload
fi

# Oracle Cloud Ubuntu instances have an iptables reject rule by default:
if command -v iptables &> /dev/null; then
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
    if command -v netfilter-persistent &> /dev/null; then
        sudo netfilter-persistent save
    fi
fi

# Configure SELinux if active (standard on Oracle Linux)
if command -v getenforce &> /dev/null; then
    if [ "$(getenforce)" != "Disabled" ]; then
        echo "🔒 Configuring SELinux for Nginx reverse proxy..."
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

# 7. Configure Nginx
echo "🌐 Configuring Nginx..."
if [ -d "/etc/nginx/sites-available" ]; then
    sudo cp deployment/nginx.conf /etc/nginx/sites-available/portfolio
    sudo ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
else
    # Oracle Linux / RHEL puts server configs in conf.d
    sudo cp deployment/nginx.conf /etc/nginx/conf.d/portfolio.conf
fi

sudo nginx -t && sudo systemctl restart nginx
sudo systemctl enable nginx

# 8. Passwordless systemctl restart for GitHub Actions CI/CD
echo "🔑 Adding passwordless systemctl permissions for user '$USER'..."
echo "$USER ALL=(ALL) NOPASSWD: /bin/systemctl restart portfolio.service, /bin/systemctl is-active portfolio.service" | sudo tee /etc/sudoers.d/portfolio_cicd > /dev/null

echo "=========================================================="
echo "✅ Oracle Cloud VPS Setup Complete!"
echo "=========================================================="
echo "⚠️ IMPORTANT FOR ORACLE CLOUD (OCI):"
echo "1. Go to Oracle Cloud Console:"
echo "   Networking -> Virtual Cloud Networks -> Your VCN -> Security Lists"
echo "   Add Ingress Rule: Source 0.0.0.0/0, Protocol TCP, Port 80,443"
echo "2. Set your domain in Nginx:"
echo "   sudo nano /etc/nginx/sites-available/portfolio (or /etc/nginx/conf.d/portfolio.conf)"
echo "3. Run Certbot for Free HTTPS:"
echo "   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo "=========================================================="
