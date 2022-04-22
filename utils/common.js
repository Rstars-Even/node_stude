// 这里放一些公共的工具。。

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

module.exports = {
    csrfProtect
}