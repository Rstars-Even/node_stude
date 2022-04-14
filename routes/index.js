const express = require('express');
const router = express.Router();
const handleDB = require('../db/handleDB')


router.get('/', (req, res) => {
    //测试设置 cookie 和 session
    res.cookie("name", "这个参数 cookieParser 的内容。");
    req.session["age"] = 11
    console.log("...");
    res.render("news/index");
})

router.get("/get_data", (req, res) => {
    //测试数据库模块。。
    (async () => {
        let result = await handleDB(res, "info_category", "find", "数据库查询出错了！");
        console.log("查询数据-----------》》》", result)
        res.send(result);
    })();
})

module.exports = router;