const express = require('express')
const sequelize = require('./db')
const { DataTypes } = require('sequelize')

const app = express()
const port = 3000

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: true }))

const User = sequelize.define(
    'User',
    {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        forget_pass: {
            type: DataTypes.STRING,
            unique: true,
        },
    },
    {
        timestamps: true
    }
)

sequelize
    .sync({ force: false })
    .then(() => {
        console.log('Database & tables created!');
    })
    .catch((error) => {
        console.error('Error creating database & tables:', error);
    });

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/login', (req, res) => {
    res.render('user/login')
})

app.get('/register', (req, res) => {
    res.render('user/register')
})

app.post('/register', async (req, res) => {
    const { username, email, password, confirm_password } = req.body
    //const password = req.body.password -> it's the same as the above line. 
    if (password !== confirm_password) {
        res.send({ message: 'error' });
        return;
    }
    const user = await User.create({
        username,
        email,
        password
    });
    res.send({ user })
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
