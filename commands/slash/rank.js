import { SlashCommandBuilder } from "discord.js";

// --- rankコマンドの定義 ---
export const data = new SlashCommandBuilder()
  .setName("rank")
  .setDescription("ランキングを表示します");

// --- コマンドの実行内容 ---
export async function execute(interaction) {
  await interaction.reply(`ランキングを表示します！`);
}