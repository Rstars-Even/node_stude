const express = require('express');
const router = express.Router();
const handleDB = require('../db/handleDB')
require('../utils/filter')

router.get('/', (req, res) => {
    //访问首页，处理右上角用户登录显示。根据用户登录状态信息。
    //从 session 中获取 user_id 
    (async () => {

        let user_id = req.session["user_id"];
        let result = [];
        if (user_id) {  
            //如果已经获取到 user_id ,要确认这个 user_id 是有效的。
            //如果有效就要查询出数据，给到模板或前端。
            result = await handleDB(res, "info_user", "find", "查询数据库出错！", `id=${user_id}`);        
        }
        console.log("用户信息查询结果------->>", result);
        
        //--------------------------------------------------------------------
        //展示首页头部分类信息。
        let result2 = await handleDB(res, "info_category", "find", "查询数据库出错！", ["name"]);
        // ---------------------------------
        // 展示首页右侧排行榜信息。
        // 查询数据库 排序 取前六条。
        // let result3 = await handleDB(res, "info_news", "sql", "数据库查询出错！", "select * from info_news order by clicks desc limit 6");
        let result3 = await handleDB(res, "info_news", "find", "查询数据库出错！", "1 order by clicks desc limit 6");

        let data = {    //把用户信息传递到模板。。
            user_info: result[0] ? {
                nick_name: result[0].nick_name,
                avatar_url: result[0].avatar_url
            } : false,
            category: result2,
            newsClick: result3
        }
        res.render("news/index", data);
    })();
})


module.exports = router;