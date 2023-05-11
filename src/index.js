const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const app = express();
const path = require("path");
const port = 3000;
const handlebars = require("express-handlebars");
const async = require("hbs/lib/async");
const { connectionUrl } = require("./config"); // Import the connectionUrl from config.js
const templatePath = path.join(__dirname, 'resources/views')
const { shipper, user, vendor, product } = require("./mongodb");
const { error } = require("console");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require('bcrypt');
const publicPath = path.join(__dirname, "/public");
const fs = require("fs");
const bodyParser = require('body-parser');
require('dotenv').config();


var multer = require('multer');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

var upload = multer({ storage: storage });


app.engine('handlebars', handlebars.engine({
    extname: '.hbs',
    partialsDir: [
        path.join(__dirname, 'resources/views/partials'),
    ]
}));


app.use(express.static(publicPath));
app.use(express.json());
app.use(cors());
app.set("view engine", "handlebars");
app.set("views", templatePath);
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: "secretKey",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }, // 1 hour
    store: MongoStore.create({
        mongoUrl: connectionUrl, // use the imported connectionUrl
        collectionName: 'sessions'
    })
}));

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/home", async (req, res, next) => {
    if ((!req.session.user)) {
        res.redirect("/");
        return;
    }
    else {
        if ((!req.session.user.check_shipper) && (!req.session.user.check_vendor)) {
            // try {
            //     await user.find({}, { img: 1, name: 1, address: 1, username: 1, _id: 0 }).then(users => {
            //         let map_user = users.map(User => User.toJSON());
            //         for (let i = 0; i < map_user.length; i++) {
            //             map_user[i].img = Buffer.from(map_user[i].img.data.data).toString('base64');
            //         }

            //         res.render('home', {
            //             showUser: true,
            //             loggedInUser: req.session.user,
            //             users: map_user,
            //         });
            //     })
            // }
            // catch (error) {
            //     console.log(error.message);
            // }

            try {
                await product.find({}, { img: 1, product_name: 1, category: 1, price: 1, _id: 0 }).then(products => {
                    let map_product = products.map(Product => Product.toJSON());
                    for (let i=0; i < map_product.length; i++){
                        map_product[i].img = Buffer.from(map_product[i].img.data.data).toString('base64');
                    }

                    res.render('home', {
                        showUser: true,
                        loggedInUser: req.session.user,
                        products: map_product,
                    });
                })
            }
            catch (error) {
                console.log(error.message);
            }
        }
    }
})


app.get("/signup-user", (req, res) => {
    if (req.session.user) {
        res.redirect("/home");
        return;
    }
    res.render("signup-user");
});

app.get("/add-product", (req, res) => {
    try {
        if (req.session.user.check_vendor) {
            res.render("add-product");
        }
        else {
            res.redirect("/")
        }
    }
    catch {
        res.redirect("/")
    }
});

app.get("/signup-vendor", (req, res) => {
    if (req.session.user) {
        res.redirect("/home");
        return;
    }
    res.render("signup-vendor");
});

app.get("/signup-shipper", (req, res) => {
    if (req.session.user) {
        res.redirect("/home");
        return;
    }
    res.render("signup-shipper");
});

app.get("/login", (req, res) => {
    if (req.session.user.check_vendor) {
        res.redirect("/view-product");
    }
    else if (req.session.user.check_shipper) {
        res.redirect("/shipper");
    }
    else {
        res.redirect("/home");
    }
});

app.get("/privacy-policy", (req, res) => {
    res.render("privacy-policy");
});

app.get("/view-product", async (req, res, next) => {
    try {
        if (req.session.user.check_vendor) {
                try {
                    await product.find({owner:req.session.user.check_vendor.username}, { img: 1, product_name: 1, category: 1, price: 1, _id: 0 }).then(products => {
                        let map_product = products.map(Product => Product.toJSON());
                        for (let i=0; i < map_product.length; i++){
                            map_product[i].img = Buffer.from(map_product[i].img.data.data).toString('base64');
                        }

                        res.render('view-product', {
                            loggedInUser: req.session.user,
                            products: map_product,
                        });
                    })
                }
                catch (error) {
                    console.log(error.message);
                }
        }
        else {
            res.redirect("/")
            res.render("view-product")
        }
    }
    catch {
        res.redirect("/")
    }
})

app.get("/shipper", (req, res) => {
    try {
        if (req.session.user.check_shipper) {
            res.render("shipper");
        }
        else {
            res.redirect("/")
        }
    }
    catch {
        res.redirect("/")
    }
})

app.post("/add-product", upload.single("image"), async (req, res) => {
    const product_info = product({
        owner: req.session.user.check_vendor.username,
        product_name: req.body.product_name,
        category: req.body.category,
        price: req.body.price,
        description: req.body.description,
        img: {
            data: fs.readFileSync("uploads/" + req.file.filename),
            contentType: "image/png",
        },
    });
    product_info
        .save()
        .then((res) => {
            console.log("product information is saved");
        })
        .catch((err) => {
            console.log(err, "error has occur");
        });
    res.render("add-product");
})

app.post("/signup-user", upload.single("image"), async (req, res) => {
    const check = await user.findOne({ username: req.body.username }) || await vendor.findOne({ username: req.body.username }) || await shipper.findOne({ username: req.body.username })
    if (check) {
        res.render('signup-user', {
            showUser: true,
        });
    }
    else {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const user_info = user({
            username: req.body.username,
            password: hashedPassword,
            name: req.body.name,
            address: req.body.address,
            img: {
                data: fs.readFileSync("uploads/" + req.file.filename),
                contentType: "image/png",
            },
        });
        user_info
            .save()
            .then((res) => {
                console.log("user information is saved");
            })
            .catch((err) => {
                console.log(err, "error has occur");
            });
        res.render("login");
    }
});



app.post("/signup-vendor", async (req, res) => {
    try {
        const check = await user.findOne({ username: req.body.username }) || await vendor.findOne({ username: req.body.username }) || await shipper.findOne({ username: req.body.username })
        const check_business = await vendor.findOne({ bussiness_name: req.body.bussiness_name })

        if (check && check_business) {
            res.render('signup-vendor', {
                showUser: true,
                showBussiness: true,
            });
        }
        else if (check) {
            res.render('signup-vendor', {
                showUser: true,
            });
        }
        else if (check_business) {
            res.render('signup-vendor', {
                showBussiness: true,
            });
        }
        else {
            try {
                const salt = await bcrypt.genSalt();
                const hashedPassword = await bcrypt.hash(req.body.password, salt);
                const data = {
                    username: req.body.username,
                    password: hashedPassword,
                    name: req.body.name,
                    bussiness_name: req.body.bussiness_name,
                    bussiness_address: req.body.bussiness_address,
                }
                await vendor.insertMany([data]);

                res.render("login");

            }

            catch {
                console.log(error.message)
            }

        }

    }
    catch {
        console.log(error.message)
    }
});

app.post("/signup-shipper", async (req, res) => {
    try {
        const check = await user.findOne({ username: req.body.username }) || await vendor.findOne({ username: req.body.username }) || await shipper.findOne({ username: req.body.username })


        if (check) {
            res.render('signup-shipper', {
                showUser: true,
            });
        }
        else {
            try {
                const salt = await bcrypt.genSalt();
                const hashedPassword = await bcrypt.hash(req.body.password, salt);
                const data = {
                    username: req.body.username,
                    password: hashedPassword,
                    name: req.body.name,
                    distribution_hub: req.body.distribution_hub,
                }
                await shipper.insertMany([data]);

                res.render("login");

            }

            catch {
                console.log(error.message)
            }

        }

    }
    catch {
        console.log(error.message)
    }
});


app.post("/login", async (req, res) => {

    try {
        const check =
            (await user.findOne({ username: req.body.username })) ||
            (await vendor.findOne({ username: req.body.username })) ||
            (await shipper.findOne({ username: req.body.username }));

        const check_shipper = await shipper.findOne({ username: req.body.username });
        const check_vendor = await vendor.findOne({ username: req.body.username });

        if (check && await bcrypt.compare(req.body.password, check.password)) {
            // Store user information in session
            req.session.user = {
                username: check.username,
                check_shipper: check_shipper,
                check_vendor: check_vendor,
            };

            // console.log("User object stored in session:", req.session.user); 

            // Redirect to home route
            try {
                await user.find({}, { name: 1, address: 1, username: 1, _id: 0 }).then(users => {
                    res.redirect('/login');
                })
            }
            catch (error) {
                console.log(error.message);
            }
        }
        else {
            res.render("login", {
                showUser: true,
                message: "Wrong username or password", // Add a message for wrong username or password
            });
        }
    }
    catch (error) {
        // console.log("Error:", error); // Log the error for debugging purposes
        res.render("login", {
            showUser: true,
            message: "An error occurred. Please try again.", // Add a message for any other errors
        });
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

app.get('/user', (req, res) => {
    if (!req.session.user) {
        res.redirect('/login');
        return;
    }
    res.render('account', {
        username: req.session.user.username,
    });
});


app.listen(port, () => console.log(`Listening at http://localhost:${port}`));