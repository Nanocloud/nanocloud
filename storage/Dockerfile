FROM debian:8.3
MAINTAINER Romain Soufflet <romain.soufflet@nanocloud.com>

RUN apt-get update && \
    apt-get -y install samba

COPY smb.conf /etc/samba/smb.conf

EXPOSE 445
EXPOSE 445/udp
EXPOSE 9090

RUN mkdir /opt/Users

CMD ["sh", "-c", "smbd -D; nmbd -D; /opt/plaza/plaza"]
