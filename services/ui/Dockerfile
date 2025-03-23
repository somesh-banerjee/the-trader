FROM node:22

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

RUN npm run build

CMD ["npm", "start"]
