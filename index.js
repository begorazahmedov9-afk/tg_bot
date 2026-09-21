require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const ytSearch = require('yt-search');
const ytdl = require('@distube/ytdl-core');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Boshlang'ich rasm havolasi (Musiqa tematikasida)
const WELCOME_IMAGE = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop';

// /start buyrug'i - Kirish qismi
bot.start(async (ctx) => {
  const firstName = ctx.from.first_name || 'Foydalanuvchi';
  
  const captionText = 
    `Assalomu alaykum, <b>${firstName}</b>! 👋\n\n` +
    `🎵 <b>NavoSearch1_bot</b> — tezkor va qulay musiqa qidiruv botiga xush kelibsiz!\n\n` +
    `Botdan foydalanish uchun pastdagi <b>"🎵 Musiqa qidirish"</b> tugmasini bosing yoki to'g'ridan-to'g'ri qo'shiq nomini yozib yuboring.`;

  try {
    await ctx.replyWithPhoto(WELCOME_IMAGE, {
      caption: captionText,
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🎵 Musiqa qidirish', 'start_search')],
        [Markup.button.url('📣 Rasmiy Kanal', 'https://t.me/telegram')]
      ])
    });
  } catch (err) {
    // Agar rasm yuklanmay qolsa, faqat matn yuboriladi
    await ctx.replyWithHTML(captionText, Markup.inlineKeyboard([
      [Markup.button.callback('🎵 Musiqa qidirish', 'start_search')]
    ]));
  }
});

// "Musiqa qidirish" tugmasi bosilganda
bot.action('start_search', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('🔍 **Musiqa nomini yoki xonanda ismini yuboring:**\n\n_Masalan: Janob Rasul - Anora_', { parse_mode: 'Markdown' });
});

// Musiqa qidiruv mantigi
bot.on('text', async (ctx) => {
  const query = ctx.message.text;

  // Agar buyruq bo'lsa e'tiborsiz qoldirish
  if (query.startsWith('/')) return;

  const waitMsg = await ctx.reply(`🔎 "<b>${query}</b>" bo'yicha musiqa qidirilmoqda...`, { parse_mode: 'HTML' });

  try {
    const r = await ytSearch(query);
    const videos = r.videos.slice(0, 5);

    if (!videos.length) {
      return ctx.telegram.editMessageText(
        ctx.chat.id,
        waitMsg.message_id,
        null,
        '❌ **Hech narsa topilmadi.** Qo\'shiq nomini aniqroq yozib qayta urinib ko\'ring.',
        { parse_mode: 'Markdown' }
      );
    }

    const buttons = videos.map((v) => [
      Markup.button.callback(`🎵 ${v.title.slice(0, 32)}... (${v.timestamp})`, `play_${v.videoId}`)
    ]);

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      waitMsg.message_id,
      null,
      `🎧 <b>Topilgan natijalar ("${query}"):</b>\nPastdagi tugmalardan birini bosing:`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(buttons)
      }
    );
  } catch (error) {
    console.error(error);
    ctx.reply('⚠️ Qidiruv jarayonida xatolik yuz berdi. Qaytadan urinib ko\'ring.');
  }
});

// MP3 Faylni yuklab yuborish
bot.action(/^play_(.+)$/, async (ctx) => {
  const videoId = ctx.match[1];
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  await ctx.answerCbQuery('📥 Musiqa yuklanmoqda, ozgina kuting...');

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;

    const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });

    await ctx.replyWithAudio(
      { source: stream, filename: `${title}.mp3` },
      { title: title, caption: '🎧 @NavoSearch1_bot orqali yuklab olindi' }
    );
  } catch (error) {
    console.error(error);
    ctx.reply(`🎧 **Musiqa havolasi:**\n${url}\n\n_(To'g'ridan-to'g'ri tinglashingiz mumkin)_`, { parse_mode: 'Markdown' });
  }
});

// Botni ishga tushirish
bot.launch().then(() => {
  console.log('NavoSearch1_bot mukammal rejimda ishlamoqda!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));