const transactionModel = require("../models/transactions.model");
const userModel = require("../models/user.model");
const settingsModel = require("../models/settings.model");
const moment = require("moment");
const ShortUniqueId = require('short-unique-id');
const { Telegraf, Markup } = require('telegraf');
const bot = new Telegraf(process.env.TELE_BOT_TOKEN);

const GROUP_ID = process.env.TELE_GROUP_ID;

// --- Bot actions remain unchanged ---

// Define the action for the first button
bot.action('action_one', async (ctx) => {
    let checkLatest = await transactionModel.findOne({ status: "pending" }, {}, { sort: { _id: -1 } });
    if (checkLatest) {
        await transactionModel.findOneAndUpdate({ _id: checkLatest._id }, { result: "up" });
    }
    await ctx.answerCbQuery();
    await ctx.reply("Thành công : Lên !");
});

// Define the action for the second button
bot.action('action_two', async (ctx) => {
    let checkLatest = await transactionModel.findOne({ status: "pending" }, {}, { sort: { _id: -1 } });
    if (checkLatest) {
        await transactionModel.findOneAndUpdate({ _id: checkLatest._id }, { result: "down" });
    }
    await ctx.answerCbQuery();
    await ctx.reply("Thành công : Xuống !");
});

// Define the action for the third button
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

// Locks to prevent race conditions. Each function gets its own lock.
let isCreatingNew = false;
let isHandlingOld = false;
let isRemoving = false;

/**
 * This function is now refactored to handle two separate cases to prevent flooding.
 * 1. If a 'pending' transaction exists, it only checks if it's time to update its status.
 * 2. If NO 'pending' transaction exists, it creates a new one.
 */
async function createNew() {
    // Use a lock to prevent this function from running multiple times simultaneously
    if (isCreatingNew) {
        return;
    }
    isCreatingNew = true;

    try {
        const setting = await settingsModel.findOne();
        const pendingTransaction = await transactionModel.findOne({ status: "pending" });

        if (pendingTransaction) {
            // SCENARIO 1: A pending transaction exists. We only check if it's time to update it.
            const dateNow = moment();
            if (moment(pendingTransaction.dateStart).isBefore(dateNow)) {
                // The time has come to provide the result. Update status and exit.
                // The next run of the cron will see no pending transaction and create a new one.
                await transactionModel.findOneAndUpdate({
                    _id: pendingTransaction._id
                }, {
                    status: "providedToUser",
                    result: (pendingTransaction.result === "") ? "sideway" : pendingTransaction.result
                });
            }
        } else {
            // SCENARIO 2: No pending transaction found. We create a new one.
            const shortId = randomUUID();
            const randomResult = ["up", "down", "sideway"][Math.floor(Math.random() * 3)];

            // NOTE: This timing logic is preserved from your original code.
            const dateStart = moment().startOf('minute').add((setting?.timePerRound || 30) + (setting?.timeAdd || 0), "seconds");
            const dateEnd = moment().startOf('minute').add(((setting?.timePerRound || 30) * 2) + (setting?.timeAdd || 0), "seconds");

            const create = await transactionModel.create({
                shortId,
                result: (setting?.auto) ? randomResult : "",
                auto: setting?.auto,
                status: "pending",
                dateStart: dateStart,
                dateEnd: dateEnd,
            });

            if (create && !setting?.auto) {
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
        // IMPORTANT: Always release the lock when the function is done.
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
    // The intervals are still aggressive, but the locks will prevent any flooding.
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
