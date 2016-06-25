FROM node:6.2-slim
MAINTAINER Olivier Berthonneau <olivier.berthonneau@nanocloud.com>

RUN npm install -g ember-cli bower sails pm2

RUN mkdir -p /opt/back
WORKDIR /opt/back

COPY package.json /tmp/package.json
RUN cd /tmp && npm install
RUN cp -a /tmp/node_modules /opt/back

COPY ./ /opt/back

EXPOSE 1337
VOLUME ["/opt/back/assets"]

CMD pm2 start app.js -- --prod && pm2 logs
