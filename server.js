const express = require('express');

const app = express();
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    //res.send('Hello World!');
    res.sendFile(__dirname + '/index.html');
});

app.listen(8000, () => {
    console.log('Listening on port 8000');
});