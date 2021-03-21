FROM node:8.10-alpine
RUN apk update && apk upgrade && apk add git
RUN pwd
RUN npm install
RUN pwd
RUN npm install -g bower
RUN pwd
RUN ls /crouchingtiger/bower.json
RUN bower --allow-root install rupalimoentek/crouchingtiger/blob/main/crouchingtiger/bower.json
RUN grunt
