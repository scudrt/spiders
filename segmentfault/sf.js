var fs = require('fs');
var https = require('https');
var cheerio = require('cheerio');
var path = './news.json';
var database = ''; //the whloe news list
var readDone = false; //lock the write stream
var url = 'https://segmentfault.com/channel/frontend'; //target

var News = function(id,title,abstract,url){
	return {"id":id,"title":title,"abstract":abstract,"url":url};
}

fs.exists(path,function(ex){
	if (ex){
		//if file exists, get the old news list
		console.log('file detected');
		var temp = fs.readFileSync(path).toString();
		database = JSON.parse(temp).list;
	}
	else{
		console.log('no file,initiating');
		fs.writeFile(path,'{"list":[]}',function(err){
			if (err){
				console.error(err);
			}
		});
		database=[];
	}
	readDone = true;
});

function save(newdata){
	database.unshift(newdata); //to keep the sequence of news
	/***insert '\n' to 'visualize' the json***/
	var temp = JSON.stringify(database).replace(/,"/g,',\n"');
	temp = temp.replace(/},/g,'},\n\n');
	fs.writeFile(path,'{"list":'+temp+'}',function(err){
		if (err){
			console.error(err);
		}
	});
}

function fetch(){
	var tempData = [];
	var html = '';
	https.get(url,function(res){
		console.log('\nfetching news');
		res.setEncoding('utf8');
		res.on('data',function(data){
			html+=data;
		});
		res.on('end',function(){
			while (readDone !== true){;}
			var $ = cheerio.load(html);
			$('div.news-item').each(function(){
				var flag = true; //record if it is a fresh news
				var sonTitle = $(this).find('h4').text().replace(/\s+/g,'');
				var sonAbstract = $(this).find('.article-excerpt').text().replace(/\s+/g,'');
				var sonUrl = "https://segmentfault.com"+$(this).find('a[target="_blank"]').attr('href');
				var sonId = Number(sonUrl.match(/[0-9]+/g)[0]);
				var sonNews = new News(sonId,sonTitle,sonAbstract,sonUrl);
				for (var i=0;i<database.length;++i){
					if (database[i].id === sonId){ //old news
						flag = false;
						break;
					}
				}
				if (flag){
					tempData.push(sonNews);
				}
				else{
					//no more fresh news
					return;
				}
			});
			if (tempData.length > 0){
				console.log(tempData.length+' more news found');
				save(tempData);
				newThings=0;
			}
			else{
				console.log('no fresh news');
			}
		});
	});
}

//place to begin
fetch();
setInterval(fetch,1800*1000);
