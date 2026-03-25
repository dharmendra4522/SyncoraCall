import mongoose from "mongoose"

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGOOSE_CONNECTION);
        console.log("Connected to Database Successfully");
    } catch (error) {
        console.error("Failed to connect to Database:", error.message);
        throw error; // Rethrow to stop server if connection fails
    }
}

export default dbConnection