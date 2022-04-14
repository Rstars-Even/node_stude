const db = require('./nodejs-rom')

async function handleDB(res, tableName, methodName, errMsg, n1, n2) {
    let Model = db.model(tableName);
    let result;
    //如果查询成功：result 接收 data。
    //如果查询失败：result 接收 err。
    try {
        result = await new Promise((resolve, reject) => {
            if (!n1) {
                //没有传n1
                Model[methodName]((err, data) => {
                    if(err)reject(err);
                    resolve(data);
                })
                return;
            }

            if (!n2) {
                //没有传n2
                Model[methodName](n1, (err, data) => {
                    if (err)reject(err);
                    resolve(data);
                })
                return;
            }


            Model[methodName](n1, n2, (err, data) => {
                if (err)reject(err);
                resolve(data);
            })
        })

    } catch (err) {
        console.log(err);
        res.send(errMsg, err);
        return
    }

    return result;
}

module.exports = handleDB