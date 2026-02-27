import { Client, GatewayIntentBits, Collection, REST, Routes, ChannelType } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
// import cron from "node-cron";

// --- 各コマンドのインポート ---
import * as ping from "./commands/slash/ping.js";
import * as omikuji from "./commands/slash/omikuji.js";
import * as autorole from "./commands/slash/auto.role.js";
import * as autovc from "./commands/slash/auto.vc.js";
import * as rank from "./commands/slash/rank.js";
import * as plugin from "./commands/slash/plugin.js";
import * as welcome from "./commands/slash/welcome.js";

dotenv.config();

// --- クライアントの初期化 ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,      // メンバー参加イベント
    GatewayIntentBits.GuildVoiceStates,  // VC自動作成
    GatewayIntentBits.GuildPresences,    // メンバーの状態監視
    GatewayIntentBits.MessageContent,    // メッセージ内容の取得
  ],
});

// --- コマンドの管理 ---
client.commands = new Collection();
const commandModules = [ping, omikuji, autorole, autovc, rank, plugin, welcome];
const commandsJSON = [];

for (const module of commandModules) {
  if (module.data && module.execute) {
    client.commands.set(module.data.name, module);
    commandsJSON.push(module.data.toJSON());
  }
}

// --- 設定の読み込み関数 ---
const getSettings = () => {
  if (!fs.existsSync("./settings.json")) return {};
  try {
    const data = fs.readFileSync("./settings.json", "utf8");
    return JSON.parse(data || "{}");
  } catch (error) {
    console.error("設定ファイルの読み込み失敗:", error);
    return {};
  }
};

// --- Readyイベント ---
client.once("ready", async () => {
  console.log(`🚀 ${client.user.tag} としてログインしました。`);

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("スラッシュコマンドを登録中...");
    
    // 全サーバー共通
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commandsJSON },
    );

    console.log("スラッシュコマンドの登録が完了しました。");
  } catch (error) {
    console.error("コマンド登録エラー:", error);
  }
});

// --- インタラクション (Slash Commands) ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`コマンド実行エラー [${interaction.commandName}]:`, error);
    const replyMsg = "コマンドの実行中にエラーが発生しました。";
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: replyMsg, ephemeral: true });
    } else {
      await interaction.reply({ content: replyMsg, ephemeral: true });
    }
  }
});

// --- 自動役職付与 ---
client.on("guildMemberAdd", async (member) => {
  const allSettings = getSettings();
  const settings = allSettings[member.guild.id];
  if (!settings) return;

  const roleId = member.user.bot ? settings.autoBotRoleId : settings.autoMemberRoleId;
  if (!roleId) return;

  try {
    const role = await member.guild.roles.fetch(roleId);
    if (role) {
      await member.roles.add(role);
      console.log(`[${member.guild.name}] ${member.user.tag} に役職を付与しました。`);
    }
  } catch (error) {
    console.error("役職付与エラー:", error);
  }
});

// --- 自動VC (作成・削除) ---
client.on("voiceStateUpdate", async (oldState, newState) => {
  const settings = getSettings()[newState.guild.id];
  if (!settings || !settings.autoVcBaseId) return;

  // 入室時：作成用チャンネルに入った場合
  if (newState.channelId === settings.autoVcBaseId) {
    try {
      const newChannel = await newState.guild.channels.create({
        name: `🔊｜${newState.member.displayName}の部屋`,
        type: ChannelType.GuildVoice,
        parent: newState.channel.parentId || null,
      });
      await newState.member.voice.setChannel(newChannel);
    } catch (error) {
      console.error("VC作成エラー:", error);
    }
  }

  // 退室時：自動作成された空のVCを削除
  if (oldState.channel && oldState.channel.name.startsWith("🔊｜")) {
    // チャンネルが空になったか確認
    if (oldState.channel.members.size === 0) {
      try {
        await oldState.channel.delete();
      } catch (error) {
        // すでに削除されている場合などのエラーを無視
        if (error.code !== 10003) console.error("VC削除エラー:", error);
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);