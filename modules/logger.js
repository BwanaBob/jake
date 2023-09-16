const options = require("../options.json");

module.exports = {
    execute(log) {
        if (typeof log === 'string' || log instanceof String) {
            const newLog = { message: log };
            log = newLog;
        }
        if (!log.date) { log.date = new Date().toLocaleString() }
        if (!log.color) { log.color = '\x1b[32m%s\x1b[0m' }

        var logString = `[${log.date.padEnd(options.logger.dateLength)}] `;
        if (log.emoji) { logString += `${log.emoji} `; }
        if (log.module) { logString += `${log.module.slice(0, options.logger.moduleLength).padEnd(options.logger.moduleLength)}| `; }
        if (log.feature) { logString += `${log.feature.slice(0, options.logger.featureLength).padEnd(options.logger.featureLength)} | ` };
        if (log.guild) { logString += `${log.guild.slice(0, options.logger.guildLength).padEnd(options.logger.guildLength)} | ` };
        if (log.channel) { logString += `${log.channel.slice(0, options.logger.channelLength).padEnd(options.logger.channelLength)} | ` };

        if (log.userName || log.nickname) {
            var userString = "";
            if (log.userName && log.nickname) {
                userString = `${log.nickname}/${log.userName}`
            } else if (log.userName) {
                userString = log.userName
            } else if (log.nickname) {
                userString = log.nickname
            }
            logString += `${userString.padEnd(options.logger.userLength)} | `
        }
        // if (log.userName) { logString += `${log.userName.padEnd(options.logger.userLength)} | ` };
        // if (log.nickname) { logString += `${log.nickname.padEnd(options.logger.userLength)} | ` };

        if (log.message) { logString += `${log.message}` };

        console.log(
            log.color, logString
                .replace(/(\r?\n|\r)/gm, " ")
                .slice(0, options.logger.logLength)
        );
    }
};
