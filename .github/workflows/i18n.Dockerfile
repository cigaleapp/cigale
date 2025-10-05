FROM oven/bun:1.2.23-alpine

RUN apk update

RUN apk add --no-cache git bash openssh gettext=0.22.5-r0 musl-dev tar make diffutils gcc

RUN wget https://download.gnu.org.ua/pub/releases/podiff/podiff-1.4.tar.gz

RUN tar xzf podiff-1.4.tar.gz

RUN cd podiff-1.4 && make
RUN cp podiff-1.4/podiff /usr/local/bin/podiff

RUN rm -rf podiff-1.4 podiff-1.4.tar.gz
