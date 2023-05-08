const mongoose = require("mongoose");


mongoose.connect("mongodb+srv://s3975979:Sang5850@cluster0.uuhro1a.mongodb.net/vender?retryWrites=true&w=majority")
.then(()=>{
    console.log("mongodb connected");
})
.catch (()=> {
    console.log("failed to connect");
})

const LogInSchema = new mongoose.Schema({
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



const vender = new mongoose.model("LogInVender",LogInSchema)

module.exports = vender