var url = require('url');
var fs = require('fs');

function renderHTML(path, response) {
    fs.readFile(path, null, function(error, data) {
        if (error) {
            response.writeHead(404);
            response.write('file not found');
        } else {
            response.write(data);
        }
        response.end();
    });
}

//handle input tag
module.exports = {
    handleRequests: function(request, response) {
        response.writeHead(200, {'Content-Type': 'text/html'});

        var path = url.parse(request.url).pathname;
        switch(path) {
            case '/': 
                renderHTML('./index.html', response); 
                break;
            default: 
                response.writeHead(404);
                response.write('route doesnt exist');
                response.end();
        }
    }
}