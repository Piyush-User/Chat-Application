const express = require("express")
const http = require("http")
const {Server} = require("socket.io")
const getUserFromToken = require("../services/getUserFromToken")
const { findById } = require("../models/user")
const UserModel = require("../models/user")
// const { error } = require("console")
const {ConversationModel, MessageModel} = require("../models/conversation")

const app = express()

// socket connection
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true
    }
})

// socket running at http://localhost:5000/

const onlineUser = new Set()

io.on("connection", async (socket) => {
    console.log("connect user", socket.id)

    const token = socket.handshake.auth.token
    
    //current user details
    const user = await getUserFromToken(token)

    if (!user) {
        return socket.disconnect(true); // Disconnect if authentication fails
    }
    
    //create a room
    socket.join(user?._id.toString())
    onlineUser.add(user?._id?.toString())

    io.emit("onlineUser", Array.from(onlineUser))

    socket.on("message-page", async (userId) => {
        // console.log("userId: ", userId)
        const userDetails = await UserModel.findById(userId).select("-password")
        // console.log("userDetails: ", userDetails)

        const payload = {
            _id: userDetails?._id,
            name: userDetails?.name,
            email: userDetails?.email,
            profile_pic: userDetails?.profile_pic,
            online: onlineUser.has(userId),
        }

        socket.emit("message-user", payload)

        //get previous message
        const getConversationMessage = await ConversationModel.findOne({
            "$or" : [
                { sender : user?._id, receiver : userId },
                { sender : userId, receiver :  user?._id}
            ]
        }).populate('messages').sort({ updatedAt : -1 })

        socket.emit('message',getConversationMessage?.messages)

    })

    //new message
    socket.on("new message", async (data) => {
        //Check conversation is available to both user
        let conversation = await ConversationModel.findOne({
            "$or" : [
                {sender: data?.sender, receiver: data?.receiver},
                {sender: data?.receiver, receiver: data?.sender}
            ]
        })

        //if conversation is not available
        if(!conversation){
            const createConversation = await ConversationModel({
                sender: data?.sender,
                receiver: data?.receiver
            })
            conversation = await createConversation.save()
        }

        const createMessage = new MessageModel({
            text : data?.text,
            imageUrl : data?.imageUrl,
            videoUrl : data?.videoUrl,
            msgByUserId : data?.msgByUserId
        })
        const saveMessage = await createMessage.save()

        const updateConversation = await ConversationModel.updateOne({_id: conversation._id}, {
            "$push": {messages: saveMessage._id}
        })

        const getConversationMessage = await ConversationModel.findOne({
            "$or" : [
                {sender: data?.sender, receiver: data?.receiver},
                {sender: data?.receiver, receiver: data?.sender}
            ]
        }).populate("messages").sort({updatedAt: -1})

        io.to(data?.sender).emit("message", getConversationMessage?.messages)
        io.to(data?.receiver).emit("message", getConversationMessage?.messages)

        // console.log("getConversation: ", getConversationMessage)
        // console.log("data:: ", data)
    })

    //disconnect
    socket.on("disconnect", () => {
        onlineUser.delete(user._id)
        console.log("disconnect user", socket.id)
    })
})

module.exports = {
    app,
    server,
}