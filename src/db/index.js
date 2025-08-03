import mongoose from "mongoose";
import {DB_NAME} from "../constant.js";
import dotenv from "dotenv";
dotenv.config()

// console.log("URI is:", process.env.MONGODB_URI); 

const connectDB = async()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(` \n MONGODB connected !! DB HOST:${connectionInstance.connection.host}`);
    }
    catch(err){
        console.log(" MONGODB CONNECTION FAILED:",err);
        process.exit(1);
    }
}

export default connectDB;