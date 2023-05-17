const mongoose = require("mongoose");
const { connectionUrl } = require("./config"); // Import the connectionUrl from config.js


mongoose.connect(connectionUrl)
.then(()=>{
    
    console.log("login database connected");
})
.catch (()=> {
    console.log("login database connected failed!");
})
module.exports = {
    connectionUrl
};
const LogInShipper = new mongoose.Schema({
    username:{
        type:String,
        require:true,
    },

    password:{
        type:String,
        require:true,
    },

    name:{
        type:String,
        require:true,
    },
    
    address:{
        type:String,
        require:true,
    },

    distribution_hub:{
        type:String,
        enum: ["HCM","HN","DN"],
        require:true,
    },

    phone_number:{
        type:String,
    },

    img:{
        data: Buffer,
        contentType: String
    }
})

const LogInUser = new mongoose.Schema({
    username:{
        type:String,
        require:true,
    },

    password:{
        type:String,
        require:true,
    },

    address:{
        type:String,
        require:true,
    },

    name:{
        type:String,
        require:true,
    },

    phone_number:{
        type:String,
    },

    img:{
        data: Buffer,
        contentType: String
    }
    
})

const LogInVendor = new mongoose.Schema({
    username:{
        type:String,
        require:true,
    },

    password:{
        type:String,
        require:true,
    },

    bussiness_name:{
        type:String,
        require:true,
    },

    bussiness_address:{
        type:String,
        require:true,
    },

    phone_number:{
        type:String,
    },

    img:{
        data: Buffer,
        contentType: String
    }
})

const Product = new mongoose.Schema({
    owner:{
        type:String,
        require:true,
    },

    product_name:{
        type:String,
        require:true,
    },

    category:{
        type:String,
        enum: ["cosmetics","electronic-devices"],
        require:true,
    },

    price:{
        type:Number,
        require:true,
    },

    description:{
        type:String,
        require:true,
    },

    img:{
        data: Buffer,
        contentType: String
    }

})

const Ordered_Product = new mongoose.Schema({
    customer_id:{
        type:String,
        require:true
    },

    owner:{
        type:String,
        require:true,
    },

    product_name:{
        type:String,
        require:true,
    },

    category:{
        type:String,
        enum: ["cosmetics","electronic-devices"],
        require:true,
    },

    distribution_hub:{
        type:String,
        enum: ["HCM","HN","DN"],
        require:true,
    },

    price:{
        type:Number,
        require:true,
    },

    description:{
        type:String,
        require:true,
    },

    img:{
        data: Buffer,
        contentType: String
    }
})

const shipper = new mongoose.model("LogInShipper",LogInShipper)
const user = new mongoose.model("LogInUser",LogInUser)
const vendor = new mongoose.model("LogInVendor",LogInVendor)
const product = new mongoose.model("Product",Product)
const ordered_product = new mongoose.model("Ordered_Product",Ordered_Product)

module.exports = {shipper,user,vendor,product,ordered_product}