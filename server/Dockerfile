FROM node:20
WORKDIR /app
COPY . .
RUN npm install --production
EXPOSE 3001
CMD ["node", "index.js"]
