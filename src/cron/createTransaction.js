const transactionModel = require("../models/transactions.model")
const userModel = require("../models/user.model")
const settingsModel = require("../models/settings.model")
const moment = require("moment")
const ShortUniqueId = require('short-unique-id');
const { Telegraf, Markup } = require('telegraf');
const bot = new Telegraf(process.env.TELE_BOT_TOKEN);

const GROUP_ID = process.env.TELE_GROUP_ID;

// Define the action for the first button
bot.action('action_one', async (ctx) => {

    let checkLatest = await transactionModel.findOne({
        status: "pending"
    }, {}, { sort: { _id: -1 } })

    if (checkLatest) {
        let update = await transactionModel.findOneAndUpdate({
            _id: checkLatest?._id
        }, {
            result: "up"
        })
    }

    await ctx.answerCbQuery();
    await ctx.reply("Thành công : Lên !")

});

// Define the action for the second button
bot.action('action_two', async (ctx) => {

    let checkLatest = await transactionModel.findOne({
        status: "pending"
    }, {}, { sort: { _id: -1 } })

    if (checkLatest) {
        let update = await transactionModel.findOneAndUpdate({
            _id: checkLatest?._id
        }, {
            result: "down"
        })
    }
    await ctx.answerCbQuery();
    await ctx.reply("Thành công : Xuống !")

});

bot.action('action_three', async (ctx) => {

    let checkLatest = await transactionModel.findOne({
        status: "pending"
    }, {}, { sort: { _id: -1 } })

    if (checkLatest) {
        let update = await transactionModel.findOneAndUpdate({
            _id: checkLatest?._id
        }, {
            result: "sideway"
        })
    }
    await ctx.answerCbQuery();
    await ctx.reply("Thành công: Bỏ qua !")

});

const { randomUUID } = new ShortUniqueId({ length: 10 });

async function createNew () {

    let setting = await settingsModel.findOne()

    let checkLatest = await transactionModel.findOne({
        status: "pending"
    }, {}, { sort: { _id: -1 } })

    let dateNow = moment()

    if (!checkLatest || checkLatest?.dateStart < dateNow) {

        if (checkLatest) {
            let updateOldTransaction = await transactionModel.findOneAndUpdate({
                _id: checkLatest?._id
            }, {
                status: "providedToUser",
                result: (checkLatest?.result === "") ? "sideway" : checkLatest?.result
            })
        }

        let shortId = randomUUID()

        let randomResult = ["up", "down", "sideway"][Math.floor(Math.random() * ["up", "down", "sideway"].length)]

        let create = await transactionModel.create({
            shortId,
            result: (setting?.auto) ? randomResult : "",
            auto: setting?.auto,
            status: "pending",
            dateStart: moment().startOf('minute').add((setting?.timePerRound) + 20, "seconds"),
            dateEnd: moment().startOf('minute').add((setting?.timePerRound * 2) + 20, "seconds"),
        })

        if (!setting?.auto) {
            try {
                await bot.telegram.sendMessage(
                  GROUP_ID,
                  'Phiên tiếp theo : '+shortId+', hãy đặt kết quả :',
                  Markup.inlineKeyboard([
                    Markup.button.callback('Lên', 'action_one'),
                    Markup.button.callback('Xuống', 'action_two'),
                    Markup.button.callback('Bỏ qua', 'action_three')
                  ]).resize()
                );
              } catch (error) {
                console.error('Failed to send message to group:', error);
              }
        }

        

        if (create) return true



    }


}

async function handleOldTransaction () {

    let setting = await settingsModel.findOne()

    let checkLatest = await transactionModel.findOne({
        status: "providedToUser"
    }, {}, { sort: { _id: -1 } })

    let dateNow = moment()

    if (checkLatest && checkLatest["dateEnd"] < dateNow) {

        let updateOldTransaction = await transactionModel.findOneAndUpdate({
            _id: checkLatest?._id
        }, {
            status: "success"
        })

    }

}

async function handleRemove () {

    let setting = await settingsModel.findOne()

    let checkLatest = await transactionModel.deleteMany({
        status: "success",
        createdAt: { $lt: moment().subtract(1, 'days').startOf('day').toDate() }
    })

    

}

async function cronAuto () {

    setInterval(createNew, 500)
    setInterval(handleOldTransaction, 1000)
    setInterval(handleRemove, 100000)

    bot.launch().then(() => {
        console.log('Bot started and message sent to group');
    });

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

}

module.exports = {
    cronAuto
}
