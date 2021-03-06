"use strict";

let fs   = require("fs");
let path = require("path");

let log  = require("./logger");
let conf = require("./configurator");

const config = conf.getConfig();

let commandHandler = function(message, client, isModCommand, callback){
    let cmdPrefix = isModCommand ? config.bot_settings.prefix.mod_prefix : config.bot_settings.prefix.command_prefix;
    let args = message.content.slice(cmdPrefix.length).trim().split(/ +/g);
    let command = args.shift().toLowerCase();

    if (isModCommand && !message.member.roles.some(r => config.bot_settings.moderator_roles.includes(r.name))){
        log.warn(`User "${message.author.tag}" (${message.author}) tried mod command "${cmdPrefix}${command}" and was denied`);
        return callback("I'm sorry, " + message.author + ". You do not have permission to use that command!");
    }

    let commandArr = [];
    let commandDir = isModCommand ? path.resolve("./src/commands/modcommands") : path.resolve("./src/commands");

    fs.readdirSync(commandDir).forEach(file => {
        let cmdPath = path.resolve(commandDir, file);
        let stats = fs.statSync(cmdPath);
        if (!stats.isDirectory()) commandArr.push(file.toLowerCase());
    });

    if (!commandArr.includes(command.toLowerCase() + ".js")){
        log.warn(
            `User "${message.author.tag}" (${message.author}) performed an unknown command: ${cmdPrefix}${command}`
        );
        return message.channel.send(
            "Hello, " + message.author + "!\n\n" +
            "It seems like you entered an unrecognized command (" + command + ").\n\n" +
            "Please use " + cmdPrefix + "help for a complete list of commands! :)"
        );
    }
    else log.info(
        `User "${message.author.tag}" (${message.author}) performed ${(isModCommand ? "mod-" : "")}command: ${cmdPrefix}${command}`
    );

    let cmdHandle = require(path.join(commandDir, command));

    try {
        cmdHandle.run(client, message, args, function(err){
            //Non-Exception Error returned by the command (e.g.: Missing Argument)
            if (err) message.channel.send(err);
        });
    }

    //Exception returned by the command handler
    catch (err){
        message.channel.send(
            "Sorry, there has been an error =(\n\n" +
            "Please ask <@371724846205239326> for help."
        );
        log.error(err);
    }

    callback();
};

module.exports = commandHandler;
