const express = require('express');
const router = express.Router();
const handleDB = require('../db/handleDB')
require('../utils/filter')
const common = require('../utils/common')


router.get('/', (req, res) => {
    (async () => {
        
        //访问首页，处理右上角用户登录显示。根据用户登录状态信息。
        //从 session 中获取 user_id 
        let userInfo = await common.getUser(req, res);
        console.log("用户信息查询结果------->>", userInfo);
        
        //--------------------------------------------------------------------
        //展示首页头部分类信息。
        let result2 = await handleDB(res, "info_category", "find", "查询数据库出错！", ["name"]);
        // ---------------------------------
        // 展示首页右侧排行榜信息。
        // 查询数据库 排序 取前六条。
        // let result3 = await handleDB(res, "info_news", "sql", "数据库查询出错！", "select * from info_news order by clicks desc limit 6");
        let result3 = await handleDB(res, "info_news", "find", "查询数据库出错！", "1 order by clicks desc limit 6");

        let data = {    //把用户信息传递到模板。。
            user_info: userInfo[0] ? {
                nick_name: userInfo[0].nick_name,
                avatar_url: userInfo[0].avatar_url
            } : false,
            category: result2,
            newsClick: result3
        }
        res.render("news/index", data);
    })();
})


router.get("/news_list", (req, res) => {
    (async function(){
        // 1.获取参数   cid（新闻分类id）   page（当前页数）    per_page(每页条数)
        let {cid = 1, page = 1, per_page =5} = req.query;   //分别给参数设置默认值。
        
        // 2.查询数据库，根据以上三个参数，获取前端需要这些数据。
        let wh = cid == 1 ? "1" : `category_id=${cid}`;
        let result = await handleDB(res, "info_news", "limit", "数据库查询出错！", {
            where: `${wh} order by create_time desc`,
            number: page,
            count: per_page
        })

        // 求总页数totalPage
        // 总页数 = 总条数/每页有多少条     结果应该向上取整 Math.ceil()
        let result2 = await handleDB(res, "info_news", "sql", "数据库查询出错", "select count(*) from info_news where " + wh)   //计算总条数。
        let totalPage = Math.ceil(result2[0]["count(*)"]/per_page)
        // console.log("result---------------------->>>>", result);
        res.send({
            newsList: result,
            totalPage,
            currentPage: Number(page)
        })
    })()
})


module.exports = router;