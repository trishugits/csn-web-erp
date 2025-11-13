const {Parser} = require('json2csv');
function jsonToCsv(data, fields = null) {
    const opts = fields ? { fields } : {};
    const parser = new Parser(opts);
    return parser.parse(data);
}

module.exports = { jsonToCsv };