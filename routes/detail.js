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

        //登录的用户是不是已经收藏了这篇新闻，传一个布尔值给模板。。
        let isCollected = false;
        if (userInfo[0]) {  //用户是否登录。。
            //查询数据库。
            let collectionResult = await handleDB(res, "info_user_collection", "find", "查询数据库出错！", `user_id=${userInfo[0].id} and news_id=${news_id}`)
            if (collectionResult[0]) {  //如果查询到值，说明用户收藏了。。
                isCollected = true;
            }
        }

        //查询和这篇新闻相关的评论。格式：[{},{},...],以创建时间降序排序。
        let commentResult = await handleDB(res, "info_comment", "find", "查询数据库出错！", `news_id=${news_id} order by create_time desc`);
        console.log("commentResult", commentResult);

        let data = {    //把用户信息传递到模板。。
            user_info: userInfo[0] ? {
                nick_name: userInfo[0].nick_name,
                avatar_url: userInfo[0].avatar_url?userInfo[0].avatar_url:"/news/images/worm.jpg",
            } : false,
            newsClick: result3,
            newsData: newsResult[0],
            isCollected,
            commentList: commentResult
        }
        res.render("news/detail", data);
    })();
})

//点击收藏功能与点击取消收藏。
router.post('/news_detail/news_collect', (req, res) => {
    (async () => {
        /*
        传参：用户：user_id ，哪一篇新闻：news_id，还需要一个 action 来区分是收藏还是取消。 
        */
        //    业务流程
        // 1.获取登录用户信息，没有就 return
        let userInfo = await common.getUser(req, res);
        if (!userInfo[0]) {
            res.send({erron: "4101", errmsg: "用户未登录！"});
            return
        }
        // 2.获取参数，判空
        let {news_id, action} = req.body;
        if (!action || !news_id) {
            res.send({errmsg: "参数错误！"})
            return
        }
        // 3.查询数据库 判断新闻是否存在，不存在就 return （要确保 new_id 是存在的）
        let newsResult = await handleDB(res, "info_news", "find", "查询数据库出错！", `id=${news_id}`);
        if (!newsResult[0]) {
            res.send({errmsg: "参数错误！"})
            return
        }
        // 4.根据 action 的值，判断是收藏还是取消
        if (action === "collect") {     //执行收藏操作。
            await handleDB(res, "info_user_collection", "insert", "数据库添加失败！", {
                user_id: userInfo[0].id,
                news_id
            })
        } else {
            await handleDB(res, "info_user_collection", "delete", "数据库删除失败！", `user_id=${userInfo[0].id} and news_id=${news_id}`);
        }
        // 5.返回操作成功
        res.send({errno: "0", errmsg: "操作成功！"})
    })();
})

//提交评论和回复的接口。。
router.post('/news_detail/news_comment', (req, res) => {
    (async () => {
        // 业务流程。
        // 1.获取登录用户的信息，获取不到就 return
        let userInfo = await common.getUser(req, res);
        if (!userInfo[0]) {
            res.send({erron: "4101", errmsg: "用户未登录！"});
            return
        }
        // 2.获取参数判空。
        let {news_id, comment, parent_id = null} = req.body;
        if (!comment || !news_id) {
            res.send({errmsg: "参数错误！"})
            return
        }
        // 3.查询新闻，看看这条新闻是否存在。。
        let newsResult = await handleDB(res, "info_news", "find", "查询数据库出错！", `id=${news_id}`);
        if (!newsResult[0]) {
            res.send({errmsg: "参数错误！"})
            return
        }
        // 4.往数据库 info_comment 表中插入数据（如果有传入 parent_id 这个属性也要）
        let commentObj = {
            user_id: userInfo[0].id,
            news_id,
            content: comment,
            create_time: new Date().toLocaleString()
        }
        if (parent_id) {    //如果 parent_id 有值就设置这个属性。
            commentObj.parent_id = parent_id;
        }
        console.log("评论数据------------------------>>", commentObj)
        let insertResule = await handleDB(res, "info_comment", "insert", "数据库插入失败！", commentObj);
        // 5.返回成功的响应（传数据给前端到回调函数中，让其去拼接评论的信息。）
        let data = {
            user: {
                avatar_url: userInfo[0].avatar_url?userInfo[0].avatar_url:"/news/images/worm.jpg",
                nick_name: userInfo[0].nick_name
            },
            content: comment,
            create_time: comment.created_time,
            news_id,
            id: insertResule.insertId,
        }
        res.send({errno: "0", errmsg: "操作成功！", data})

    })();
})
module.exports = router