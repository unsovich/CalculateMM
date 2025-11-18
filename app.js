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

// --- Инициализация Supabase ---
// ВСТАВЬТЕ СЮДА ВАШИ РЕАЛЬНЫЕ КЛЮЧИ!
const SUPABASE_URL = 'https://kyxyuhttgyfihakaajsn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_x0GfxNq6Aq2UReH-IGO2iQ_x5zJLX4M';

if (!window.supabase) {
    showError("Ошибка: Библиотека Supabase не загружена. Проверьте подключение в index.html");
}
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- ФУНКЦИИ АУТЕНТИФИКАЦИИ ---

/**
 * Обновляет элементы интерфейса в зависимости от статуса аутентификации.
 * @param {object | null} user - Объект пользователя Supabase или null.
 */
function updateAuthUI(user) {
    const authStatus = document.getElementById('authStatus');
    const modalAuthStatus = document.getElementById('modalAuthStatus');
    const authForm = document.getElementById('authForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const saveProductBtn = document.getElementById('saveProductBtn');

    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');

    if (user) {
        // Пользователь вошел в систему
        authStatus.textContent = `Вы вошли как: ${user.email}`;
        modalAuthStatus.textContent = `Статус: ✅ Вход выполнен (${user.email}). Вы можете добавлять и редактировать продукты.`;
        authStatus.style.color = '#27ae60';

        authForm.style.display = 'none';
        logoutBtn.style.display = 'inline-block';

        saveProductBtn.disabled = false; // Разрешаем сохранение/добавление
    } else {
        // Пользователь не вошел в систему (анонимный)
        authStatus.textContent = `Статус: Анонимный`;
        modalAuthStatus.textContent = `Статус: ❌ Для добавления и редактирования продуктов необходимо войти в систему.`;
        authStatus.style.color = '#e74c3c';

        authForm.style.display = 'flex';
        logoutBtn.style.display = 'none';

        saveProductBtn.disabled = true; // Запрещаем сохранение/добавление

        // Очищаем поля при выходе
        if (authEmail) authEmail.value = '';
        if (authPassword) authPassword.value = '';
    }
}

async function signUpUser(email, password) {
    try {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw new Error(error.message);

        showSuccess('Регистрация успешна! Проверьте почту для подтверждения.');
        const { data: { user } } = await supabase.auth.getUser();
        updateAuthUI(user);
    } catch (error) {
        showError('Ошибка регистрации: ' + error.message);
    }
}

async function signInUser(email, password) {
    try {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);

        showSuccess('Вход выполнен успешно!');
        updateAuthUI(user);
    } catch (error) {
        showError('Ошибка входа: ' + error.message);
    }
}

async function signOutUser() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);

        showSuccess('Выход выполнен.');
        updateAuthUI(null);
    } catch (error) {
        showError('Ошибка выхода: ' + error.message);
    }
}

function initAuthListeners() {
    const authForm = document.getElementById('authForm');
    const signUpBtn = document.getElementById('signUpBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            signInUser(email, password);
        });
    }

    if (signUpBtn) {
        signUpBtn.addEventListener('click', () => {
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            if (email && password) {
                signUpUser(email, password);
            } else {
                showError('Введите email и пароль для регистрации.');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', signOutUser);
    }
}

// --- Новый объект API для Supabase ---
var ProductsAPI = {
    async getAll() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw new Error(error.message);
        return data;
    },

    async getById(id) {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) return null;

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', numericId)
            .single();
        if (error) {
            if (error.code !== 'PGRST116') throw new Error(error.message);
            return null;
        }
        return data;
    },

    async addProduct(product) {
        const { data, error } = await supabase.from('products').insert([product]).select();
        if (error) throw new Error(error.message);
        return data[0];
    },

    async updateProduct(id, product) {
        const numericId = parseInt(id, 10);
        const { data, error } = await supabase.from('products').update(product).eq('id', numericId).select();
        if (error) throw new Error(error.message);
        return data[0];
    },

    async deleteProduct(id) {
        const numericId = parseInt(id, 10);
        const { error } = await supabase.from('products').delete().eq('id', numericId);
        if (error) throw new Error(error.message);
        return true;
    }
};


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

function calculateFluidNeed(weight) {
    if (weight <= 0) return { total: 0, breakdown: 'Введите вес' };

    let totalFluid;
    let breakdown = [];

    if (weight <= 10) {
        totalFluid = weight * 100;
        breakdown.push(`1-10 кг: ${weight} кг x 100 мл/кг = ${totalFluid} мл`);
    } else if (weight <= 20) {
        const first10 = 10 * 100;
        const remaining = weight - 10;
        const remainingFluid = remaining * 50;
        totalFluid = first10 + remainingFluid;
        breakdown.push(`1-10 кг: 10 кг x 100 мл/кг = ${first10} мл`);
        breakdown.push(`10-20 кг: ${roundToTwo(remaining)} кг x 50 мл/кг = ${roundToTwo(remainingFluid)} мл`);
    } else {
        const first20 = 10 * 100 + 10 * 50;
        const remaining = weight - 20;
        const remainingFluid = remaining * 20;
        totalFluid = first20 + remainingFluid;
        breakdown.push(`1-10 кг: 10 кг x 100 мл/кг = 1000 мл`);
        breakdown.push(`10-20 кг: 10 кг x 50 мл/кг = 500 мл`);
        breakdown.push(`> 20 кг: ${roundToTwo(remaining)} кг x 20 мл/кг = ${roundToTwo(remainingFluid)} мл`);
    }

    // Ограничиваем максимальный суточный объем для взрослых до 3000 мл
    if (weight > 20 && totalFluid > 3000) {
        totalFluid = 3000;
        breakdown.push('<br>***Внимание: Расчет ограничен максимальным объемом 3000 мл/сутки.***');
    }

    return { total: Math.round(totalFluid), breakdown: breakdown.join('<br>') };
}

function calculateFluidVolume() {
    const weight = parseFloat(document.getElementById('patientWeight').value);
    const fluidNeed = calculateFluidNeed(weight);
    document.getElementById('totalFluidNeed').textContent = `${fluidNeed.total} мл/сутки`;
    document.getElementById('fluidStatus').textContent = fluidNeed.total > 0 ? 'Расчет по формуле Холлидея-Сегара' : 'Введите данные';
    document.getElementById('fluidBreakdown').innerHTML = fluidNeed.breakdown;
    document.getElementById('totalFluidNeed').dataset.totalFluid = fluidNeed.total; // Сохраняем ЖВО
}

function updatePatientMetrics() {
    const weight = parseFloat(document.getElementById('patientWeight').value);
    const height = parseFloat(document.getElementById('patientHeight').value);
    const age = parseFloat(document.getElementById('patientAge').value);
    const gender = document.getElementById('patientGender').value;
    // Фактор активности берется из input, по умолчанию он установлен в initCalculator
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

    // Обновление ИМТ
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

    // Обновление ОО и СП
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

    // Обновляем расчет ЖВО и рациона
    calculateFluidVolume();
    const selectedProductId = document.getElementById('selectedProduct').value;
    if (dailyNeed > 0 && selectedProductId) {
        calculateRation();
    } else {
        document.getElementById('rationResult').innerHTML = '';
        document.getElementById('additionalFluidResult').innerHTML = '';
    }
}

// --- Главная функция расчета рациона ---

/**
 * Выполняет расчет суточного рациона и его состава.
 * @param {number} totalDailyNeedKcal - Суточная потребность в ккал.
 * @param {object} product - Объект продукта из базы.
 * @param {string} concentrationType - 'ordinary' или 'hyper'.
 * @param {number} numMeals - Количество приемов пищи в сутки.
 * @param {number | null} scoopsOverride - Количество ложек НА ОДИН ПРИЕМ (для округления), или null для точного расчета.
 * @returns {object} Объект с результатами расчета.
 */
function performRationCalculation(totalDailyNeedKcal, product, concentrationType, numMeals, scoopsOverride = null) {
    const scoopsBase = product.scoopsOrdinary;
    const waterBase = product.waterOrdinary;
    const scoopWeight = product.scoopWeight; // Вес 1 ложки в граммах
    const kcalPer100g = product.calories;

    // 1. Определение параметров порции на основе типа разведения
    let scoopsPerServing, waterPerServing;

    if (concentrationType === 'ordinary') {
        scoopsPerServing = scoopsBase;
        waterPerServing = waterBase;
    } else { // 'hyper'
        // Логика по запросу: в 1.5 раза больше смеси на то же количество воды
        scoopsPerServing = scoopsBase * 1.5;
        waterPerServing = waterBase;
    }

    // Объем порции: Объем воды + Объем порошка (принимаем 1г порошка ~ 1мл)
    const powderWeightPerServing = scoopsPerServing * scoopWeight;
    const volumePerServing = waterPerServing + powderWeightPerServing;

    // Расчет Ккал/мл (динамический)
    const kcalPerServing = (kcalPer100g / 100) * powderWeightPerServing;
    const kcalPerMl = kcalPerServing / volumePerServing;

    // 2. Расчет суточных потребностей (на основе ккал)

    let totalVolumeMl, requiredPowderGrams, requiredPowderScoops, requiredWaterMl, totalCalculatedKcal;
    let scoopsPerMeal; // Ложек на один прием

    if (scoopsOverride !== null) {
        // --- УПРОЩЕННЫЙ РАСЧЕТ (С ОКРУГЛЕНИЕМ ЛОЖЕК НА ПРИЕМ) ---
        scoopsPerMeal = scoopsOverride; // scoopsOverride - округленное количество ложек на прием
        requiredPowderScoops = scoopsPerMeal * numMeals;
        requiredPowderGrams = requiredPowderScoops * scoopWeight;

        // Расчет воды: (Общее количество ложек / Ложек на порцию) * Вода на порцию
        const totalServingsBase = requiredPowderScoops / scoopsPerServing;
        const waterCalculated = totalServingsBase * waterPerServing;

        // ИЗМЕНЕНИЕ: Округление воды до десятков в упрощенном расчете
        requiredWaterMl = Math.round(waterCalculated / 10) * 10;

        totalVolumeMl = Math.round(requiredWaterMl + requiredPowderGrams); // ОКРУГЛЕНИЕ ОБЩЕГО ОБЪЕМА

        // Пересчитываем калорийность, исходя из округленного количества порошка
        totalCalculatedKcal = Math.round((kcalPer100g / 100) * requiredPowderGrams);
    } else {
        // --- ТОЧНЫЙ РАСЧЕТ ---
        const requiredTotalVolume = totalDailyNeedKcal / kcalPerMl;
        totalVolumeMl = Math.round(requiredTotalVolume); // ОКРУГЛЕНИЕ ОБЩЕГО ОБЪЕМА

        // Расчет требуемого количества порошка: (Общий объем / Объем порции) * Вес порошка в порции
        const powderWeightPerMl = powderWeightPerServing / volumePerServing;
        requiredPowderGrams = totalVolumeMl * powderWeightPerMl;
        requiredPowderScoops = requiredPowderGrams / scoopWeight;

        requiredWaterMl = totalVolumeMl - requiredPowderGrams;
        requiredWaterMl = Math.round(requiredWaterMl); // ОКРУГЛЕНИЕ ВОДЫ (до целого)
        totalCalculatedKcal = totalDailyNeedKcal; // По определению

        scoopsPerMeal = requiredPowderScoops / numMeals; // Расчет ложек на прием
    }

    // 3. Расчет состава (БЖУ)
    const proteinDailyGrams = (requiredPowderGrams / 100) * product.proteins;
    const fatDailyGrams = (requiredPowderGrams / 100) * product.fats;
    const carbDailyGrams = (requiredPowderGrams / 100) * product.carbs;

    const proteinKcal = Math.round(proteinDailyGrams * 4);
    const fatKcal = Math.round(fatDailyGrams * 9);
    const carbKcal = Math.round(carbDailyGrams * 4);

    const waterPerMeal = requiredWaterMl / numMeals; // Расчет объема воды на прием

    return {
        mealsPerDay: numMeals,
        kcalPerMl: kcalPerMl,
        totalVolumeMl: totalVolumeMl, // уже округлено
        requiredPowderGrams: roundToTwo(requiredPowderGrams),
        requiredPowderScoops: roundToTwo(requiredPowderScoops),
        requiredWaterMl: requiredWaterMl, // уже округлено
        volumePerMeal: roundToTwo(totalVolumeMl / numMeals),
        scoopsPerMeal: roundToTwo(scoopsPerMeal),
        waterPerMeal: roundToTwo(waterPerMeal), // ДОБАВЛЕНО

        proteinDailyGrams: roundToTwo(proteinDailyGrams),
        fatDailyGrams: roundToTwo(fatDailyGrams),
        carbDailyGrams: roundToTwo(carbDailyGrams),

        proteinKcal: proteinKcal,
        fatKcal: fatKcal,
        carbKcal: carbKcal,

        totalDailyNeedKcal: totalDailyNeedKcal,
        totalCalculatedKcal: totalCalculatedKcal,

        scoopsPerServing: roundToTwo(scoopsPerServing),
        waterPerServing: roundToTwo(waterPerServing),
    };
}

/**
 * Формирует HTML-таблицу для результатов расчета.
 * @param {object} result - Результаты расчета от performRationCalculation.
 * @returns {string} HTML-код таблицы.
 */
function buildRationTableHTML(result) {
    return `
        <table class="results-table">
            <thead>
                <tr>
                    <th>Параметр (Ед. изм.)</th> 
                    <th>Значение</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td data-label="Количество приемов (шт/сутки)">Количество приемов (шт/сутки)</td>
                    <td class="highlight">${result.mealsPerDay}</td>
                </tr>
                <tr>
                    <td data-label="Объем на прием (мл)">Объем готовой смеси на прием (мл)</td>
                    <td>${result.volumePerMeal}</td>
                </tr>
                <tr>
                    <td data-label="Порошок на прием (г)">Порошок на прием (г)</td>
                    <td>${roundToTwo(result.requiredPowderGrams / result.mealsPerDay)}</td>
                </tr>
                <tr>
                    <td data-label="Ложек на прием (шт)">Ложек на прием (шт)</td>
                    <td>${result.scoopsPerMeal}</td>
                </tr>
                <tr>
                    <td data-label="Воды на прием (мл)">Объем воды на прием (мл)</td>
                    <td>${result.waterPerMeal}</td>
                </tr>
                <tr class="separator">
                    <td colspan="2">**СУТОЧНЫЙ РАЦИОН**</td>
                </tr>
                <tr>
                    <td data-label="Объем воды (мл)">Объем воды в суточном рационе (мл)</td>
                    <td class="highlight">${result.requiredWaterMl}</td>
                </tr>
                <tr>
                    <td data-label="Сухая смесь (г)">Количество сухой смеси (г)</td>
                    <td class="highlight">${result.requiredPowderGrams}</td>
                </tr>
                <tr>
                    <td data-label="Сухая смесь (ложки)">Количество сухой смеси (ложек)</td>
                    <td class="highlight">${result.requiredPowderScoops}</td>
                </tr>
                <tr>
                    <td data-label="Общий объем (мл)">Общий объем готовой смеси (мл)</td>
                    <td class="highlight">${result.totalVolumeMl}</td>
                </tr>
                <tr class="separator">
                    <td colspan="2">**ПИТАТЕЛЬНАЯ ЦЕННОСТЬ (ККАЛ)**</td>
                </tr>
                <tr>
                    <td data-label="Калорийность (ккал)">Калорийность суточного рациона (ккал)</td>
                    <td class="highlight">${result.totalCalculatedKcal.toFixed(0)}</td>
                </tr>
                <tr>
                    <td data-label="Белки (г)">Белки (г)</td>
                    <td>${result.proteinDailyGrams}</td>
                </tr>
                <tr>
                    <td data-label="Жиры (г)">Жиры (г)</td>
                    <td>${result.fatDailyGrams}</td>
                </tr>
                <tr>
                    <td data-label="Углеводы (г)">Углеводы (г)</td>
                    <td>${result.carbDailyGrams}</td>
                </tr>
            </tbody>
        </table>
    `;
}

function calculateRation() {
    // 1. Получение данных пациента
    const dailyNeed = parseFloat(document.getElementById('dailyNeedResult').dataset.dailyNeed);
    const totalFluidNeedMl = parseFloat(document.getElementById('totalFluidNeed').dataset.totalFluid);
    const numMeals = parseInt(document.getElementById('numMeals').value);

    // 2. Получение данных продукта
    const productSelect = document.getElementById('selectedProduct');
    const selectedProductId = productSelect.value;
    const concentrationType = document.getElementById('concentrationType').value;
    const rationResultDiv = document.getElementById('rationResult');
    const allProducts = window.PRODUCT_DATA || [];
    const selectedProduct = allProducts.find(p => String(p.id) === selectedProductId);

    if (dailyNeed <= 1 || !selectedProductId || numMeals <= 0 || !selectedProduct) {
        rationResultDiv.innerHTML = '<p class="error-message-inline">Введите данные пациента, выберите смесь и количество приемов.</p>';
        document.getElementById('additionalFluidResult').innerHTML = '';
        return;
    }

    // Проверка наличия обязательных данных для разведения
    const { scoopsOrdinary, waterOrdinary, scoopWeight, calories } = selectedProduct;
    if (!scoopsOrdinary || !waterOrdinary || !scoopWeight || !calories) {
        rationResultDiv.innerHTML = `<p class="error-message-inline">Для выбранного продукта не заполнены обязательные параметры разведения (обычное разведение, вес ложки, калории/100г). Заполните их в разделе "Управление продуктами".</p>`;
        document.getElementById('additionalFluidResult').innerHTML = '';
        return;
    }


    // --- 3. Точный расчет (по ккал) ---
    const exactResult = performRationCalculation(dailyNeed, selectedProduct, concentrationType, numMeals);


    // --- 4. Упрощенный расчет (с округлением ложек НА ПРИЕМ) ---

    // Округляем количество ложек на один прием
    const roundedScoopsPerMeal = Math.round(exactResult.scoopsPerMeal);
    // Передаем округленное количество ложек на прием
    const roundedResult = performRationCalculation(dailyNeed, selectedProduct, concentrationType, numMeals, roundedScoopsPerMeal);


    // --- 5. Расчет дополнительной жидкости (на основе ТОЧНОГО РАСЧЕТА) ---
    const totalWaterInRation = exactResult.requiredWaterMl;
    const additionalFluid = Math.max(0, totalFluidNeedMl - totalWaterInRation);

    document.getElementById('additionalFluidResult').innerHTML = `
        <div class="results-section">
            <h4>💧 Расчет дополнительной жидкости</h4>
            <div class="result-card result-portion-volume">
                <h5>Дополнительный объем жидкости</h5>
                <p class="small-metric-value">${additionalFluid} мл</p>
                <p class="metric-status">ЖВО (${totalFluidNeedMl} мл) - Вода в смеси (${totalWaterInRation} мл)</p>
            </div>
        </div>
    `;


    // --- 6. Вывод результатов ---

    const concentrationName = concentrationType === 'ordinary'
        ? 'Обычное'
        : 'Гиперкалорическое (150% сухой смеси)';

    // Формируем блок с общей информацией о разведении (КОМПАКТНЫЙ ВЫВОД)
    const dilutionInfo = `
        <div class="results-section">
            <h4>📄 Расчет рациона: ${escapeHtml(selectedProduct.name)}</h4>
            <p class="ration-summary-compact">
                <strong>Тип разведения:</strong> ${concentrationName} (${exactResult.kcalPerMl.toFixed(2)} ккал/мл). 
                <strong>Базовая порция:</strong> ${exactResult.scoopsPerServing} ложек на ${exactResult.waterPerServing} мл воды.
            </p>
        </div>
    `;

    // --- Структуры для выравнивания таблиц ---

    // Точный расчет: использует пустой элемент для компенсации высоты блока статуса
    const exactStatus = `
        <p class="metric-status status-subtext" style="margin-top: -10px;">Расчет для полного удовлетворения потребности в Ккал</p>
        <p class="metric-status status-caloric-change empty-placeholder">&nbsp;</p> 
    `;

    // Упрощенный расчет: содержит сообщение об изменении калоража
    const caloricChange = roundedResult.totalCalculatedKcal - dailyNeed;
    const waterRoundingInfo = (roundedResult.requiredWaterMl % 10 !== 0) ? '' : `Вода округлена до ${roundedResult.requiredWaterMl} мл (кратное 10).`;
    const roundedStatus = `
        <p class="metric-status status-subtext" style="margin-top: -10px;">Расчет с округлением ложек на прием до ${roundedScoopsPerMeal} шт. ${waterRoundingInfo}</p>
        <p class="metric-status status-caloric-change">
            <strong>Изменение калоража:</strong> ${caloricChange > 0 ? '+' : ''}${caloricChange.toFixed(0)} ккал. 
            (${roundToTwo((roundedResult.totalCalculatedKcal / dailyNeed) * 100)}% от потребности)
        </p>
    `;

    // Выводим результаты в две секции (ИЗМЕНЕНИЕ: Класс для контейнера)
    rationResultDiv.innerHTML = dilutionInfo +
        '<div class="calculation-grid">' + // ИСПОЛЬЗУЕМ НОВЫЙ КЛАСС
        // Колонка 1: Точный расчет
        '<div>' +
        '<h4>Точный расчет рациона</h4>' +
        exactStatus +
        buildRationTableHTML(exactResult) + // Передаем только результат
        '</div>' +

        // Колонка 2: Упрощенный расчет
        '<div>' +
        '<h4>Упрощенный расчет рациона (Округление)</h4>' +
        roundedStatus +
        buildRationTableHTML(roundedResult) + // Передаем только результат
        '</div>' +
        '</div>';
}


async function loadProductsToSelect() {
    const selectElement = document.getElementById('selectedProduct');
    if (!selectElement) return;

    try {
        selectElement.innerHTML = '<option value="">-- Загрузка продуктов... --</option>';

        const products = await ProductsAPI.getAll();
        window.PRODUCT_DATA = products; // Сохраняем глобально для calculateRation

        if (products.length === 0) {
            selectElement.innerHTML = '<option value="">Нет доступных продуктов. Добавьте продукты в базу.</option>';
            return;
        }

        selectElement.innerHTML = '<option value="">-- Выберите смесь --</option>' +
            products.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');

        updatePatientMetrics();

    } catch (error) {
        console.error('Ошибка загрузки продуктов:', error);
        selectElement.innerHTML = '<option value="">Ошибка загрузки продуктов</option>';
        showError('Ошибка загрузки списка продуктов из Supabase. Проверьте RLS и ключи.');
    }
}

function initCalculator() {
    // 1. Установка пустых значений для данных пациента
    const weightInput = document.getElementById('patientWeight');
    const heightInput = document.getElementById('patientHeight');
    const ageInput = document.getElementById('patientAge');

    if (weightInput) weightInput.value = '';
    if (heightInput) heightInput.value = '';
    if (ageInput) ageInput.value = '';

    // 2. Установка Фактора активности по умолчанию (1.2 - Постельный режим)
    const activityFactorElement = document.getElementById('activityFactor');
    if (activityFactorElement) {
        activityFactorElement.value = '1.2';
    }

    // Инициализация слушателей событий
    const inputs = ['patientWeight', 'patientHeight', 'patientAge', 'patientGender', 'activityFactor'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updatePatientMetrics);
        }
    });

    // Первоначальный расчет (с пустыми полями)
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
            document.getElementById('additionalFluidResult').innerHTML = '';
        }
    };
    if (selectedProduct) selectedProduct.addEventListener('change', autoCalculate);
    if (concentrationType) concentrationType.addEventListener('change', autoCalculate);
    if (numMeals) numMeals.addEventListener('input', autoCalculate);
}

function initModal() {
    const productModal = document.getElementById('productModal');
    const searchMedpitanieBtn = document.getElementById('searchMedpitanieBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const productForm = document.getElementById('productForm');

    function closeModal() {
        productModal.style.display = 'none';
        document.getElementById('errorMessage').textContent = '';
        document.getElementById('errorMessage').style.display = 'none';
        productForm.reset();
        document.getElementById('productId').value = '';
    }
    window.closeModal = closeModal;

    async function openModal(productId = null) {
        productForm.reset();
        document.getElementById('productId').value = '';

        const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
        const isAuthenticated = !!user;

        document.getElementById('saveProductBtn').disabled = !isAuthenticated;

        if (productId) {
            const product = await ProductsAPI.getById(productId);
            if (product) {
                document.getElementById('productId').value = product.id;
                document.getElementById('productName').value = product.name || '';
                document.getElementById('productCalories').value = product.calories || '';
                document.getElementById('productProteins').value = product.proteins || '';
                document.getElementById('productFats').value = product.fats || '';
                document.getElementById('productCarbs').value = product.carbs || '';
                document.getElementById('productScoopWeight').value = product.scoopWeight || '';
                document.getElementById('productPackageAmount').value = product.packageAmount || '';

                document.getElementById('productScoopsOrdinary').value = product.scoopsOrdinary || '';
                document.getElementById('productWaterOrdinary').value = product.waterOrdinary || '';
                document.getElementById('servingVolume_ordinary').value = product.servingVolume_ordinary || '';

                document.getElementById('productScoopsHyper').value = product.scoopsHyper || '';
                document.getElementById('productWaterHyper').value = product.waterHyper || '';
                document.getElementById('servingVolume_hyper').value = product.servingVolume_hyper || '';

                document.getElementById('productApplicationMethod').value = product.applicationMethod || '';
                document.getElementById('productDescription').value = product.description || '';
            }
        }

        await loadProductsTable();
        productModal.style.display = 'block';
    }
    window.openModal = openModal;

    searchMedpitanieBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === productModal) {
            closeModal();
        }
    });

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('productId').value;
        const data = {
            name: document.getElementById('productName').value,
            calories: parseFloat(document.getElementById('productCalories').value) || null,
            proteins: parseFloat(document.getElementById('productProteins').value) || null,
            fats: parseFloat(document.getElementById('productFats').value) || null,
            carbs: parseFloat(document.getElementById('productCarbs').value) || null,
            scoopWeight: parseFloat(document.getElementById('productScoopWeight').value) || null,
            packageAmount: parseFloat(document.getElementById('productPackageAmount').value) || null,

            scoopsOrdinary: parseFloat(document.getElementById('productScoopsOrdinary').value) || null,
            waterOrdinary: parseFloat(document.getElementById('productWaterOrdinary').value) || null,
            servingVolume_ordinary: parseFloat(document.getElementById('servingVolume_ordinary').value) || null,

            // Поля гиперкалорического разведения не используются в расчете, но сохраняются в базе
            scoopsHyper: parseFloat(document.getElementById('productScoopsHyper').value) || null,
            waterHyper: parseFloat(document.getElementById('productWaterHyper').value) || null,
            servingVolume_hyper: parseFloat(document.getElementById('servingVolume_hyper').value) || null,

            applicationMethod: document.getElementById('productApplicationMethod').value,
            description: document.getElementById('productDescription').value,
        };

        try {
            if (id) {
                await ProductsAPI.updateProduct(id, data);
                showSuccess(`Продукт "${data.name}" успешно обновлен`);
            } else {
                await ProductsAPI.addProduct(data);
                showSuccess(`Продукт "${data.name}" успешно добавлен`);
            }
            closeModal();
            await loadProductsToSelect();
            await loadProductsTable();

        } catch (error) {
            showError('Ошибка сохранения продукта: ' + error.message);
        }
    });
}

async function loadProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        const isAuthenticated = !!user;

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
                    <button class="btn-small btn-edit" onclick="window.editProduct(${product.id})" ${isAuthenticated ? '' : 'disabled'}>Редактировать</button>
                    <button class="btn-small btn-delete" onclick="window.deleteProduct(${product.id})" ${isAuthenticated ? '' : 'disabled'}>Удалить</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showError('Ошибка загрузки списка продуктов: ' + error.message);
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Ошибка загрузки данных</td></tr>';
    }
}

window.editProduct = async function (productId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await window.openModal(productId);
    } else {
        showError('Для редактирования продуктов необходимо войти в систему.');
    }
};

window.deleteProduct = async function (productId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showError('Для удаления продуктов необходимо войти в систему.');
        return;
    }

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

// --- Инициализация приложения ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Подключаем Supabase, чтобы проверить статус
        if (!window.supabase) {
            showError("Критическая ошибка: Библиотека Supabase не загружена. Проверьте подключение в index.html");
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        updateAuthUI(user);

        initAuthListeners();
        initCalculator();
        initRationListeners();
        initModal();

        await loadProductsToSelect();

        supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                updateAuthUI(session.user);
            } else {
                updateAuthUI(null);
            }
        });

    } catch (error) {
        showError('Ошибка инициализации приложения: ' + error.message);
    }
});