FROM nanocloud/frontend
MAINTAINER Olivier Berthonneau <olivier.berthonneau@nanocloud.com>

CMD npm install && \
    bower install --allow-root && \
    ember build --environment=development && \
    ember serve --insecure-proxy true --ssl true --ssl-key /opt/ssl/nginx.key --ssl-cert /opt/ssl/nginx.crt
