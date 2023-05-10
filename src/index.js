const express = require("express");
const app = express();
const path = require("path");
const port = 3000;
const handlebars = require('express-handlebars');
const async = require("hbs/lib/async");
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
    partialsDir  : [
        path.join(__dirname, 'resources/views/partials'),
    ]
}));
app.use(express.static(publicPath));
app.use(express.json());
app.use(cors());
app.set("view engine", "handlebars");
app.set("views", templatePath);
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.get("/", async (req, res, next) => {
    try {
        await user.find({}, {img:1, name: 1, address: 1, username: 1, _id: 0 }).then(users => {
            let imageValueConverted = Buffer.from(users.map(User => User.toJSON())[0].img.data.data).toString('base64');
            res.render('home', {
                showUser: true,

                users: users.map(User => User.toJSON()),
                imageValueConverted:imageValueConverted
            });
        })
    }
    catch (error) {
        console.log(error.message);
    }
})


app.get("/signup-user", (req, res) => {
    res.render("signup-user")
})

app.get("/add-product", (req, res) => {
    res.render("add-product")
})

app.get("/signup-vendor", (req, res) => {
    res.render("signup-vendor")
})

app.get("/signup-shipper", (req, res) => {
    res.render("signup-shipper")
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.get("/privacy-policy", (req, res) => {
    res.render("privacy-policy")
})

app.get("/view-product", (req, res) => {
    res.render("view-product")
})

app.post("/add-product", async (req, res) => {
    try {
        try {
            const data = {
                username: req.body.username,
                password: hashedPassword,
                name: req.body.name,
                address: req.body.address,
            }
            await user.insertMany([data]);

            res.render("login");

        }

        catch {
            console.log(error.message)
        }

    }
    catch {
        console.log(error.message)
    }
})

// app.post("/signup-user", upload.single("image"), async (req, res, next) => {
//     try {
//         const check = await user.findOne({ username: req.body.username }) || await vendor.findOne({ username: req.body.username }) || await shipper.findOne({ username: req.body.username })

//         if (check) {
//             res.render('signup-user', {
//                 showUser: true,
//             });
//         }
//         else {
//             try {
//                 const salt = await bcrypt.genSalt();
//                 const hashedPassword = await bcrypt.hash(req.body.password, salt);
//                 const user_info = {
//                     username: req.body.username,
//                     password: hashedPassword,
//                     name: req.body.name,
//                     address: req.body.address,
//                     img: {
//                         data: fs.readFileSync(path.join("/uploads/" + req.file.filename)),
//                         contentType: "image/png",
//                     }
//                 }
//                 await user.insertMany([user_info]);

//                 res.render("login");
//             }

//             catch {
//                 console.log("lỗi 1")
//             }

//         }

//     }
//     catch {
//         console.log("lỗi 2")
//     }

// })

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
                console.log("info is saved");
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

})

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

})

app.post("/login", async (req, res) => {
    try {
        const check = await user.findOne({ username: req.body.username }) || await vendor.findOne({ username: req.body.username }) || await shipper.findOne({ username: req.body.username })
        if (await bcrypt.compare(req.body.password, check.password)) {
            try {
                await user.find({}, { name: 1, address: 1, username: 1, _id: 0 }).then(users => {
                    res.render('home', {
                        showUser: true,

                        users: users.map(User => User.toJSON())

                    });
                })
            }
            catch (error) {
                console.log(error.message);
            }
        }
        else {
            res.render('login', {
                showUser: true,
            });
        }

    }
    catch {
        res.render('login', {
            showUser: true,
        });
    }
})

app.listen(port, () => console.log(`Listening at http://localhost:${port}`));

