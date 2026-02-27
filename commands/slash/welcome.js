import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import fs from "fs";

/**
 * welcomeコマンドの定義
 */
export const data = new SlashCommandBuilder()
  .setName("welcome")
  .setDescription("新規参加に関する設定")
  // 管理者権限を持つメンバーのみ実行可能にする
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("change")
      .setDescription("ウェルカム機能の稼働の有無を切り替えます")
      .addStringOption((option) =>
        option
          .setName("status")
          .setDescription("稼働状態の選択")
          .setRequired(true)
          .addChoices(
            { name: "有効", value: "enable" },
            { name: "無効", value: "disable" },
          ),
      ),
  );

/**
 * コマンドの実行処理
 */
export async function execute(interaction) {
  const subCommand = interaction.options.getSubcommand();

  if (subCommand === "change") {
    const status = interaction.options.getString("status");
    const isEnabled = status === "enable";

    try {
      // settings.json の読み込みと更新
      const filePath = "./settings.json";
      let settings = {};

      if (fs.existsSync(filePath)) {
        settings = JSON.parse(fs.readFileSync(filePath, "utf8"));
      }

      // サーバーごとの設定を初期化・更新
      if (!settings[interaction.guildId]) {
        settings[interaction.guildId] = {};
      }
      
      settings[interaction.guildId].welcomeEnabled = isEnabled;

      // ファイルに保存
      fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));

      // 応答
      const message = isEnabled 
        ? "✅ ウェルカム機能を**有効**にしました。" 
        : "📴 ウェルカム機能を**無効**にしました。";
        
      await interaction.reply({ content: message, ephemeral: true });

    } catch (error) {
      console.error("設定の保存中にエラーが発生しました:", error);
      await interaction.reply({
        content: "設定の保存中にエラーが発生しました。",
        ephemeral: true,
      });
    }
  }
}