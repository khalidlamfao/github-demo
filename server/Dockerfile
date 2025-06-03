FROM node:18
WORKDIR /app/server
COPY server/package.json ./package.json
RUN npm install --production
COPY server .
COPY client ../client
EXPOSE 3001
CMD ["npm", "start"]
