import { Application, config } from './deps.ts';

import router from './routes.ts';

const app = new Application();

app.use(async (ctx, next) => {
    await next();
    const time = ctx.response.headers.get('X-Response-Time');
    console.log(`${ctx.request.method} ${ctx.request.url}: ${time}`);
});

app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const delta = Date.now() - start;
    ctx.response.headers.set("X-Response-Time", `${delta}ms`);
});

app.use(router.routes());

// We use this dynamic loader to load stylesheets etc. (You actually can send html files using this middleware but we use the routes for that)
app.use(async (ctx) => {
    ctx.response.body = `   _____          _          _  _____                     
  / ____|        | |        | |/ ____|                    
 | |     ___   __| | ___  __| | (___  _ __   _____      __
 | |    / _ \\ / _\` |/ _ \\/ _\` |\\___ \\| '_ \\ / _ \\ \\ /\\ / /
 | |___| (_) | (_| |  __/ (_| |____) | | | | (_) \\ V  V / 
  \\_____\\___/ \\__,_|\\___|\\__,_|_____/|_| |_|\\___/ \\_/\\_/`;
});

if (import.meta.main) {
    await app.listen({
        port: config.port
    });
}