import io from "./connect.js";
import { config } from "dotenv";
config({ path: "config.env" });


import dataTransfer from "./dataTransfer.js";
//Clients kết nối với server
io.on("connection", (socket) => {
    console.log(dataTransfer)
})
  