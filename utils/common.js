// 这里放一些公共的工具。。
const handleDB = require('../db/handleDB')

function csrfProtect(req, res, next){   //设置 token 防止csrf。。
    // 这里的代码什么时候执行？？
    // 在执行router下接口之前， 来执行这个函数里面的代码

    if(req.method === "GET"){ // 渲染转账页面的时候，同时在cookie中设置csrf_token
        //设置cookie和session
        let csrf_token = getRandomString(48);
        res.cookie('csrf_token', csrf_token); 

    }else if(req.method === "POST"){
        console.log(req.headers["x-csrftoken"]);
        console.log(req.cookies["csrf_token"]);

        if((req.headers["x-csrftoken"] === req.cookies["csrf_token"])){
            console.log("csrf验证通过！");
        }else{
            res.send("csrf验证不通过！");
            return
        }
    }

    next()
}


function getRandomString(n) {       //生成 csrf-token 的函数。。。
    var str = "";
    while (str.length < n) {
        str += Math.random().toString(36).substr(2);
    }
    return str.substr(str.length - n);
}


//获取用户信息函数。。
async function getUser(req, res) {
    //访问首页，处理右上角用户登录显示。根据用户登录状态信息。
    //从 session 中获取 user_id 
    let user_id = req.session["user_id"];
    let result = [];
    if (user_id) {  
        //如果已经获取到 user_id ,要确认这个 user_id 是有效的。
        //如果有效就要查询出数据，给到模板或前端。
        result = await handleDB(res, "info_user", "find", "查询数据库出错！", `id=${user_id}`);        
    }
    return result;        
}

//抛出404页面。
async function abort404(req, res) {
    let userInfo = await getUser(req, res);
    let data = {    //把用户信息传递到模板。。
        user_info: userInfo[0] ? {
            nick_name: userInfo[0].nick_name,
            avatar_url: userInfo[0].avatar_url
        } : false,
    }
    res.render('news/404', data);
}

module.exports = {
    csrfProtect,
    getUser,
    abort404
}