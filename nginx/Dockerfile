FROM nginx:alpine
COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY nginx.http.conf /etc/nginx/templates/nginx.http.conf
COPY nginx.https.conf /etc/nginx/templates/nginx.https.conf
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
