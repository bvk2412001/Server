import io from "./connect.js";
import { config } from "dotenv";
config({ path: "config.env" });


import dataTransfer from "./dataTransfer.js";
import moment from "moment/moment.js";

//name room global



io.on("connection", (socket) => {
    console.log("socket join")
    //join socket vào room global
    socket.join(process.env.ROOM_NAME_GLOBAL);

    //gửi thông báo client đã join vô room global
    dataTransfer.socket_id = socket.id
    socket.emit(process.env.JOIN_ROOM_GLOBAL, dataTransfer)

    socket.on(process.env.SEND_MESSAGE_GLOBAL, (data) => {
        data.dateTime = moment().format('lll');
        io.to(process.env.ROOM_NAME_GLOBAL).emit(process.env.SEND_MESSAGE_GLOBAL, data)
    })

    socket.on(process.env.SEND_MESSAGE_LOCALE, (data) => {
        console.log(data)
        socket.join(data.inf_user.locale)
        data.dateTime = moment().format('lll');
        io.to(data.inf_user.locale).emit(process.env.SEND_MESSAGE_LOCALE, data)


    })
    
    socket.on(process.env.SEND_MESSAGE_PRIVATE, (data) => {
        let roomName;
        console.log(data)
        if (parseInt(data.inf_user.fbId) < parseInt(data.data.toUserId)) {
            roomName = data.inf_user.fbId + data.data.toUserId
        }
        else {
            roomName = data.data.toUserId + data.inf_user.fbId
        }
        socket.join(roomName)
        data.data = {socket_id_toUser : data.data.socket_id_toUser, roomName: roomName, message: data.data.message }
        data.dateTime = moment().format('lll');
        io.to(`${data.data.socket_id_toUser}`).emit(process.env.CREATE_ROOM, data)
        io.to(`${data.socket_id}`).emit(process.env.SEND_MESSAGE_PRIVATE, data)
        io.to(`${data.data.socket_id_toUser}`).emit(process.env.SEND_MESSAGE_PRIVATE, data)
        console.log(data);
    })
})

