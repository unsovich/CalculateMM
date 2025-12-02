
function safeToFixed(value, digits = 1) {
    if (value === null || value === undefined) {
        return (0).toFixed(digits);
    }
    const num = parseFloat(value);
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
        return (0).toFixed(digits);
    }
    return num.toFixed(digits);
}

function runCalculation(product, dailyNeed, feedingsPerDay, concentrationType) {
    const productCalories = product.calories || 0;
    const productScoopWeight = product.scoopWeight || 0;

    const scoopsOrdinary = product.scoopsOrdinary || 0;
    const waterOrdinary = product.waterOrdinary || 0;
    const servingVolumeOrdinary = product.servingVolume_ordinary || 0;

    const kcalPerScoop = (productCalories * productScoopWeight) / 100;

    let scoopsPerServing, waterPerServing, servingVolume;

    if (concentrationType === 'ordinary') {
        scoopsPerServing = scoopsOrdinary;
        waterPerServing = waterOrdinary;
        servingVolume = servingVolumeOrdinary;
    }

    const kcalPerServing = kcalPerScoop * scoopsPerServing;
    const concentration = kcalPerServing / servingVolume;

    const requiredVolumeMl = dailyNeed / concentration;
    const requiredScoopsTotal = (requiredVolumeMl / servingVolume) * scoopsPerServing;
    const totalWaterInRationExact = (requiredScoopsTotal / scoopsPerServing) * waterPerServing;
    const totalMixWeightGramsExact = requiredScoopsTotal * productScoopWeight;
    const totalKcalExact = kcalPerScoop * requiredScoopsTotal;

    return {
        concentration,
        scoopsPerServing,
        waterPerServing,
        servingVolume,
        requiredVolumeMl,
        requiredScoopsTotal,
        requiredWaterMl: totalWaterInRationExact,
        totalKcalExact
    };
}

// Simulation
const dailyNeed = 100;
const product = {
    calories: 500, // Guess
    scoopWeight: 4.5, // Guess
    scoopsOrdinary: 9,
    waterOrdinary: 180,
    servingVolume_ordinary: 200 // Guess
};

console.log("Testing with servingVolume = 200");
let result = runCalculation(product, dailyNeed, 1, 'ordinary');
console.log(`Scoops: ${result.requiredScoopsTotal.toFixed(2)}`);
console.log(`Water: ${result.requiredWaterMl.toFixed(0)}`);
console.log(`Solution: ${result.requiredVolumeMl.toFixed(0)}`);

// Try to find the exact servingVolume that gives 99ml solution
// 99 = 100 / concentration
// concentration = 100 / 99 = 1.0101
// concentration = (kcalPerScoop * 9) / servingVolume
// 1.0101 = (22.5 * 9) / servingVolume
// servingVolume = 202.5 / 1.0101 = 200.47

product.servingVolume_ordinary = 200.5;
console.log("\nTesting with servingVolume = 200.5");
result = runCalculation(product, dailyNeed, 1, 'ordinary');
console.log(`Scoops: ${result.requiredScoopsTotal.toFixed(2)}`);
console.log(`Water: ${result.requiredWaterMl.toFixed(0)}`);
console.log(`Solution: ${result.requiredVolumeMl.toFixed(0)}`);
