// Global test setup for root backend
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_unit_tests';
process.env.DB_SSL = 'false';

// Mocks or global test data can be defined here
