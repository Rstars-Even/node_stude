const express = require('express');
const router = express.Router();
const Captcha = require('../utils/captcha');
const handleDB = require('../db/handleDB')
const md5 = require('md5');
const keys = require('../keys')


router.get("/passport/image_code/:float", (req, res) => {

    let captchaObj = new Captcha();
    let captcha = captchaObj.getCode();

    //captcha.text      图片验证码文本。。
    //captcha.data      图片验证码图片内容信息。。
    //保存图片验证码文本到 session 中,以便写注册接口时拿来使用。
    req.session["ImageCode"] = captcha.text;
    // console.log("req.session---------------->:", req.session);


    res.setHeader('Content-Type', 'image/svg+xml');     //需要加入类型信息。。
    res.send(captcha.data);
})

//注册账号接口。。
router.post('/passport/register', function(req, res) {
    console.log('/passport/register');

    (async function () {
        
        //1、获取 post 参数，做判空
        let {username, image_code, password, agree} = req.body;
        console.log(username, image_code, password, agree);
        if (!username || !password || !image_code || !agree) {
            res.json({errmsg: '缺少必传参数！'})
            return
        }
        //2、验证用户输入的图片验证码是否正确，拿用户填写的 image_code 和 session 中的 req.session["imageCode"] 进行对比。
        console.log(image_code, req.session["ImageCode"])
        if (image_code.toLowerCase() !== req.session["ImageCode"].toLowerCase()) {  //用 toLowerCase() 方法忽略大小写。
            res.send({errmsg: "验证码填写错误！"})
            return
        }
        //3、查询数据库，看看用户名是否已被注册
        let result = await handleDB(res, "info_user", "find", "数据库查询出错！", `username="${username}"`);
        console.log("result------------>", result);
        //如果没有这个用户 result 是一个空数组[]，
        
        //4、如果已存在就返回 return
        if (result[0]) {
            res.send({errmsg: "用户名已经注册！"});
            return
        }
        //5、如果不存在就往数据库中新增一条记录
        let result2 = await handleDB(res, "info_user", "insert", "数据库插入出错！", {
            username,
            password_hash: md5(md5(password)+keys.password_salt),
            nick_name: username,
            last_login: new Date().toLocaleString(),
        })
        console.log("result2--------------------->>", result2.insertId);
        // result2.insertId; 插入数据时，自动生成这个 id 值。

        //6、保持用户的登入状态
        req.session["user_id"] = result2.insertId;
        //7、返回用户注册成功给到前端
        res.send({errno:"0", errmsg: "注册成功！"})
    })();
})

router.post('/passport/login', (req, res) => {  //用户登录接口。。

    (async () => {

        // 1、获取 post 请求参数，判空
        let {username, password} = req.body;
        if (!username || !password) {
            res.json({errmsg: "缺少必传参数！"})
            return
        }
        //2、查询数据库，验证用户名是不是已经注册。
        let result = await handleDB(res, "info_user", "find", "数据库查询出错！", `username="${username}"`);
        // 3、如果没有注册，返回用户名未注册，return。
        if (!result[0]) {
            res.send({errmsg: "用户名未注册！"})
            return
        }
        console.log("用户查询结果：", result);

        //4、校验 密码是不是正确？
        if (md5(md5(password)+keys.password_salt) !== result[0].password_hash) {
            res.send({errmsg: "用户名或密码错误！"})
            return
        }
        //5、保持用户登录状态。
        req.session["user_id"] = result[0].id;

        //设置最后一次登录时间 last_login 字段。。本质是在修改字段
        await handleDB(res, "info_user", "update", "数据库修改出错！", `id=${result[0].id}`, {last_login: new Date().toLocaleString()})

        //6、返回登录状态给前端。。
        res.send({errno: "0", errmsg: "登录成功！"})


    })();
})

router.post('/passport/logout', function(req, res) {    //退出登录接口。。
    //退出登录实际上就是删除 session 中的 user_id 
    delete req.session["user_id"];
    res.send({errmsg: '退出登录成功！'})
})
    
module.exports = router;