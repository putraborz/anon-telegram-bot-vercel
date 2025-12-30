import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN);

let waiting = [];
let pairs = {};
let settings = {};

function getSettings(id) {
  if (!settings[id]) settings[id] = { gender: "Any", looking: "Any" };
  return settings[id];
}

function matchUsers(userId) {
  const userSet = getSettings(userId);

  for (let i = 0; i < waiting.length; i++) {
    const otherId = waiting[i];
    const otherSet = getSettings(otherId);

    if (
      (userSet.looking === "Any" || userSet.looking === otherSet.gender) &&
      (otherSet.looking === "Any" || otherSet.looking === userSet.gender)
    ) {
      waiting.splice(i, 1);
      pairs[userId] = otherId;
      pairs[otherId] = userId;

      bot.telegram.sendMessage(userId, "✅ Partner ditemukan!");
      bot.telegram.sendMessage(otherId, "✅ Partner ditemukan!");
      return true;
    }
  }
  return false;
}

bot.start(ctx => {
  ctx.reply(
    "🤖 Anonymous Chat Bot\n\n" +
    "/search — cari partner\n" +
    "/next — ganti partner\n" +
    "/stop — hentikan chat\n" +
    "/settings — pengaturan\n" +
    "/rules — aturan"
  );
});

bot.command("rules", ctx => {
  ctx.reply("📜 Rules:\n1. No spam\n2. No porn\n3. Saling menghormati");
});

bot.command("settings", ctx => {
  ctx.reply(
    "⚙️ Settings:\n" +
    "/gender_male /gender_female /gender_any\n" +
    "/looking_male /looking_female /looking_any"
  );
});

bot.command("gender_male", ctx => {
  getSettings(ctx.from.id).gender = "Male";
  ctx.reply("Gender diset: Male");
});

bot.command("gender_female", ctx => {
  getSettings(ctx.from.id).gender = "Female";
  ctx.reply("Gender diset: Female");
});

bot.command("gender_any", ctx => {
  getSettings(ctx.from.id).gender = "Any";
  ctx.reply("Gender diset: Any");
});

bot.command("looking_male", ctx => {
  getSettings(ctx.from.id).looking = "Male";
  ctx.reply("Cari partner: Male");
});

bot.command("looking_female", ctx => {
  getSettings(ctx.from.id).looking = "Female";
  ctx.reply("Cari partner: Female");
});

bot.command("looking_any", ctx => {
  getSettings(ctx.from.id).looking = "Any";
  ctx.reply("Cari partner: Any");
});

bot.command("search", ctx => {
  const id = ctx.from.id;
  if (!matchUsers(id)) {
    waiting.push(id);
    ctx.reply("⏳ Mencari partner...");
  }
});

bot.command("next", ctx => {
  const id = ctx.from.id;
  const partner = pairs[id];
  if (partner) {
    delete pairs[partner];
    bot.telegram.sendMessage(partner, "❌ Partner keluar");
  }
  delete pairs[id];
  matchUsers(id) || waiting.push(id);
});

bot.command("stop", ctx => {
  const id = ctx.from.id;
  const partner = pairs[id];
  if (partner) bot.telegram.sendMessage(partner, "❌ Chat dihentikan");
  delete pairs[id];
  waiting = waiting.filter(u => u !== id);
  ctx.reply("🛑 Chat dihentikan");
});

bot.on("text", ctx => {
  const partner = pairs[ctx.from.id];
  if (partner) bot.telegram.sendMessage(partner, ctx.message.text);
});

export default async function handler(req, res) {
  await bot.handleUpdate(req.body);
  res.status(200).send("OK");
}
