//1.1.1
var fs = require('fs');
var http = require('http');
var async = require('async');
var events = require('events');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');

var baseUrl = 'http://www.ygdy8.com';
var url = 'http://www.ygdy8.com/html/gndy/dyzz/list_23_';
var path = './movies.json';
var data = '', pageData;
var readDone = false;
var currentPage = 0, currentMovie = 1;
var loopList = [];
var timeDelay = 10; //x seconds every page 
var event = new events.EventEmitter();

var Movie = function(title,url,download){
	return {"title":title,"url":url,"download":download};
}

function mySleep(tickTime){
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
	pageData = [];
	http.get(url+currentPage+'.html',function(res){
		res.on('data',function(data){
			html+=iconv.decode(data,'gb2312');
		});
		res.on('end',function(){
			var $ = cheerio.load(html);
			$('a.ulink').each(function(){
				pageData.push(new Movie($(this).text(),baseUrl+$(this).attr('href'),[]));
			});
			movieFetch();
			event.on('moviedone',function(){
				console.log('page '+currentPage+' done.');
				--currentPage;
				save();
				setTimeout(pageFetch,timeDelay*1000);
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
	}
	else{
		console.log('no file,initiating');
		preDeal();
		fs.writeFile(path,'{"page":['+currentPage+'],"data":[]}',function(err){
			if (err){
				console.error(err);
			}
		});
		data=[];
	}
});

setTimeout(pageFetch,1500);
