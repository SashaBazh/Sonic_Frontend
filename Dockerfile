FROM node:18 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm install -g @angular/cli
RUN npm run build -- --configuration production

FROM node:18-alpine
RUN npm install -g serve
COPY --from=build /app/dist/sonic-full/browser /app
EXPOSE 7000
CMD ["serve", "-s", "/app", "-l", "7000"]