#!/bin/bash
# =============================================================================
# NoteSphere Backend EC2 Bootstrap Script (Ubuntu 22.04 / 24.04 LTS)
# Run once on your EC2 instance to prepare the environment:
#   chmod +x setup-ec2.sh
#   sudo ./setup-ec2.sh
# =============================================================================

set -e

echo "=== [1/6] Updating system packages ==="
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl wget git unzip ufw

echo "=== [2/6] Installing OpenJDK 21 ==="
sudo apt-get install -y openjdk-21-jdk
java -version

echo "=== [3/6] Installing and configuring MySQL Server ==="
sudo apt-get install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql

# Create database and configure user if not already present
sudo mysql -e "CREATE DATABASE IF NOT EXISTS db_notesphere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root123';"
sudo mysql -e "FLUSH PRIVILEGES;"
echo "MySQL initialized with database 'db_notesphere'!"

echo "=== [4/6] Creating application directory ==="
sudo mkdir -p /opt/notesphere
sudo chown -R $USER:$USER /opt/notesphere
chmod 755 /opt/notesphere

# Create application environment configuration template
if [ ! -f /opt/notesphere/application.env ]; then
cat << 'EOF' > /opt/notesphere/application.env
# NoteSphere Backend Production Environment Variables
SERVER_PORT=8080
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/db_notesphere?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=root123
JWT_SECRET=NoteSphereSecretKeyForJWTAuthenticationMustBeAtLeast256BitsLong2024SecureKey
JWT_ACCESS_TOKEN_EXPIRATION_MS=86400000
JWT_REFRESH_TOKEN_EXPIRATION_MS=604800000
APP_CORS_ALLOWED_ORIGINS=*
EOF
chmod 600 /opt/notesphere/application.env
echo "Created /opt/notesphere/application.env"
fi

echo "=== [5/6] Setting up Systemd Service ==="
sudo cp "$(dirname "$0")/notesphere.service" /etc/systemd/system/notesphere.service
sudo systemctl daemon-reload
sudo systemctl enable notesphere.service

echo "=== [6/6] Configuring Firewall ==="
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 8080/tcp comment 'NoteSphere Backend API'
sudo ufw --force enable || true

echo ""
echo "=========================================================="
echo " NoteSphere EC2 Setup Complete!"
echo " Deployment folder: /opt/notesphere"
echo " Service name:      notesphere.service"
echo " Port:              8080"
echo "=========================================================="
