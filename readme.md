爬虫集合-spider

需要安装node.js+额外模块

dytt(电影天堂):
	从最后一页开始爬取电影天堂的电影列表并保存对应下载链接。
	会爬到重复的电影是因为电影天堂会重复出电影。

	使用的额外模块:
		cheerio + iconv-lite + async

	命令：
		node dytt [delaytime]
		[delaytime]: 设置网页的请求间隔(秒),默认12秒

segmentfault(思否):
	爬取思否里前端板块的最新新闻。

	使用的额外模块:
		cheerio

	命令:
		node sf