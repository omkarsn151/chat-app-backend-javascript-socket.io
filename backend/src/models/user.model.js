import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        userName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        profilePic: {
            type: String,
        },
    }, { timestamps: true }
);

// Middleware to hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to check if the password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
    if (!this.password) {
        throw new Error("User password is not set.");
    }
    if (!password) {
        throw new Error("Password to compare is missing.");
    }
    return await bcrypt.compare(password, this.password);
};


export const User = mongoose.model("User", userSchema);