# Simple MarkDoc 

Manage Markdoc easly with Svelte.

## Remote Development

## Local Development

### 🧑‍🤝‍🧑 Clone the project

```sh
git clone https://github.com/diramazioni/smdoc.git
```

### 📦️ Install dependencies

```sh
pnpm i
```

### 💾️ Init and seed the db with prisma 
```sh
pnpm prisma db push &&\
pnpm seed
```

### 💿️ Run the development server

```sh
pnpm run dev
```
### Deploy to the server
```sh
pnpm run build &&\
mv deploy/pm2/ecosystem.config.cjs.example deploy/pm2/ecosystem.config.cjs
```
Then edit the file deploy/pm2/ecosystem.config.cjs
```sh
pm2 start deploy/pm2/ecosystem.config.cjs
pm2 save
```