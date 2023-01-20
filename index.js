const parser = require("./parser/index.js");
const { getMsgID, parseFrame } = require("./src/converter");

var can = require("socketcan");
let channel;
//create channel on given can port (vcan0 as test) normally can0/can1

module.exports = function (app) {
    var plugin = {};

    plugin.id = "orion-bms-signalk";
    plugin.name = "Orion BMS to Signalk";
    plugin.description = "Converts Orion BMS CAN data to Signalk";

    plugin.start = function (options, restartPlugin) {
        // Here we put our plugin logic
        app.debug("Plugin started");
        var channel = can.createRawChannel(options.canInterface, true);

        //create mask on can port to receive only 2 requried CANID's
        //as listed in DBC file
        //2147485360 => 80 00 06 B0
        //2147485361 => 80 00 06 B1

        //Can dump shows ID as
        //00 00 06 B0
        //00 00 06 B1

        channel.setRxFilters([
            { id: 0x06b0, mask: 0xfff, invert: false },
            { id: 0x06b1, mask: 0xfff, invert: false },
        ]);

        channel.addListener("onMessage", function (msg) {
            msgId = getMsgID(msg.id);
            canData = msg.data.readBigUInt64BE();
            //console.log(canData);
            //
            for (const parserLookup of parser[msgId].data) {
                parsedData = parseFrame(parserLookup, canData);
                app.debug(parsedData);
                app.handleMessage("orion-bms-signalk", {
                    updates: [
                        {
                            values: [
                                {
                                    path: parsedData.path,
                                    value: parsedData.value,
                                },
                            ],
                        },
                    ],
                });
                console.log(parsedData);
            }
        });

        channel.start();
    };

    plugin.stop = function () {
        if (channel) {
            channel.stop();
        }
        channel = undefined;

        // Here we put logic we need when the plugin stops
        app.debug("Plugin stopped");
    };

    plugin.schema = {
        type: "object",
        required: ["canInterface"],
        properties: {
            canInterface: {
                type: "string",
                title: "Can Interface",
                description: "Name of can Interface can0..can1...",
            },
            // The plugin schema
        },
    };

    return plugin;
};
