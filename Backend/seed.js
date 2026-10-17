const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require('dotenv').config();
const mongoose = require('mongoose');
const Material = require('./models/Material');
const Device = require('./models/Device');

// Sample reference data. Pore tomra real dam diye update korte parba
const materials = [
  { name: 'Copper', symbol: 'Cu', category: 'base metal', pricePerKg: 9 },
  { name: 'Aluminum', symbol: 'Al', category: 'base metal', pricePerKg: 2.5 },
  { name: 'Iron', symbol: 'Fe', category: 'base metal', pricePerKg: 0.5 },
  { name: 'Nickel', symbol: 'Ni', category: 'base metal', pricePerKg: 17 },
  { name: 'Tin', symbol: 'Sn', category: 'base metal', pricePerKg: 30 },
  { name: 'Cobalt', symbol: 'Co', category: 'base metal', pricePerKg: 30 },
  { name: 'Lithium', symbol: 'Li', category: 'other', pricePerKg: 15 },
  { name: 'Gold', symbol: 'Au', category: 'precious metal', pricePerKg: 100000 },
  { name: 'Silver', symbol: 'Ag', category: 'precious metal', pricePerKg: 1000 },
  { name: 'Palladium', symbol: 'Pd', category: 'precious metal', pricePerKg: 35000 },
  { name: 'Plastic', symbol: '', category: 'plastic', pricePerKg: 0.8 },
  { name: 'Glass', symbol: '', category: 'glass', pricePerKg: 0.2 },
];

// Prottek material er koto % recover kora jay
const recoveryRates = {
  Copper: 90,
  Aluminum: 85,
  Iron: 85,
  Nickel: 75,
  Tin: 80,
  Cobalt: 80,
  Lithium: 50,
  Gold: 95,
  Silver: 90,
  Palladium: 90,
  Plastic: 40,
  Glass: 30,
};

// Device er composition: [material naam, device weight er koto %]
const phoneComposition = [
  ['Copper', 15],
  ['Aluminum', 8],
  ['Gold', 0.02],
  ['Silver', 0.1],
  ['Palladium', 0.01],
  ['Lithium', 1],
  ['Cobalt', 5],
  ['Nickel', 2],
  ['Tin', 1],
  ['Plastic', 25],
  ['Glass', 25],
];

const laptopComposition = [
  ['Copper', 12],
  ['Aluminum', 18],
  ['Iron', 15],
  ['Gold', 0.01],
  ['Silver', 0.05],
  ['Palladium', 0.005],
  ['Lithium', 1],
  ['Cobalt', 3],
  ['Nickel', 1],
  ['Tin', 1],
  ['Plastic', 30],
  ['Glass', 8],
];

const tabletComposition = [
  ['Copper', 10],
  ['Aluminum', 25],
  ['Gold', 0.015],
  ['Silver', 0.08],
  ['Palladium', 0.008],
  ['Lithium', 1.5],
  ['Cobalt', 6],
  ['Nickel', 2],
  ['Tin', 1],
  ['Plastic', 15],
  ['Glass', 25],
];

const tvComposition = [
  ['Copper', 6],
  ['Aluminum', 8],
  ['Iron', 15],
  ['Gold', 0.002],
  ['Silver', 0.02],
  ['Plastic', 35],
  ['Glass', 30],
];

const devices = [
  {
    name: 'iPhone 13',
    brand: 'Apple',
    model: 'A2633',
    category: 'smartphone',
    weightKg: 0.174,
    aliases: ['iphone13', 'iphone 13', 'apple iphone 13'],
    composition: phoneComposition,
  },
  {
    name: 'Galaxy S21',
    brand: 'Samsung',
    model: 'SM-G991B',
    category: 'smartphone',
    weightKg: 0.169,
    aliases: ['galaxy s21', 'samsung s21', 's21'],
    composition: phoneComposition,
  },
  {
    name: 'Redmi Note 11',
    brand: 'Xiaomi',
    model: '2201117TG',
    category: 'smartphone',
    weightKg: 0.179,
    aliases: ['redmi note 11', 'xiaomi note 11'],
    composition: phoneComposition,
  },
  {
    name: 'Inspiron 15',
    brand: 'Dell',
    model: '3511',
    category: 'laptop',
    weightKg: 1.8,
    aliases: ['dell inspiron 15', 'inspiron 3511'],
    composition: laptopComposition,
  },
  {
    name: 'Pavilion 15',
    brand: 'HP',
    model: '15-eg0000',
    category: 'laptop',
    weightKg: 1.75,
    aliases: ['hp pavilion 15', 'pavilion 15'],
    composition: laptopComposition,
  },
  {
    name: 'MacBook Air M1',
    brand: 'Apple',
    model: 'A2337',
    category: 'laptop',
    weightKg: 1.29,
    aliases: ['macbook air', 'macbook air m1', 'apple macbook air'],
    composition: laptopComposition,
  },
  {
    name: 'iPad 9th Gen',
    brand: 'Apple',
    model: 'A2602',
    category: 'tablet',
    weightKg: 0.487,
    aliases: ['ipad 9', 'ipad 9th generation'],
    composition: tabletComposition,
  },
  {
    name: 'Smart TV 43 inch',
    brand: 'Samsung',
    model: 'UA43T5300',
    category: 'television',
    weightKg: 8.5,
    aliases: ['samsung tv 43', 'samsung smart tv', '43 inch tv'],
    composition: tvComposition,
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Ager data muche notun kore dhokabe
    await Material.deleteMany();
    await Device.deleteMany();

    const createdMaterials = await Material.insertMany(materials);

    // Material naam theke id khujar jonno
    const materialIds = {};
    createdMaterials.forEach((m) => {
      materialIds[m.name] = m._id;
    });

    const devicesToInsert = devices.map((device) => ({
      ...device,
      composition: device.composition.map(([materialName, percentage]) => ({
        material: materialIds[materialName],
        percentage,
        recoveryRate: recoveryRates[materialName],
      })),
    }));

    await Device.insertMany(devicesToInsert);

    console.log(`${createdMaterials.length} materials added`);
    console.log(`${devicesToInsert.length} devices added`);
    process.exit(0);
  } catch (error) {
    console.error(`Seed Error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();