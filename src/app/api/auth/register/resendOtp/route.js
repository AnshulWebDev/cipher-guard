import { otp } from "../../../../../../model/otp";
import otpGenerator from "otp-generator";
import { mailSender } from "../../../../../../utils/mailSender";
import { NextResponse } from "next/server";
import { connectDB } from "../../../../../../utils/dbconnect";
export const POST = async (req) => {
  try {
    await connectDB();
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
    //generate 8 digit otp
    const OTP = otpGenerator.generate(8, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    await connectDB();
    //create generated otp in OTP schema
    await otp.create({
      email: decode.email,
      otp: OTP,
    });

    //send otp via mail
    await mailSender(
      decode.email,
      "Verify Your Email",
      `
      <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
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
      background-color: #fff;
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

    .otp {
      display: inline-block;
      padding: 8px 16px;
      font-size: 18px;
      font-weight: bold;
      background-color: #1a82e2;
      color: #fff;
      border-radius: 4px;
    }

    .footer {
      border-top: 2px solid #ccc;
      padding-top: 20px;
      margin-top: 20px;
    }
  </style>
</head>

<body>

  <div class="container">
    <h1>Email Verification</h1>
    <p>Thank you for signing up with CipherGuard. To complete your registration, please use the following One-Time Password (OTP):</p>

    <p class="otp">${OTP}</p>

    <p>This OTP is valid for 15 minutes. Do not share it with anyone for security reasons.</p>
    <p>If you did not sign up for CipherGuard, please ignore this email.</p>

    <div class="footer">
      <p>Best,<br><a href="https://devglimpse.com" target="_blank">The CipherGuard team</a></p>
    </div>
  </div>

</body>

</html>

      `
    );
    return NextResponse.json(
      { success: true, message: "OTP send successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error.message);
    // if (
    //   error.message === "Body is unusable" ||
    //   "Unexpected end of JSON input"
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
