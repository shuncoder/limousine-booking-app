function pickMultiplier({ dynamicPricing, fillRate }) {
  if (!dynamicPricing?.enabled) return 1;

  const tiers = Array.isArray(dynamicPricing.tiers) ? dynamicPricing.tiers : [];
  const sorted = [...tiers].sort((a, b) => (b.minFillRate ?? 0) - (a.minFillRate ?? 0));

  for (const tier of sorted) {
    if (typeof tier?.minFillRate !== 'number' || typeof tier?.multiplier !== 'number') continue;
    if (fillRate >= tier.minFillRate) return tier.multiplier;
  }

  return 1;
}

function computePrice({ basePrice, dynamicPricing, fillRate }) {
  const multiplier = pickMultiplier({ dynamicPricing, fillRate });
  const price = Math.round((Number(basePrice) || 0) * multiplier);
  return { price, multiplier, fillRate };
}

function computeDiscount({ promo, amount }) {
  if (!promo) return { discountAmount: 0 };
  const nAmount = Math.max(0, Number(amount) || 0);

  if (promo.type === 'percent') {
    const pct = Math.max(0, Math.min(100, Number(promo.value) || 0));
    const discountAmount = Math.round((nAmount * pct) / 100);
    return { discountAmount };
  }

  if (promo.type === 'fixed') {
    const fixed = Math.max(0, Number(promo.value) || 0);
    return { discountAmount: Math.min(nAmount, fixed) };
  }

  return { discountAmount: 0 };
}

module.exports = { computePrice, computeDiscount };
