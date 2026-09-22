const { MongoClient } = require("mongodb");

const client = new MongoClient(
  "mongodb+srv://nguyendung01082006_db_user:minhdungne@cluster0.vp16ipp.mongodb.net/?appName=Cluster0",
);

const database = client.db("bydung");

async function connectDatabase() {
  await client.connect();
}

module.exports = {
  connectDatabase,
  database,
};
