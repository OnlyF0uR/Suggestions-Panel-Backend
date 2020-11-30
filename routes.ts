import { Router, createJWT, verifyJWT, config } from './deps.ts';

const cache = new Map<string, { user: UserData, guilds: GuildData[]}>();

const router = new Router();

// Only discord oAuth2.0 interacts with this request
router.get('/auth', async (ctx) => {
    const code = ctx.request.url.searchParams.get('code');

    const data: any = {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:8080/auth',
        code: code,
        scope: 'identity guilds',
    };

    const tokenData = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams(data),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    const tokenDataJson = await tokenData.json();

    const userData = await getUserData(tokenDataJson);

    const jwt = await createJWT({ alg: 'HS512', typ: 'JWT', exp: Date.now() + 1800000 }, { id: userData.id }, config.jwtSecret);
    ctx.cookies.set('token', jwt);

    const guilds = await getGuildList(tokenDataJson);
    cache.set(userData.id, { user: userData, guilds: guilds });

    ctx.response.redirect('http://localhost:3000/discordbots/stats');
});

// Our api interacts with this request
router.get('/api/userdata', async (ctx) => {
    const token = ctx.cookies.get('token');
    if (token == null) {
        ctx.response.status = 404;
    } else {
        const payload = await verifyJWT(token, config.jwtSecret, "HS512");
        const id = payload.id as string;

        ctx.response.status = 200;
        ctx.response.body = cache.get(id)?.user;
    }
});

const getUserData = async (data: TokenData): Promise<UserData> => {
    const userData = await fetch('https://discord.com/api/users/@me', {
        headers: {
            authorization: `${data.token_type} ${data.access_token}`,
        },
    });
    return await userData.json();
}

const getGuildList = async (data: TokenData): Promise<GuildData[]> => {
    const userData = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: {
            authorization: `${data.token_type} ${data.access_token}`,
        },
    });
    return await userData.json();
}

interface TokenData {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
}

interface UserData {
    id: string;
    username: string;
    avatar: string;
    discriminator: string;
    public_flags: number;
    flags: number;
    locale: string;
    mfa_enabled: boolean;
}

interface GuildData {
    id: string;
    name: string;
    icon: string;
    owner: boolean;
    permissions: number;
    features: string[];
    permissions_new: string;
}

export default router;