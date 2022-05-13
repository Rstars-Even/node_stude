const express = require('express');
const handleDB = require('../db/handleDB')
const router = express.Router();
require('../utils/filter')
const common = require('../utils/common')

router.get('/news_detail/:news_id', (req, res) => {
    (async () => {

        let userInfo = await common.getUser(req, res);
        console.log("用户信息查询结果------->>", userInfo);

        // 展示首页右侧排行榜信息。
        // 查询数据库 排序 取前六条。
        let result3 = await handleDB(res, "info_news", "find", "查询数据库出错！", "1 order by clicks desc limit 6");

        //左侧新闻内容。。
        let {news_id} = req.params;
        let newsResult = await handleDB(res, "info_news", "find", "查询数据库出错！", `id=${news_id}`);
        // console.log("newResult-------", newsResult);
        
        //确保数据有 id 为 news_id 这篇新闻，才可以继续往下执行。如果没有这篇新闻则返回404页面。
        if (!newsResult[0]) {

            common.abort404(req, res);
            return;
        }

        //点击文章数+1
        newsResult[0].clicks += 1;
        await handleDB(res, "info_news", "update", "数据库更新出错", `id=${news_id}`, {clicks: newsResult[0].clicks});

        let data = {    //把用户信息传递到模板。。
            user_info: userInfo[0] ? {
                nick_name: userInfo[0].nick_name,
                avatar_url: userInfo[0].avatar_url
            } : false,
            newsClick: result3,
            newsData: newsResult[0],
        }
        res.render("news/detail", data);
    })();

})

module.exports = router