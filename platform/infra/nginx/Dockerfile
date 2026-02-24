FROM nginx:1.27-alpine

RUN apk add --no-cache openssl

COPY platform/infra/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY platform/infra/nginx/docker-entrypoint.sh /docker-entrypoint.sh
COPY platform/infra/nginx/static/ /usr/share/nginx/html/

RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
