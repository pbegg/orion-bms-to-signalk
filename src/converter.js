let getMsgID = function (canID) {
    return canID & 0xfff;
};

let parseFrame = function (parserLookup, data) {
    //console.log(parserLookup);
    bitShift = 64 - (parserLookup.bitStart + 1) - parserLookup.bitLength + 8;
    data = Number(data >> BigInt(bitShift));
    data = data & (2 ** parserLookup.bitLength - 1);

    data = data * parserLookup.resolution + parserLookup.offset;
    return {
        path: parserLookup.name,
        value: data,
    };
    //
};

module.exports = {
    getMsgID,
    parseFrame,
};
