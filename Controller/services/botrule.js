//爬站规则

const Models = require("./../../Core/OTO/Models");

const Server = require("./../../Core/Server");
const ApiResponse = require("./../../Entity/ApiResponse");


module.exports = () => ({
    /**
     * @swagger
     * /services/botrule:
     *   post:
     *     tags:
     *       - Services - BotRule —— 系统服务：机器人爬网规则
     *     summary: 创建一套用于爬站的规则
     *     description: 根据提供的信息保存爬站的规则
     *     parameters:
     *       - in: body
     *         name: rule
     *         description: 站点规则
     *         schema:
     *           type: array
     *           items:
     *             type: object
     *             required:
     *               - host
     *               - ruleName
     *               - selector
     *             properties:
     *               host:
     *                 type: string
     *               ruleName:
     *                 type: string
     *                 enum:
     *                   - BookName
     *                   - ChapterList
     *                   - CapterTitle
     *                   - Content
     *                   - IndexNextPage
     *                   - ContentNextPage
     *               selector:
     *                 type: string
     *               removeSelector:
     *                 type: array
     *                 items:
     *                   type: string
     *               getContentAction:
     *                 type: string
     *               getUrlAction:
     *                 type: string
     *               type:
     *                 type: string
     *                 default: Object
     *                 enum:
     *                   - Object
     *                   - List
     *               checkSetting:
     *                 type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post ": async (ctx) => {
        let param = await Server.parseJsonFromBodyData(ctx, ["host", "ruleName", "selector"]);
        if (param == null) return;

        let host = "";
        let hostCheck = new Set();
        for (let p of param) {
            host = p.host;
            hostCheck.add(p.host);
        }
        if (hostCheck.size != 1) {
            ctx.body = new ApiResponse({ code: 50000, msg: "发现多套网站的规则，每次更新只能同一套网站。" }).getJSONString();
            return;
        }

        //全套规则删除并更新
        const myModels = new Models();
        let rules = await myModels.RuleForWeb.findAll({
            where: {
                Host: host
            }
        });
        for (let r of rules) r.destroy();

        for (let p of param) {
            let rule = {
                Host: p.host,
                RuleName: p.ruleName,
                Selector: p.selector
            }
            if (Array.isArray(p.removeSelector) && p.removeSelector.length > 0) {
                rule.RemoveSelector = p.removeSelector.join(",");
            }
            if (p.getContentAction) rule.GetContentAction = p.getContentAction;
            if (p.getUrlAction) rule.GetUrlAction = p.getUrlAction;
            if (p.type == "Object" || p.type == "List") rule.Type = p.type;
            if (p.checkSetting) rule.CheckSetting = p.checkSetting;

            let ret = await myModels.RuleForWeb.create(rule);
        }

        ctx.body = new ApiResponse().getJSONString();

    },

    /**
     * @swagger
     * /services/botrule:
     *   get:
     *     tags:
     *       - Services - BotRule —— 系统服务：机器人爬网规则
     *     summary: 拿到指定站点的规则
     *     description: 拿到指定站点的规则——给UI用于展示
     *     parameters:
     *     - name: host
     *       in: query
     *       required: true
     *       description: 站点的host标识
     *       schema:
     *         type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "get ": async (ctx) => {
        let host = ctx.query.host;

        const myModels = new Models();
        let rules = await myModels.RuleForWeb.findAll({
            where: {
                Host: host
            }
        });
        let rsl = [];

        for (let r of rules) {
            let {
                Host: host,
                RuleName: ruleName,
                Selector: selector,
                GetContentAction: getContentAction,
                GetUrlAction: getUrlAction,
                CheckSetting: checkSetting,
                Type: type
            } = r.dataValues;
            let temp = {
                host,
                ruleName,
                selector,
                type,
                getContentAction,
                getUrlAction,
                checkSetting,
            }
            if (r.RemoveSelector) temp.removeSelector = r.RemoveSelector.split(",");
            rsl.push(temp)
        }
        ctx.body = new ApiResponse(rsl).getJSONString();
    },
    /**
     * @swagger
     * /services/botrule:
     *   delete:
     *     tags:
     *       - Services - BotRule —— 系统服务：机器人爬网规则
     *     summary: 删除指定站点的规则
     *     description: 删除指定站点的规则
     *     parameters:
     *     - name: host
     *       in: query
     *       required: true
     *       description: 站点的host标识
     *       schema:
     *         type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "delete ": async (ctx) => {
        let host = ctx.query.host;

        const myModels = new Models();
        let rules = await myModels.RuleForWeb.findAll({
            where: {
                Host: host
            }
        });

        for (let r of rules) r.destroy();

        ctx.body = new ApiResponse().getJSONString();
    },

    /**
     * @swagger
     * /services/botrule/hostlist:
     *   get:
     *     tags:
     *       - Services - BotRule —— 系统服务：机器人爬网规则
     *     summary: 拿到已配置规则的站点列表
     *     description: 拿到已配置规则的站点的列表
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "get /hostlist": async (ctx) => {
        const myModels = new Models();
        let rules = await myModels.RuleForWeb.findAll();
        let tempHost = new Set();
        for (let r of rules) {
            tempHost.add(r.Host)
        }
        ctx.body = new ApiResponse(Array.from(tempHost)).getJSONString();
    },
});