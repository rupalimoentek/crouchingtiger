FROM node:8.10-alpine
RUN apk update && apk upgrade && apk add git
RUN mkdir /home/CT 
RUN git clone https://github.com/rupalimoentek/crouchingtiger.git /home/CT
WORKDIR /home/CT
RUN pwd
RUN npm install
RUN npm install -g bower@"^1.8.8"
RUN bower --allow-root install /home/CT/crouchingtiger/bower.json
RUN grunt
