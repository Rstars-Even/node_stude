#下载依赖
npm i

#node 版本
v10.15.0

#项目启动
1.检查系统数据库服务是否启动。。
   1.启动数据库：net start mysql

    2.关闭数据库：net stop mysql

    3.进入数据库个人用户：mysql -u root -p ---->输入密码：

    4.退出当前数据库管理系统：quit

    5.显示当前所有数据库：show databases

2.把文件夹下 nodejs-orm 中的 sql 文件放到数据库中执行建表。

3.node app.js

4.打开：http://localhost:3003/
