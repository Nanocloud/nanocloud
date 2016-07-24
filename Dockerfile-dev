FROM nanocloud/backend
MAINTAINER Olivier Berthonneau <olivier.berthonneau@nanocloud.com>

RUN npm install nodemon node-inspector -g

EXPOSE 5858
EXPOSE 8081

CMD npm install && (node-inspector --hidden assets/ --web-port=8081 &) && nodemon --debug app.js
