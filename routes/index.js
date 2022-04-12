const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
    //测试设置 cookie 和 session
    res.cookie("name", "这个参数 cookieParser 的内容。");
    req.session["age"] = 11

    res.render("news/index");
})

module.exports = router;