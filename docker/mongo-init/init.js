// docker/mongo-init/init.js
const dbName = 'nichinsoft_db';
const dbRef = db.getSiblingDB(dbName);

const appPassword = process.env.MONGO_APP_PASSWORD || 'changeme';

const userExists = dbRef.getUser('nichin_app');
if (!userExists) {
  dbRef.createUser({
    user: 'nichin_app',
    pwd: appPassword,
    roles: [{ role: 'readWrite', db: dbName }],
  });
}

['stockslists', 'tradeslists', 'stockspricelists', 'counters'].forEach((name) => {
  if (!dbRef.getCollectionNames().includes(name)) {
    dbRef.createCollection(name);
  }
});

dbRef.counters.updateOne(
  { _id: 'tradeNo' },
  { $setOnInsert: { _id: 'tradeNo', seq: 999 } },
  { upsert: true }
);

print('MongoDB init complete');
