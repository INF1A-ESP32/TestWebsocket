const WebSocket = require('ws');
const WebSocketPort = 33003;
const server = new WebSocket.Server({
    port: WebSocketPort
});

// Track the start time so the game can be timed
let start_time = new Date();

var http = require('http');

console.log(`Websocket Server started at port ${WebSocketPort}`);

let connections = [];

let whitelist_mac = [
    'XX:XX:XX:XX:XX:XX',
]

sendMessage = (socket, data, client_id)=>{
    console.log(`${client_id} | send |`, data)
    socket.send(JSON.stringify(data));
}

server.on('connection', function (socket, client) {
    console.log(client.headers)
    connections.push(socket);
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