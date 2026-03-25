import User from "../schema/userSchema.js"
import bcrypt from "bcryptjs"
import jwtToken from "../utils/jwtToken.js";

export const SignUp = async (req, res) => {
    try {
        const { fullname, username, email, password, gender, profilepic } = req.body
        const user = await User.findOne({ username });
        if (user) return res.status(400).send({ success: false, message: "Username Already Exists" })
        const emailpresent = await User.findOne({ email });
        if (emailpresent) return res.status(400).send({ success: false, message: "User Already Exists With this Email" })
        const hashPassword = bcrypt.hashSync(password, 10)
        const boyProfilePic = profilepic || `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`
        const girlProfilePic = profilepic || `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`

        const newUser = new User({
            fullname,
            username,
            email,
            password: hashPassword,
            gender,
            profilepic: gender === "male" ? boyProfilePic : girlProfilePic
        })
        if (newUser) {
            await newUser.save();
            const token = jwtToken(newUser._id, res)
            return res.status(201).send({
                _id: newUser._id,
                fullname: newUser.fullname,
                username: newUser.username,
                profilepic: newUser.profilepic,
                email: newUser.email,
                message: "Signup Successfully!",
                token
            })
        } else {
            return res.status(400).send({ success: false, message: "Invalid User Data" })
        }

    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message || "Internal Server Error"
        })
        console.log(error);
    }
}



export const Login = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email })
        if (!user) return res.status(404).send({ success: false, message: "Email Doesn't Exist, Please Register" })
        const comparePassword = bcrypt.compareSync(password, user.password || "")
        if (!comparePassword) return res.status(401).send({ success: false, message: "Invalid Email or Password" })
        const token = jwtToken(user._id, res);
        console.log(token);

        res.status(200).send({
            _id: user._id,
            fullname: user.fullname,
            username: user.username,
            profilepic: user.profilepic,
            email: user.email,
            message: "Successfully Logged In",
            token
        })
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error
        })
        console.log(error);
    }
}

export const LogOut = async (req, res) => {
    try {
        res.clearCookie('jwt', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });
        res.status(200).send({ message: "User LogOut" })
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error
        })
        console.log(error);
    }
}