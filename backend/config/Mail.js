import nodemailer from "nodemailer" // mail send karne kaliya nodemailer package use karte ha
import dotenv from "dotenv"
dotenv.config()
const transporter = nodemailer.createTransport({
  service: "Gmail", //google ka gmail service use kar rahe ha
  port: 465,  //google use karta 465 port
  secure: true, // true for 465, false for other ports
  auth: {
    user:process.env.EMAIL,
    pass:process.env.EMAIL_PASS,
  },
});

const sendMail=async (to,otp)=>{
await transporter.sendMail({
    from:`${process.env.EMAIL}`, // apna email kon email bhej raha ha
    to,// jisko bhejna hai 
    subject: "Reset Your Password",
    html:`<p>Your OTP for password reset is <b>${otp}</b>. It expires in 5 minutes.</p>`
})
}

export default sendMail