#!/bin/bash
# =============================================================================
# NoteSphere Backend Service Restart Script (Executed on EC2 during CI/CD)
# =============================================================================

set -e

APP_DIR="/opt/notesphere"
JAR_NAME="notesphere.jar"
NEW_JAR="$APP_DIR/notesphere-latest.jar"

echo "=== [1/3] Checking incoming deployment artifact ==="
if [ -f "$NEW_JAR" ]; then
    if [ -f "$APP_DIR/$JAR_NAME" ]; then
        echo "Backing up current JAR..."
        cp "$APP_DIR/$JAR_NAME" "$APP_DIR/notesphere-backup.jar"
    fi
    mv "$NEW_JAR" "$APP_DIR/$JAR_NAME"
    chmod 755 "$APP_DIR/$JAR_NAME"
    echo "Swapped incoming build to $APP_DIR/$JAR_NAME"
else
    echo "Using existing $APP_DIR/$JAR_NAME"
fi

echo "=== [2/3] Restarting NoteSphere Service ==="
sudo systemctl restart notesphere.service

echo "=== [3/3] Verifying Service Health ==="
sleep 6

STATUS=$(sudo systemctl is-active notesphere.service)
if [ "$STATUS" = "active" ]; then
    echo "NoteSphere backend is ACTIVE and running on port 8080!"
else
    echo "Service status: $STATUS"
    echo "Printing recent service logs:"
    sudo journalctl -u notesphere.service -n 30 --no-pager
    exit 1
fi
