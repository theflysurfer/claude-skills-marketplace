#!/bin/bash

# ========================================
# Create New Nginx Site from Template
# ========================================
# Interactive script to create a new site configuration
# Usage: ./create-new-site.sh

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================"
echo "  Create New Nginx Site"
echo "========================================"
echo ""

# Function to prompt user
prompt() {
    local var_name="$1"
    local prompt_text="$2"
    local default_value="${3:-}"

    if [ -n "$default_value" ]; then
        read -p "$(echo -e ${BLUE}${prompt_text}${NC} [${default_value}]: )" user_input
        eval "$var_name=\"${user_input:-$default_value}\""
    else
        read -p "$(echo -e ${BLUE}${prompt_text}${NC}: )" user_input
        eval "$var_name=\"$user_input\""
    fi
}

# Step 1: Choose site type
echo -e "${YELLOW}Step 1: Choose site type${NC}"
echo "  1) WordPress (with rate limiting, security)"
echo "  2) Reverse Proxy (Streamlit, Node.js, generic apps)"
echo ""
prompt SITE_TYPE "Enter choice (1 or 2)" "2"

case $SITE_TYPE in
    1)
        TEMPLATE="templates/site-template-wordpress.conf"
        TYPE_NAME="WordPress"
        ;;
    2)
        TEMPLATE="templates/site-template-reverse-proxy.conf"
        TYPE_NAME="Reverse Proxy"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✓${NC} Selected: $TYPE_NAME"
echo ""

# Step 2: Site details
echo -e "${YELLOW}Step 2: Site details${NC}"
prompt SITE_NAME "Site name (for files/logs, e.g., 'myapp')"
prompt DOMAIN_NAME "Domain name (e.g., 'myapp.srv759970.hstgr.cloud')" "${SITE_NAME}.srv759970.hstgr.cloud"
prompt BACKEND_PORT "Backend port (e.g., 8501 for Streamlit, 9002 for WordPress)"

echo ""
echo -e "${GREEN}✓${NC} Site name: $SITE_NAME"
echo -e "${GREEN}✓${NC} Domain: $DOMAIN_NAME"
echo -e "${GREEN}✓${NC} Backend port: $BACKEND_PORT"
echo ""

# Step 3: Optional features
echo -e "${YELLOW}Step 3: Optional features${NC}"

# Basic auth
prompt ENABLE_BASIC_AUTH "Enable basic authentication? (y/n)" "n"

# Confirm
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "  Template: $TYPE_NAME"
echo "  Site name: $SITE_NAME"
echo "  Domain: $DOMAIN_NAME"
echo "  Backend port: $BACKEND_PORT"
echo "  Basic auth: $ENABLE_BASIC_AUTH"
echo ""
prompt CONFIRM "Create this configuration? (y/n)" "y"

if [ "$CONFIRM" != "y" ]; then
    echo "Aborted."
    exit 0
fi

# Step 4: Create configuration file
echo ""
echo -e "${YELLOW}Step 4: Creating configuration...${NC}"

CONFIG_FILE="configs/sites-available/${SITE_NAME}"

# Check if file already exists
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error:${NC} Configuration file already exists: $CONFIG_FILE"
    exit 1
fi

# Copy template and replace placeholders
sed -e "s|{{DOMAIN_NAME}}|${DOMAIN_NAME}|g" \
    -e "s|{{SITE_NAME}}|${SITE_NAME}|g" \
    -e "s|{{BACKEND_PORT}}|${BACKEND_PORT}|g" \
    "$TEMPLATE" > "$CONFIG_FILE"

# Enable/disable basic auth
if [ "$ENABLE_BASIC_AUTH" = "y" ]; then
    # Uncomment basic auth line
    sed -i 's|# include snippets/basic-auth.conf;|include snippets/basic-auth.conf;|g' "$CONFIG_FILE"
    echo -e "${GREEN}✓${NC} Basic authentication enabled"
else
    echo -e "${BLUE}[i]${NC} Basic authentication disabled (can be enabled later)"
fi

echo -e "${GREEN}✓${NC} Configuration created: $CONFIG_FILE"
echo ""

# Step 5: Pre-deployment checks
echo -e "${YELLOW}Step 5: Pre-deployment checks${NC}"

# Check SSL certificate
echo -e "${BLUE}[i]${NC} Checking SSL certificate..."
if ssh automation@69.62.108.82 "test -f /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} SSL certificate exists for $DOMAIN_NAME"
else
    echo -e "${RED}✗${NC} SSL certificate NOT found for $DOMAIN_NAME"
    echo -e "${YELLOW}[!]${NC} You need to create the certificate before deploying:"
    echo "    ssh automation@69.62.108.82 \"sudo certbot certonly --nginx -d ${DOMAIN_NAME}\""
    SSL_MISSING=1
fi

# Check backend is running
echo -e "${BLUE}[i]${NC} Checking backend on port $BACKEND_PORT..."
if ssh automation@69.62.108.82 "curl -s -o /dev/null -w '%{http_code}' http://localhost:${BACKEND_PORT}" | grep -q "200\|302\|301\|404" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Backend is responding on port $BACKEND_PORT"
else
    echo -e "${RED}✗${NC} Backend NOT responding on port $BACKEND_PORT"
    echo -e "${YELLOW}[!]${NC} Make sure your application is running before deploying"
    BACKEND_MISSING=1
fi

# Check rate limiting zones (for WordPress)
if [ "$SITE_TYPE" = "1" ]; then
    echo -e "${BLUE}[i]${NC} Checking rate limiting zones (WordPress)..."
    if ssh automation@69.62.108.82 "sudo nginx -T 2>/dev/null | grep -q 'limit_req_zone.*wplogin'"; then
        echo -e "${GREEN}✓${NC} Rate limiting zones configured"
    else
        echo -e "${RED}✗${NC} Rate limiting zones NOT configured"
        echo -e "${YELLOW}[!]${NC} Deploy rate-limiting-zones.conf before deploying WordPress site"
        ZONES_MISSING=1
    fi
fi

echo ""

# Step 6: Validation
echo -e "${YELLOW}Step 6: Validating configuration...${NC}"
./scripts/validate-nginx-config.sh "$SITE_NAME" || {
    echo -e "${RED}Validation failed!${NC}"
    echo "Fix the issues above before deploying."
    exit 1
}

echo ""

# Step 7: Next steps
echo "========================================"
echo "  Configuration Created Successfully!"
echo "========================================"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo ""

if [ -n "${SSL_MISSING:-}" ]; then
    echo -e "${YELLOW}1. Create SSL certificate:${NC}"
    echo "   ssh automation@69.62.108.82 \"sudo certbot certonly --nginx -d ${DOMAIN_NAME}\""
    echo ""
fi

if [ -n "${BACKEND_MISSING:-}" ]; then
    echo -e "${YELLOW}2. Start your backend application on port ${BACKEND_PORT}${NC}"
    echo ""
fi

if [ -n "${ZONES_MISSING:-}" ]; then
    echo -e "${YELLOW}3. Deploy rate limiting configuration:${NC}"
    echo "   scp configs/conf.d/rate-limiting-zones.conf automation@69.62.108.82:/tmp/"
    echo "   ssh automation@69.62.108.82 \"sudo mv /tmp/rate-limiting-zones.conf /etc/nginx/conf.d/\""
    echo ""
fi

if [ -z "${SSL_MISSING:-}" ] && [ -z "${BACKEND_MISSING:-}" ] && [ -z "${ZONES_MISSING:-}" ]; then
    echo -e "${GREEN}All checks passed! Ready to deploy.${NC}"
    echo ""
    echo -e "${YELLOW}Deploy the site:${NC}"
    echo "   ./scripts/nginx-deploy.sh configs/sites-available/${SITE_NAME} ${SITE_NAME}"
    echo ""
    echo -e "${YELLOW}After deployment, test:${NC}"
    echo "   curl -k -I https://${DOMAIN_NAME}/"
else
    echo -e "${YELLOW}After completing the steps above, deploy with:${NC}"
    echo "   ./scripts/nginx-deploy.sh configs/sites-available/${SITE_NAME} ${SITE_NAME}"
fi

echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "   - Standards: docs/NGINX_STANDARDS.md"
echo "   - Template: $TEMPLATE"
echo "   - Config file: $CONFIG_FILE"
echo ""
echo "========================================"
