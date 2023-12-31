import { NextResponse } from "next/server";
import { connectDB } from "../../../../../../utils/dbconnect";
import { user } from "../../../../../../model/user";
import Jwt from "jsonwebtoken";
import { otp as OTP } from "../../../../../../model/otp";
import { mailSender } from "../../../../../../utils/mailSender";

export const POST = async (req) => {
  try {
    await connectDB();
    const { otp } = await req.json();
    const cookiesValue = await req.cookies.get("data")?.value;
    if (!cookiesValue) {
      return NextResponse.json(
        { success: false, message: "Please register first" },
        { status: 422 }
      );
    }
    const decode = Jwt.verify(cookiesValue, process.env.JWT_SECRET);
    if (!decode) {
      return NextResponse.json(
        { success: false, message: "unable to verify" },
        { status: 401 }
      );
    }

    // console.log(decode);
    const recentOtp = await OTP.findOne({ email: decode.email })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!recentOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Try to resend otp",
      });
    }
    if (otp !== recentOtp.otp) {
      return NextResponse.json(
        { success: false, message: "Invalid otp" },
        { status: 422 }
      );
    }
    await user.create({
      firstName: decode.firstName,
      lastName: decode.lastName,
      email: decode.email,
      isEmailVerify: true,
      password: decode.password,
      profileImg: `https://api.dicebear.com/7.x/fun-emoji/png?seed=${decode.firstName}`,
    });
    await mailSender(
      decode.email,
      "Welcome to CipherGuard",
      `<!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SecurePass Pro</title>
        <style>
          /* Add your styles here */
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
      
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #f4f4f4;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
      
          h1 {
            color: #262626;
          }
      
          p {
            font-size: 16px;
            line-height: 1.5;
            color: #262626;
          }
      
          ul {
            list-style-type: none;
            padding: 0;
          }
      
          ul li::before {
            content: "✓ ";
            color: #262626;
          }
      
          .footer {
            border-top: 2px solid #ccc;
            padding-top: 20px;
            margin-top: 20px;
          }
      
          /* Responsive Styles */
          @media screen and (max-width: 600px) {
            .container {
              padding: 15px;
            }
          }
        </style>
      </head>
      
      <body>
      
        <div class="container">
          <h1>${decode.firstName}, Welcome to CipherGuard!</h1>
          <p>You are now part of the CipherGuard family! Get ready to depart on an exciting journey with us!</p>
          <p>To make things extra special for you, starting today, we will send you a series of exclusive emails with
            amazing tips and tricks to get the most out of.</p>
          <p>Get ready!</p>
      
          <h2>Key Features:</h2>
          <ul>
            <li>Generate unique Passwords</li>
            <li>Overall safety score</li>
            <li>No forgot password policy</li>
            <li>Login Alert!</li>
            <li>Username Generator option</li>
            <li>Password Storage and Encryption</li>
            <li>Secure Notes</li>
            <li>After four unsuccessful password attempts, the account may be temporarily suspended for security purposes</li>
            <li>Emergency Access</li>
            <li>Import/Export Functionality</li>
            <li>login alert (if user think there is suspicious login they can temporarily blocked their account)</li>
            <li>Vault password</li>
          </ul>
      
          <div class="footer">
            <p>Best,<br><a href="https://devglimpse.com" target="_blank">The CipherGuard team</a></p>
          </div>
        </div>
      
      </body>
      
      </html>
      `
    );
    const response = NextResponse.json(
      { success: true, message: "Account create successfully" },
      { status: 200 }
    );
    response.cookies.delete("data");
    return response;
  } catch (error) {
    console.log(error.message);
    // if (
    //   error.message === "Body is unusable" ||
    //   error.message === "Unexpected end of JSON input"
    // ) {
    //   return NextResponse.json(
    //     { success: false, message: "Data can't be empty" },
    //     { status: 406 }
    //   );
    // }
    return NextResponse.json(
      { success: false, message: "Internal server error Try Again" },
      { status: 500 }
    );
  }
};
