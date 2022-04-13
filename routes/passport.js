
const express = require('express');
const router = express.Router();

router.get("/passport", (req, res) => {
    res.send("这是验证码接口！！！")

})

module.exports = router;