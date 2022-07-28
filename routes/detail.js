const express = require('express');
const handleDB = require('../db/handleDB')
const router = express.Router();
require('../utils/filter')
const common = require('../utils/common')
const constant = require('../utils/constant')

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
        // console.log("commentResult--------------->>>", commentResult);

        //给 commentResult 数组中每一个元素（每一条评论）进行处理，添加评论者的信息。
        for (let index = 0; index < commentResult.length; index++) {
            //查询数据库，查询 info_user 表中对应的玩家信息。根据 commentResult[i] 中的 user_id 属性来查询。
            let commenterResult = await handleDB(res, "info_user", "find", "查询数据库出错！", `id=${commentResult[index].user_id}`);
            commentResult[index].commenter = {
                nick_name: commenterResult[0].nick_name,
                avatar_url: commenterResult[0].avatar_url?(constant.AVATAR_URL_PRE + commenterResult[0].avatar_url): "/news/images/worm.jpg"
            }

            //如果commentResult[index].parent_id 有这个值就添加 parent 这个属性。
            if (commentResult[index].parent_id) {
                //如果有回复，查询父评论的内容 contrnt(info_comment),和父评论名（info_user）的昵称 nick_name
                var parentComment = await handleDB(res, "info_comment", "find", "数据库查询失败！", `id=${commentResult[index].parent_id}`)
                var parentUserInfo = await handleDB(res, "info_user", "find", "数据库查询失败！", `id=${parentComment[0].user_id}`)
                commentResult[index].parent = {
                    user: {
                        nick_name: parentUserInfo[0].nick_name,
                    },
                    content: parentComment[0].comment
                }
            }
        }

        //把登陆用户的点赞过的评论全部查出来，组成：["id1", "id2", ...] 传递给前端模板。
        let user_like_comments_ids = [];
        if (userInfo[0]) {
            //查询“info_comments_like”表当前登录用户点赞过的评论对象。
            //查询条件：user_id = 用户登陆舰的 id
            let user_like_commentsResult = await handleDB(res, "info_comment_like", "find", "查询数据库出错！", `user_id=${userInfo[0].id}`);
            user_like_commentsResult.forEach(el => {
                user_like_comments_ids.push(el.comment_id);
            })
        }        

        //查询新闻作者的一些信息，传到模板。。
        let authorInfo = await handleDB(res, "info_user", "find", "数据库查询失败！", `id=${newsResult[0].user_id}`);
        // console.log("--------------newsResult[0]-", newsResult[0]);
        // console.log("---------------", authorInfo);
        let authorNewsCount = await handleDB(res, "info_news", "sql", "查询数据库出错！", `select count(*) from info_news where user_id=${authorInfo[0].id}`)
        //查询作者的粉丝数量。。
        let authorFansCount = await handleDB(res, "info_user_fans", "sql", "查询数据库出错！", `select count(*) from info_user_fans where followed_id=${authorInfo[0].id}`)

        //登录的用户是不是已经关注了这作者，传一个布尔值给模板。。
        let isFollow = false;
        if (userInfo[0]) {  //用户是否登录。。
            //查询数据库。
            let followResult = await handleDB(res, "info_user_fans", "find", "查询数据库出错！", `follower_id=${userInfo[0].id} and followed_id=${authorInfo[0].id}`)
            if (followResult[0]) {  //如果查询到值，说明用户收藏了。。
                isFollow = true;
            }
        }
        authorInfo[0].avatar_url = authorInfo[0].avatar_url? (constant.AVATAR_URL_PRE + authorInfo[0].avatar_url): "/news/images/worm.jpg"

        let data = {    //把用户信息传递到模板。。
            user_info: userInfo[0] ? {
                nick_name: userInfo[0].nick_name,
                avatar_url: userInfo[0].avatar_url? (constant.AVATAR_URL_PRE + userInfo[0].avatar_url): "/news/images/worm.jpg",
            } : false,
            newsClick: result3,
            newsData: newsResult[0],
            isCollected,
            commentList: commentResult,
            user_like_comments_ids,
            authorInfo: authorInfo[0],
            authorNewsCount: authorNewsCount[0]["count(*)"],
            authorFansCount: authorFansCount[0]["count(*)"],
            isFollow
        }
        console.log("--------------------------------", data.newsData);
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
        } else {    //取消收藏操作。。
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
        if (parent_id) {    //如果 parent_id 有值就设置这个属性。说明是回复
            commentObj.parent_id = parent_id;

            //如果有回复，查询父评论的内容 contrnt(info_comment),和父评论名（info_user）的昵称 nick_name
            var parentComment = await handleDB(res, "info_comment", "find", "数据库查询失败！", `id=${parent_id}`)
            var parentUserInfo = await handleDB(res, "info_user", "find", "数据库查询失败！", `id=${parentComment[0].user_id}`)
        }
        console.log("评论数据------------------------>>", commentObj)
        let insertResule = await handleDB(res, "info_comment", "insert", "数据库插入失败！", commentObj);
        // 5.返回成功的响应（传数据给前端到回调函数中，让其去拼接评论的信息。）
        // console.log("parentComment[0]:", parentComment[0])
        let data = {
            user: {
                avatar_url: userInfo[0].avatar_url?(constant.AVATAR_URL_PRE + userInfo[0].avatar_url):"/news/images/worm.jpg",
                nick_name: userInfo[0].nick_name
            },
            content: comment,
            create_time: commentObj.create_time,
            news_id,
            id: insertResule.insertId,
            parent: parent_id?{     //是否传有 parent_id
                user: {
                    nick_name: parentUserInfo[0].nick_name,
                },
                content: parentComment[0].content,
            }:null
        }
        // console.log("data----------------->>>", data);
        res.send({errno: "0", errmsg: "操作成功！", data})

    })();
})

//评论点赞功能。
router.post('/news_detail/comment_like', (req, res) => {
    (async () => {
        // 1.获取登录用户信息，没有就 return
        let userInfo = await common.getUser(req, res);
        if (!userInfo[0]) {
            res.send({erron: "4101", errmsg: "用户未登录！"});
            return
        }
        // 2.获取参数，判空
        let {comment_id, action} = req.body;
        if (!comment_id || !action) {
            res.send({errmsg: "参数错误！"})
            return
        }
        // 3.查询数据库 判断评论是否存在，不存在就 return （要确保 comment_id 是存在的）
        let commentResult = await handleDB(res, "info_comment", "find", "查询数据库出错！", `id=${comment_id}`);
        if (!commentResult[0]) {
            res.send({errmsg: "参数错误！"})
            return
        }
        // console.log("comment_id---------", comment_id, action);
        // 4.根据 action 的值，判断是点赞还是取消点赞。
        if (action === "add") {     //执行点赞操作。
            await handleDB(res, "info_comment_like", "insert", "数据库添加失败！", {
                user_id: userInfo[0].id,    //点赞的用户就是这个登录的用户。
                comment_id
            })

            var like_count = commentResult[0].like_count?commentResult[0].like_count+1:1;
        } else {    //取消点赞操作。。
            await handleDB(res, "info_comment_like", "delete", "数据库删除失败！", `user_id=${userInfo[0].id} and comment_id=${comment_id}`);

            var like_count = commentResult[0].like_count?commentResult[0].like_count-1:0;
        }
        //更新数据库 info_comment 里面的 like_count 字段。
        await handleDB(res, "info_comment", "update", "数据库更新失败！", `id=${comment_id}`,{like_count});

        // 5.返回操作成功
        res.send({errno: "0", errmsg: "操作成功！"})
    })();
})

//点击关注功能与点击取消关注。
router.post('/news_detail/followed_user', (req, res) => {
    (async () => {
        /*
        传参：用户：user_id ，还需要一个 action 来区分是收藏还是取消。 
        */
        //    业务流程
        // 1.获取登录用户信息，没有就 return
        let userInfo = await common.getUser(req, res);
        if (!userInfo[0]) {
            res.send({erron: "4101", errmsg: "用户未登录！"});
            return
        }
        // 2.获取参数，判空
        let {user_id, action} = req.body;
        if (!action || !user_id) {
            res.send({errmsg: "参数错误！"})
            return
        }
        // 3.查询数据库 判断是否存在，不存在就 return （要确保 user_id 是存在的）
        let userResult = await handleDB(res, "info_user", "find", "查询数据库出错！", `id=${user_id}`);
        if (!userResult[0]) {
            res.send({errmsg: "参数错误！"})
            return
        }
        // 4.根据 action 的值，判断是关注还是取消
        if (action === "follow") {     //执行关注操作。
            await handleDB(res, "info_user_fans", "insert", "数据库添加失败！", {
                follower_id: userInfo[0].id,
                followed_id: user_id
            })
        } else {    //取消关注操作。。
            await handleDB(res, "info_user_fans", "delete", "数据库删除失败！", `follower_id=${userInfo[0].id} and followed_id=${user_id}`);
        }
        // 5.返回操作成功
        res.send({errno: "0", errmsg: "操作成功！"})
    })();
})
module.exports = router