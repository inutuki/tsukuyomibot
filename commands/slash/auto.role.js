import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import fs from "fs";

// --- autoroleコマンドの定義 ---
export const data = new SlashCommandBuilder()
  .setName("autorole")
  .setDescription("新規参加者に自動で役職を付与する設定")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  // --- 設定用サブコマンドの追加 ---
  .addSubcommand((subcommand) =>
    subcommand
      .setName("set")
      .setDescription("自動役職を設定します")
      .addRoleOption((option) =>
        option.setName("role").setDescription("付与する役職").setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("自動役職の種類")
          .setRequired(true)
          .addChoices(
            { name: "ボット", value: "Bot" },
            { name: "メンバー", value: "Member" },
          ),
      ),
  )
  // --- 解除用サブコマンドの追加 ---
  .addSubcommand((subcommand) =>
    subcommand.setName("remove").setDescription("自動役職を解除します")
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("解除する役職の種類")
          .setRequired(true)
          .addChoices(
            { name: "ボット", value: "Bot" },
            { name: "メンバー", value: "Member" },
          ),
      ),
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
  if (!settings[guildId]) {
    settings[guildId] = {};
  }

  // --- 設定処理 ---
  if (subCommand === "set") {
    const role = interaction.options.getRole("role");
    const type = interaction.options.getString("type");

    // --- 役職情報を保存 ---
    settings[guildId][`auto${type}RoleId`] = role.id;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    await interaction.reply({
      content: `✅ このサーバーの **${type === "Bot" ? "ボット" : "メンバー"}** 用自動役職を **${role.name}** に設定しました。`,
      ephemeral: true,
    });
  } 
  
  // --- 解除処理 ---
  else if (subCommand === "remove") {
    const type = interaction.options.getString("type");
    const key = `auto${type}RoleId`;

    if (settings[guildId] && settings[guildId][key]) {
      delete settings[guildId][key];
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      await interaction.reply({
        content: `🗑️ **${type === "Bot" ? "ボット" : "メンバー"}** 用の自動役職設定を解除しました。`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `❌ **${type === "Bot" ? "ボット" : "メンバー"}** 用の自動役職は設定されていません。`,
        ephemeral: true,
      });
    }
  }
}