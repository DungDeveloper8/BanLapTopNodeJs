const mongoose = require("mongoose");

if (!process.env.MONGODB_URI) {
  throw new Error("Thiếu MONGODB_URI trong cấu hình môi trường.");
}

const database = {
  collection(name) {
    if (!mongoose.connection.db) throw new Error("MongoDB chưa được kết nối.");
    return mongoose.connection.db.collection(name);
  },
};

async function connectDatabase() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB || "bydung",
    serverSelectionTimeoutMS: 10000,
    autoIndex: false,
  });
  await mongoose.connection.db.command({ ping: 1 });
}

async function nextId(name, session) {
  const options = { upsert: true, returnDocument: "after" };
  if (session) options.session = session;
  const result = await database.collection("counters").findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    options,
  );
  const id = Number(result?.seq ?? result?.value?.seq);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("Không cấp được ID cho " + name);
  return id;
}

module.exports = { connectDatabase, database, nextId, mongoose };
