// app.js

// Вспомогательные функции
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.className = 'error-message';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.className = 'success-message';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

function roundToTwo(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return 0;
    }
    return Math.round(num * 100) / 100;
}

// --- Инициализация приложения ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await db.init();
        await initializeInitialData();
        await loadProductsToSelect();
        initCalculator();
        initRationListeners();
        initProductsSearch();
        initModal();
        initFluidCalculator();
    } catch (error) {
        showError('Ошибка инициализации базы данных: ' + error.message);
    }
});

async function loadProductsToSelect() {
    const selectElement = document.getElementById('selectedProduct');
    if (!selectElement) return;

    try {
        const products = await ProductsAPI.getAll();
        if (products.length === 0) {
            selectElement.innerHTML = '<option value="">Нет доступных продуктов. Добавьте продукты в базу.</option>';
            return;
        }
        selectElement.innerHTML = '<option value="">-- Выберите смесь --</option>' +
            products.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    } catch (error) {
        console.error('Ошибка загрузки продуктов:', error);
        selectElement.innerHTML = '<option value="">Ошибка загрузки продуктов</option>';
    }
}

async function initializeInitialData() {
    try {
        const existingProducts = await ProductsAPI.getAll();
        if (existingProducts.length === 0 && typeof initialProducts !== 'undefined') {
            console.log('Загрузка начальных данных продуктов в базу...');
            const productsToInsert = initialProducts.map(p => ({
                name: p.name,
                calories: p.calories || null,
                proteins: p.proteins || null,
                fats: p.fats || null,
                carbs: p.carbs || null,
                description: p.description || '',
                applicationMethod: p.applicationMethod || '',
                scoopWeight: p.scoopWeight || null,
                packageAmount: p.packageAmount || null,
                scoopsPerServing_ordinary: p.scoopsPerServing_ordinary || null,
                waterPerServing_ordinary: p.waterPerServing_ordinary || null,
                servingVolume_ordinary: p.servingVolume_ordinary || null,
                scoopsPerServing_hyper: p.scoopsPerServing_hyper || null,
                waterPerServing_hyper: p.waterPerServing_hyper || null,
                servingVolume_hyper: p.servingVolume_hyper || null,
            }));
            await ProductsAPI.bulkInsert(productsToInsert);
            console.log(`Загружено ${initialProducts.length} продуктов`);
        }
    } catch (error) {
        console.error('Ошибка загрузки начальных данных:', error);
        showError('Ошибка загрузки начальных данных: ' + error.message);
    }
}

// --- ФУНКЦИИ РАСЧЕТА ПАЦИЕНТА ---
function calculateBMI(weight, height) {
    if (weight > 0 && height > 0) {
        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);
        return bmi;
    }
    return null;
}

function calculateBMR(weight, height, age, gender) {
    if (weight > 0 && height > 0 && age > 0) {
        let bmr;
        if (gender === 'male') {
            bmr = 66.5 + (13.75 * weight) + (5.003 * height) - (6.75 * age);
        } else {
            bmr = 655.1 + (9.563 * weight) + (1.850 * height) - (4.676 * age);
        }
        return bmr;
    }
    return null;
}

function updatePatientMetrics() {
    const weight = parseFloat(document.getElementById('patientWeight').value);
    const height = parseFloat(document.getElementById('patientHeight').value);
    const age = parseFloat(document.getElementById('patientAge').value);
    const gender = document.getElementById('patientGender').value;
    const activityFactorValue = parseFloat(document.getElementById('activityFactor').value) || 1.2;

    const bmiResult = document.getElementById('bmiResult');
    const bmiStatus = document.getElementById('bmiStatus');
    const bmrResult = document.getElementById('bmrResult');
    const dailyNeedResult = document.getElementById('dailyNeedResult');
    const dailyNeedStatus = document.getElementById('dailyNeedStatus');
    const activityFactorSelect = document.getElementById('activityFactor');
    const activityFactorText = activityFactorSelect.options[activityFactorSelect.selectedIndex].text.split(' - ')[1] || 'Не задан';

    const bmi = calculateBMI(weight, height);
    const bmr = calculateBMR(weight, height, age, gender);
    let dailyNeed = null;

    if (bmi) {
        let status = '';
        if (bmi < 18.5) { status = 'Недостаток веса'; bmiStatus.style.color = '#e74c3c'; }
        else if (bmi >= 18.5 && bmi < 24.9) { status = 'Нормальный вес'; bmiStatus.style.color = '#27ae60'; }
        else if (bmi >= 25 && bmi < 29.9) { status = 'Избыточный вес'; bmiStatus.style.color = '#f39c12'; }
        else { status = 'Ожирение'; bmiStatus.style.color = '#c0392b'; }
        bmiResult.textContent = `${bmi.toFixed(1)} кг/м²`;
        bmiStatus.textContent = status;
    } else {
        bmiResult.textContent = '0.0 кг/м²';
        bmiStatus.textContent = 'Введите данные';
        bmiStatus.style.color = '#333';
    }

    if (bmr) {
        bmrResult.textContent = `${bmr.toFixed(0)} ккал/сутки`;
        dailyNeed = bmr * activityFactorValue;
        dailyNeedResult.textContent = `${dailyNeed.toFixed(0)} ккал/сутки`;
        dailyNeedResult.style.color = '#2980b9';
        dailyNeedStatus.textContent = activityFactorText;
    } else {
        bmrResult.textContent = '0 ккал/сутки';
        dailyNeedResult.textContent = '0 ккал/сутки';
        dailyNeedResult.style.color = '#333';
        dailyNeedStatus.textContent = 'ОО * Фактор активности';
    }

    dailyNeedResult.dataset.dailyNeed = dailyNeed ? dailyNeed.toFixed(0) : '0';
    calculateFluidVolume();

    const selectedProductId = document.getElementById('selectedProduct').value;
    if (dailyNeed > 0 && selectedProductId) {
        calculateRation();
    } else {
        document.getElementById('rationResult').innerHTML = '';
        document.getElementById('additionalFluidResult').innerHTML = ''; // Очистка раздела дополнительной жидкости
    }
}

function initCalculator() {
    const inputs = ['patientWeight', 'patientHeight', 'patientAge', 'patientGender', 'activityFactor'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updatePatientMetrics);
        }
    });
    updatePatientMetrics();
}

function initRationListeners() {
    const selectedProduct = document.getElementById('selectedProduct');
    const concentrationType = document.getElementById('concentrationType');
    const numMeals = document.getElementById('numMeals');

    const autoCalculate = () => {
        const selectedProductId = selectedProduct.value;
        const dailyNeed = parseFloat(document.getElementById('dailyNeedResult').dataset.dailyNeed);
        if (selectedProductId && dailyNeed > 0) {
            calculateRation();
        } else {
            document.getElementById('rationResult').innerHTML = "";
            document.getElementById('additionalFluidResult').innerHTML = ''; // Очистка
        }
    };

    if (selectedProduct) selectedProduct.addEventListener('change', autoCalculate);
    if (concentrationType) concentrationType.addEventListener('change', autoCalculate);
    if (numMeals) numMeals.addEventListener('input', autoCalculate);
}

async function calculateRation() {
    const selectedProductId = document.getElementById('selectedProduct').value;
    const concentrationType = document.getElementById('concentrationType').value;
    const dailyNeed = parseFloat(document.getElementById('dailyNeedResult').dataset.dailyNeed);
    const numMeals = parseInt(document.getElementById('numMeals').value) || 4;
    const rationResultDiv = document.getElementById('rationResult');
    document.getElementById('additionalFluidResult').innerHTML = ''; // Очистка перед началом расчета

    if (!dailyNeed || dailyNeed === 0 || numMeals <= 0) {
        rationResultDiv.innerHTML = "<p class='error-message-inline'>Пожалуйста, заполните данные пациента и задайте количество приемов пищи.</p>";
        return;
    }

    if (!selectedProductId || !concentrationType) {
        rationResultDiv.innerHTML = "<p class='error-message-inline'>Пожалуйста, выберите смесь и тип разведения.</p>";
        return;
    }

    try {
        const product = await ProductsAPI.getById(selectedProductId);
        if (!product) {
            rationResultDiv.innerHTML = "<p class='error-message-inline'>Продукт не найден.</p>";
            return;
        }

        if (!product.scoopWeight || product.scoopWeight <= 0) {
            rationResultDiv.innerHTML = "<p class='error-message-inline'>Ошибка: не задан вес мерной ложки для выбранного продукта.</p>";
            return;
        }

        // --- НОВАЯ ЛОГИКА: Расчет калорийности по БЖУ, если не задана явно ---
        let calorieSource = 'заданная';

        if (!product.calories || product.calories <= 0) {
            const proteins = product.proteins || 0;
            const fats = product.fats || 0;
            const carbs = product.carbs || 0;

            if (proteins > 0 || fats > 0 || carbs > 0) {
                // Formula: Protein * 4 + Fat * 9 + Carb * 4
                product.calories = (proteins * 4) + (fats * 9) + (carbs * 4);
                calorieSource = 'расчетная (Б*4 + Ж*9 + У*4)';
            }
        }

        if (!product.calories || product.calories <= 0) {
            rationResultDiv.innerHTML = "<p class='error-message-inline'>Ошибка: Калорийность продукта не задана (ни напрямую, ни через БЖУ).</p>";
            return;
        }
        // --- КОНЕЦ НОВОЙ ЛОГИКИ ---

        let scoopsPerServing, waterPerServing, concentrationLabel, servingVolume;
        let dilutionWarning = ''; // Переменная для предупреждения

        // 1. Get Ordinary Parameters (needed for fallback)
        const scoops_ord = product.scoopsPerServing_ordinary;
        const water_ord = product.waterPerServing_ordinary;
        const vol_ord = product.servingVolume_ordinary;

        if (!scoops_ord || !water_ord) {
            // Cannot calculate anything without ordinary parameters
            rationResultDiv.innerHTML = `<p class='error-message-inline'>Невозможно рассчитать рацион: не заданы параметры Обычного (≈1.0 ккал/мл) разведения для ${product.name}, которые необходимы для любого расчета.</p>`;
            document.getElementById('additionalFluidResult').innerHTML = '';
            return;
        }

        if (concentrationType === 'ordinary') {
            scoopsPerServing = scoops_ord;
            waterPerServing = water_ord;
            servingVolume = vol_ord;
            concentrationLabel = 'Обычное (≈1.0 ккал/мл)';
        } else if (concentrationType === 'hyper') {
            concentrationLabel = 'Гиперкалорическое (≈1.5 ккал/мл)';

            // Check if Hyper parameters are explicitly set
            if (product.scoopsPerServing_hyper && product.waterPerServing_hyper) {
                scoopsPerServing = product.scoopsPerServing_hyper;
                waterPerServing = product.waterPerServing_hyper;
                servingVolume = product.servingVolume_hyper;
            } else {
                // FALLBACK: Calculate Hyper from Ordinary (assuming 1.5x concentration)
                scoopsPerServing = scoops_ord;
                waterPerServing = water_ord / 1.5; // Уменьшаем воду на 1/1.5 для повышения концентрации
                servingVolume = null; // Forces recalculation based on new water volume + powder density

                dilutionWarning = `<p class='error-message-inline' style="color: #f39c12; font-size: 0.9em; margin-bottom: 20px; padding: 10px; border: 1px dashed #f39c12; border-radius: 5px;">
                    <strong>⚠ Внимание:</strong> Параметры гиперкалорического разведения отсутствуют в базе. Использован расчетный вариант (${scoopsPerServing.toFixed(1)} ложек на ${waterPerServing.toFixed(0)} мл воды) для достижения концентрации ≈1.5 ккал/мл.
                </p>`;
            }
        }

        const powderPerServingGrams = scoopsPerServing * product.scoopWeight;

        let actualServingVolume;
        if (servingVolume && servingVolume > 0) {
            actualServingVolume = servingVolume;
        } else {
            const volumePowderML = powderPerServingGrams / 0.7; // Примерная плотность порошка
            actualServingVolume = waterPerServing + volumePowderML;
        }

        const caloriesPerServing = (powderPerServingGrams / 100) * product.calories;

        const actualEnergyDensity = caloriesPerServing / actualServingVolume;
        const rationVolume = dailyNeed / actualEnergyDensity;

        const ratioPowderToVolume = powderPerServingGrams / actualServingVolume;
        const ratioWaterToPowder = waterPerServing / powderPerServingGrams;

        const totalPowderGrams = rationVolume * ratioPowderToVolume;
        const totalWaterML = totalPowderGrams * ratioWaterToPowder;

        const totalCalories = (totalPowderGrams / 100) * product.calories;
        const totalProteins = (totalPowderGrams / 100) * product.proteins;
        const totalFats = (totalPowderGrams / 100) * product.fats;
        const totalCarbs = (totalPowderGrams / 100) * product.carbs;

        const mealVolume = rationVolume / numMeals;
        const mealPowderGrams = totalPowderGrams / numMeals;
        const mealWaterML = totalWaterML / numMeals;
        const mealScoops = mealPowderGrams / product.scoopWeight;

        // --- Расчет порции с округлением ложек ---
        const roundedMealScoops = Math.round(mealScoops);
        const isRoundingApplied = Math.abs(mealScoops - roundedMealScoops) >= 0.05;

        const roundedMealPowderGrams = roundedMealScoops * product.scoopWeight;
        const roundedMealWaterML = roundedMealPowderGrams * ratioWaterToPowder;

        let roundedMealTotalVolume;
        if (servingVolume && servingVolume > 0) {
            roundedMealTotalVolume = (roundedMealPowderGrams / powderPerServingGrams) * actualServingVolume;
        } else {
            const roundedVolumePowderML = roundedMealPowderGrams / 0.7;
            roundedMealTotalVolume = roundedMealWaterML + roundedVolumePowderML;
        }

        const roundedTotalPowderGrams = roundedMealPowderGrams * numMeals;
        const roundedTotalWaterML = roundedMealWaterML * numMeals;
        const roundedTotalVolume = roundedMealTotalVolume * numMeals;
        const roundedTotalCalories = (roundedTotalPowderGrams / 100) * product.calories;

        // --- Расчет калорийного отклонения и БЖУ ---
        const calorieDifference = roundedTotalCalories - dailyNeed;
        const differenceText = calorieDifference >= 0
            ? `+${Math.abs(calorieDifference).toFixed(0)} ккал`
            : `-${Math.abs(calorieDifference).toFixed(0)} ккал`;
        const differenceClass = (Math.abs(calorieDifference) / dailyNeed) < 0.05
            ? 'success-message-inline'
            : (calorieDifference >= 0 ? 'success-message-inline' : 'error-message-inline');

        const finalTotalProteins = (roundedTotalPowderGrams / 100) * product.proteins;
        const finalTotalFats = (roundedTotalPowderGrams / 100) * product.fats;
        const finalTotalCarbs = (roundedTotalPowderGrams / 100) * product.carbs;

        const getNutritionPercentages = (calories, proteins, fats, carbs) => {
            const proteinKcal = proteins * 4;
            const fatKcal = fats * 9;
            const carbKcal = carbs * 4;
            const baseKcal = calories > 0 ? calories : 1;
            return {
                protein: roundToTwo((proteinKcal / baseKcal) * 100),
                fat: roundToTwo((fatKcal / baseKcal) * 100),
                carb: roundToTwo((carbKcal / baseKcal) * 100)
            };
        };

        const precisePcts = getNutritionPercentages(totalCalories, totalProteins, totalFats, totalCarbs);
        const roundedPcts = getNutritionPercentages(roundedTotalCalories, finalTotalProteins, finalTotalFats, finalTotalCarbs);

        // ВНИМАНИЕ: Здесь используются ПОРЦИОННЫЕ данные (mealScoops, mealPowderGrams и т.д.)
        const generateSummaryHtml = (scoops, powderG, waterML, volumeML, isRounded = false) => `
            <div class="results-section" style="border-top: none; padding-top: 0;">
                <h4 style="margin-bottom: 5px;">${isRounded ? 'Вариант порции (с округлением ложек)' : 'Точный расчет порции'}</h4>
                <p style="margin: 0 0 10px 0; font-size: 0.9em; color: #555;">(${numMeals} раз в сутки)</p>
                <div class="result-row ration-summary-row">
                    <div class="result-card ration-summary-card result-portion-powder">
                        <h5>Количество ложек смеси</h5>
                        <p class="metric-value">${scoops.toFixed(1)} ложек</p>
                        <p class="metric-status">(${powderG.toFixed(1)} г)</p>
                    </div>
                    <div class="result-card ration-summary-card result-portion-volume">
                        <h5>Вода (мл) + порошок</h5>
                        <p class="metric-value small-metric-value">${volumeML.toFixed(0)} мл</p>
                        <p class="metric-status">(${waterML.toFixed(0)} мл воды + ${powderG.toFixed(1)} г порошка)</p>
                    </div>
                </div>
            </div>
        `;

        const preciseTableHtml = `
            <h3 style="margin-top: 20px;">Рацион на сутки (Точный расчет)</h3>
            <table class="results-table">
                <thead><tr><th>Показатель</th><th>Всего</th><th>% от Калоража</th></tr></thead>
                <tbody>
                    <tr><td data-label="Суточная потребность (СП)" class="highlight">Суточная потребность (СП)</td><td data-label="Значение" class="highlight">${dailyNeed.toFixed(0)} ккал</td><td data-label="% от Калоража">-</td></tr>
                    <tr><td data-label="Калории (Рацион)" class="highlight">Калории (Рацион)</td><td data-label="Значение" class="highlight">${totalCalories.toFixed(0)} ккал</td><td data-label="% от Калоража">-</td></tr>
                    <tr><td data-label="Белки (г)">Белки (г)</td><td data-label="Значение">${totalProteins.toFixed(1)} г</td><td data-label="% от Калоража">${precisePcts.protein.toFixed(1)}%</td></tr>
                    <tr><td data-label="Жиры (г)">Жиры (г)</td><td data-label="Значение">${totalFats.toFixed(1)} г</td><td data-label="% от Калоража">${precisePcts.fat.toFixed(1)}%</td></tr>
                    <tr><td data-label="Углеводы (г)">Углеводы (г)</td><td data-label="Значение">${totalCarbs.toFixed(1)} г</td><td data-label="% от Калоража">${precisePcts.carb.toFixed(1)}%</td></tr>
                    <tr><td colspan="3" style="background-color: #f0f0f0; text-align: center; font-weight: bold; padding: 5px;">Объем и компоненты</td></tr>
                    <tr><td data-label="Количество приемов пищи">Количество приемов пищи</td><td data-label="Значение" colspan="2">${numMeals} раз</td></tr>
                    <tr><td data-label="Объем готовой смеси">Объем готовой смеси</td><td data-label="Значение" colspan="2">${rationVolume.toFixed(0)} мл</td></tr>
                    <tr><td data-label="Всего сухого продукта">Всего сухого продукта</td><td data-label="Значение" colspan="2">${totalPowderGrams.toFixed(1)} г</td></tr>
                    <tr><td data-label="Всего воды">Всего воды</td><td data-label="Значение" colspan="2">${totalWaterML.toFixed(0)} мл</td></tr>
                </tbody>
            </table>
        `;

        const roundedTableHtml = `
            <h3 style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">Рацион на сутки (с округлением ложек)</h3>
            <p style="margin-top: 10px;"><strong>Цель:</strong> Округлить порцию до **${roundedMealScoops} ложек** для удобства. <br> <span class="${differenceClass}">Отклонение от СП (${dailyNeed.toFixed(0)} ккал): ${differenceText}</span></p>
            ${generateSummaryHtml(roundedMealScoops, roundedMealPowderGrams, roundedMealWaterML, roundedMealTotalVolume, true)}
            <table class="results-table">
                <thead><tr><th>Показатель</th><th>Всего</th><th>% от Калоража</th></tr></thead>
                <tbody>
                    <tr><td data-label="Калории (Новая)" class="highlight">Калории (Новая)</td><td data-label="Значение" class="highlight">${roundedTotalCalories.toFixed(0)} ккал</td><td data-label="% от Калоража">-</td></tr>
                    <tr><td data-label="Белки (г)">Белки (г)</td><td data-label="Значение">${finalTotalProteins.toFixed(1)} г</td><td data-label="% от Калоража">${roundedPcts.protein.toFixed(1)}%</td></tr>
                    <tr><td data-label="Жиры (г)">Жиры (г)</td><td data-label="Значение">${finalTotalFats.toFixed(1)} г</td><td data-label="% от Калоража">${roundedPcts.fat.toFixed(1)}%</td></tr>
                    <tr><td data-label="Углеводы (г)">Углеводы (г)</td><td data-label="Значение">${finalTotalCarbs.toFixed(1)} г</td><td data-label="% от Калоража">${roundedPcts.carb.toFixed(1)}%</td></tr>
                    <tr><td colspan="3" style="background-color: #f0f0f0; text-align: center; font-weight: bold; padding: 5px;">Объем и компоненты</td></tr>
                    <tr><td data-label="Объем готовой смеси">Объем готовой смеси</td><td data-label="Значение" colspan="2">${roundedTotalVolume.toFixed(0)} мл</td></tr>
                    <tr><td data-label="Всего сухого продукта">Всего сухого продукта</td><td data-label="Значение" colspan="2">${roundedTotalPowderGrams.toFixed(1)} г</td></tr>
                    <tr><td data-label="Всего воды">Всего воды</td><td data-label="Значение" colspan="2">${roundedTotalWaterML.toFixed(0)} мл</td></tr>
                </tbody>
            </table>
        `;

        const resultHtml = `
            ${dilutionWarning}
            <h3>✅ Результаты расчета</h3>
            <p><strong>Смесь:</strong> ${escapeHtml(product.name)}</p>
            <p><strong>Калорийность 100г сухого:</strong> ${product.calories.toFixed(0)} ккал (${calorieSource})</p>
            <p><strong>Тип разведения:</strong> ${concentrationLabel} &nbsp;&nbsp; | &nbsp;&nbsp; <strong>Энерг. плотность:</strong> ${actualEnergyDensity.toFixed(2)} ккал/мл</p>
            <hr>
            ${generateSummaryHtml(mealScoops, mealPowderGrams, mealWaterML, mealVolume, false)}
            ${preciseTableHtml}
            ${isRoundingApplied ? roundedTableHtml : ''}
        `;

        if (!isRoundingApplied) {
            rationResultDiv.innerHTML = resultHtml.replace('Рацион на сутки (Точный расчет)', 'Рацион на сутки');
        } else {
            rationResultDiv.innerHTML = resultHtml;
        }

        // --- Расчет и отображение дополнительной жидкости ---
        const patientWeight = parseFloat(document.getElementById('patientWeight').value);
        const fluidMaintenanceNeed = calculateMaintenanceFluid(patientWeight);

        if (isRoundingApplied) {
            displayAdditionalFluid(fluidMaintenanceNeed, roundedTotalVolume, roundedTotalWaterML, true);
        } else {
            displayAdditionalFluid(fluidMaintenanceNeed, rationVolume, totalWaterML, false);
        }

    } catch (error) {
        showError('Ошибка при расчете рациона: ' + error.message);
        rationResultDiv.innerHTML = `<p class='error-message-inline'>Произошла внутренняя ошибка расчета.</p>`;
        document.getElementById('additionalFluidResult').innerHTML = '';
    }
}

// --- НОВАЯ ФУНКЦИЯ ДЛЯ ОТОБРАЖЕНИЯ ДОПОЛНИТЕЛЬНОЙ ЖИДКОСТИ ---
function displayAdditionalFluid(fluidMaintenanceNeed, totalVolume, totalWaterInMix, isRounded) {
    const additionalFluidResultDiv = document.getElementById('additionalFluidResult');

    if (!additionalFluidResultDiv || fluidMaintenanceNeed === 0) {
        if (additionalFluidResultDiv) additionalFluidResultDiv.innerHTML = '';
        return;
    }

    let additionalWaterNeeded = 0;
    let additionalWaterText = 'Не требуется';
    let additionalWaterStatus = 'success';
    let waterInMix = totalWaterInMix;

    // Расчет дополнительной жидкости (ЖВО)
    if (fluidMaintenanceNeed > 0) {
        additionalWaterNeeded = fluidMaintenanceNeed - waterInMix;

        if (additionalWaterNeeded < 0) {
            additionalWaterText = `Избыток: ${Math.abs(additionalWaterNeeded).toFixed(0)} мл (ЖВО может быть выше)`;
            additionalWaterStatus = 'warning';
            additionalWaterNeeded = 0; // Не показывать отрицательный объем для добавления
        } else if (additionalWaterNeeded > 0) {
            additionalWaterText = `Требуется добавить`;
            additionalWaterStatus = 'primary';
        }
    } else {
        additionalWaterText = 'Нет данных о весе';
        additionalWaterStatus = 'default';
        additionalWaterNeeded = 0;
    }

    const waterNeededDisplay = additionalWaterNeeded.toFixed(0);

    const waterHtml = `
        <div class="results-section">
            <h4 style="margin-bottom: 5px;">💧 Дополнительная жидкость, необходимая на сутки</h4>
            <div class="result-row ration-summary-row">
                <div class="result-card ration-summary-card result-portion-powder" style="border-left-color: #3498db; min-width: 30%;">
                    <h5>ЖВО (Жел. Водный Объем)</h5>
                    <p class="metric-value small-metric-value">${fluidMaintenanceNeed.toFixed(0)} мл</p>
                    <p class="metric-status">Расчет по Холлидею-Сегару</p>
                </div>
                <div class="result-card ration-summary-card result-portion-volume" style="border-left-color: #f39c12; min-width: 30%;">
                    <h5>Вода в готовой смеси (ЖВС)</h5>
                    <p class="metric-value small-metric-value">${totalWaterInMix.toFixed(0)} мл</p>
                    <p class="metric-status">Используется ${isRounded ? 'округленный' : 'точный'} расчет</p>
                </div>
                <div class="result-card ration-summary-card result-portion-volume" style="border-left-color: ${additionalWaterStatus === 'primary' ? '#2ecc71' : (additionalWaterStatus === 'warning' ? '#e74c3c' : '#ccc')}; min-width: 30%;">
                    <h5>Добавить воды (ЖВО - ЖВС)</h5>
                    <p class="metric-value small-metric-value">${waterNeededDisplay} мл</p>
                    <p class="metric-status">${additionalWaterText}</p>
                </div>
            </div>
            <p style="text-align: center; margin-top: -10px; font-size: 0.85em; color: #7f8c8d;">
                <em>Данные основаны на ${isRounded ? 'округленном' : 'точном'} расчете рациона.</em>
            </p>
        </div>
    `;

    additionalFluidResultDiv.innerHTML = waterHtml;
}


// --- ФУНКЦИИ РАСЧЕТА ЖВО (Желаемого Водного Объема) ДЛЯ ДЕТЕЙ ---
function calculateMaintenanceFluid(weight) {
    if (!weight || weight <= 0) return 0;

    let fluid = 0;
    if (weight <= 10) {
        fluid = weight * 100;
    } else if (weight <= 20) {
        fluid = 1000 + (weight - 10) * 50;
    } else {
        fluid = 1000 + 500 + (weight - 20) * 20;
    }
    return Math.round(fluid);
}

function calculateFluidVolume() {
    const weight = parseFloat(document.getElementById('patientWeight').value);
    const totalFluidNeedEl = document.getElementById('totalFluidNeed');
    const fluidStatusEl = document.getElementById('fluidStatus');
    const fluidBreakdownEl = document.getElementById('fluidBreakdown');

    if (!weight || weight <= 0) {
        totalFluidNeedEl.textContent = '0 мл/сутки';
        fluidStatusEl.textContent = 'Результат появится после ввода веса';
        fluidBreakdownEl.innerHTML = '';
        return;
    }

    if (weight > 54) {
        totalFluidNeedEl.textContent = '— мл/сутки';
        fluidStatusEl.textContent = 'Расчет применим для детей до 54 кг';
        fluidBreakdownEl.innerHTML = '<p style="color: #f39c12;">⚠ Для пациентов с весом > 54 кг используйте другие формулы.</p>';
        return;
    }

    const maintenanceFluid = calculateMaintenanceFluid(weight);

    totalFluidNeedEl.textContent = `${maintenanceFluid} мл/сутки`;
    totalFluidNeedEl.style.color = '#2980b9';
    fluidStatusEl.textContent = 'Формула Холлидея-Сегара';

    let breakdown = '<strong>Расчет:</strong> ';
    if (weight <= 10) {
        breakdown += `${weight.toFixed(1)} кг × 100 мл/кг = ${maintenanceFluid} мл`;
    } else if (weight <= 20) {
        const extra = weight - 10;
        breakdown += `1000 мл (10 кг) + ${extra.toFixed(1)} кг × 50 мл/кг = ${maintenanceFluid} мл`;
    } else {
        const extra = weight - 20;
        breakdown += `1500 мл (20 кг) + ${extra.toFixed(1)} кг × 20 мл/кг = ${maintenanceFluid} мл`;
    }

    fluidBreakdownEl.innerHTML = `<p>${breakdown}</p>
        <p style="margin-top: 8px; color: #7f8c8d; font-size: 0.85em;">
            <em>⚠ Это базовый расчет жидкости поддержания (ЖП). При необходимости учитывайте дополнительные потери (ЖВО, ЖТПП).</em>
        </p>`;
}

function initFluidCalculator() {
    const weightInput = document.getElementById('patientWeight');
    if (weightInput) {
        calculateFluidVolume();
    }
}

// --- ФУНКЦИИ УПРАВЛЕНИЯ ПРОДУКТАМИ И МОДАЛЬНОГО ОКНА ---

function initProductsSearch() {
    const searchBtn = document.getElementById('searchMedpitanieBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            openModal();
        });
    }
}

function initModal() {
    const modal = document.getElementById('productModal');
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const productForm = document.getElementById('productForm');
    const searchMedpitanieBtn = document.getElementById('searchMedpitanieBtn');

    // Открытие модального окна по кнопке "Управление продуктами"
    if (searchMedpitanieBtn) {
        searchMedpitanieBtn.addEventListener('click', () => {
            openModal();
        });
    }

    // Закрытие модального окна
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
    }

    // Закрытие при клике вне модального окна
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Обработка отправки формы
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveProduct();
        });
    }

    // Загрузка списка продуктов при открытии
    loadProductsTable();
}

async function openModal(productId = null) {
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const productForm = document.getElementById('productForm');

    if (productId) {
        modalTitle.textContent = 'Редактировать продукт';
        await loadProductForEdit(productId);
    } else {
        modalTitle.textContent = 'Добавить новый продукт';
        productForm.reset();
        document.getElementById('productId').value = '';
    }

    await loadProductsTable();
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('productModal');
    const productForm = document.getElementById('productForm');
    modal.style.display = 'none';
    productForm.reset();
    document.getElementById('productId').value = '';
}

async function loadProductForEdit(productId) {
    try {
        const product = await ProductsAPI.getById(productId);
        if (!product) {
            showError('Продукт не найден');
            return;
        }

        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productCalories').value = product.calories || '';
        document.getElementById('productProteins').value = product.proteins || '';
        document.getElementById('productFats').value = product.fats || '';
        document.getElementById('productCarbs').value = product.carbs || '';
        document.getElementById('productScoopWeight').value = product.scoopWeight || '';
        document.getElementById('productPackageAmount').value = product.packageAmount || '';
        document.getElementById('productScoopsOrdinary').value = product.scoopsPerServing_ordinary || '';
        document.getElementById('productWaterOrdinary').value = product.waterPerServing_ordinary || '';
        document.getElementById('servingVolume_ordinary').value = product.servingVolume_ordinary || '';
        document.getElementById('productScoopsHyper').value = product.scoopsPerServing_hyper || '';
        document.getElementById('productWaterHyper').value = product.waterPerServing_hyper || '';
        document.getElementById('servingVolume_hyper').value = product.servingVolume_hyper || '';
        document.getElementById('productApplicationMethod').value = product.applicationMethod || '';
        document.getElementById('productDescription').value = product.description || '';
    } catch (error) {
        showError('Ошибка загрузки данных продукта: ' + error.message);
    }
}

async function saveProduct() {
    const productId = document.getElementById('productId').value;

    const productData = {
        name: document.getElementById('productName').value,
        calories: parseFloat(document.getElementById('productCalories').value) || null,
        proteins: parseFloat(document.getElementById('productProteins').value) || null,
        fats: parseFloat(document.getElementById('productFats').value) || null,
        carbs: parseFloat(document.getElementById('productCarbs').value) || null,
        scoopWeight: parseFloat(document.getElementById('productScoopWeight').value) || null,
        packageAmount: parseFloat(document.getElementById('productPackageAmount').value) || null,
        scoopsPerServing_ordinary: parseFloat(document.getElementById('productScoopsOrdinary').value) || null,
        waterPerServing_ordinary: parseFloat(document.getElementById('productWaterOrdinary').value) || null,
        servingVolume_ordinary: parseFloat(document.getElementById('servingVolume_ordinary').value) || null,
        scoopsPerServing_hyper: parseFloat(document.getElementById('productScoopsHyper').value) || null,
        waterPerServing_hyper: parseFloat(document.getElementById('productWaterHyper').value) || null,
        servingVolume_hyper: parseFloat(document.getElementById('servingVolume_hyper').value) || null,
        applicationMethod: document.getElementById('productApplicationMethod').value || '',
        description: document.getElementById('productDescription').value || ''
    };

    try {
        if (productId) {
            await ProductsAPI.updateProduct(productId, productData);
            showSuccess('Продукт успешно обновлен');
        } else {
            await ProductsAPI.addProduct(productData);
            showSuccess('Продукт успешно добавлен');
        }

        await loadProductsTable();
        await loadProductsToSelect();
        closeModal();
    } catch (error) {
        showError('Ошибка сохранения продукта: ' + error.message);
    }
}

async function loadProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    try {
        const products = await ProductsAPI.getAll();

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Нет продуктов в базе данных</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${escapeHtml(product.name)}</td>
                <td>${product.calories || '—'}</td>
                <td>
                    <button class="btn-small btn-edit" onclick="editProduct(${product.id})">Редактировать</button>
                    <button class="btn-small btn-delete" onclick="deleteProduct(${product.id})">Удалить</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showError('Ошибка загрузки списка продуктов: ' + error.message);
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Ошибка загрузки данных</td></tr>';
    }
}

// Глобальные функции для кнопок
window.editProduct = async function (productId) {
    await openModal(productId);
};

window.deleteProduct = async function (productId) {
    if (!confirm('Вы уверены, что хотите удалить этот продукт?')) {
        return;
    }

    try {
        await ProductsAPI.deleteProduct(productId);
        showSuccess('Продукт успешно удален');
        await loadProductsTable();
        await loadProductsToSelect();
    } catch (error) {
        showError('Ошибка удаления продукта: ' + error.message);
    }
};