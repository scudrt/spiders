//1.1.3
var fs = require('fs');
var http = require('http');
var async = require('async');
var events = require('events');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');

var baseUrl = 'http://www.ygdy8.com';
var url = 'http://www.ygdy8.com/html/gndy/dyzz/list_23_';
var path = './movies.json';
var data = '', pageData = [];
var currentPage = 0;
var timeDelay = 12; //x seconds every page 
var event = new events.EventEmitter();

var Movie = function(title,url,download){
	return {"title":title,"url":url,"download":download};
}

function mySleep(tickTime){ //ms
	var t = new Date();
	while (new Date() - t < tickTime){;}
}

function preDeal(){
	var tempUrl = 'http://www.ygdy8.com/html/gndy/dyzz/index.html';
	var tempHtml = '';
	http.get(tempUrl,function(res){
		res.on('data',function(data){
			tempHtml+=iconv.decode(data,'gb2312');
		});
		res.on('end',function(){
			var $ = cheerio.load(tempHtml);
			currentPage = Number($('option').last().text());
			event.emit('preDealed');
		});
	});
}

function save(){ //data saved every page
	console.log('page '+(currentPage+1)+' saved');
	data = pageData.concat(data);
	var temp = JSON.stringify(data).replace(/",/g,'",\n');
	temp = temp.replace(/},/g,'},\n\n');
	fs.writeFile(path,'{"page":'+currentPage+',"data":'+temp+'}',function(err){
		if (err){
			console.log(err);
		}
	});
}

function movieFetch(){
	async.forEachSeries(pageData,function(el,fun){
		mySleep(timeDelay*1000);
		var currentIndex = pageData.indexOf(el);
		http.get(el.url,function(res){
			var html = '';
			res.on('data',function(data){
				html+=iconv.decode(data,'gb2312');
			});
			res.on('end',function(){
				console.log((currentIndex+1)+'/'+pageData.length+': '+el.title);
				var $ = cheerio.load(html);
				$('td[bgcolor="#fdfddf"]').each(function(){
					pageData[currentIndex].download.push($(this).text());
				});
				if (currentIndex === pageData.length-1){
					event.emit('moviedone');
				}
				fun();
			});
		});
	});
}

function pageFetch(){ //get the url list from pages
	console.log('fetching page '+currentPage);
	var html = '';
	http.get(url+currentPage+'.html',function(res){
		res.on('data',function(data){
			html+=iconv.decode(data,'gb2312');
		});
		res.on('end',function(){
			var $ = cheerio.load(html);
			$('a.ulink').each(function(){
				pageData.push(new Movie($(this).text(),baseUrl+$(this).attr('href'),[]));
				if ($(this).text() === $('a.ulink').last().text()){
					movieFetch();
				}
			});
		});
	});
}

//check movies.json
fs.exists('./movies.json',function(ex){
	if (ex){
		console.log('file detected');
		var temp = JSON.parse(fs.readFileSync(path).toString());
		currentPage = temp.page;
		data = temp.data;
		event.emit('initok');
		if (currentPage === 0){
			currentPage = 1;
		}
	}
	else{
		console.log('creating movies.json');
		preDeal();
		event.on('preDealed',function(){
			fs.writeFile(path,'{"page":'+currentPage+',"data":[]}',function(err){
				if (err){
					console.error(err);
				}
			});
			event.emit('initok');
		})
		data=[];
	}
});

event.on('moviedone',function(){
	console.log('page '+currentPage+' done.');
	--currentPage;
	save();
	pageData = [];
	setTimeout(pageFetch,timeDelay*1000);
});
if (process.argv[2] !== undefined){
	timeDelay = Number(process.argv[2]);
}
event.on('initok',pageFetch);
