var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var users = [];
var connections = [];
const AssistantV1 = require('ibm-watson/assistant/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const assistant = new AssistantV1({
    version: '2019-02-28',
    authenticator: new IamAuthenticator({
        apikey: 'VeQ_s9F-fUsqJcOCi094AZqyQS13YhvWxcc-3aJbylFs',
    }),
    url: 'https://api.eu-gb.assistant.watson.cloud.ibm.com/instances/5dbf9a54-e67f-442c-96cf-cd81dfa2407e',
});

server.listen(process.env.PORT || 3000)
console.log('server running....')

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html')
})

//open connection with socketio

io.sockets.on('connection', function (socket) {
    connections.push(socket);
    console.log('connected: %s sockets connected', connections.length)

    //disconnect
    socket.on('disconnect', function (data) {
        users.splice(users.indexOf(socket.username), 1);
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1);
        console.log("Disconnected: %s sockets connected", connections.length)
    })

    socket.on('new user', function (data, callback) {
        callback(true);
        socket.username = data;
        users.push(socket.username);
        updateUsernames()
    });

    function updateUsernames() {
        io.sockets.emit('get users', users);
    }


    socket.on('send message', function (data) {

        assistant.message({
            workspaceId: '042d3e04-cac2-4ce6-957d-9c97a7ddaa8f',
            input: { 'text': data }
        })
            .then(res => {
                console.log(res.result.output.text);
                var wr = res.result.output.text;
                io.sockets.emit('new message', { msg: data, user: socket.username, reply: wr });
            })
            .catch(err => {
                console.log(err)
            });

        console.log(data)

    })


})