import jwt from "jsonwebtoken"

const jwtToken =  (userId , res)=>{
    const token = jwt.sign({userId},process.env.JWT_SECRET,{
        expiresIn:"30d"
    })
    const isDev = process.env.NODE_ENV === "development";
    res.cookie("jwt", token, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: isDev ? "Lax" : "None",
        secure: !isDev,
        path: '/'
    })
    return token;
}

export default jwtToken;