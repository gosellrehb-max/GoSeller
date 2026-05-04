#!/usr/bin/env node

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.example') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gosellr';
const DEFAULT_COUNT = 60;

const SELLER_TYPES = ['Company', 'Dealer', 'Wholesaler', 'Trader', 'Shopkeeper'];
const CATEGORIES = ['Grocery', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books', 'Automotive', 'Health', 'Other'];

const SellerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    businessName: { type: String, required: true },
    type: { type: String, enum: SELLER_TYPES, default: 'Shopkeeper' },
    status: { type: String, default: 'approved' },
    verified: { type: Boolean, default: true },
    sqlLevel: { type: String, default: 'Free' },
  },
  { collection: 'sellers', timestamps: true, strict: false },
);

const ProductSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    title: { type: String, required: true, trim: true, maxlength: 2000 },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: true, maxlength: 2000 },
    shortDescription: { type: String, maxlength: 200 },
    category: { type: String, enum: CATEGORIES, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    images: { type: [String], required: true },
    imageUrl: { type: String },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, unique: true, sparse: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'draft'], default: 'approved' },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
  },
  { collection: 'products', timestamps: true, strict: false },
);

const Seller = mongoose.models.Seller || mongoose.model('Seller', SellerSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

function toSlug(input) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function ensureSeederSeller() {
  const existing = await Seller.findOne().lean().exec();
  if (existing?._id) return existing._id;

  const created = await Seller.create({
    userId: new mongoose.Types.ObjectId(),
    businessName: 'Seeder Demo Store',
    type: faker.helpers.arrayElement(SELLER_TYPES),
    status: 'approved',
    verified: true,
    sqlLevel: 'Basic',
  });
  return created._id;
}

function buildProduct(sellerId, index) {
  const title = faker.commerce.productName();
  const slugSeed = `${title}-${index}-${faker.string.alphanumeric(6)}`;
  const imageUrl = faker.image.urlLoremFlickr({ category: 'commerce' });
  const price = Number(faker.commerce.price({ min: 8, max: 3500, dec: 2 }));
  const originalPrice = Number((price + faker.number.float({ min: 5, max: 250, multipleOf: 0.01 })).toFixed(2));

  return {
    sellerId,
    title,
    slug: toSlug(slugSeed),
    description: faker.commerce.productDescription(),
    shortDescription: faker.commerce.productAdjective(),
    category: faker.helpers.arrayElement(CATEGORIES),
    price,
    originalPrice,
    imageUrl,
    images: [imageUrl],
    stock: faker.number.int({ min: 5, max: 250 }),
    sku: `SKU-${faker.string.alphanumeric({ length: 10, casing: 'upper' })}-${index}`,
    tags: faker.helpers.arrayElements(
      ['new', 'popular', 'eco', 'deal', 'premium', 'bestseller', 'recommended'],
      { min: 1, max: 3 },
    ),
    status: 'approved',
    isActive: true,
    isFeatured: faker.datatype.boolean(),
    views: faker.number.int({ min: 0, max: 4000 }),
    sales: faker.number.int({ min: 0, max: 800 }),
  };
}

async function seedProducts(count) {
  await mongoose.connect(mongoUri);
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`);

  const sellerId = await ensureSeederSeller();
  await Product.deleteMany({});
  console.log('Cleared Product collection.');

  const products = Array.from({ length: count }, (_, i) => buildProduct(sellerId, i + 1));
  await Product.insertMany(products);
  console.log(`Inserted ${products.length} products.`);
}

async function main() {
  const argCount = Number(process.argv[2]);
  const count = Number.isFinite(argCount) && argCount > 0 ? Math.floor(argCount) : DEFAULT_COUNT;

  try {
    await seedProducts(count);
    console.log('Product seeding completed.');
  } catch (error) {
    console.error('Product seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  main();
}
