import mongoose from "mongoose";

const loopSchema=new mongoose.Schema({
    // author matlab user samjho kyuki user hi reels baneyga or reel kiska ha ye detail hona chahia nah
    author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        media: {
            type: String,
            required: true
        },
        caption:{
            type:String
        },
        likes:[
            {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            }
        ],
        comments:[
           {
                   author:{
                   type: mongoose.Schema.Types.ObjectId,
                   ref: "User"},
                   message:{
                       type:String
                   }
                   }
        ]
    
},{timestamps:true})

const Loop=mongoose.model("Loop",loopSchema)

export default Loop