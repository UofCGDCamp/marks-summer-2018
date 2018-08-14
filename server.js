'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const WebSocket = require('ws');
const path = require('path');
const fs = require('file-system');

const PORT = process.env.PORT || 3000;

const server = express()
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });

var lv2assign = JSON.parse(fs.readFileSync('public/lv2assign.json'));
var lv3assign = JSON.parse(fs.readFileSync('public/lv3assign.json'));

var lv2info = JSON.parse(fs.readFileSync('public/2018lv2.json'));
var lv3info = JSON.parse(fs.readFileSync('public/2018lv3.json'));

wss.on('connection', (ws) => {
  console.log('Client connected');

  /*Can send information back to THAT client by the following:
  ws.send("Info back to THAT client.");
  */

  ws.on('message', function incoming(data) {

    var sendString = "MarkData~";

    var levelFile = null;
    var clientStudent = {};
    //student json object

    lv2info.students.forEach(function each(student){
      if(student.passcode == data){
        sendString += student.name + "~";
        //add student's name

        clientStudent = student;
        //save the student

        levelFile = lv2assign;
        //check the level 2 file for assignments
      }
    });

    lv3info.students.forEach(function each(student){
      if(student.passcode == data){
        sendString += student.name + "~";
        //add student's name

        clientStudent = student;
        //save the student

        levelFile = lv3assign;
        //check the level 3 file for assignments
      }
    });

    if(levelFile != null && clientStudent != {}){
      //student was found

      for(var i = 0; i < levelFile.labs.length; i++){
        var currentLab = levelFile.labs[i];
        sendString += "Lab " + currentLab.lab_number + " - " + currentLab.name + "%" + currentLab.percentage + "%" + searchComment(clientStudent, "lab", currentLab.lab_number) + "%";
        //assignment header (Lab # - Lab Title%percentage$)

        for(var j = 0; j < currentLab.requirements.length; j++){
          var currentReq = currentLab.requirements[j];

          if(currentReq.subrequirements == undefined){
            //normal requirement

            sendString += currentReq.name + "$"

            var tempMark = searchMark(clientStudent, "lab", currentLab.lab_number, j);

            if(tempMark > currentReq.max_mark){
              //if mark is too high

              tempMark = currentReq.max_mark;
              //set to max mark
            }

            sendString += tempMark + "$" + currentReq.full_mark;

          }else{
            //there are subrequirements

            sendString += currentReq.name + "$" + currentReq.full_mark + "$" + currentReq.max_mark + ">";

            for(var k = 0; k < currentReq.subrequirements.length; k++){
              var subreq = currentReq.subrequirements[k];
              //current subrequirement

              sendString += subreq.name + "$";
              //subreq name

              sendString += searchSubMark(clientStudent, "lab", currentLab.lab_number, j, k) + "$";
              //mark for subrequirement

              sendString += subreq.full_mark + "$";
              //full mark of subrequirement

              sendString += searchSubComment(clientStudent, "lab", currentLab.lab_number, j, k);
              //comment for subrequirement

              if(currentReq.subrequirements.length - 1 != k){
                //not last iteration
                sendString += "**";
                //add delimiter
              }
            }
          }

          if(currentLab.requirements.length - 1 != j){
            //not the last iteration
            sendString += "&";
            //delimiter to split requirements
          }

        }

        if(levelFile.labs.length - 1 != i){
          //not the last iteration
          sendString += "#";
          //delimiter to split assignments
        }
      }
      ws.send(sendString);
    }
    else{
      ws.send("Not Found");
    }



	  wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        /*Can send information to all connected clients
        client.send("Info to all clients");
        */
      }
	  });
  });
  ws.on('close', () => {
    console.log('Client disconnected')
  });
});

function searchMark(student, assignType, assignNumber, reqIndex){
  var rvMark = 0;
  //assume not found, then return a default value of 0

  student.assignments_info.forEach(function each(assignment){
    if(assignment.type == assignType && assignment.number == assignNumber){
      //Assignment is found
      if(assignment.marks.length > reqIndex){
        //Can be found

        rvMark = assignment.marks[reqIndex];
        //set return value

        return;
        //stop looping foreach function

      }

    }
  });
  return rvMark;
  //not found
}

function searchComment(student, assignType, assignNumber){
  var rvMark = "";
  //assume not found, then return a default value of 0

  student.assignments_info.forEach(function each(assignment){
    if(assignment.type == assignType && assignment.number == assignNumber){
      //Assignment is found
      rvMark = assignment.comment;
      //console.log(rvMark)
      return;
    }
  });

  return rvMark;
  //not found
}

function searchSubMark(student, assignType, assignNumber, reqIndex, subreqIndex){
  var rvMark = 0;
  //assume not found, then return a default value of 0

  student.assignments_info.forEach(function each(assignment){
    if(assignment.type == assignType && assignment.number == assignNumber){
      //Assignment is found
      if(assignment.marks.length > reqIndex){
        //Can be found

        rvMark = assignment.marks[reqIndex][subreqIndex].mark;
        //set return value

        return;
        //stop looping foreach function

      }

    }
  });

  return rvMark;
  //not found
}

function searchSubComment(student, assignType, assignNumber, reqIndex, subreqIndex){
  var rvMark = 0;
  //assume not found, then return a default value of 0

  student.assignments_info.forEach(function each(assignment){
    if(assignment.type == assignType && assignment.number == assignNumber){
      //Assignment is found
      if(assignment.marks.length > reqIndex){
        //Can be found

        rvMark = assignment.marks[reqIndex][subreqIndex].comment;
        //set return value

        return;
        //stop looping foreach function

      }

    }
  });

  return rvMark;
  //not found
}


//keep awake

const http = require("http");
setInterval(function() {
    http.get("http://marks-summer-2018.herokuapp.com/");
}, 300000); // every 5 minutes (300000)



/*
A simple Flash socket policy server for NodeJS. Request must be, and response is, null-terminated, according to Adobe spec.
*/

var file = process.argv[2] || './etc/flashpolicy.xml',
	host = process.argv[3] || 'localhost',
	port = process.argv[4] || 843,
	poli;

var fsps = require('net').createServer(function (stream) {
	stream.setEncoding('utf8');
	stream.setTimeout(3000); // 3s
	stream.on('connect', function () {
		console.log('Got connection from ' + stream.remoteAddress + '.');
	});
	stream.on('data', function (data) {
		if (data == '<policy-file-request/>\0') {
			console.log('Good request. Sending file to ' + stream.remoteAddress + '.')
      console.log(poli);
			stream.end(poli + '\0');
		} else {
			console.log('Bad request from ' + stream.remoteAddress + '.');
			stream.end();
		}
	});
	stream.on('end', function () {
		stream.end();
	});
	stream.on('timeout', function () {
		console.log('Request from ' + stream.remoteAddress + ' timed out.');
		stream.end();
	});
});

require('fs').readFile(file, 'utf8', function (err, content) {
	if (err) throw err;
  poli = content;
	fsps.listen(port, host);
	//process.setgid('nobody');
	//process.setuid('nobody');
	console.log('Flash socket policy server running at ' + host + ':' + port + ' and serving ' + file);
});
