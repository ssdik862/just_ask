import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { code } from 'telegraf/format';
import config from 'config';
import { ogg } from './ogg.js';
import { openai } from './openai.js';

console.log(config.get('TEST_ENV'));

const INITIAL_SESSION = {
    messages: [],
}

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

bot.use(session());

bot.command('new', async (ctx) => {
    ctx.session = INITIAL_SESSION;
    await ctx.reply(JSON.stringify('start... await voise or text message'));
});

bot.command('start', async (ctx) => {
    ctx.session = INITIAL_SESSION;
    await ctx.reply(JSON.stringify('start... await voise or text message'));
});

bot.on(message('text'), async (ctx) => {
    if (ctx.session === null || ctx.session === undefined) {
        ctx.session = INITIAL_SESSION;
    }
    try {
        await ctx.reply(code(`Ваш зарпос: ${ctx.message.text}`));
        await ctx.reply(code('I got it. waiting for server response'));
        ctx.session.messages.push({
            role: openai.roles.USER,
            content: ctx.message.text
        });

        const response = await openai.chat(ctx.session.messages);

        ctx.session.messages.push({
            role: openai.roles.ASSISTANT,
            content: response.content,
        });

        await ctx.reply(response.content);

    } catch (error) {
        console.log('text message error', error.message);
    }
})



bot.on(message('voice'), async (ctx) => {
    // ctx.session ==  true ?? INITIAL_SESSION;
    if (ctx.session === null || ctx.session === undefined) {
        ctx.session = INITIAL_SESSION;
    }
    try {
        await ctx.reply(code('I got it. waiting for server response'));
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userId = String(ctx.message.from.id);
        console.log('userId',userId);
        console.log('link', link.href);
        const oggPath = await ogg.create(link.href, userId);
        const mp3Path = await ogg.toMp3(oggPath, userId);

        const text = await openai.transcription(mp3Path);
        ctx.session.messages.push({
            role: openai.roles.USER,
            content: text
        });

        const response = await openai.chat(ctx.session.messages);

        ctx.session.messages.push({
            role: openai.roles.ASSISTANT,
            content: response.content,
        });

        await ctx.reply(code(`Ваш зарпос: ${text}`));
        await ctx.reply(response.content);

        // await ctx.reply(text);
        // await ctx.reply(mp3Path);
        // await ctx.reply(JSON.stringify(link, null, 2))
    } catch (error) {
        console.log('voice message error', error.message);
    }
    // await ctx.reply(JSON.stringify(ctx.message.voice, null, 2));
})



bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log("hello...!!!");