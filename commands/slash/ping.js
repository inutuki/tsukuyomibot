import { SlashCommandBuilder } from "discord.js";

// --- pingコマンドの定義 ---
export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("レイテンシを確認します");

// --- コマンドの実行内容 ---
export async function execute(interaction) {
  await interaction.reply(`Pong! (${interaction.client.ws.ping}ms)`);
}
