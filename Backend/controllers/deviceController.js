const Device = require('../models/Device');

// Text ke simple kore: lowercase, space/symbol bad
const normalize = (text) => String(text).toLowerCase().replace(/[^a-z0-9]/g, '');

const round = (number, digits = 4) => Number(number.toFixed(digits));

// Query er sathe device ta koto mile, 0 theke 100 score
const scoreDevice = (device, query) => {
  const candidates = [
    device.name,
    `${device.brand} ${device.name}`,
    device.model,
    ...device.aliases,
  ].map(normalize);

  let best = 0;

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (candidate === query) return 100;

    if (candidate.includes(query) || query.includes(candidate)) {
      const ratio =
        Math.min(candidate.length, query.length) /
        Math.max(candidate.length, query.length);
      best = Math.max(best, Math.round(ratio * 90));
    }
  }

  return best;
};

// @route   GET /api/devices
// @access  Private
const getDevices = async (req, res) => {
  try {
    const devices = await Device.find()
      .select('name brand model category weightKg')
      .sort({ brand: 1, name: 1 });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/devices/identify
// @access  Private
const identifyDevice = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res
        .status(400)
        .json({ message: 'Please enter a device name or model' });
    }

    const normalizedQuery = normalize(query);

    if (!normalizedQuery) {
      return res.status(400).json({ message: 'Invalid device name' });
    }

    const devices = await Device.find();

    const matches = devices
      .map((device) => ({
        _id: device._id,
        name: device.name,
        brand: device.brand,
        model: device.model,
        category: device.category,
        weightKg: device.weightKg,
        confidence: scoreDevice(device, normalizedQuery),
      }))
      .filter((item) => item.confidence >= 40)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    if (matches.length === 0 || matches[0].confidence < 60) {
      return res.json({
        found: false,
        message: 'Device not found in database',
        suggestions: matches,
      });
    }

    res.json({
      found: true,
      device: matches[0],
      otherMatches: matches.slice(1),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/devices/analyze
// @access  Private
// FR4: recoverable material, FR3: estimated recycling value
const analyzeDevice = async (req, res) => {
  try {
    const { deviceId, weightKg, quantity } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: 'Please select a device' });
    }

    const device = await Device.findById(deviceId).populate(
      'composition.material'
    );

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const unitWeightKg =
      weightKg !== undefined && weightKg !== ''
        ? Number(weightKg)
        : device.weightKg;
    const qty =
      quantity !== undefined && quantity !== '' ? Number(quantity) : 1;

    if (!(unitWeightKg > 0) || !(qty > 0)) {
      return res
        .status(400)
        .json({ message: 'Weight and quantity must be greater than 0' });
    }

    const totalWeightKg = unitWeightKg * qty;

    let totalRecoverableKg = 0;
    let estimatedValue = 0;

    const materials = device.composition
      .filter((item) => item.material)
      .map((item) => {
        const materialKg = (totalWeightKg * item.percentage) / 100;
        const recoverableKg = (materialKg * item.recoveryRate) / 100;
        const value = recoverableKg * item.material.pricePerKg;

        totalRecoverableKg += recoverableKg;
        estimatedValue += value;

        return {
          name: item.material.name,
          symbol: item.material.symbol,
          category: item.material.category,
          percentage: item.percentage,
          recoveryRate: item.recoveryRate,
          pricePerKg: item.material.pricePerKg,
          materialGrams: round(materialKg * 1000),
          recoverableGrams: round(recoverableKg * 1000),
          value: round(value, 2),
        };
      })
      .sort((a, b) => b.value - a.value);

    res.json({
      device: {
        _id: device._id,
        name: device.name,
        brand: device.brand,
        model: device.model,
        category: device.category,
      },
      unitWeightKg,
      quantity: qty,
      totalWeightKg: round(totalWeightKg),
      totalRecoverableKg: round(totalRecoverableKg),
      estimatedValueUSD: round(estimatedValue, 2),
      materials,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDevices, identifyDevice, analyzeDevice };