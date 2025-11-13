const mongoose = require("mongoose");
const classClosureSchema = new mongoose.Schema({
    class: {type: String, required: true},
    date: {type: String, required: true },
    reason: {type: String, required: true, default: "School Closed"},
    createdBy: {type: mongoose.Schema.Types.ObjectId, refPath: 'createdByModel'},
    createdByModel: String,
    createdAt: {type: Date, default: Date.now}
});
classClosureSchema.index({class:1, date:1}, {unique:true});

module.exports = mongoose.model('ClassClosure', ClassClosureSchema);