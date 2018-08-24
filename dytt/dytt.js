var http = require('http');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var superagent = require('superagent');

var url = 'http://www.dytt8.net/html/gndy/dyzz/index.html'
var html = '';

function start()
{
	http.get(url,function (res)
	{
		html = '';
		res.on('data',function (temp)
		{
			html+=iconv.decode(temp,'gb2312');
		});
		res.on('end',function ()
		{
			solve();
		})
	})
	.on('error',function ()
	{
		console.log('请求失败');
	})
}

function solve()
{
	var $ = cheerio.load(html);
	console.log('部分最新电影名单:(电影天堂)');
	$('a.ulink').each(function (i,el){
		console.log(i+'.'+$(this).text());
	});
}

start();
