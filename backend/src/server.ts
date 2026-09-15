import { createApp } from './app';
import { env } from './lib/env';

const app = createApp();

app.listen(env.port, () => {
  console.log(`AgroMarket API escuchando en http://localhost:${env.port}`);
});
