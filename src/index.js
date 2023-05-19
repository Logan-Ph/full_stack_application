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
          { customer_id: req.session.user.user_id },
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
          let map_product = products.map((Product) => Product.toJSON());
          for (let i = 0; i < map_product.length; i++) {
            map_product[i].img = Buffer.from(
              map_product[i].img.data.data
            ).toString("base64");
          }
          res.render("customer-account", {
            check_customer: true,
            loggedInUser: req.session.user,
            products: map_product,
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
    if (!req.session.user.check_shipper && !req.session.user.check_vendor) {
      try {
        // await product.find({}, { img: 1, product_name: 1, category: 1, price: 1, _id: 1 }).then(products => {
        //     let map_product = products.map(Product => Product.toJSON());
        //     for (let i = 0; i < map_product.length; i++) {
        //         map_product[i].img = Buffer.from(map_product[i].img.data.data).toString('base64');
        //     }

        //     res.render('home', {
        //         showUser: true,
        //         loggedInUser: req.session.user,
        //         products: map_product,
        //     });
        // })
        res.render("checkout", {
          loggedInUser: req.session.user,
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

app.get("/delivered-orders", (req, res) => {
  try {
    if (req.session.user.check_shipper) {
      res.render("delivered-orders");
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
    res.redirect("/login"); //this is for sometime the req.session.user does not recognize the 'check_vendor' and 'check_shipper' properties
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
          .find({ distribution_hub: req.session.user.distribution_hub }, {})
          .then((products) => {
            let map_product = products.map((Product) => Product.toJSON());
            if (!check_list.includes(map_product.customer_id)) {
              customer_list.push({
                customer_id: map_product.customer_id,
                address: map_product.address,
              });
              check_list.push(map_product.customer_id);
            }

            customer_list.push({
              customer_id: products.customer_id,
            });

            // for (let i = 0; i < map_product.length; i++) {
            //     map_product[i].img = Buffer.from(map_product[i].img.data.data).toString('base64');
            // }
          });

        res.render("shipper", {
          loggedInUser: req.session.user,
          customer_list: customer_list,
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
      await ordered_product
        .find({ customer_id: req.params.id }, {})
        .then((ordered_products) => {
          let map_product = ordered_products.map((Product) => Product.toJSON());
          for (let i = 0; i < map_product.length; i++) {
            map_product[i].img = Buffer.from(
              map_product[i].img.data.data
            ).toString("base64");
          }
        });

      res.render("parcel-info", {
        loggedInUser: req.session.user,
        map_product: map_product,
        cusotmer_name: map_product.receiver,
        cusotmer_address: map_product.address,
        cusotmer_phone_number: map_product.cusotmer_phone_number,
        customer_id: req.params.id,
      });
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
      await ordered_product.deleteMany({ customer_id: req.params.id });
      res.redirect("/shipper");
    } else {
      res.redirect("/");
    }
  } catch {
    res.redirect("/");
  }
});

// để tạm thời
app.get("/parcel-info", (req, res) => {
  try {
    if (req.session.user.check_shipper) {
      res.render("parcel-info");
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

// Change personal info
app.get("/user/editprofile", async (req, res) => {
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
            { name: 1, address: 1, email: 1, phone_number: 1, _id: 0 }
          )
          .then((user) => {
            // Debug
            console.log(user[0].toObject().phone_number);
            res.render("account", {
              state: "change_personal_info",
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

// Update user's personal information
app.post("/user/update", async (req, res) => {
  // Debug
  // console.log(
  //   "/user/update POST route called at " + new Date().toLocaleString()
  // );
  if (!req.session.user) {
    res.status(401).send("You are not logged in");
    return;
  }

  try {
    userToUpdate = req.session.user.username;
    const { name, email, phone_number, address } = req.body;
    // Debug
    console.log(req.body);

    // Check if any of the fields are empty, and only update non-empty fields
    const updatedFields = {};
    if (name) updatedFields.name = name;
    if (email) updatedFields.email = email;
    if (phone_number) updatedFields.phone_number = phone_number;
    if (address) updatedFields.address = address;

    // Validate phone number using regex
    const phoneRegex = /^(0|1)\d{9,10}$/;
    if (phone_number && !phoneRegex.test(phone_number)) {
      return res.status(400).send("Invalid phone number");
    }
    // Validate email using regex
    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (email && !emailRegex.test(email)) {
      return res.status(400).send("Invalid email address");
    }
    await user
      .findOneAndUpdate(
        { username: userToUpdate },
        { $set: updatedFields },
        { new: true }
      )
      .then((updatedUser) => {
        if (!updatedUser) {
          // Debug
          // console.log("Got 404, User not found");
          return res
            .status(404)
            .send("Error occured when trying to update user's information");
        }
        // Debug
        console.log(updatedFields);
        // console.log("User updated successfully");
        res.sendStatus(200);
      })
      .catch((error) => res.send(error));
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
});

app.get("/user/cart", async (req, res) => {
  // prototype, only temporary, will be changed later
  user
    .find({ _id: new mongoose.Types.ObjectId("645ceb07867182fdcdcfcacc") })
    .then((users, errors) => {
      let id = users[0].toObject()._id;
      // console.log(id);
      ordered_product
        .find({ customer_id: id })
        .then((ordered_product, errors) => {
          // console.log(ordered_product);
          const simplifiedProducts = ordered_product.map((product) => {
            return {
              product_name: product.product_name,
              category: product.category,
              price: product.price,
            };
          });

          res.json(simplifiedProducts);
        });
    });
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
  console.log(
    "add-to-cart POST route called at " + new Date().toLocaleString()
  );
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
      const newOrderedProduct = new ordered_product({
        _id: new mongoose.Types.ObjectId(productId),
        owner: foundproduct.owner,
        product_name: foundproduct.product_name,
        category: foundproduct.category,
        price: foundproduct.price,
        description: foundproduct.description,
        img: foundproduct.img,
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

app.post("/home/product-detail/checkout", async (req, res) => {
  // Debug
//   console.log("checkout POST route called at " + new Date().toLocaleString());
  try {
    if (req.session.user) {
      const customerID = req.session.user._id;
      const orderedProducts = req.body.orderedProducts;
      const distributionHub = req.body.distributionHub;

      // Fetch product prices from the Product model database
      const productIDs = orderedProducts.map(
        (product_item) => product_item._id
      );
      const products = await product.find({ _id: { $in: productIDs } });

      // Create ordered products with fetched prices and customer_id
      const orderedProductsToInsert = orderedProducts
        .map((orderedProduct) => {
          const productItem = products.find(
            (productItem) => productItem._id.toString() === orderedProduct._id
          );

          if (!productItem) {
            console.error(`Product not found: ${orderedProduct._id}`);
            return null;
          }

          return {
            customer_id: customerID,
            owner: orderedProduct.owner,
            product_name: orderedProduct.product_name,
            category: orderedProduct.category,
            distribution_hub: distributionHub,
            price: productItem.price,
            description: orderedProduct.description,
            img: orderedProduct.img,
            quantity: orderedProduct.quantity,
          };
        })
        .filter((orderedProduct) => orderedProduct !== null);

      // Insert the ordered products into the Ordered_Product model
      await ordered_product.insertMany(orderedProductsToInsert);

      res.status(200).json({ message: "Order submitted successfully" });
    } else {
      // User not logged in
      res.status(401).json({ message: "Invalid session" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(port, () => console.log(`Listening at http://localhost:${port}`));
