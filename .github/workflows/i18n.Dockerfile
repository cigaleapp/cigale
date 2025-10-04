FROM oven/bun:1.2.23-alpine

RUN apk update

RUN apk add --no-cache git bash openssh gettext=0.22.5-r0 
