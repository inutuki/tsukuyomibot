import { SlashCommandBuilder } from "discord.js";

// --- プラグイン管理コマンドの定義 ---
const PLUGIN_CHOICES = [
    { name: "Rank", value: "rank" },
    { name: "AutoRole", value: "autorole" },
    { name: "AutoVC", value: "autovc" },
    { name: "Omikuji", value: "omikuji" },
    { name: "Ping", value: "ping" }
];

// --- pluginコマンドの定義 ---
export const data = new SlashCommandBuilder()
    .setName("plugin")
    .setDescription("プラグインを管理します")
    // --- プラグイン管理のサブコマンドを追加 ---
    .addSubcommand((subcommand) =>
        subcommand
            .setName("enable")
            .setDescription("プラグインを有効にします")
            .addStringOption((option) =>
                option.setName("name")
                    .setDescription("有効にするプラグインの名前")
                    .setRequired(true)
                    .addChoices(...PLUGIN_CHOICES)
            )
    )
    // --- プラグイン管理のサブコマンドを追加 ---
    .addSubcommand((subcommand) =>
        subcommand
            .setName("disable")
            .setDescription("プラグインを無効にします")
            .addStringOption((option) =>
                option.setName("name")
                    .setDescription("無効にするプラグインの名前")
                    .setRequired(true)
                    .addChoices(...PLUGIN_CHOICES)
            )
    );

// --- コマンドの実行内容 ---
export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const pluginName = interaction.options.getString("name");

    // --- 設定の安全な読み込み ---
    const settings = typeof getSettings === "function" ? getSettings() : {};

    if (!settings.plugins) settings.plugins = {};

    // --- プラグインの有効化/無効化処理 ---
    if (subcommand === "enable") {
        settings.plugins[pluginName] = true;
        await interaction.reply({ content: `✅ **${pluginName}** プラグインを有効にしました。`, ephemeral: true });
    } else if (subcommand === "disable") {
        settings.plugins[pluginName] = false;
        await interaction.reply({ content: `❌ **${pluginName}** プラグインを無効にしました。`, ephemeral: true });
    } else {
        await interaction.reply({ content: "不明なサブコマンドです。", ephemeral: true });
    }
}