const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')
const dotenv = require('dotenv')
const knex = require("./config/db")
const env = dotenv.config().parsed

const bot = new Telegraf(env.BOT_TOKEN)

// redis
const redis = require('redis');
const client = redis.createClient();
client.connect();

bot.start(async(ctx) => {
    const chatId = ctx.chat.id
    const name   = ctx.chat.first_name

    // register user
    const hasUser = await knex("users").where({ chat_id: chatId }).first()
    if(!hasUser)    await knex("users").insert({ chat_id: chatId, name })

    // send welcome message
    ctx.reply("سلام به ربات لایسنس خوش اومدی:)")
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

bot.launch()

// Enable graceful stop
process.once('SIGINT', ()  => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))