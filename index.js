const express = require('express')
const sequelize = require('./db')
const { DataTypes, Op } = require('sequelize')
const session = require('express-session')

const app = express()
const port = 3000

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: true }))
app.use(
    session({
        secret: 'mysecretkey',
        resave: false,
        saveUninitialized: true,
        cookie: {maxAge: 3600000}
    })
)

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
    // console.log(req.session)
    res.render('index')
})

app.get('/login', (req, res) => {
    res.render('user/login')
})

app.post('/login', async(req, res) => {
    const {username, password} = req.body
    const exists_user = await User.findOne ({
        where: {
            username
        }
    })

    if (!exists_user) {
        res.send ({message: 'User doesn\'n exist!'})
        return
    }

    if (password == exists_user.password) {
        req.session.user = username
        res.redirect('/')
    } else {
        res.send ({message: 'Password is incorrect!'})
    }
})

app.get('/register', (req, res) => {
    res.render('user/register')
})

app.post('/register', async (req, res) => {
    const { username, email, password, confirm_password } = req.body
    //const password = req.body.password -> it's the same as the above line. 
    const exists_user = await User.findOne ({ //to avoid the ORM error.
        where: {
            [Op.or]: [{ username }, { email }]
        }
    })

    if (exists_user) {
        res.send({ message: 'Duplicate email/username, please try another one!'})        
    }
    
    if (password !== confirm_password) {
        res.send({ message: 'Password doesn\'t match, check it again!' });
        return;
    }

    await User.create({
        username,
        email,
        password
    });
    res.redirect('/')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
