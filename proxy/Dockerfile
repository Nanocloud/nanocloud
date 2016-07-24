FROM nginx:1.9.14-alpine
MAINTAINER Olivier Berthonneau <olivier.berthonneau@nanocloud.com>

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./certificates /etc/nginx/ssl/

EXPOSE 80
EXPOSE 443
