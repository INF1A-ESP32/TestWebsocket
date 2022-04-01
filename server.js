const WebSocket = require('ws');
const server = new WebSocket.Server({
    port: 33003
});
let start_time = new Date();
var http = require('http'); // Import Node.js core module
const { time } = require('console');

var webserver = http.createServer(function (req, res) {   //create web server
    if (req.url == '/') { //check the URL of the current request

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write("<html><head><meta http-equiv=\"refresh\" content=\"1\">");
        Object.keys(robots).forEach(key => {
            let color = "black"
            if (robots[key].status === "booting") {
                color = "orange"
            }
            if (robots[key].status === "ready") {
                color = "green"
            }
            res.write(`<div style="background-color: ${color}; color: white; border-radius: 15px; padding: 20px; width: 200px; text-align: center">`);
            res.write(String(robots[key].name));
            res.write("<br>");
            res.write(String(robots[key].team));
            res.write("<br>");
            res.write(String(robots[key].status));
            res.write("<br>");
            res.write(String(robots[key].ready));
            res.write("</div>");
        })
        res.write('</body></html>');
        res.end();

    }
    else
        res.end('Invalid Request!');

});

webserver.listen(5000); //6 - listen for any incoming requests

console.log('Node.js web server at port 5000 is running..')

console.log("Websocket Server started")
let connections = [];
let robots = {};
let whitelist_mac = [
    'F0:08:D1:D1:72:A0', // Robot INF1B
    '34:94:54:25:13:84', // TEST ESP32
    'FC:F5:C4:2F:45:5C', // Robot INF1A
]

sendMessage = (socket, data, client_id)=>{
    console.log(`${client_id} | send |`, data)
    socket.send(JSON.stringify(data));
}

server.on('connection', function (socket, client) {
    console.log(client.headers)
    connections.push(socket);
    //socket.send("Hallo Pieter post hier")
    // client_ip = client.socket.remoteAddress.split(":")
    // client_ip = client_ip[client_ip.length-1]
    // console.log(`Checking if user on ${client_ip} has rights to connect`)
    // When you receive a message, send that message to every socket.
    socket.on('message', function (msg) {
        let data = {}
        // return;
        let client_id = "UNKNOWN"
        if(socket.id) client_id = socket.id;
        
        try {
            
            data = JSON.parse(String(msg))
            console.log(`${client_id} | res |`,data);
        } catch (error) {
            console.log(`${client_id} | res | ${String(msg)}`);
            //socket.send("Dankjewel");
            return
        }
        if ("status" in data && data["status"]=="finished"){
            console.log("Start robot", new Date())
            // console.log("Time: ",start_time.fromNow())
        }
        if ("id" in data) {
            let loginData = {
                'loggedin': false
            }
            if (whitelist_mac.includes(data.id)) {
                console.log("This device has valid credentials")
                socket.id = data.id;
                client_id = data.id;
                loginData['loggedin'] = true;
            }
            console.log(`${client_id} | send |`, loginData)
            socket.send(JSON.stringify(loginData));
            if(!loginData['loggedin']){
                socket.terminate();
            }
        } else {
            // console.log(`${socket.id} | ${String(msg)}`);
            // let update_data = JSON.parse(String(msg))
            // robots[socket.id]['status'] = update_data.status;
            // robots[socket.id]['ready'] = update_data.ready;
        }
    });
    socket.on('pong', () => socket.isAlive = true);


    // When a socket closes, or disconnects, remove it from the array.
    socket.on('close', function () {
        // console.log("Connection closed")
        // delete connections[socket];
        // robots[socket.id].status = "disconnected"
        // robots[socket.id].ready = false
    });
    
});

setTimeout(() => {
    let game = "race";
    connections.forEach(socket => {    
        let client_id = "UNKNOWN"
        if(socket.id) client_id = socket.id;    
        sendMessage(socket, {
            "action": "prepare",
            "game": game,
        }, client_id)
        setTimeout(() => {
            start_time = new Date();
            console.log("Start robot", start_time)
            sendMessage(socket, {
                "action": "start",
                "game": game,
            }, client_id)
        }, 2000)
        setTimeout(() => {
            sendMessage(socket, {
                "action": "ended",
                "game": game,
            }, client_id)
        }, 10000000)
    }
)}, 15000)

const interval = setInterval(function ping() {
    connections.forEach(socket => {
        let client_id = "UNKNOWN"
        if(socket.id) client_id = socket.id;
        if (socket.isAlive === false) {
            console.log(`${client_id} | disconnect | The connection has been terminated`)
            connections = connections.filter(connection => connection !== socket);
            return socket.terminate();
        }
        socket.isAlive = false
        socket.ping();
    });
}, 5000);
