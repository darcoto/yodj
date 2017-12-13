// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'yplayer-server';

var server = {port:8180,host:'localhost'};

const express = require('express')
const bodyParser = require('body-parser');
const app = express()

var clients = [];

app.listen(server.port, () => {
  log('Listening on port ' + server.port)
})

app.set('trust proxy', 'loopback')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', function(req, res){
  res.send('Hello World!')
})

app.post('/api',function(req, res){

    if(req.body.command){
      sendData(req.body.command,req.body.params);
    }
    res.send('Api call')
});

app.get('/connect', function(req, res){

    var index = clients.push(res) - 1;
    log('Connected client #'+index + '/' + clients.length);
    
    if(req.headers.referer.indexOf('/dj') != -1){
      res._client_type = 'dj';
    }else{
      res._client_type = 'display';
    }

    req.on('close', function () {
      log('Disconnect client #'+index + '/' + clients.length);
      clients.splice(index, 1);
      sendPing();
    });

    res.writeHead(200, {
      'Connection': 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'YDJ': 'start'
    });

    res.write("retry: 1000\n\n");
    sendPing();
});

setInterval(function(){
    sendPing();
}, 60000);


function sendPing(){
  sendData('ping',{clients:get_clients()});
}

function sendData(event_type,params){
    var json = JSON.stringify(params);
    log('Data to send: ' + json)
    for(var i=0; i < clients.length; i++){
      log('Send to #'+i);
      clients[i].write('event: '+ event_type + '\n');
      clients[i].write('data: ' + json + '\n\n');
    }
}

function get_clients(){
  var result = {dj:0,display:0};
  for(var x in clients){
    var client = clients[x];
    if(client._client_type == 'dj'){
      result.dj++;
    }else{
      result.display++;
    }
  }
  return result;
}

function log(txt){
    var date = new Date();
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();
    var hour = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();
    console.log(year + '-' + (monthIndex+1) + '-' + day + ' ' + hour+ ':' + min+ ':' + sec +' ' + txt);
}

console.log("====================================")
console.log("Start Yplayer Server");
console.log("====================================")
console.log("")
