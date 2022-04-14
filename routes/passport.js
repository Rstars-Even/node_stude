
const express = require('express');
const router = express.Router();
const Captcha = require('../utils/captcha');

router.get("/passport/image_code/:float", (req, res) => {

    let captchaObj = new Captcha();
    let captcha = captchaObj.getCode();

    //captcha.text      图片验证码文本。。
    //captcha.data      图片验证码图片内容信息。。
    res.setHeader('Content-Type', 'image/svg+xml');     //需要加入类型信息。。
    res.send(captcha.data);

})

module.exports = router;