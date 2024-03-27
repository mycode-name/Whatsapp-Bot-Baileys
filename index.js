const Bot = require("./Bot");

const Mirror = require("./plugins/Mirror");
const TagEveryone = require("./plugins/TagEveryone");
const ParticipantsUpdate = require("./plugins/ParticipantsUpdate");
const Roles = require("./plugins/Roles");

const { botConfig, pluginsConfig } = require("./config");

const plugins = [
  new Mirror(pluginsConfig.mirror),
  new TagEveryone(pluginsConfig.tagEveryone),
  new ParticipantsUpdate(pluginsConfig.patrticipantsUpdate),
  new Roles(pluginsConfig.roles),
];

const bot = new Bot(plugins, botConfig);

(async () => {
  await bot.connect();
  await bot.run();
})();
