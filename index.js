import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  ChannelType,
  PermissionsBitField,
} from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import cron from "node-cron";
import {
  data as pingData,
  execute as pingExec,
} from "./commands/slash/ping.js";
import {
  data as omikujiData,
  execute as omikujiExec,
} from "./commands/slash/omikuji.js";
import {
  data as autoroleData,
  execute as autoroleExec,
} from "./commands/slash/auto.role.js";
import {
  data as autovcData,
  execute as autovcExec,
} from "./commands/slash/auto.vc.js";
import {
  data as rankData,
  execute as rankExec,
} from "./commands/slash/rank.js";
import {
  data as pluginData,
  execute as pluginExec,
} from "./commands/slash/plugin.js";

// --- 環境変数の読み込み ---
dotenv.config();

// --- クライアントの初期化 ---
const client = new Client({
  intents: [
    // --- サーバー関連のイベントを受け取るためのインテント ---
    GatewayIntentBits.Guilds,
    // --- メンバー関連のイベントを受け取るためのインテント ---
    GatewayIntentBits.GuildMembers,
    // --- ボイスチャンネルの状態を監視するためのインテント ---
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// --- コマンドの登録用リスト ---
const commands = [
  pingData.toJSON(),
  omikujiData.toJSON(),
  autoroleData.toJSON(),
  autovcData.toJSON(),
  rankData.toJSON(),
  pluginData.toJSON(),
];

// --- コマンドのコレクションに登録 ---
client.commands = new Collection();
client.commands.set(pingData.name, { data: pingData, execute: pingExec });
client.commands.set(omikujiData.name, {
  data: omikujiData,
  execute: omikujiExec,
});
client.commands.set(autoroleData.name, {
  data: autoroleData,
  execute: autoroleExec,
});
client.commands.set(autovcData.name, { data: autovcData, execute: autovcExec });
client.commands.set(rankData.name, { data: rankData, execute: rankExec });
client.commands.set(pluginData.name, { data: pluginData, execute: pluginExec });

// --- 設定の安全な読み込み関数 ---
const getSettings = () => {
  if (!fs.existsSync("./settings.json")) return {};
  try {
    const data = fs.readFileSync("./settings.json", "utf8");
    return JSON.parse(data || "{}");
  } catch (error) {
    console.error("設定ファイルの読み込みに失敗しました:", error);
    return {};
  }
};

// --- メイン処理 (Ready) ---
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log(`${commands.length} 個のスラッシュコマンドを更新中...`);

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log(`成功: ${data.length} 個のコマンドを同期しました。`);
  } catch (error) {
    console.error("同期中にエラーが発生しました:", error);
  }
});

/**
// --- チャンネルの公開/非公開を更新する関数 ---
async function updateChannelVisibility(isVisible) {
    // --- 設定の読み込み ---
    const settings = getSettings();
    
    // --- 全サーバーの設定をループして更新 ---
    for (const guildId in settings) {
        const channelId = settings[guildId].autoViewChannelId;
        if (!channelId) continue;

        try {
            const guild = await client.guilds.fetch(guildId);
            const channel = await guild.channels.fetch(channelId);
            if (channel) {
                // --- チャンネルの権限を更新して公開/非公開を切り替える ---
                await channel.permissionOverwrites.edit(guild.roles.everyone, {
                    ViewChannel: isVisible
                });
                console.log(`[${guild.name}] ${isVisible ? '開店' : '閉店'}処理完了`);
            }
        } catch (err) {
            console.error(`Visibility Update Error [${guildId}]:`, err);
        }
    }
}
*/

// --- インタラクション (Slash Commands) ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (command) await command.execute(interaction).catch(console.error);
});

// --- 自動役職付与 (guildMemberAdd) ---
client.on("guildMemberAdd", async (member) => {
  // --- 設定の読み込み ---
  const settings = getSettings()[member.guild.id];
  if (!settings) return;

  // --- ボットかユーザーかで付与する役職を判定 ---
  const roleId = member.user.bot
    ? settings.autoBotRoleId
    : settings.autoMemberRoleId;
  if (roleId) {
    const role = member.guild.roles.cache.get(roleId);
    if (role) await member.roles.add(role).catch(console.error);
  }
});

// --- 自動VC (voiceStateUpdate) ---
client.on("voiceStateUpdate", async (oldState, newState) => {
  // --- 設定の読み込み ---
  const settings = getSettings()[newState.guild.id];
  if (!settings || !settings.autoVcBaseId) return;

  // --- 作成用チャンネルに入室した場合 ---
  if (newState.channelId === settings.autoVcBaseId) {
    const newChannel = await newState.guild.channels.create({
      name: `🔊｜${newState.member.displayName}の部屋`,
      type: ChannelType.GuildVoice,
      parent: newState.channel.parentId,
    });
    await newState.member.voice.setChannel(newChannel);
  }

  // --- 無人になった自動作成VCを削除 ---
  if (
    oldState.channel?.name.startsWith("🔊｜") &&
    oldState.channel.members.size === 0
  ) {
    await oldState.channel.delete().catch(console.error);
  }
});

// --- ログイン ---
client.login(process.env.DISCORD_TOKEN);
