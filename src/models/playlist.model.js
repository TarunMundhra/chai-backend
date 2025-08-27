import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
    },
    owner : {
        type : mongoose.Schema.types.ObjectId,
        ref : "User"
    },
    videos : [
        {
            type : mongoose.Schema.types.ObjectId,
            ref : "Video"
        }
    ],
    description : {
        type : string,
        required : true
    }
},{timestamps: true})

export const Playlist = mongoose.model("Playlist",playlistSchema);