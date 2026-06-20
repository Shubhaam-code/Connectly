import mongoose from "mongoose";

const messageSchema=new mongoose.Schema({
sender:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
},
receiver:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User" 
},
message:{
   type:String 
},
image:{
    type:String  
},
video:{
    type:String
},
messageType:{
    type:String,
    enum:["text","image","video","audio"],
    default:"text"
},
audioUrl:{
    type:String
},
audioDuration:{
    type:Number
},
seen:{
    type:Boolean,
    default:false
},
delivered:{
    type:Boolean,
    default:false
},
reactions: [
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: String
    }
],
replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
},
isEdited: {
    type: Boolean,
    default: false
},
isDeleted: {
    type: Boolean,
    default: false
},
sharedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
},
sharedLoop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Loop"
},
sharedStory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Story"
}
},{timestamps:true})

const Message=mongoose.model("Message",messageSchema)
export default Message
