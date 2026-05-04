#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.example') });

// Import models
const User = require('../src/models/User');
const Product = require('../src/models/Product');

/**
 * Database setup script for GoSellr
 * This script initializes the database with indexes and sample data
 */

class DatabaseSetup {
  constructor() {
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gosellr';
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      console.log('🌟 Connecting to MongoDB...');

      await mongoose.connect(this.mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      console.log('✅ MongoDB connected successfully!');
      console.log(`📊 Database: ${mongoose.connection.name}`);
      console.log(`🔗 Host: ${mongoose.connection.host}`);
      console.log(`🚀 Port: ${mongoose.connection.port}`);

    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Create database indexes
   */
  async createIndexes() {
    try {
      console.log('\n🔍 Creating database indexes...');

      // User indexes
      console.log('📝 Creating User indexes...');
      await User.collection.createIndex({ email: 1 }, { unique: true });
      await User.collection.createIndex({ phone: 1 });
      await User.collection.createIndex({ role: 1, status: 1 });
      await User.collection.createIndex({ 'business.verified': 1 });
      await User.collection.createIndex({ createdAt: -1 });
      await User.collection.createIndex({ lastActivityAt: -1 });
      await User.collection.createIndex({ isDeleted: 1 });

      // Product indexes
      console.log('📝 Creating Product indexes...');
      await Product.collection.createIndex({ name: 'text', description: 'text', tags: 'text' });
      await Product.collection.createIndex({ category: 1, status: 1 });
      await Product.collection.createIndex({ price: 1 });
      await Product.collection.createIndex({ ratings: 1 });
      await Product.collection.createIndex({ featured: 1, status: 1 });
      await Product.collection.createIndex({ trending: 1, status: 1 });
      await Product.collection.createIndex({ bestSeller: 1, status: 1 });
      await Product.collection.createIndex({ newArrival: 1, status: 1 });
      await Product.collection.createIndex({ slug: 1 }, { unique: true });
      await Product.collection.createIndex({ sku: 1 }, { unique: true });
      await Product.collection.createIndex({ seller: 1, status: 1 });

      console.log('✅ All indexes created successfully!');

    } catch (error) {
      console.error('❌ Error creating indexes:', error.message);
      throw error;
    }
  }

  /**
   * Create sample data
   */
  async createSampleData() {
    try {
      console.log('\n📊 Creating sample data...');

      // Check if sample data already exists
      const userCount = await User.countDocuments();
      const productCount = await Product.countDocuments();

      if (userCount > 0 || productCount > 0) {
        console.log('⚠️ Sample data already exists. Skipping...');
        await this.ensureAdminUser();
        return;
      }

      // Create admin user
      console.log('👤 Creating admin user...');
      const adminPassword = await bcrypt.hash('admin123', 12);
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@gosellr.com',
        phone: '+1234567890',
        password: adminPassword,
        confirmPassword: adminPassword,
        role: 'super-admin',
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        addresses: [{
          type: 'home',
          isDefault: true,
          firstName: 'Admin',
          lastName: 'User',
          addressLine1: '123 Admin Street',
          city: 'Admin City',
          state: 'AC',
          postalCode: '12345',
          country: 'US',
          phone: '+1234567890'
        }],
        preferences: {
          language: 'en',
          currency: 'USD',
          timezone: 'UTC'
        }
      });

      // Create seller user
      console.log('👤 Creating seller user...');
      const sellerPassword = await bcrypt.hash('seller123', 12);
      const sellerUser = await User.create({
        firstName: 'John',
        lastName: 'Seller',
        email: 'seller@gosellr.com',
        phone: '+1234567891',
        password: sellerPassword,
        confirmPassword: sellerPassword,
        role: 'seller',
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        addresses: [{
          type: 'home',
          isDefault: true,
          firstName: 'John',
          lastName: 'Seller',
          addressLine1: '456 Seller Avenue',
          city: 'Seller City',
          state: 'SC',
          postalCode: '67890',
          country: 'US',
          phone: '+1234567891'
        }],
        business: {
          name: 'John\'s Electronics Store',
          description: 'Premium electronics and gadgets',
          website: 'https://johnselectronics.com',
          category: 'Electronics',
          subcategory: 'Consumer Electronics',
          tags: ['electronics', 'gadgets', 'premium'],
          founded: new Date('2020-01-01'),
          employees: '1-10',
          annualRevenue: '100k-500k',
          verified: true,
          rating: {
            average: 4.5,
            count: 25
          },
          commission: 5
        },
        preferences: {
          language: 'en',
          currency: 'USD',
          timezone: 'UTC'
        }
      });

      // Create customer user
      console.log('👤 Creating customer user...');
      const customerPassword = await bcrypt.hash('customer123', 12);
      const customerUser = await User.create({
        firstName: 'Jane',
        lastName: 'Customer',
        email: 'customer@gosellr.com',
        phone: '+1234567892',
        password: customerPassword,
        confirmPassword: customerPassword,
        role: 'customer',
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        addresses: [{
          type: 'home',
          isDefault: true,
          firstName: 'Jane',
          lastName: 'Customer',
          addressLine1: '789 Customer Road',
          city: 'Customer City',
          state: 'CC',
          postalCode: '11111',
          country: 'US',
          phone: '+1234567892'
        }],
        preferences: {
          language: 'en',
          currency: 'USD',
          timezone: 'UTC'
        }
      });

      // Create sample products
      console.log('📦 Creating sample products...');
      const sampleProducts = [
        {
          name: 'iPhone 15 Pro Max',
          description: 'The most advanced iPhone ever with A17 Pro chip, titanium design, and pro camera system.',
          shortDescription: 'Latest iPhone with pro features',
          price: 1199.99,
          originalPrice: 1299.99,
          discountPercentage: 8,
          currency: 'USD',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
              alt: 'iPhone 15 Pro Max',
              isPrimary: true
            }
          ],
          thumbnail: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300',
          category: 'Electronics',
          brand: 'Apple',
          stock: 50,
          sku: 'IPHONE-15-PRO-MAX-256GB',
          specifications: [
            { name: 'Storage', value: '256GB' },
            { name: 'Color', value: 'Natural Titanium' },
            { name: 'Screen Size', value: '6.7 inches' },
            { name: 'Chip', value: 'A17 Pro' }
          ],
          dimensions: {
            length: 15.9,
            width: 7.7,
            height: 0.8,
            unit: 'cm'
          },
          weight: {
            value: 221,
            unit: 'g'
          },
          shipping: {
            weight: 0.5,
            dimensions: {
              length: 20,
              width: 15,
              height: 5
            },
            freeShipping: true,
            shippingCost: 0
          },
          ratings: {
            average: 4.8,
            count: 125,
            distribution: {
              1: 2,
              2: 3,
              3: 5,
              4: 15,
              5: 100
            }
          },
          metaTitle: 'iPhone 15 Pro Max - Latest Apple Smartphone',
          metaDescription: 'Get the iPhone 15 Pro Max with A17 Pro chip, titanium design, and pro camera system.',
          keywords: ['iphone', 'apple', 'smartphone', 'pro', 'titanium'],
          tags: ['smartphone', 'apple', 'iphone', 'pro', 'titanium'],
          status: 'active',
          featured: true,
          trending: true,
          bestSeller: true,
          newArrival: true,
          seller: sellerUser._id,
          vendor: {
            name: 'John\'s Electronics Store',
            id: sellerUser._id.toString(),
            rating: 4.5
          }
        },
        {
          name: 'MacBook Pro 16-inch',
          description: 'The most powerful MacBook Pro ever with M3 Max chip, up to 128GB unified memory, and stunning Liquid Retina XDR display.',
          shortDescription: 'Professional laptop with M3 Max chip',
          price: 2499.99,
          originalPrice: 2699.99,
          discountPercentage: 7,
          currency: 'USD',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
              alt: 'MacBook Pro 16-inch',
              isPrimary: true
            }
          ],
          thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300',
          category: 'Electronics',
          brand: 'Apple',
          stock: 25,
          sku: 'MACBOOK-PRO-16-M3-MAX',
          specifications: [
            { name: 'Processor', value: 'M3 Max' },
            { name: 'Memory', value: '32GB Unified Memory' },
            { name: 'Storage', value: '1TB SSD' },
            { name: 'Display', value: '16-inch Liquid Retina XDR' }
          ],
          dimensions: {
            length: 35.6,
            width: 24.8,
            height: 1.7,
            unit: 'cm'
          },
          weight: {
            value: 2.1,
            unit: 'kg'
          },
          shipping: {
            weight: 3.0,
            dimensions: {
              length: 40,
              width: 30,
              height: 10
            },
            freeShipping: true,
            shippingCost: 0
          },
          ratings: {
            average: 4.9,
            count: 89,
            distribution: {
              1: 1,
              2: 1,
              3: 2,
              4: 6,
              5: 79
            }
          },
          metaTitle: 'MacBook Pro 16-inch with M3 Max - Professional Laptop',
          metaDescription: 'The most powerful MacBook Pro with M3 Max chip, up to 128GB unified memory.',
          keywords: ['macbook', 'pro', 'apple', 'laptop', 'm3 max'],
          tags: ['laptop', 'apple', 'macbook', 'pro', 'm3 max'],
          status: 'active',
          featured: true,
          trending: true,
          bestSeller: true,
          newArrival: true,
          seller: sellerUser._id,
          vendor: {
            name: 'John\'s Electronics Store',
            id: sellerUser._id.toString(),
            rating: 4.5
          }
        },
        {
          name: 'Sony WH-1000XM5 Wireless Headphones',
          description: 'Industry-leading noise canceling wireless headphones with 30-hour battery life and exceptional sound quality.',
          shortDescription: 'Premium noise-canceling headphones',
          price: 399.99,
          originalPrice: 449.99,
          discountPercentage: 11,
          currency: 'USD',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
              alt: 'Sony WH-1000XM5 Headphones',
              isPrimary: true
            }
          ],
          thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
          category: 'Electronics',
          brand: 'Sony',
          stock: 75,
          sku: 'SONY-WH-1000XM5-BLACK',
          specifications: [
            { name: 'Battery Life', value: '30 hours' },
            { name: 'Noise Canceling', value: 'Industry-leading' },
            { name: 'Connectivity', value: 'Bluetooth 5.2' },
            { name: 'Weight', value: '250g' }
          ],
          dimensions: {
            length: 20.5,
            width: 16.5,
            height: 8.5,
            unit: 'cm'
          },
          weight: {
            value: 250,
            unit: 'g'
          },
          shipping: {
            weight: 0.5,
            dimensions: {
              length: 25,
              width: 20,
              height: 10
            },
            freeShipping: true,
            shippingCost: 0
          },
          ratings: {
            average: 4.7,
            count: 234,
            distribution: {
              1: 5,
              2: 8,
              3: 15,
              4: 46,
              5: 160
            }
          },
          metaTitle: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
          metaDescription: 'Industry-leading noise canceling wireless headphones with 30-hour battery life.',
          keywords: ['sony', 'headphones', 'wireless', 'noise canceling', 'bluetooth'],
          tags: ['headphones', 'sony', 'wireless', 'noise canceling', 'bluetooth'],
          status: 'active',
          featured: true,
          trending: true,
          bestSeller: true,
          seller: sellerUser._id,
          vendor: {
            name: 'John\'s Electronics Store',
            id: sellerUser._id.toString(),
            rating: 4.5
          }
        }
      ];

      await Product.insertMany(sampleProducts);

      console.log('✅ Sample data created successfully!');
      console.log(`👥 Users created: ${await User.countDocuments()}`);
      console.log(`📦 Products created: ${await Product.countDocuments()}`);

    } catch (error) {
      console.error('❌ Error creating sample data:', error.message);
      throw error;
    }
  }

  /**
   * Ensure at least one super-admin exists. Creates default admin (admin@gosellr.com / admin123) if none.
   */
  async ensureAdminUser() {
    const adminCount = await User.countDocuments({ role: 'super-admin' });
    if (adminCount > 0) return;
    console.log('👤 No admin found. Creating default admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@gosellr.com',
      phone: '+1234567890',
      password: adminPassword,
      confirmPassword: adminPassword,
      role: 'super-admin',
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
      addresses: [{
        type: 'home',
        isDefault: true,
        firstName: 'Admin',
        lastName: 'User',
        addressLine1: '123 Admin Street',
        city: 'Admin City',
        state: 'AC',
        postalCode: '12345',
        country: 'US',
        phone: '+1234567890'
      }],
      preferences: {
        language: 'en',
        currency: 'USD',
        timezone: 'UTC'
      }
    });
    console.log('✅ Default admin created: admin@gosellr.com / admin123');
  }

  /**
   * Display database statistics
   */
  async showStatistics() {
    try {
      console.log('\n📊 Database Statistics:');
      console.log('========================');

      const userCount = await User.countDocuments();
      const productCount = await Product.countDocuments();
      const adminCount = await User.countDocuments({ role: 'super-admin' });
      const sellerCount = await User.countDocuments({ role: 'seller' });
      const customerCount = await User.countDocuments({ role: 'customer' });
      const activeProductCount = await Product.countDocuments({ status: 'active' });
      const featuredProductCount = await Product.countDocuments({ featured: true });

      console.log(`👥 Total Users: ${userCount}`);
      console.log(`   👑 Admins: ${adminCount}`);
      console.log(`   🏪 Sellers: ${sellerCount}`);
      console.log(`   👤 Customers: ${customerCount}`);
      console.log(`📦 Total Products: ${productCount}`);
      console.log(`   ✅ Active Products: ${activeProductCount}`);
      console.log(`   ⭐ Featured Products: ${featuredProductCount}`);

    } catch (error) {
      console.error('❌ Error getting statistics:', error.message);
    }
  }

  /**
   * Run the complete setup
   */
  async run() {
    try {
      console.log('🚀 Starting GoSellr Database Setup...');
      console.log('=====================================');

      // Connect to database
      await this.connect();

      // Create indexes
      await this.createIndexes();

      // Create sample data
      await this.createSampleData();

      // Show statistics
      await this.showStatistics();

      console.log('\n🎉 Database setup completed successfully!');
      console.log('=====================================');
      console.log('🌟 GoSellr is ready to use!');
      console.log('📧 Admin Login: admin@gosellr.com / admin123');
      console.log('🏪 Seller Login: seller@gosellr.com / seller123');
      console.log('👤 Customer Login: customer@gosellr.com / customer123');

    } catch (error) {
      console.error('\n❌ Database setup failed:', error.message);
      process.exit(1);
    } finally {
      // Close database connection
      if (this.isConnected) {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed.');
      }
    }
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  const setup = new DatabaseSetup();
  setup.run().catch(console.error);
}

module.exports = DatabaseSetup;
