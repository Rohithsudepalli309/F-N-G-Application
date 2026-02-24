const logger = require('../config/logger');

class PriceEngineService {
  constructor() {
    this.io = null;
    this.intervalId = null;
  }

  init(io) {
    this.io = io;
    this.startEngine();
  }

  startEngine() {
    logger.info('🚀 Real-time Price Engine started');
    this.intervalId = setInterval(() => {
      this.generatePriceUpdates();
    }, 30000); // Update every 30 seconds
  }

  generatePriceUpdates() {
    // Simulate price fluctuations for key grocery items or surge for food
    const update = {
      timestamp: new Date().toISOString(),
      updates: [
        { productId: 'p_g1', fluctuation: (Math.random() * 0.1 - 0.05).toFixed(2) }, // ±5%
        { productId: 'p_n1', fluctuation: (Math.random() * 0.1).toFixed(2) },        // Surge only potentially
      ]
    };

    if (this.io) {
      this.io.emit('price_update', update);
      logger.info('📈 Price updates emitted:', update);
    }
  }

  stopEngine() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

module.exports = new PriceEngineService();
