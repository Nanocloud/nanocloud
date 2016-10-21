FROM node:6.3.0-slim
MAINTAINER Olivier Berthonneau <olivier.berthonneau@nanocloud.com>

RUN npm install -g pm2

RUN mkdir -p /opt/back
WORKDIR /opt/back

COPY package.json /tmp/package.json
RUN cd /tmp && npm install
RUN cp -a /tmp/node_modules /opt/back

COPY ./ /opt/back

EXPOSE 1337

CMD pm2 start app.js -- --prod && pm2 logs
