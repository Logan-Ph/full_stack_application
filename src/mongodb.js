// RMIT University Vietnam
// Course: COSC2430 Web Programming
// Semester: 2023A
// Assessment: Assignment 2
// Author and ID: Sang(s3975979), Khang(s3979229)
// Acknowledgement:




const mongoose = require("mongoose");
const { connectionUrl } = require("./config"); // Import the connectionUrl from config.js


mongoose.connect(connectionUrl)
    .then(() => {

        console.log("login database connected");
    })
    .catch(() => {
        console.log("login database connected failed!");
    })
module.exports = {
    connectionUrl
};
const LogInShipper = new mongoose.Schema({
    username: {
        type: String,
        require: true,
    },

    password: {
        type: String,
        require: true,
    },

    name: {
        type: String,
        require: true,
    },

    address: {
        type: String,
        require: true,
    },

    distribution_hub: {
        type: String,
        enum: ["HCM", "HN", "DN"],
        require: true,
    },

    phone_number: {
        type: String,
    },

    img: {
        data: Buffer,
        contentType: String
    }
})

const LogInUser = new mongoose.Schema({
    username: {
        type: String,
        require: true,
    },

    password: {
        type: String,
        require: true,
    },

    address: {
        type: String,
        require: true,
    },

    name: {
        type: String,
        require: true,
    },

    phone_number: {
        type: String,
    },

    img: {
        data: Buffer,
        contentType: String
    }

})

const LogInVendor = new mongoose.Schema({
    username: {
        type: String,
        require: true,
    },

    password: {
        type: String,
        require: true,
    },

    bussiness_name: {
        type: String,
        require: true,
    },

    bussiness_address: {
        type: String,
        require: true,
    },

    bussiness_phone_number: {
        type: String,
    },

    img: {
        data: Buffer,
        contentType: String
    }
})

const Product = new mongoose.Schema({
    owner: {
        type: String,
        require: true,
    },

    product_name: {
        type: String,
        require: true,
    },

    category: {
        type: String,
        enum: ["cosmetics", "electronic-devices"],
        require: true,
    },

    price: {
        type: Number,
        require: true,
    },

    description: {
        type: String,
        require: true,
    },

    img: {
        data: Buffer,
        contentType: String
    }

})

const Ordered_Product = new mongoose.Schema({
    //customer id
    customer_id: {
        type: String,
        require: true
    },

    //customer phone number
    customer_phone_number:{
        type: String,
        require: true
    },

    //customer name
    receiver: {
        type: String,
        require: true,
    },

    //prodcut name
    product_name: {
        type: String,
        require: true,
    },

    //vendor name of that product
    sender: {
        type: String,
        require: true,
    },

    //prodcut category
    category: {
        type: String,
        enum: ["cosmetics", "electronic-devices"],
        require: true,
    },

    //distribution hub
    distribution_hub: {
        type: String,
        enum: ["HCM", "HN", "DN"],
        require: true,
    },

    //product price
    price: {
        type: Number,
        require: true,
    },

    // product description
    description: {
        type: String,
        require: true,
    },

    // product quanity
    quanity: {
        type: Number,
        require: true,
    },

    //customer address
    address: {
        type: String,
        require: true,
    },

    //product_image
    img: {
        data: Buffer,
        contentType: String
    }
})

const shipper = new mongoose.model("LogInShipper", LogInShipper)
const user = new mongoose.model("LogInUser", LogInUser)
const vendor = new mongoose.model("LogInVendor", LogInVendor)
const product = new mongoose.model("Product", Product)
const ordered_product = new mongoose.model("Ordered_Product", Ordered_Product)

module.exports = { shipper, user, vendor, product, ordered_product }