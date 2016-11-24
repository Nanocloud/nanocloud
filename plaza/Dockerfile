FROM golang:1.6
MAINTAINER \
  Olivier Berthonneau <olivier.berthonneau@nanocloud.com>

COPY ./install.sh /go/src/github.com/Nanocloud/nanocloud/plaza/install.sh
WORKDIR /go/src/github.com/Nanocloud/nanocloud/plaza

RUN ./install.sh
COPY ./ /go/src/github.com/Nanocloud/nanocloud/plaza

CMD ["sh", "-c", "./build.sh"]
