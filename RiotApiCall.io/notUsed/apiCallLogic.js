const https = require('https');
const http = require('http');
const url = require('url');
var fs = require('fs');

//expires every 24 hours.
const apiKey = 'RGAPI-38981d7f-58cd-421c-9688-aa0fdc141128';

// intial request to test endpoint
// const url = 'https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/xSamdavagx?api_key=' + apiKey;

const PORT = 8080;
const server = http.createServer((request, response) => {
    //fetch summonerName query parameter from url
    // when hardcoded summonerName, calling http://localhost:8080 displayed information
    // now http://localhost:8080?summonerName=xSamdavagx passed as url parameter
    const parts = url.parse(request.url, true);
    const query = parts.query;
    const summonerName = query.summonerName;

    // function to make actual api call 
    makeAPICall(summonerName, response)
});

server.listen(PORT, () => console.log("Server is listening on port %s", PORT));

function makeAPICall(summonerName, response) {
    //url inside function so we can specify summonerName as a parameter
    const url = 'https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/' + summonerName + '?api_key=' + apiKey;

    //get request using https package
    https.get(url, (resp) => {
        let data = '';
      
        // Waiting for chunks of data
        resp.on('data', (chunk) => {
            data += chunk;
        });
      
        // When whole response finished (Received all chunks), tell server data is received and end.
        resp.on('end', () => {
            response.end(data);
        });
      
        // simple error handling
      }).on("error", (err) => {
        console.log("Error: " + err.message);
      });
}