FROM node:5.6-slim
MAINTAINER Romain Soufflet <romain.soufflet@nanocloud.com>

RUN npm install -g bootprint bootprint-openapi
WORKDIR /opt

COPY nanocloud-api.yml /opt/swagger.yml
CMD bootprint openapi swagger.yml /opt/output
