require('dotenv').config();
const mongoose = require('mongoose');

const LOCAL = 'mongodb://localhost:27017/rent-management';
const ATLAS = process.env.MONGO_URI;

const Admin   = require('../models/Admin');
const Renter  = require('../models/Renter');
const Payment = require('../models/Payment');
const Bill    = require('../models/Bill');

(async () => {
  // Connect to local
  const local = await mongoose.createConnection(LOCAL).asPromise();
  const atlas = await mongoose.createConnection(ATLAS).asPromise();

  const models = [
    { name: 'Admin',   schema: Admin.schema },
    { name: 'Renter',  schema: Renter.schema },
    { name: 'Payment', schema: Payment.schema },
    { name: 'Bill',    schema: Bill.schema },
  ];

  for (const { name, schema } of models) {
    const LocalModel = local.model(name, schema);
    const AtlasModel = atlas.model(name, schema);

    const docs = await LocalModel.find({}).lean();
    if (docs.length === 0) { console.log(`${name}: no data`); continue; }

    await AtlasModel.deleteMany({});
    await AtlasModel.insertMany(docs, { ordered: false });
    console.log(`${name}: migrated ${docs.length} records`);
  }

  await local.close();
  await atlas.close();
  console.log('Migration complete!');
})();
