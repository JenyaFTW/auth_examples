const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const port = 3000;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const TOKEN_KEY = 'Authorization';
const JWT_SECRET = '5a633d7f34a0b59fe433c01c704625bb';

app.use((req, _, next) => {
    let user = {};
    const token = req.get(TOKEN_KEY);
    if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        user = decoded;
    }

    req.user = user;

    next();
});

app.get('/', (req, res) => {
    if (req.user.username) {
        return res.json({
            username: req.user.username,
        });
    }
    res.sendFile(path.join(__dirname+'/index.html'));
});

const users = [
    {
        login: 'Login',
        password: 'Password',
        username: 'Username',
    },
    {
        login: 'Login1',
        password: 'Password1',
        username: 'Username1',
    }
]

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;

    const user = users.find((user) => {
        if (user.login == login && user.password == password) {
            return true;
        }
        return false
    });

    if (user) {
        const token = await jwt.sign(user, JWT_SECRET);

        res.json({ token });
    }

    res.status(401).send();
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
