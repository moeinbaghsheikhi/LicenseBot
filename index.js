const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')
const dotenv = require('dotenv')
const env = dotenv.config().parsed

const bot = new Telegraf(env.BOT_TOKEN)

bot.start((ctx) => ctx.reply('Welcome'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))