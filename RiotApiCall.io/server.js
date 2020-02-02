var http = require('http');
var express = require('express');
var app = express();
var exphbs = require('express-handlebars');
var request = require('request');
var async = require('async');
var rp = require('request-promise');
//specified main as my default layout for simplicity
app.engine('handlebars', exphbs({defaultLayout: 'main'}));

app.set('view engine', 'handlebars');

app.get('/', function(req, res){
    var data = {};
    var data2 = {};
    var kills = [];
    var wins = [];
    var deaths = [];
    var assists = [];

    //TODO: this API key can be auto-renewed, didnt have enough time to implement
    var apiKey = 'RGAPI-38981d7f-58cd-421c-9688-aa0fdc141128';
    //TODO: this value should not be hardcoaded. My idea was to have an input parameter in my handlebars front end, and use that as
    // the parameter for the API Call. Not enough time to do.
    //In "notUsed" files you can find the implementation to allow users to hit any endpoint by just changing the browser url themselves
    var summonerName = 'xSamdavagx';
    var URL = 'https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/' + summonerName + '?api_key=' + apiKey;

    // used async waterfall to be able to trigger the async request commands in order
    async.waterfall([
        // API Call 1, using a summonerName variable, make a request to the API to retrieve basic user information
        // ENDPOINT: /lol/summoner/v4/summoners/by-name/{summonerName}
        function(callback) {
            request(URL, function(err, response, body) {
                if (!err && response.statusCode==200) {
                    var json = JSON.parse(body);
                    data.id = json.id;
                    data.name = json.name;
                    data.level = json.summonerLevel;
                    data.accountId = json.accountId;
                    callback(null, data);
                } else {
                    console.log(err);
                }
            });
        },
        // API Call 2, using the accountID retrieved from API CALL 1 to get the list of Matches in which my summoner has participated
        // ENDPOINT: /lol/match/v4/matchlists/by-account/{encryptedAccountId}
        function(obj, callback) {
            var accountId = obj.accountId;
            var URL2 = 'https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/' + accountId + '?api_key=' + apiKey;
            request(URL2, function(err, response, body) {
                if(!err && response.statusCode==200) {
                    var json2 = JSON.parse(body);
                    data2.totalGames = json2.totalGames;
                    data2.listofGames = json2.matches;
                    callback(null, obj, data2);
                } else {
                    console.log(err)
                }
            });
        },
        // API Call 3, using the gameId for each game my user played, find the list of participantIds, select correct user based on accountId
        // this value will then be mapped to the array "participants": which contains the statistics based on the participantID per game.
        // accountID cant be directly mapped to "participants": as participantID enumarates players starting from 1 ... n
        //TODO: efficiency check, can we make less requests and avoid the two loops?
        function(obj1, obj2, callback) {
            // Will act as a promise array
            var myRequests = [];
            var limit = 1;
            obj2.listofGames.forEach(element => {
                var gameId = element.gameId;
                var URL3 = 'https://na1.api.riotgames.com/lol/match/v4/matches/' + gameId + '?api_key=' + apiKey;
                //limit at 17 games displayed, why? API has a limit of 20 requests per second!, so the preivosu 2
                //api requests plus this 17 take us to 19
                if (limit <= 18){
                    myRequests.push(rp(URL3));
                    limit++;
                }
            });
            Promise.all(myRequests)
            .then((arrayOfRequests) => {
                arrayOfRequests.forEach(element => {
                    var json3 = JSON.parse(element);
                    var id = 0;
                    json3.participantIdentities.forEach(element2 => {
                      // at this stage, element contains the list of participantsIdentities in which we can find a participantID for a specific accountID
                        if (element2.player.accountId == obj1.accountId) {
                            id = element2.participantId;
                        }
                    });
                    json3.participants.forEach(element3 => {
                      // as this point we get the correct participantID, which we can map to the "participants:" array to retrieve the statistics of
                      // a particular player
                        if (element3.stats.participantId == id) {
                            kills.push({kills: element3.stats.kills});
                            wins.push({win: element3.stats.win});
                            deaths.push({deaths: element3.stats.deaths});
                            assists.push({assists: element3.stats.assists});
                        }
                    });
                })
                callback(null, obj1, obj2, kills, wins, deaths, assists);
        }).catch(function (err){
            console.log('Error');
        });
        }
    ],
function(err, data, data2, kills, wins, deaths, assists) {
        if(err){
            console.log(err);
            return;
        }

        res.render('index', {
            info: data,
            info2: data2,
            kills: kills,
            win: wins,
            deaths: deaths,
            assists: assists
        });
    });
});

var port = Number(process.env.PORT || 8080);
app.listen(port);

// http.createServer(app.handleRequests).listen(8080);
