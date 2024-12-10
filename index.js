const express = require('express')
const sequelize = require('./db')
const { DataTypes, Op } = require('sequelize')
const session = require('express-session')
const { isAuthenticated } = require ('./middlewares/auth.middleware')
const crypto = require ('crypto')

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
    'User', {
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

const ShortUrl = sequelize.define(
    'ShortUrl', {
        url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
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
    res.render('index', { key: '' })
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

app.post('/register', async(req, res) => {
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

app.get('/profile', isAuthenticated, async(req, res) => { //If doesn't have user session, can not see profile page.
    const user = await User.findOne({
        where: {
            username: req.session.user
        }
    })
    res.render('user/profile', {username: user.username, email:user.email})
})

app.post('/profile', isAuthenticated, async (req, res) => {
    const { username, email, password } = req.body
    const user = await User.findOne({
        where: {
            username: req.session.user
        }
    })
    // to check if the updated username and email are not exist in the database.
    if (username) {
        const exists_user = await User.findOne({
            where: {
                username
            }
        })
        if (exists_user) {
            res.redirect('/profile')
        } else {
            user.username = username
            req.session.user = username
        }
    }

    if (email) {
        const exists_user = await User.findOne({
            where: {
                email
            }
        })
        if (exists_user) {
            res.redirect('/profile')
        } else {
            user.email = email
        }
    }

    if (password) {
        user.password = password
    }

    user.save()

    res.render('user/profile', {username: user.username, email: user.email})
})

//to generate unique 5 characters
function generateUniqueString(length = 5) {
    return crypto.randomBytes(length).toString('base64').slice(0, length)
}

function generateRandomString(length) {
	const characters =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	const charactersLength = characters.length;

	for (let i = 0; i < length; i++) {
		result += characters.charAt(
			Math.floor(Math.random() * charactersLength)
		);
	}

	return result;
}

app.post('/', async(req, res) => {
    const { original_url } = req.body

    const key = generateUniqueString()

    const ShortURL = ShortUrl.create({
        url: original_url,
        key
    })
    res.render('index', { key })
})

app.get('/u/:key', async(req, res) => {
    const url = await ShortUrl.findOne({        
        where: {
            key: req.params.key
        }
    })
    if (url) {
        res.redirect(url.url)
    } else {
        res.redirect('/')
    }
})

app.get('/forget', (req, res) => {
    res.render('user/forget', { message: '' })
})

app.post('/forget', async (req, res) => {
    const { username } = req.body
    const randomString = generateRandomString(20)
    
    const user = await User.findOne({
        where: {
            username: username
        }
    })

    if (user) {
        user.forget_pass = randomString
		console.log(`http://localhost:3000/forget/${randomString}`)

        user.save()
    }

    res.render('user/forget', { message:'We sent a link to your email. Check and click on it.' })
})

app.get('/forget/:forget_key', (req, res) => {
    res.render('user/reset-password', { message: '' })
})

app.post('/forget/:forget_key', async(req, res) => {
    const { password, confirm_password } = req.body

    if (password == confirm_password) {
        const user = await User.findOne({
            where: {
                forget_pass: req.params.forget_key
            }
        })

        if (user) {
        user.password = password
        user.save()

        res.render('user/reset-password', { message: 'Your account password updated!'})
    } else{
        res.redirect('/login')
    }
} else {
    res.render('user/reset-password', { message: 'Password mismatched, check it again.'})
}
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
