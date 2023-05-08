const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://s3975979:Sang5850@cluster0.uuhro1a.mongodb.net/login?retryWrites=true&w=majority")
.then(()=>{
    console.log("login database connected");
})
.catch (()=> {
    console.log("login database connected failed!");
})

const LogInShipper = new mongoose.Schema({
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

    distribution_hub:{
        type:String,
        enum: ["HCM","HN","DN"],
        require:true,
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
    }
})

const shipper = new mongoose.model("LogInShipper",LogInShipper)
const user = new mongoose.model("LogInUser",LogInUser)
const vendor = new mongoose.model("LogInVendor",LogInVendor)

module.exports = {shipper,user,vendor}