const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NewbetSchema = new Schema({
    name: String,
    betname: String,
    stake: Number
});

const Newbet = mongoose.model('Newbet', NewbetSchema);

module.exports = Newbet;