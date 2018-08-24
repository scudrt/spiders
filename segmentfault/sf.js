var fs = require('fs');
var https = require('https');
var cheerio = require('cheerio');
var html = '';
var url = 'https://segmentfault.com/channel/frontend';
var path = 'G:/spiderProjects/segmentfault/news.json';
var database = '',data;
var readDone = false;
var newThings = 0; // counting the new news

var News = function(id,title,abstract,url){
	return {"id":id,"title":title,"abstract":abstract,"url":url};
}

fs.exists(path,function(ex){
	if (ex){
		console.log('file detected');
		data = fs.readFileSync(path).toString();
		database = JSON.parse(data).list;
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

function save(num){
	console.log('found '+num+' more news');
	database.sort(function(a,b){
		return b.id-a.id;
	});
	var temp = JSON.stringify(database).replace(/,"/g,',\n"');
	temp = temp.replace(/},/g,'},\n\n');
	fs.writeFile(path,'{"list":'+temp+'}',function(err){
		if (err){
			console.error(err);
		}
	});
}

function fetch(){
	https.get(url,function(res){
		console.log('fetching begin');
		res.setEncoding('utf8');
		res.on('data',function(data){
			html+=data;
		});
		res.on('end',function(){
			while (readDone !== true){;}
			var $ = cheerio.load(html);
			$('div.news-item').each(function(i,el){
				var flag = true;
				var sonTitle = $(this).find('h4').text().replace(/\s+/g,'');
				var sonAbstract = $(this).find('.article-excerpt').text().replace(/\s+/g,'');
				var sonUrl = "https://segmentfault.com"+$(this).find('a[target="_blank"]').attr('href');
				var sonId = Number(sonUrl.match(/[0-9]+/g)[0]);
				var sonNews = new News(sonId,sonTitle,sonAbstract,sonUrl);
				for (var i=0;i<database.length;++i){
					if (database[i].id === sonId){
						flag = false; //fetched news
						break;
					}
				}
				if (flag){
					++newThings;
					database.push(sonNews);
				}
			});
			if (newThings > 0){
				save(newThings);
				newThings=0;
			}
			else{
				console.log('no fresh news');
			}
			console.log('fetching end\n');
		});
	});
}

fetch();
setInterval(fetch,1800*1000);
