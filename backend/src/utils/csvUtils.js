const csvToJson = require('csvtojson')

exports.csvToJson = async (buffer) => {
    const str = buffer.toString();
    return await csvToJson().fromString(str);
}
