const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { AuthenticationClient, UserInfoClient } = require('auth0');
const { auth } = require('express-oauth2-jwt-bearer');
const port = 3000;

const CLIENT_ID = '7Olt2WPXxlf56SYb41BOyGAfxiiyGAe6';
const CLIENT_SECRET = '90P5wXl-xE2IQEcmG9e42Xs2GNpKt9YfAZ5Gq84Ef_Jc2v8Sbi6P4RSL0ZwQdTwQ';
const DOMAIN = 'yevgen-kpi.eu.auth0.com';

const auth0 = new AuthenticationClient({
    domain: DOMAIN,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
});

const checkJwt = auth({
    audience: 'http://localhost:3000/',
    issuerBaseURL: `https://${DOMAIN}/`,
});

const userInfo = new UserInfoClient({
    domain: DOMAIN,
});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const TOKEN_KEY = 'Authorization';

app.get('/api/me', checkJwt, async (req, res) => {
    const auth = req.auth;
    if (auth) {
        const token = auth.token;
        const { data } = await userInfo.getUserInfo(token);
        console.log(data);
        return res.json(data);
    }
    return res.status(401).json({ 'error': 'Forbidden' });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/api/redirect', (req, res) => {
    return res.redirect(301, `https://${DOMAIN}/authorize?client_id=${CLIENT_ID}&redirect_uri=http://localhost:3000/&response_type=code&response_mode=query&scope=offline_access+openid+profile&audience=http://localhost:3000/&prompt=login`);
});

app.get('/api/callback', async (req, res) => {
    const code = req.query['code'];
    if (code) {
        const data = await auth0.oauth.authorizationCodeGrant({ code, redirect_uri: 'http://localhost:3000/', grant_type: 'authorization_code' });
        console.log(data.data.access_token);
        return res.json(data.data);
    }
    return res.status(403).json({ error: 'Forbidden' });
});

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        const { data } = await auth0.oauth.passwordGrant({
            username: login,
            password,
            scope: 'offline_access openid',
            audience: 'http://localhost:3000/'
        });

        res.json(data).send();
    } catch (err) {
        res.status(401).send();
    }
});

app.post('/api/refresh', async (req, res) => {
    const refresh_token = req.get(TOKEN_KEY);

    const { data } = await auth0.oauth.refreshTokenGrant({ refresh_token });

    res.json(data).send();
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
