#!/bin/sh
set -eu

if [ -z "${LETSENCRYPT_DOMAIN:-}" ]; then
  echo "LETSENCRYPT_DOMAIN must be set (e.g. yourname.duckdns.org)" >&2
  exit 1
fi

DOMAIN="$LETSENCRYPT_DOMAIN"
HTTPS_DIR="/etc/letsencrypt/live/$DOMAIN"

if [ -f "$HTTPS_DIR/fullchain.pem" ] && [ -f "$HTTPS_DIR/privkey.pem" ]; then
  sed "s|__DOMAIN__|${DOMAIN}|g" /etc/nginx/templates/nginx.https.conf > /etc/nginx/nginx.conf
else
  sed "s|__DOMAIN__|${DOMAIN}|g" /etc/nginx/templates/nginx.http.conf > /etc/nginx/nginx.conf
fi

exec nginx -g 'daemon off;'
