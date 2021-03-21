FROM node:8.10-alpine
RUN pwd
RUN npm install
RUN pwd
RUN npm install -g bower
RUN pwd
RUN bower --allow-root install bower.json
RUN grunt
