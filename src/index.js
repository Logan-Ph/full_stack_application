const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const app = express();
const path = require("path");
const port = 3000;
const handlebars = require("express-handlebars");
const async = require("hbs/lib/async");
const { connectionUrl } = require("./mongodb"); // Import the connectionUrl from config.js
const templatePath = path.join(__dirname, "resources/views");
const {
    checkout,
    shipper,
    user,
    vendor,
    product,
    ordered_product,
    cart,
} = require("./mongodb");
const { error } = require("console");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcrypt");
const publicPath = path.join(__dirname, "/public");
const fs = require("fs");
const bodyParser = require("body-parser");
require("dotenv").config();

var multer = require("multer");
const { default: mongoose } = require("mongoose");

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

var upload = multer({ storage: storage });

app.engine(
    "handlebars",
    handlebars.engine({
        extname: ".hbs",
        partialsDir: [path.join(__dirname, "resources/views/partials")],
        helpers: {
            ifeq: function (a, b) {
                if (a === b) {
                    return true;
                }
            },
        },
    })
);

app.use(express.static(publicPath));
app.use(express.json());
app.use(cors());
app.set("view engine", "handlebars");
app.set("views", templatePath);
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: "secretKey",
        resave: true,
        saveUninitialized: true,
        cookie: { maxAge: 3600000 }, // 1 hour
        store: MongoStore.create({
            mongoUrl: connectionUrl, // use the imported connectionUrl
            collectionName: "sessions",
        }),
    })
);

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/home", async (req, res, next) => {
    if (!req.session.user) {
        res.redirect("/");
        return;
    } else {
        if (!req.session.user.check_shipper && !req.session.user.check_vendor) {
            try {
                await product
                    .find({}, { img: 1, product_name: 1, category: 1, price: 1, _id: 1 })
                    .then((products) => {
                        let map_product = products.map((Product) => Product.toJSON());
                        for (let i = 0; i < map_product.length; i++) {
                            map_product[i].img = Buffer.from(
                                map_product[i].img.data.data
                            ).toString("base64");
                        }

                        res.render("home", {
                            showUser: true,
                            loggedInUser: req.session.user,
                            products: map_product,
                        });
                    });
            } catch (error) {
                console.log(error.message);
            }
        }
    }
});

app.get("/signup-user", (req, res) => {
    if (req.session.user) {
        res.redirect("/home");
        return;
    }
    res.render("signup-user");
});

app.get("/customer-account", async (req, res) => {
    if (req.session.user) {
        if (req.session.user.check_vendor) {
            res.render("customer-account", {
                check_vendor: true,
                loggedInUser: req.session.user,
            });
            return;
        } else if (req.session.user.check_shipper) {
            res.render("customer-account", {
                check_shipper: true,
                loggedInUser: req.session.user,
            });
            return;
        } else {
            await ordered_product
                .find(
                    {
                        customer_id: new mongoose.Types.ObjectId(req.session.user.user_id),
                    },
                    {}
                )
                .populate("product_id")
                .then(async (cartEntries) => {
                    let map_cartEntries = cartEntries.map((cartEntry) =>
                        cartEntry.toJSON()
                    );
                    // console.log(map_cartEntries[0].product_id.img.data.data)
                    // Get images from products
                    for (let i = 0; i < map_cartEntries.length; i++) {
                        console.log(map_cartEntries[i])
                        let map_img = map_cartEntries[i].product_id.img.data.data;
                        // console.log(map_img);
                        map_cartEntries[i].img = Buffer.from(map_img).toString("base64");
                    }

                    // Calculate total spent money on ordered_products
                    let total_spent = 0;
                    for (let i = 0; i < map_cartEntries.length; i++) {
                        total_spent += map_cartEntries[i].product_id.price;
                    }

                    // console.log(map_cartEntries[0]);
                    res.render("customer-account", {
                        check_customer: true,
                        loggedInUser: req.session.user,
                        products: map_cartEntries,
                        total_spent: total_spent,
                    });
                });
        }
    } else {
        res.redirect("/");
    }
});

app.get("/add-product", (req, res) => {
    try {
        if (req.session.user.check_vendor) {
            res.render("add-product", { loggedInUser: req.session.user });
        } else {
            res.redirect("/");
        }
    } catch {
        res.redirect("/");
    }
});
app.get("/home/product-detail/checkout", async (req, res) => {
    if (!req.session.user) {
        res.redirect("/");
        return;
    } else {
        // console.log(req.session.user.user_id);
        if (!req.session.user.check_shipper && !req.session.user.check_vendor) {
            try {
                // Find all cart entries
                await cart
                    .find(
                        {
                            customer_id: new mongoose.Types.ObjectId(
                                req.session.user.user_id
                            ),
                        },
                        {}
                    )
                    .populate("product_id")
                    .then(async (cartEntries) => {
                        let map_cartEntries = cartEntries.map((cartEntry) =>
                            cartEntry.toJSON()
                        );
                        // console.log(map_cartEntries[0].product_id.img.data.data)
                        // Get images from products
                        for (let i = 0; i < map_cartEntries.length; i++) {
                            let map_img = map_cartEntries[i].product_id.img.data.data;
                            //   console.log(map_img);
                            map_cartEntries[i].img = Buffer.from(map_img).toString("base64");
                        }

                        // Debug
                        console.log(map_cartEntries[0]);

                        res.render("checkout", {
                            loggedInUser: req.session.user,
                            products: map_cartEntries,
                        });
                    });
            } catch (error) {
                console.log(error.message);
            }
        }
    }
});

app.get("/home/:id/product-detail", async (req, res) => {
    try {
        if (req.session.user) {
            try {
                await product
                    .find(
                        { _id: req.params.id },
                        {
                            img: 1,
                            description: 1,
                            product_name: 1,
                            category: 1,
                            price: 1,
                            _id: 1,
                            owner: 1,
                        }
                    )
                    .then((products) => {
                        let map_product = products.map((Product) => Product.toJSON());
                        for (let i = 0; i < map_product.length; i++) {
                            map_product[i].img = Buffer.from(
                                map_product[i].img.data.data
                            ).toString("base64");
                        }

                        res.render("product-detail", {
                            loggedInUser: req.session.user,
                            products: map_product,
                        });
                    });
            } catch (error) {
                console.log(error.message);
            }
        } else {
            res.redirect("/");
        }
    } catch {
        res.redirect("/");
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
    try {
        if (req.session.user.check_vendor) {
            res.redirect("/view-product");
        } else if (req.session.user.check_shipper) {
            res.redirect("/shipper");
        } else {
            res.redirect("/home");
        }
    } catch {
        res.render("login")
    }
});

app.get("/privacy-policy", (req, res) => {
    res.render("privacy-policy");
});

app.get("/view-product", async (req, res, next) => {
    try {
        if (await req.session.user.check_vendor) {
            try {
                if (
                    !product.find(
                        { owner: req.session.user.check_vendor.username },
                        {
                            img: 1,
                            description: 1,
                            product_name: 1,
                            category: 1,
                            price: 1,
                            _id: 1,
                        }
                    )
                ) {
                    res.render("view-product", {
                        loggedInUser: req.session.user,
                        checkproduct: true,
                    });
                }
                await product
                    .find(
                        { owner: req.session.user.check_vendor.bussiness_name },
                        {
                            img: 1,
                            description: 1,
                            product_name: 1,
                            category: 1,
                            price: 1,
                            _id: 1,
                        }
                    )
                    .then((products) => {
                        if (products.length === 0) {
                            res.render("view-product", {
                                loggedInUser: req.session.user,
                                checkproduct: true,
                            });
                        } else {
                            let map_product = products.map((Product) => Product.toJSON());
                            for (let i = 0; i < map_product.length; i++) {
                                map_product[i].img = Buffer.from(
                                    map_product[i].img.data.data
                                ).toString("base64");
                            }
                            res.render("view-product", {
                                loggedInUser: req.session.user,
                                products: map_product,
                            });
                        }
                    });
            } catch (error) {
                console.log(error.message);
            }
        } else {
            res.redirect("/");
            res.render("view-product");
        }
    } catch {
        res.redirect("/");
    }
});

app.get("/view-product/:id/delete", async (req, res) => {
    try {
        if (req.session.user.check_vendor) {
            product
                .findByIdAndDelete(req.params.id)
                .then((product) => {
                    if (!product) {
                        return res.send("Cannot found that product ID!");
                    }
                    res.redirect("/view-product");
                })
                .catch((error) => res.send(error));
        } else {
            res.redirect("/");
        }
    } catch {
        res.redirect("/");
    }
});

app.get("/shipper", async (req, res) => {
    try {
        if (req.session.user.check_shipper) {
            let customer_list = [];
            let check_list = [];
            try {
                await ordered_product
                    .find(
                        {
                            distribution_hub: req.session.user.check_shipper.distribution_hub,
                        },
                        {}
                    )
                    .populate("product_id")
                    .populate("customer_id")
                    .then(async (cartEntries) => {
                        let map_cartEntries = cartEntries.map((cartEntry) =>
                            cartEntry.toJSON()
                        );
                        //   console.log(map_cartEntries[0].product_id.img.data.data)
                        // Get images from products
                        for (let i = 0; i < map_cartEntries.length; i++) {
                            const result = customer_list.find(({ username }) => username === map_cartEntries[i].customer_id.username); //find an instance inside customer_list
                            if (!result) {
                                customer_list.push(
                                    {
                                        id: map_cartEntries[i].customer_id._id,
                                        username: map_cartEntries[i].customer_id.username,
                                        address: map_cartEntries[i].customer_id.address,
                                    }
                                );
                            }
                            let map_img = map_cartEntries[i].product_id.img.data.data;
                            // console.log(map_img);
                            map_cartEntries[i].img = Buffer.from(map_img).toString("base64");
                        }

                        console.log(customer_list);
                        res.render("shipper", {
                            check_customer: true,
                            loggedInUser: req.session.user,
                            // products: map_cartEntries,
                            customer_list: customer_list,
                        });
                    });
            } catch (error) {
                console.log(error.message);
            }
        } else {
            res.redirect("/");
        }
    } catch {
        res.redirect("/");
    }
});

app.get("/:id/parcel-info", async (req, res) => {
    try {
        if (req.session.user.check_shipper) {
            let customer_list = [];
            let check_list = [];
            try {
                await ordered_product
                    .find(
                        {
                            customer_id: new mongoose.Types.ObjectId(req.params.id),
                        },
                        {}
                    )
                    .populate("product_id")
                    .populate("customer_id")
                    .then(async (cartEntries) => {
                        let map_cartEntries = cartEntries.map((cartEntry) =>
                            cartEntry.toJSON()
                        );
                        //   console.log(map_cartEntries[0].product_id.img.data.data)
                        // Get images from products
                        for (let i = 0; i < map_cartEntries.length; i++) {
                            const result = customer_list.find(({ username }) => username === map_cartEntries[i].customer_id.username); //find an instance inside customer_list
                            if (!result) {
                                customer_list.push(
                                    {
                                        id: map_cartEntries[i].customer_id._id,
                                        username: map_cartEntries[i].customer_id.username,
                                        address: map_cartEntries[i].customer_id.address,
                                        phone_number: map_cartEntries[i].customer_id.phone_number,
                                        name: map_cartEntries[i].customer_id.name,
                                    }
                                );
                            }
                            let map_img = map_cartEntries[i].product_id.img.data.data;
                            // console.log(map_img);
                            map_cartEntries[i].img = Buffer.from(map_img).toString("base64");
                        }

                        // console.log(customer_list);
                        res.render("parcel-info", {
                            products: map_cartEntries,
                            customer_list: customer_list,
                            id: customer_list[0].id
                        });
                    });
            } catch (error) {
                console.log(error.message);
            }
        } else {
            res.redirect("/");
        }
    } catch {
        res.redirect("/");
    }
});

app.get("/:id/parcel-info/delete", async (req, res) => {
    try {
        if (req.session.user.check_shipper) {
            await ordered_product.deleteMany({ customer_id: new mongoose.Types.ObjectId(req.params.id) });
            res.redirect("/shipper");
        } else {
            res.redirect("/");
        }
    } catch {
        res.redirect("/");
    }
});

app.get("/view-product/:id/update", (req, res) => {
    try {
        consol.log(req.params.id);
        res.redirect("/view-product");
    } catch {
        res.redirect("/");
    }
});

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
});

app.post(
    "/view-product/:id/update",
    upload.single("image"),
    async (req, res) => {
        try {
            if (req.session.user.check_vendor) {
                await product
                    .findByIdAndUpdate(req.params.id, {
                        $set: {
                            product_name: req.body.product_name,
                            category: req.body.category,
                            price: req.body.price,
                            description: req.body.description,
                            img: {
                                data: fs.readFileSync("uploads/" + req.file.filename),
                                contentType: "image/png",
                            },
                        },
                    })
                    .then((product) => {
                        if (!product) {
                            return res.send("Cannot found that product ID!");
                        }
                        res.redirect("/view-product");
                    })
                    .catch((error) => res.send(error));
            } else {
                res.redirect("/");
            }
        } catch {
            res.redirect("/");
        }
    }
);

app.post("/signup-user", upload.single("image"), async (req, res) => {
    const check =
        (await user.findOne({ username: req.body.username })) ||
        (await vendor.findOne({ username: req.body.username })) ||
        (await shipper.findOne({ username: req.body.username }));
    if (check) {
        res.render("signup-user", {
            showUser: true,
        });
    } else {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const user_info = user({
            username: req.body.username,
            password: hashedPassword,
            name: req.body.name,
            address: req.body.address,
            phone_number: req.body.phone_number,
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

app.post("/signup-vendor", upload.single("image"), async (req, res) => {
    try {
        const check =
            (await user.findOne({ username: req.body.username })) ||
            (await vendor.findOne({ username: req.body.username })) ||
            (await shipper.findOne({ username: req.body.username }));
        const check_business = await vendor.findOne({
            bussiness_name: req.body.bussiness_name,
        });

        if (check && check_business) {
            res.render("signup-vendor", {
                showUser: true,
                showBussiness: true,
            });
        } else if (check) {
            res.render("signup-vendor", {
                showUser: true,
            });
        } else if (check_business) {
            res.render("signup-vendor", {
                showBussiness: true,
            });
        } else {
            try {
                const salt = await bcrypt.genSalt();
                const hashedPassword = await bcrypt.hash(req.body.password, salt);
                const vendor_info = vendor({
                    username: req.body.username,
                    password: hashedPassword,
                    name: req.body.name,
                    bussiness_name: req.body.bussiness_name,
                    bussiness_address: req.body.bussiness_address,
                    phone_number: req.body.phone_number,
                    img: {
                        data: fs.readFileSync("uploads/" + req.file.filename),
                        contentType: "image/png",
                    },
                });
                vendor_info
                    .save()
                    .then((res) => {
                        console.log("vendor information is saved");
                    })
                    .catch((err) => {
                        console.log(err, "error has occur");
                    });
                res.render("login");
            } catch {
                console.log(error.message);
            }
        }
    } catch {
        console.log(error.message);
    }
});

app.post("/signup-shipper", upload.single("image"), async (req, res) => {
    try {
        const check =
            (await user.findOne({ username: req.body.username })) ||
            (await vendor.findOne({ username: req.body.username })) ||
            (await shipper.findOne({ username: req.body.username }));

        if (check) {
            res.render("signup-shipper", {
                showUser: true,
            });
        } else {
            try {
                const salt = await bcrypt.genSalt();
                const hashedPassword = await bcrypt.hash(req.body.password, salt);
                const shipper_info = shipper({
                    username: req.body.username,
                    password: hashedPassword,
                    name: req.body.name,
                    phone_number: req.body.phone_number,
                    distribution_hub: req.body.distribution_hub,
                    img: {
                        data: fs.readFileSync("uploads/" + req.file.filename),
                        contentType: "image/png",
                    },
                });
                shipper_info
                    .save()
                    .then((res) => {
                        console.log("vendor information is saved");
                    })
                    .catch((err) => {
                        console.log(err, "error has occur");
                    });
                res.render("login");
            } catch {
                console.log(error.message);
            }
        }
    } catch {
        console.log(error.message);
    }
});

app.post("/login", async (req, res) => {
    try {
        const check =
            (await user.findOne({ username: req.body.username })) ||
            (await vendor.findOne({ username: req.body.username })) ||
            (await shipper.findOne({ username: req.body.username }));

        const check_shipper = await shipper.findOne({
            username: req.body.username,
        });
        const check_vendor = await vendor.findOne({ username: req.body.username });

        let map_user = check.toJSON();
        map_user.img = Buffer.from(map_user.img.data.data).toString("base64");
        // console.log(map_user.check_vendor)
        // console.log(check_vendor);
        // console.log(check_shipper);
        if (
            map_user &&
            (await bcrypt.compare(req.body.password, map_user.password))
        ) {
            req.session.user = {
                check_shipper: check_shipper,
                check_vendor: check_vendor,
                username: map_user.username,
                user_id: map_user._id,
                name: map_user.name,
                bussiness_name: map_user.bussiness_name,
                bussiness_address: map_user.bussiness_address,
                address: map_user.address,
                distribution_hub: map_user.distribution_hub,
                phone_number: map_user.phone_number,
                img: map_user.img,
            };

            // console.log("User object stored in session:", req.session.user);
            // Redirect to home route
            try {
                await user
                    .find({}, { name: 1, address: 1, username: 1, _id: 0 })
                    .then((users) => {
                        res.redirect("/login");
                    });
            } catch (error) {
                console.log(error.message);
            }
        } else {
            res.render("login", {
                showUser: true,
                message: "Wrong username or password", // Add a message for wrong username or password
            });
        }
    } catch (error) {
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

// View user's personal information
app.get("/user", async (req, res) => {
    if (!req.session.user) {
        res.redirect("/login");
        return;
    }
    try {
        if (!req.session.user.check_shipper && !req.session.user.check_vendor) {
            try {
                await user
                    .find(
                        { username: req.session.user.username },
                        { username: 1, name: 1, address: 1, _id: 0 }
                    )
                    .then((user) => {
                        res.render("account", {
                            state: "view_personal_info",
                            user: user[0].toObject(),
                        });
                    });
            } catch (error) {
                console.log(error.message);
            }
        }
    } catch (error) {
        console.log(error.message);
    }
});


// Search products
app.get("/search", async (req, res) => {
    const searchTerm = req.query.q;
    const sortOption = req.query.sort;

    try {
        let query = {}; // Empty query object

        if (searchTerm) {
            const regex = new RegExp(searchTerm, "i");
            query = {
                $or: [{ product_name: { $regex: regex } }],
            };
        }

        let sort = {};

        if (sortOption === "price_low") {
            // Sort by price ascending (low to high)
            sort = { price: 1 };
        } else if (sortOption === "price_high") {
            // Sort by price descending (high to low)
            sort = { price: -1 };
        }

        await product
            .find(query, { img: 1, product_name: 1, category: 1, price: 1, _id: 1 })
            .sort(sort)
            .then((products) => {
                let map_product = products.map((Product) => Product.toJSON());
                for (let i = 0; i < map_product.length; i++) {
                    map_product[i].img = Buffer.from(
                        map_product[i].img.data.data
                    ).toString("base64");
                }

                res.render("search", {
                    showUser: true,
                    loggedInUser: req.session.user,
                    products: map_product,
                    searchTerm: searchTerm,
                });
            });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});
app.post("/add-to-cart/:id", async (req, res) => {
    // Debug
    //   console.log(
    //     "add-to-cart POST route called at " + new Date().toLocaleString()
    //   );
    const customerID = req.session.user.user_id;
    // Debug
    //   console.log(customerID);
    try {
        if (req.session.user) {
            const productId = req.params.id;
            //   console.log(productId)
            const quantity = req.body.quantity || 1; // Default quantity is 1

            // Find the product by its ID
            const foundproduct = await product.findById(productId);

            if (!foundproduct) {
                // Product not found
                return res.status(404).json({ message: "Product not found" });
            }

            // Fix hộ cái foundproduct.img với bro, nếu ảnh bị lỗi ko display đc thì nguyên cái item bên checkout page cũng k render luôn =))
            //   console.log(foundproduct.img);

            // Create a new ordered_product entry

            const newOrderedProduct = new cart({
                product_id: new mongoose.Types.ObjectId(productId),
                owner: foundproduct.owner,
                product_name: foundproduct.product_name,
                price: foundproduct.price,
                customer_id: new mongoose.Types.ObjectId(customerID),
                quantity: quantity,
            });

            // Save the new ordered_product entry to the database
            await newOrderedProduct.save();

            res.status(200).send(newOrderedProduct);
        } else {
            // User not logged in
            res.status(401).json({ message: "Invalid session" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/delete-from-cart/:id", async (req, res) => {
    try {
        if (req.session.user) {
            cart
                .findByIdAndDelete(req.params.id)
                .then((product) => {
                    if (!product) {
                        return res.send("Cart Item not found");
                    }
                    res.redirect("/home/product-detail/checkout");
                })
                .catch((error) => res.send(error));
        } else {
            res.redirect("/home/product-detail/checkout");
        }
    } catch {
        res.redirect("/home/product-detail/checkout");
    }
});

app.post("/home/product-detail/checkout", async (req, res) => {
    console.log("checkout POST route called at " + new Date().toLocaleString());
    try {
        if (req.session.user) {
            const customerID = new mongoose.Types.ObjectId(req.session.user.user_id);
            const distributionHub = req.body.distributionHub;

            // Fetch cart items for the current user
            const cartItems = await cart.find({ customer_id: customerID }).exec();
            //  console.log(cartItems)
            // Create ordered_product documents for each cart item
            const createOrderedProductsPromises = cartItems.map((cartItem) => {
                const orderedProductData = {
                    product_id: cartItem.product_id,
                    customer_id: customerID,
                    owner: cartItem.owner,
                    product_name: cartItem.product_name,
                    category: cartItem.product_id.category, // Assuming cartItem.product_id is populated
                    distribution_hub: distributionHub,
                    price: cartItem.price,
                    quantity: cartItem.quantity,
                };

                return ordered_product.create(orderedProductData);
            });

            // Wait for all ordered_product documents to be created
            await Promise.all(createOrderedProductsPromises);

            // Remove cart items for the current user
            await cart
                .deleteMany({ customer_id: customerID })
                .exec()
                .then((result) => {
                    console.log("Deleted successfully:", result);
                })
                .catch((error) => {
                    console.log("Error while deleting:", error);
                });

            res.sendStatus(200);
        } else {
            res.status(401).json({ message: "Invalid session" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal server error");
    }
});


app.listen(port, () => console.log(`Listening at http://localhost:${port}`));
