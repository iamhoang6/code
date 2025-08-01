const transactionModel = require("../models/transactions.model");
const userModel = require("../models/user.model");
const settingsModel = require("../models/settings.model");
const moment = require("moment");
const ShortUniqueId = require('short-unique-id');
const { Telegraf, Markup } = require('telegraf');
const bot = new Telegraf(process.env.TELE_BOT_TOKEN);

const GROUP_ID = process.env.TELE_GROUP_ID;

// --- Bot actions remain unchanged ---

bot.action('action_one', async (ctx) => {
    let checkLatest = await transactionModel.findOne({ status: "pending" }, {}, { sort: { _id: -1 } });
    if (checkLatest) {
        await transactionModel.findOneAndUpdate({ _id: checkLatest._id }, { result: "up" });
    }
    await ctx.answerCbQuery();
    await ctx.reply("Thành công : Lên !");
});

bot.action('action_two', async (ctx) => {
    let checkLatest = await transactionModel.findOne({ status: "pending" }, {}, { sort: { _id: -1 } });
    if (checkLatest) {
        await transactionModel.findOneAndUpdate({ _id: checkLatest._id }, { result: "down" });
    }
    await ctx.answerCbQuery();
    await ctx.reply("Thành công : Xuống !");
});

bot.action('action_three', async (ctx) => {
    let checkLatest = await transactionModel.findOne({ status: "pending" }, {}, { sort: { _id: -1 } });
    if (checkLatest) {
        await transactionModel.findOneAndUpdate({ _id: checkLatest._id }, { result: "sideway" });
    }
    await ctx.answerCbQuery();
    await ctx.reply("Thành công: Bỏ qua !");
});


const { randomUUID } = new ShortUniqueId({ length: 10 });

// --- OPTIMIZATION & FIXES START HERE ---

let isCreatingNew = false;
let isHandlingOld = false;
let isRemoving = false;

async function createNew() {
    if (isCreatingNew) {
        return;
    }
    isCreatingNew = true;

    try {
        const setting = await settingsModel.findOne();
        // Exit if settings are not configured
        if (!setting) {
            console.error("Settings not found. Halting transaction creation.");
            isCreatingNew = false; // Release lock
            return;
        }
        
        const pendingTransaction = await transactionModel.findOne({ status: "pending" });

        if (pendingTransaction) {
            // SCENARIO 1: A pending transaction exists. Check if it's time to process it.
            const dateNow = moment();
            if (moment(pendingTransaction.dateStart).isBefore(dateNow)) {
                await transactionModel.findOneAndUpdate({
                    _id: pendingTransaction._id
                }, {
                    status: "providedToUser",
                    result: (pendingTransaction.result === "") ? "sideway" : pendingTransaction.result
                });
            }
        } else {
            // SCENARIO 2: No pending transaction. Create the next one in the sequence.
            const lastTransaction = await transactionModel.findOne({}, {}, { sort: { _id: -1 } });
            
            let newDateStart;
            const timePerRound = setting.timePerRound || 30;
            const timeAdd = setting.timeAdd || 0;


            if (lastTransaction) {
                // Base the next start time on the previous transaction's start time.
                newDateStart = moment(lastTransaction.dateStart).add(timePerRound, 'seconds');
            } else {
                // First ever run. Schedule the first transaction to start safely in the future.
                // This avoids the startOf('minute') bug entirely.
                newDateStart = moment().startOf('minute').add(timeAdd + 60, 'seconds'); // Start in 5 seconds
            }
            
            // CATCH-UP: If server was off, the calculated start time might be in the past.
            // If so, reschedule it to start safely in the future to prevent an instant loop.
            if (newDateStart.isBefore(moment())) {
                 newDateStart = moment().startOf('minute').add(timeAdd + 60, 'seconds');
            }

            // We use the original logic for dateEnd relative to the NEW dateStart
            const newDateEnd = newDateStart.clone().add(timePerRound, 'seconds');
            
            const shortId = randomUUID();
            const randomResult = ["up", "down", "sideway"][Math.floor(Math.random() * 3)];

            const create = await transactionModel.create({
                shortId,
                result: (setting.auto) ? randomResult : "",
                auto: setting.auto,
                status: "pending",
                // Use the new, safely calculated start and end times
                dateStart: newDateStart.toDate(),
                dateEnd: newDateEnd.toDate(),
            });

            if (create && !setting.auto) {
                try {
                    await bot.telegram.sendMessage(
                        GROUP_ID,
                        'Phiên tiếp theo : ' + shortId + ', hãy đặt kết quả :',
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
        }
    } catch (error) {
        console.error("Error in createNew:", error);
    } finally {
        isCreatingNew = false;
    }
}

async function handleOldTransaction() {
    if (isHandlingOld) {
        return;
    }
    isHandlingOld = true;

    try {
        const checkLatest = await transactionModel.findOne({
            status: "providedToUser"
        }, {}, { sort: { _id: -1 } });

        const dateNow = moment();

        if (checkLatest && moment(checkLatest.dateEnd).isBefore(dateNow)) {
            await transactionModel.findOneAndUpdate({
                _id: checkLatest._id
            }, {
                status: "success"
            });
        }
    } catch (error) {
        console.error("Error in handleOldTransaction:", error);
    } finally {
        isHandlingOld = false;
    }
}

async function handleRemove() {
    if (isRemoving) {
        return;
    }
    isRemoving = true;

    try {
        await transactionModel.deleteMany({
            status: "success",
            createdAt: { $lt: moment().subtract(1, 'days').startOf('day').toDate() }
        });
    } catch (error) {
        console.error("Error in handleRemove:", error);
    } finally {
        isRemoving = false;
    }
}

async function cronAuto() {
    setInterval(createNew, 500);
    setInterval(handleOldTransaction, 1000);
    setInterval(handleRemove, 100000);

    bot.launch().then(() => {
        console.log('Bot started');
    });

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = {
    cronAuto
}
