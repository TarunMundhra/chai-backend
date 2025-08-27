import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    onVideos : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Video"
    },
    onTweets : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Tweet"
    },
    likedBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    onComment : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Comment"
    }
},{timestamps : true})

export const Like = mongoose.model("Like", likeSchema);