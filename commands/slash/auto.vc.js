import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import fs from "fs";

// --- autovcコマンドの定義 ---
export const data = new SlashCommandBuilder()
  .setName("autovc")
  .setDescription("自動通話作成機能の設定を行います")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  // --- 設定用サブコマンドの追加 ---
  .addSubcommand(subcommand =>
    subcommand.setName("set")
      .setDescription("作成用チャンネルを設定します")
      .addChannelOption(option =>
        option.setName("channel")
          .setDescription("参加すると新しく部屋が作られるチャンネル")
          .addChannelTypes(ChannelType.GuildVoice)
          .setRequired(true)
      )
  )
  // --- 解除用サブコマンドの追加 ---
  .addSubcommand(subcommand =>
    subcommand.setName("remove")
      .setDescription("自動通話作成の設定を解除します")
  );

// --- コマンドの実行内容 ---
export async function execute(interaction) {
  const subCommand = interaction.options.getSubcommand();
  const settingsPath = "./settings.json";
  const guildId = interaction.guild.id;

  // --- 設定の安全な読み込み ---
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf8") || "{}");
    } catch (e) {
      settings = {};
    }
  }

  // --- サーバーごとの設定枠がなければ作成 ---
  if (!settings[guildId]) settings[guildId] = {};

  // --- 設定処理 ---
  if (subCommand === "set") {
    const channel = interaction.options.getChannel("channel");
    
    // --- 設定を保存 ---
    settings[guildId].autoVcBaseId = channel.id;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    await interaction.reply({
      content: `✅ **${channel.name}** を自動作成用チャンネルに設定しました。`,
      ephemeral: true
    });
  } 
  
  // --- 解除処理 ---
  else if (subCommand === "remove") {
    if (settings[guildId]?.autoVcBaseId) {
      delete settings[guildId].autoVcBaseId;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      await interaction.reply({ content: "🗑️ 自動通話作成の設定を解除しました。", ephemeral: true });
    } else {
      await interaction.reply({ content: "❌ 設定されているチャンネルはありません。", ephemeral: true });
    }
  }
}