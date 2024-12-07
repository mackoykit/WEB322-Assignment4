let mongoose = require("mongoose");
let Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
require("dotenv").config();

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    loginHistory: [{
        dateTime: {
            type: Date,
            default: Date.now,
        },
        userAgent: {
            type: String,
            required: true,
        },
    }],
});

let User;

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(process.env.MONGODB_CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        db.on("error", (err) => {
            console.error("MongoDB Connection Error:", err);
            reject(err);
        });

        db.once("open", () => {
            User = db.model("users", userSchema);
            console.log("MongoDB Connection Successful");
            resolve();
        });
    });
};

module.exports.registerUser = function (userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
            return;
        }

        bcrypt.hash(userData.password, 10)
            .then(hash => {
                let newUser = new User({
                    userName: userData.userName,
                    email: userData.email,
                    password: hash,
                    loginHistory: []
                });

                return newUser.save();
            })
            .then(() => {
                resolve();
            })
            .catch(err => {
                if (err.code === 11000) {
                    reject("User Name already taken");
                } else {
                    reject("There was an error creating the user: " + err);
                }
            });
    });
};

module.exports.checkUser = function (userData) {
    return new Promise((resolve, reject) => {
        User.findOne({ userName: userData.userName })
            .exec()
            .then(user => {
                if (!user) {
                    reject(`Unable to find user: ${userData.userName}`);
                    return;
                }

                return bcrypt.compare(userData.password, user.password)
                    .then(isMatch => {
                        if (!isMatch) {
                            reject(`Incorrect Password for user: ${userData.userName}`);
                            return;
                        }

                        const MAX_HISTORY = 10;
                        if (user.loginHistory.length >= MAX_HISTORY) {
                            user.loginHistory = user.loginHistory.slice(0, MAX_HISTORY - 1);
                        }

                        user.loginHistory.unshift({
                            dateTime: new Date(),
                            userAgent: userData.userAgent
                        });

                        return User.updateOne(
                            { userName: user.userName },
                            { $set: { loginHistory: user.loginHistory } }
                        ).then(() => resolve(user));
                    });
            })
            .catch(err => {
                reject(`Error during login: ${err}`);
            });
    });
};
