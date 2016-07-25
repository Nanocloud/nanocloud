FROM golang:1.6
MAINTAINER \
  Olivier Berthonneau <olivier.berthonneau@nanocloud.com>

COPY ./ /go/src/github.com/Nanocloud/community/plaza
WORKDIR /go/src/github.com/Nanocloud/community/plaza

RUN ./install.sh
CMD ["sh", "-c", "./build.sh"]
