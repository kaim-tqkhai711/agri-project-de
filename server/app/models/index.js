const dbConfig = require("../config/db.config.js");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;

// Import các model
db.accounts = require("./account.model.js")(mongoose);
db.farms = require("./farm.model.js")(mongoose);
db.products = require("./product.model.js")(mongoose);
db.scanlogs = require("./scanlog.model.js")(mongoose);
db.auditlogs = require("./auditlog.model.js")(mongoose); 

module.exports = db;