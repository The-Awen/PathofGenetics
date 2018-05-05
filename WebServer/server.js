const express = require('express');
const firebase = require('firebase-admin');
const WebSocket = require('ws');

const serviceAccount = require('path/to/serviceAccountKey.json');

const app = express();
app.use(bodyParser.json());

// Firebase REST
firebase.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://pathofgenetics.firebaseio.com'
});

app.get("/build", function(req, res, next) {
    return firebase.database().ref('builds').once('value').then(function(snapshot) {
        res.status(200).send(snapshot.val());
    });
});

app.get("/build/:id", function(req, res, next) {
    return firebase.database().ref('builds/' + id).once('value').then(function(snapshot) {
        res.status(200).send(snapshot.val());
    });
});

app.post("/build", function(req, res, next) {
    let parameters = JSON.parse(req.body.parameters);
    
    let id = firebase.database().ref().child('builds').push().key;
    
    firebase.database().ref('builds/' + id).set({
        tree: '',
        parameters,
        progress: 0
    }).then((results) => {
        const ws = new WebSocket('ws://localhost:5000');

        ws.on('open', function open() {
          ws.send(parameters);
        });
        
        ws.on('message', function incoming(build) {
            firebase.database().ref('builds/' + id).set({
                tree: build.tree,
                parameters,
                progress: build.progress
            });
        });    
    });
    
});

app.put("/build/:id", function(req, res, next) {
    let parameters = JSON.parse(req.body.parameters);
    let tree = JSON.parse(req.body.tree);
    let progress = Number(JSON.parse(req.body.progress));
    
    firebase.database().ref('builds/' + id).set({
        tree,
        parameters,
        progress
    }).then((result) => {
        res.status(200).send(id);  
    });
});

app.delete("/build/:id", function(req, res, next) {
    firebase.database().ref('builds/' + id).remove().then((result) => {
        res.status(200);  
    });
});

app.listen(4000, () => {
    console.log('Web Server listening on port 4000');
});