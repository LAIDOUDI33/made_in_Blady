// Jest setup file for AlgeriaTrade.dz
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client for tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    satimTransaction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    stripeTransaction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    cryptoPayment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    dpaAgreement: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    currencyRate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    negotiation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    contract: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    crmContact: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    erpConnector: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    callSession: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    arModel: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.SATIM_ENVIRONMENT = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.JWT_SECRET = 'test-secret';

// Extend Jest matchers
expect.extend({
  toBeValidCurrency(received) {
    const validCurrencies = ['DZD', 'EUR', 'USD', 'GBP', 'CHF', 'CAD', 'TND', 'MAD'];
    const pass = validCurrencies.includes(received);
    return {
      pass,
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid currency`
          : `Expected ${received} to be a valid currency, got one of ${validCurrencies.join(', ')}`,
    };
  },
});

// Global test timeout
jest.setTimeout(30000);
