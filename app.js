//入口文件。。
const express = require('express');
const app = express();

// const appConfig = require('./config');
// appConfig(app);     //以函数的方式调用。。

const AppConfig = require('./config');
//以面向对象的方式调用。。推荐使用。
let appConfig = new AppConfig(app);

// const AppConfig = require('./config');
// let appConfig = new AppConfig(app);     //以面向对象的方式调用。。用类的函数调用。。
// appConfig.run();


app.listen(appConfig.listenPort, function () {
    console.log("node 项目启动成功！！！")
})