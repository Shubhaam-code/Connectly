import mongoose from "mongoose";

const connectDb=async ()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("✅ MongoDB Connected")
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message)
        throw error
    }
}

export default connectDb