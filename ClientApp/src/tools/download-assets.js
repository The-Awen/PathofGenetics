var path = require("path");
var fs = require("fs");
var http = require("http");

var hostName = "web.poecdn.com";
var homeDirectory = process.env["HOME"];
var outputDir = homeDirectory + "/temp/images/";
var spriteUrl = "/image///build-gen/passive-skill-sprite/"
var jsonData = JSON.parse(fs.readFileSync(path.resolve("../assets/data/skilltree.json"), "utf8"));

function retrieveImages()
{
	var promises = [];

	for (var key in jsonData.assets)
	{
		var url = jsonData.assets[key]["0.3835"];
		if (!url) continue;
		var name = path.basename(url);

		if (!name) continue;

		promises.push(requestImage(name, url));
	}

	Promise.all(promises).then(function() { console.log('retrieveImages done'); });
}

function retrieveSprites()
{
	var promises = [];

	for (var key in jsonData.skillSprites)
	{
		var spriteDefinition = jsonData.skillSprites[key];
		promises.push(requestImage(spriteDefinition[3].filename, spriteUrl + spriteDefinition[3].filename));
	}

	Promise.all(promises).then(function() { console.log('retrieveSprites done'); });
}

function requestImage(name, url)
{
	var fileName = outputDir + name;

	return new Promise(function(resolve, reject)
	{
		if (fs.exists(fileName)) fs.unlinkSync(fileName);

		var request = http.request({ host: hostName, path: url }, function(res)
		{
			var receivedData = [];
			res.on('data', function (chunk) { receivedData.push(chunk); });
			res.on('end', (d) => { fs.writeFileSync(fileName, Buffer.concat(receivedData)); resolve(); });
		});

		request.on('error', (e) => { reject(); });
		request.end();
	});
}

retrieveImages();
retrieveSprites();