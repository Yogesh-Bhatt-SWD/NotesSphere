#!/bin/bash
sudo mysql << 'EOF'
CREATE USER IF NOT EXISTS 'notesphere'@'localhost' IDENTIFIED BY 'root123';
ALTER USER 'notesphere'@'localhost' IDENTIFIED BY 'root123';
GRANT ALL PRIVILEGES ON *.* TO 'notesphere'@'localhost' WITH GRANT OPTION;

CREATE USER IF NOT EXISTS 'notesphere'@'%' IDENTIFIED BY 'root123';
ALTER USER 'notesphere'@'%' IDENTIFIED BY 'root123';
GRANT ALL PRIVILEGES ON *.* TO 'notesphere'@'%' WITH GRANT OPTION;

CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'root123';
ALTER USER 'root'@'%' IDENTIFIED BY 'root123';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY 'root123';
ALTER USER 'root'@'127.0.0.1' IDENTIFIED BY 'root123';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;

CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY 'root123';
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root123';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;

CREATE DATABASE IF NOT EXISTS db_notesphere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
FLUSH PRIVILEGES;
EOF

sudo sed -i 's/SPRING_DATASOURCE_USERNAME=root/SPRING_DATASOURCE_USERNAME=notesphere/g' /opt/notesphere/application.env
echo "Configured users and application.env"
