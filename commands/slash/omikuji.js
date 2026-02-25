import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { $botOwnerIds, $omikujiChannelId } from "../../config.js";

// --- 運勢の定義 ---
const responses = {
  大吉: `# 【大吉】
**運勢**：
天が味方する最高の流れ。迷いが晴れ、思い切った決断が吉となる。
今までの努力が報われ、喜びが大きく広がる兆し。

**願望**： 叶う。焦らずとも自然に近づく。
**恋愛**： 出会いも進展も最高潮。告白は大吉。
**仕事**： 評価される。挑戦が成功につながる。
**金運**： 思わぬ臨時収入あり。使いすぎ注意。
**健康**： 心身ともに快調。運動を始めるとさらに良し。
**ラッキー**： 赤色・朝の散歩・甘いもの`,

  中吉: `# 【中吉】
**運勢**：
良い流れが来ているが、調子に乗ると足元をすくわれる。
慎重さと誠実さが運をさらに高める鍵。

**願望**： 叶うが少し時間がかかる。
**恋愛**： 距離が縮まる。焦らず相手を思いやれ。
**仕事**： 地道な努力が成果になる。目上の助けあり。
**金運**： 安定。貯める意識が吉。
**健康**： 体力はあるが油断禁物。睡眠を大切に。
**ラッキー**： 緑色・読書・温かいお茶`,

  小吉: `# 【小吉】
**運勢**：
小さな幸運が積み重なる日。大きな成果よりも「日々の積み上げ」が大事。
気づかないところにチャンスが隠れている。

**願望**： 少しずつ叶う。準備が大切。
**恋愛**： 進展はゆっくり。聞き上手が吉。
**仕事**： ミスを減らすほど評価が上がる。
**金運**： 無駄遣いを減らせば運が開ける。
**健康**： 軽い不調が出やすい。冷えに注意。
**ラッキー**： 黄色・整理整頓・パン`,

  吉: `# 【吉】
**運勢**：
穏やかに運が巡る。大きな波はないが、心がけ次第で良い方向へ。
「丁寧さ」が運を呼ぶ。

**願望**： 努力すれば叶う。途中で諦めるな。
**恋愛**： 安心できる関係が育つ。過去の縁が動くことも。
**仕事**： 周囲との協力が成功の鍵。独断は凶。
**金運**： 普通。計画的に使えば問題なし。
**健康**： 生活リズムを整えると吉。
**ラッキー**： 白色・神社の参拝・靴を磨く`,

  末吉: `# 【末吉】
**運勢**：
今はまだ静かな流れ。大きな幸運は先に控えている。
焦らず歩めば、やがて光が差し込む。
「継続」と「我慢」が未来の吉を呼ぶ兆し。

**願望**： すぐには叶わぬが、努力を続ければ後に実る。
**恋愛**： ゆっくり育つ縁あり。今は信頼を積む時。
**仕事**： 地道な積み重ねが評価につながる。裏方役が吉。
**金運**： 大きな増減なし。今は守りの時。
**健康**： 無理をしなければ安定。習慣の見直し吉。
**ラッキー**： 紫色・夕暮れの散歩・日記を書く`,

  凶: `# 【凶】
**運勢**：
思い通りに進みにくい時。焦って動くと傷口を広げる恐れあり。
今は「自分磨き」と「現状維持」に徹するのが賢明。
嵐が過ぎ去るのを静かに待とう。

**願望**： 難航する。今は時期を待て。
**恋愛**： 誤解が生じやすい。言葉選びは慎重に。
**仕事**： ケアレスミスに注意。確認を怠るな。
**金運**： 予想外の出費に注意。財布の紐を締めよ。
**健康**： 疲れが溜まりやすい。早めの休息を。
**ラッキー**： 黒色・掃除・温かいお風呂`,

  大凶: `# 【大凶】
**運勢**：
嵐のように運が乱れやすい。何をやっても裏目に出やすい時期。
しかし、ここが底。これ以上悪くなることはない。
「膿（うみ）を出す時」と捉え、謙虚に過ごせば道が開ける。

**願望**： かなり厳しい。一度計画を白紙にする勇気を。
**恋愛**： トラブルの予感。感情的にならないこと。
**仕事**： 大きな挑戦は控えよ。足元を固める時。
**金運**： 紛失や浪費に最大級の警戒を。
**健康**： 無理は禁物。しっかり休養を取ること。
**ラッキー**： 灰色・深呼吸・お守り`
};

// --- コマンド定義 ---
export const data = new SlashCommandBuilder()
  .setName("omikuji")
  .setDescription("おみくじ機能")
  // 1. 通常のおみくじを引くサブコマンド
  .addSubcommand(sub =>
    sub.setName("draw")
      .setDescription("おみくじを引きます")
  )
  // 2. プレビュー用サブコマンド
  .addSubcommand(sub =>
    sub.setName("preview")
      .setDescription("運勢のプレビューを表示します（管理者限定）")
      .addStringOption(option =>
        option.setName("fortune")
          .setDescription("表示する運勢を選択してください")
          .setRequired(true)
          .addChoices(
            ...Object.keys(responses).map(key => ({ name: key, value: key }))
          )
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands);

export async function execute(interaction) {
  // チャンネルチェック (配列に含まれているか確認)
  if (!$omikujiChannelId.includes(interaction.channelId)) {
    return await interaction.reply({ 
      content: "❌ このコマンドは特定のチャンネルでのみ使用できます。", 
      ephemeral: true 
    });
  }

  const subcommand = interaction.options.getSubcommand();

  // --- プレビューモードの処理 ---
  if (subcommand === "preview") {
    if (!$botOwnerIds.includes(interaction.user.id)) {
      return await interaction.reply({ 
        content: "❌ このサブコマンドはボットオーナーのみ使用できます。", 
        ephemeral: true 
      });
    }
    const fortune = interaction.options.getString("fortune");
    const replyMessage = responses[fortune] || "指定された運勢は存在しません。";
    return await interaction.reply({ content: replyMessage, ephemeral: true });
  }

  // --- 通常のおみくじ処理 (draw) ---
  if (subcommand === "draw") {
    const fortunes = Object.keys(responses);
    const result = fortunes[Math.floor(Math.random() * fortunes.length)];
    const replyMessage = responses[result];
    await interaction.reply(replyMessage);
  }
}