import mongoose from "mongoose";
import mongooseAggregatePaginate  from
 "mongoose-aggregate-paginate-v2"; 

const commentSchema  = new mongoose.model({
    content : {
        type : String,
        required : true 
    },
    onVideo : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Video"
    },
    commentedBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
},{timestamps : true})

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment",commentSchema);