const { Telegraf, Markup } = require('telegraf')
const { message } = require('telegraf/filters')
const dotenv = require('dotenv')
const knex = require("./config/db")
const env = dotenv.config().parsed

const bot = new Telegraf(env.BOT_TOKEN)

// redis
const redis = require('redis');
const client = redis.createClient();
client.connect();

// channels 
const rqeuiredChannels = ["@dsfsdfadscxc"]

async function checkUserMembership(ctx){
    const userId = ctx.message.from.id
    let isMember = true

    for(const channel of rqeuiredChannels){
        const member = await ctx.telegram.getChatMember(channel, userId)
        if(member.status == "left" || member.status == "kicked"){
            isMember = false
            break;
        }
    }

    return isMember
}

bot.use(async (ctx, next) => {
    const isMember = await checkUserMembership(ctx)
    
    if(isMember) return next()
    else {
        ctx.reply(`برای استفاده از این ربات ابتدا باید توی کانال های زیر عضو بشی: \n\n @dsfsdfadscxc`)
    }
})

bot.start(async(ctx) => {
    const chatId = ctx.chat.id
    const name   = ctx.chat.first_name

    // register user
    const hasUser = await knex("users").where({ chat_id: chatId }).first()
    if(!hasUser)    await knex("users").insert({ chat_id: chatId, name })

    // send welcome message
    ctx.reply("سلام به ربات لایسنس خوش اومدی:)",
        Markup.inlineKeyboard([
            [
                Markup.button.callback("خرید لایسنس", "shop")
            ]
        ])
    )
})

bot.command("admin", async(ctx) => {
    const chatId = ctx.chat.id

    const user = await knex("users").where({ chat_id: chatId, role: "admin" }).first()
    if(user){
        const createAdmin = client.set(`admin:${chatId}`, "verify", { EX: 30 })
        ctx.reply("با موفقیت وارد شدید✅ \n لطفا پسورد خود را وارد کنید: (30 ثانیه)")
    }
}) 

bot.on("text", async(ctx) => {
    const chatId = ctx.update.message.chat.id
    const message = ctx.update.message.text

    // get message is password
    const isPassword = await client.get(`admin:${chatId}`)
    const isAdmin =    await client.get(`admin:login:${chatId}`)

    if(isPassword){
        const validatePassword = await knex("admin_passwords").where({ password: message }).first()
        if(validatePassword){
            client.set(`admin:login:${chatId}`, "true", { EX: 604800 })
            ctx.reply("با موفقیت وارد شدی🚀")
            client.del(`admin:${chatId}`)
        }
        else ctx.reply("پسورد وارد شده صحیح نیست ⛔")
    }else if(isAdmin){
        const addNewLicense = await knex("licenses").insert({ license_key: message })
        ctx.reply("لایسنس جدید اضافه شد➕✅")
    }
})

bot.action("shop", async(ctx) => {
    const getRandomLicense = await knex("licenses").where({ status: "set" }).orderByRaw("RAND()").first()
    
    if(getRandomLicense){
        ctx.reply("لایسنس شما با موفقیت دریافت شد: \n " + getRandomLicense.license_key)
        const updateLicense = await knex("licenses").where({ id: getRandomLicense.id }).update({ status: "use" })
    } else ctx.reply("لایسنسی وجود ندار. تا شارژ مجدد لایسنس ها صبر کنید")
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', ()  => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))