FROM golang:1.6
MAINTAINER \
  Olivier Berthonneau <olivier.berthonneau@nanocloud.com>

COPY ./ /go/src/github.com/Nanocloud/nanocloud/plaza
WORKDIR /go/src/github.com/Nanocloud/nanocloud/plaza

RUN ./install.sh
CMD ["sh", "-c", "./build.sh"]
