//与服务器相关的通用方法都放这
const fs = require("fs");
const path = require("path");

/**
 * 处理通过body传递的参数
 * @param {*} ctx 
 * @returns 
 */
function parseBodyData(ctx) {
    return new Promise((resolve, reject) => {
        try {
            let postData = ''
            ctx.req.addListener('data', (data) => {
                postData += data
            })
            ctx.req.on('end', () => {
                resolve(postData)
            })

        } catch (err) {
            reject(err)
        }
    })
}

/**
 * 从请求解释出json，检测必要的参数
 * @param {*} ctx 
 * @param {Array} requireCheck 
 * @returns 解释后的结果
 */
async function parseJsonFromBodyData(ctx, requireCheck = []) {
    let bodyStr = await parseBodyData(ctx);
    let param = null;
    try {
        param = JSON.parse(bodyStr);

        if (!requireCheck || requireCheck.length == 0) return param;

        //检查必填
        const pmCheck = (param) => {
            for (let p of requireCheck) {
                if (typeof (param[p]) === "undefined") {
                    let msg = "参数错误。缺少必要参数：" + p;
                    ctx.body = msg;
                    throw (msg);
                }
            }
        }
        if (Array.isArray(param)) {
            for (let p of param) pmCheck(p);
        } else {
            pmCheck(param);
        }
    } catch (err) {
        ctx.status = 600;
        ctx.body = JSON.stringify({ ret: 1, err: err.message });
        return null;
    }
    return param;
}

/**
 * 递归-创建目录
 * @param {*} dir 多层目录
 * @returns 
 */
function MkPath(dir) {
    if (fs.existsSync(dir)) {
        return true;
    } else {
        if (MkPath(path.dirname(dir))) {
            fs.mkdirSync(dir);
            return true;
        }
    }
}

module.exports = {
    MkPath: MkPath,
    parseBodyData: parseBodyData,
    parseJsonFromBodyData: parseJsonFromBodyData
}