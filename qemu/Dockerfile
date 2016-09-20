FROM debian:8.5
MAINTAINER Romain Soufflet <romain.soufflet@nanocloud.com>

RUN apt-get update -y && \
    apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get install -y git nodejs qemu-system-x86

WORKDIR /opt

COPY package.json /tmp/package.json
RUN cd /tmp && npm install
RUN cp -a /tmp/node_modules /opt/

COPY ./ /opt/

EXPOSE 3000

CMD ["node", "index.js"]
