// app.js

// Вспомогательные функции
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.className = 'error-message';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        console.error("Error display element 'errorMessage' not found: " + message);
    }
}

function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.className = 'success-message';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    } else {
        console.log("Success: " + message);
    }
}

function roundToTwo(num) {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
        return 0;
    }
    return Math.round(num * 100) / 100;
}

/**
 * БЕЗОПАСНАЯ ФУНКЦИЯ: Округляет число до заданного количества знаков после запятой.
 * Возвращает '0.00' (или другое заданное значение) в случае undefined, null, NaN или Infinity.
 * @param {number} value - Число для округления.
 * @param {number} digits - Количество знаков после запятой (по умолчанию 1).
 * @returns {string} Округленное число в виде строки.
 */
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


// --- Инициализация Supabase ---
const SUPABASE_URL = 'https://kyxyuhttgyfihakaajsn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_x0GfxNq6Aq2UReH-IGO2iQ_x5zJLX4M';

if (!window.supabase) {
    // В отличие от showError, этот блок вызовет console.error, если даже showError не сработает
    console.error("Ошибка: Библиотека Supabase не загружена. Проверьте подключение в index.html");
}
// Добавлено условие, чтобы избежать ошибки, если window.supabase не загружен
const { createClient } = window.supabase || { createClient: () => ({ auth: { getUser: () => ({ data: {} }), onAuthStateChange: () => { } } }) };
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

    // Безопасное обновление UI
    if (user) {
        if (authStatus) {
            authStatus.textContent = `Вы вошли как: ${user.email}`;
            authStatus.style.color = '#27ae60';
        }
        if (modalAuthStatus) {
            modalAuthStatus.textContent = `Статус: ✅ Вход выполнен (${user.email}). Вы можете добавлять и редактировать продукты.`;
        }
        if (authForm) authForm.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (saveProductBtn) saveProductBtn.disabled = false;
    } else {
        if (authStatus) {
            authStatus.textContent = `Статус: Анонимный`;
            authStatus.style.color = '#e74c3c';
        }
        if (modalAuthStatus) {
            modalAuthStatus.textContent = `Статус: ❌ Для добавления и редактирования продуктов необходимо войти в систему.`;
        }
        if (authForm) authForm.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (saveProductBtn) saveProductBtn.disabled = true;

        const authEmail = document.getElementById('authEmail');
        const authPassword = document.getElementById('authPassword');
        if (authEmail) authEmail.value = '';
        if (authPassword) authPassword.value = '';
    }
    loadProductsTable();
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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);

        showSuccess('Вход выполнен успешно!');
        updateAuthUI(data.user);
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
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');

    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = authEmail ? authEmail.value : '';
            const password = authPassword ? authPassword.value : '';
            signInUser(email, password);
        });
    }

    if (signUpBtn) {
        signUpBtn.addEventListener('click', () => {
            const email = authEmail ? authEmail.value : '';
            const password = authPassword ? authPassword.value : '';
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
// ... ProductsAPI ...

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
            if (error.code !== 'PGRST116') {
                throw new Error(error.message);
            }
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

// function getProteinTarget(weight, proteinNeedPerKg) {
//    return weight > 0 ? weight * proteinNeedPerKg : 0;
//}

function getFluidNeed(weight) {
    if (weight <= 0) {
        return 0;
    }

    let totalFluid = 0;
    if (weight > 20) {
        totalFluid += (weight - 20) * 20;
        totalFluid += 1500;
    } else if (weight > 10) {
        totalFluid += (weight - 10) * 50;
        totalFluid += 1000;
    } else {
        totalFluid = weight * 100;
    }
    return totalFluid;
}

function updatePatientMetrics() {
    const weight = parseFloat(document.getElementById('patientWeight')?.value) || 0;
    const height = parseFloat(document.getElementById('patientHeight')?.value) || 0;
    const age = parseFloat(document.getElementById('patientAge')?.value) || 0;
    const gender = document.getElementById('patientGender')?.value || 'male';
    const activityFactorValue = parseFloat(document.getElementById('activityFactor')?.value) || 1.2;

    const bmiResult = document.getElementById('bmiResult');
    const bmiStatus = document.getElementById('bmiStatus');
    const bmrResult = document.getElementById('bmrResult');
    const dailyNeedResult = document.getElementById('dailyNeedResult');
    const dailyNeedStatus = document.getElementById('dailyNeedStatus');
    const fluidNeedResult = document.getElementById('fluidNeedResult');
    const fluidNeedStatus = document.getElementById('fluidNeedStatus');

    const activityFactorSelect = document.getElementById('activityFactor');
    const activityFactorText = activityFactorSelect?.options[activityFactorSelect.selectedIndex]?.text.split(' - ')[1] || 'Не задан';

    const bmi = calculateBMI(weight, height);
    const bmr = calculateBMR(weight, height, age, gender);
    // const proteinTarget = getProteinTarget(weight, proteinNeedPerKg);
    const fluidNeed = getFluidNeed(weight);

    let dailyNeed = null;

    if (bmiResult) {
        if (bmi) {
            let status = '';
            if (bmi < 18.5) {
                status = 'Недостаток веса';
                bmiStatus.style.color = '#e74c3c';
            } else if (bmi >= 18.5 && bmi < 24.9) {
                status = 'Нормальный вес';
                bmiStatus.style.color = '#27ae60';
            } else if (bmi >= 25 && bmi < 29.9) {
                status = 'Избыточный вес';
                bmiStatus.style.color = '#f39c12';
            } else {
                status = 'Ожирение';
                bmiStatus.style.color = '#c0392b';
            }
            bmiResult.textContent = `${safeToFixed(bmi, 1)} кг/м²`;
            if (bmiStatus) bmiStatus.textContent = status;
        } else {
            bmiResult.textContent = '0.0 кг/м²';
            if (bmiStatus) {
                bmiStatus.textContent = 'Введите данные';
                bmiStatus.style.color = '#95a5a6';
            }
        }
    }


    if (bmrResult && dailyNeedResult) {
        if (bmr) {
            bmrResult.textContent = `${safeToFixed(bmr, 0)} ккал/сутки`;
            dailyNeed = bmr * activityFactorValue;
            dailyNeedResult.textContent = `${safeToFixed(dailyNeed, 0)} ккал/сутки`;
            dailyNeedResult.style.color = '#e67e22';
            if (dailyNeedStatus) dailyNeedStatus.textContent = `ОО * ${safeToFixed(activityFactorValue, 1)} (${activityFactorText})`;
        } else {
            bmrResult.textContent = '0 ккал/сутки';
            dailyNeedResult.textContent = '0 ккал/сутки';
            dailyNeedResult.style.color = '#34495e';
            if (dailyNeedStatus) dailyNeedStatus.textContent = 'ОО * Фактор активности';
        }
        // Сохраняем суточную потребность в атрибуте для использования в calculateRation
        dailyNeedResult.dataset.dailyNeed = dailyNeed ? safeToFixed(dailyNeed, 0) : '0';
    }


    if (fluidNeedResult) {
        fluidNeedResult.textContent = `${safeToFixed(fluidNeed, 0)} мл/сутки`;
        fluidNeedResult.style.color = '#9b59b6';
        if (fluidNeedStatus) fluidNeedStatus.textContent = `Формула: Holliday-Segar 4-2-1`;
        fluidNeedResult.dataset.totalFluid = safeToFixed(fluidNeed, 0);
    }

    calculateRation();
}

/**
 * Основная функция расчета рациона.
 * Возвращает только точный расчет (exactResult).
 */
function runCalculation(product, dailyNeed, feedingsPerDay, concentrationType) {
    const productCalories = product.calories || 0;
    const productScoopWeight = product.scoopWeight || 0;

    // Данные для разведений
    const scoopsStandard = product.scoopsStandard || 0;
    const waterStandard = product.waterStandard || 0;
    const servingVolumeStandard = product.servingVolume_standard || 0;

    const scoopsOrdinary = product.scoopsOrdinary || 0;
    const waterOrdinary = product.waterOrdinary || 0;
    const servingVolumeOrdinary = product.servingVolume_ordinary || 0;

    const scoopsHyper = product.scoopsHyper || 0;
    const waterHyper = product.waterHyper || 0;
    const servingVolumeHyper = product.servingVolume_hyper || 0;

    const packageAmount = product.packageAmount || 0;

    const kcalPerScoop = (productCalories * productScoopWeight) / 100;

    let scoopsPerServing, waterPerServing, servingVolume, baseServingDescription;

    // Логика выбора разведения
    if (concentrationType === 'standard') {
        if (scoopsStandard <= 0 || waterStandard <= 0 || servingVolumeStandard <= 0) {
            throw new Error('MISSING_DATA_STANDARD');
        }
        scoopsPerServing = scoopsStandard;
        waterPerServing = waterStandard;
        servingVolume = servingVolumeStandard;
        baseServingDescription = `${scoopsPerServing} ложек на ${waterPerServing} мл воды`;

    } else if (concentrationType === 'ordinary') {
        if (scoopsOrdinary <= 0 || waterOrdinary <= 0 || servingVolumeOrdinary <= 0) {
            throw new Error('MISSING_DATA_ORDINARY');
        }
        scoopsPerServing = scoopsOrdinary;
        waterPerServing = waterOrdinary;
        servingVolume = servingVolumeOrdinary;
        baseServingDescription = `${scoopsPerServing} ложек на ${waterPerServing} мл воды`;

    } else if (concentrationType === 'hyper') {
        // Проверяем, есть ли данные для гиперкалорического
        if (scoopsHyper > 0 && waterHyper > 0 && servingVolumeHyper > 0) {
            scoopsPerServing = scoopsHyper;
            waterPerServing = waterHyper;
            servingVolume = servingVolumeHyper;
            baseServingDescription = `${scoopsPerServing} ложек на ${waterPerServing} мл воды`;
        } else {
            // Если данных нет, выбрасываем ошибку для уведомления (согласно требованию 3)
            // Раньше был фоллбэк, теперь требование: "отображать уведомление, что нет данных"
            throw new Error('MISSING_DATA_HYPER');
        }
    } else {
        throw new Error('Неизвестный тип разведения');
    }

    const kcalPerServing = kcalPerScoop * scoopsPerServing;
    const concentration = kcalPerServing / servingVolume;

    if (concentration === 0 || isNaN(concentration) || !isFinite(concentration)) {
        if (dailyNeed > 0) {
            throw new Error('Ошибка расчета концентрации. Проверьте данные продукта (Ккал/100г, Вес ложки, Объем порции).');
        }
    }

    const requiredVolumeMl = dailyNeed / concentration;
    const requiredScoopsTotal = (requiredVolumeMl / servingVolume) * scoopsPerServing;
    const totalWaterInRationExact = (requiredScoopsTotal / scoopsPerServing) * waterPerServing;
    const totalMixWeightGramsExact = requiredScoopsTotal * productScoopWeight;
    const totalKcalExact = kcalPerScoop * requiredScoopsTotal;

    const packageAmountCheck = packageAmount > 0;
    const daysSupplyExact = (packageAmountCheck && totalMixWeightGramsExact > 0)
        ? (packageAmount / totalMixWeightGramsExact)
        : 0;
    const canSupplyPerMonthExact = daysSupplyExact > 0 ? (30 / daysSupplyExact) : 0;

    const exactResult = {
        concentration,
        kcalPerMl: concentration,
        scoopsPerServing,
        waterPerServing,
        baseServingDescription: baseServingDescription,
        feedingsPerDay: feedingsPerDay,
        totalCalculatedKcal: totalKcalExact,
        totalMixWeightGrams: totalMixWeightGramsExact,
        requiredVolumeMl: requiredVolumeMl,
        requiredScoopsTotal: requiredScoopsTotal,
        requiredWaterMl: totalWaterInRationExact,
        dailyVolumeLitres: requiredVolumeMl / 1000,
        daysSupply: daysSupplyExact,
        canSupplyPerMonth: canSupplyPerMonthExact,
        requiredScoopsPerMeal: requiredScoopsTotal / feedingsPerDay,
        requiredWaterPerMeal: totalWaterInRationExact / feedingsPerDay,
        volumePerMealMl: requiredVolumeMl / feedingsPerDay,
        kcalPerMeal: totalKcalExact / feedingsPerDay,
        // Detailed parameters for debugging/transparency
        details: {
            kcalPerScoop,
            servingVolume,
            packageAmount,
            scoopsPerServing,
            waterPerServing
        }
    };

    return exactResult;
}


function buildRationTableHTML(result) {
    const createRowUnit = (label, value, unit, isHighlight = false, precision = 1) => `
        <tr>
            <td data-label="${label}">${label}</td>
            <td class="${isHighlight ? 'highlight' : ''}">${safeToFixed(value, precision)} ${unit}</td>
        </tr>
    `;

    const tableHTML = `
        <table class="results-table">
            <thead>
                <tr>
                    <th colspan="2">Количество на один прием</th>
                </tr>
            </thead>
            <tbody>
                ${createRowUnit('Ложек', result.requiredScoopsPerMeal, 'шт.', true, 2)}
                ${createRowUnit('Воды', result.requiredWaterPerMeal, 'мл', true, 0)}
                ${createRowUnit('Готовый раствор (прибл.)', result.volumePerMealMl, 'мл', true, 0)}
                ${createRowUnit('Калорийность', result.kcalPerMeal, 'ккал', false, 0)}
            </tbody>

            <thead>
                <tr>
                    <th colspan="2">Количество на сутки</th>
                </tr>
            </thead>
            <tbody>
                ${createRowUnit('Вес сухой смеси', result.totalMixWeightGrams, 'г', true, 1)}
                ${createRowUnit('Общее количество ложек', result.requiredScoopsTotal, 'шт.', false, 2)}
                ${createRowUnit('Общее количество воды', result.requiredWaterMl, 'мл', true, 0)}
                <tr>
                    <td data-label="Общий объем раствора (прибл.)">Общий объем раствора (прибл.)</td>
                    <td class="highlight">${safeToFixed(result.requiredVolumeMl, 0)} мл (${safeToFixed(result.dailyVolumeLitres, 2)} л)</td>
                </tr>
                ${createRowUnit('Калорийность', result.totalCalculatedKcal, 'ккал', false, 0)}
            </tbody>

            <thead>
                <tr>
                    <th colspan="2">Расход продукта</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td data-label="На сколько суток хватит банки смеси">На сколько суток хватит банки смеси</td>
                    <td class="highlight">${result.daysSupply > 0 ? safeToFixed(result.daysSupply, 1) + ' дн.' : 'Н/Д (Вес упаковки не указан)'}</td>
                </tr>
                <tr>
                    <td data-label="Сколько банок нужно на месяц (30 дн.)">Сколько банок нужно на месяц (30 дн.)</td>
                    <td class="highlight">${result.canSupplyPerMonth > 0 ? safeToFixed(result.canSupplyPerMonth, 1) + ' шт.' : 'Н/Д (Вес упаковки не указан)'}</td>
                </tr>
            </tbody>
        </table>
    `;
    return tableHTML;
}

async function calculateRation() {
    const rationResultDiv = document.getElementById('rationResult');
    const additionalFluidResultDiv = document.getElementById('additionalFluidResult');
    const exportBtn = document.getElementById('exportBtn');

    if (rationResultDiv) rationResultDiv.style.display = 'none';
    if (additionalFluidResultDiv) additionalFluidResultDiv.style.display = 'none';
    if (exportBtn) exportBtn.style.display = 'none';

    // Читаем метрическую потребность (для справки и экспорта)
    const dailyNeedMetric = parseFloat(document.getElementById('dailyNeedResult')?.dataset.dailyNeed) || 0;
    // Читаем потребность для расчета смеси (НОВЫЙ ИСТОЧНИК ДАННЫХ)
    const requiredMixKcal = parseFloat(document.getElementById('requiredMixKcal')?.value) || 0;

    const totalFluidNeedMl = parseFloat(document.getElementById('fluidNeedResult')?.dataset.totalFluid) || 0;
    const selectedProductId = document.getElementById('selectedProduct')?.value;
    const feedingsPerDay = parseInt(document.getElementById('feedingsPerDay')?.value, 10) || 0;
    const concentrationType = document.getElementById('concentrationType')?.value || 'ordinary';

    // ВАЛИДАЦИЯ по новому полю
    if (requiredMixKcal <= 0 || !selectedProductId || feedingsPerDay <= 0) {
        return;
    }

    try {
        const selectedProduct = await ProductsAPI.getById(selectedProductId);

        if (!selectedProduct) {
            showError('Не удалось найти данные выбранного продукта.');
            return;
        }

        // Вызываем runCalculation, передавая requiredMixKcal
        const exactResult = runCalculation(
            selectedProduct,
            requiredMixKcal,
            feedingsPerDay,
            concentrationType
        );

        let concentrationName = '';
        if (concentrationType === 'standard') concentrationName = 'Разведение "как на банке"';
        else if (concentrationType === 'ordinary') concentrationName = 'Изокалорическое разведение';
        else if (concentrationType === 'hyper') concentrationName = 'Гиперкалорическое разведение';

        const dilutionInfo = `
            <div class="results-section">
                <h4>📄 Расчет рациона: ${escapeHtml(selectedProduct.name)}</h4>
                <p class="ration-summary-compact">
                    <strong>Тип разведения:</strong> ${concentrationName}.
                    <strong>Концентрация:</strong> ${safeToFixed(exactResult.kcalPerMl, 2)} ккал/мл.
                </p>
                <div class="calculation-details-block" style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 0.9em; color: #555;">
                    <strong>Детали расчета (базовая порция):</strong><br>
                    • ${exactResult.details.scoopsPerServing} ложек на ${exactResult.details.waterPerServing} мл воды = ${safeToFixed(exactResult.details.servingVolume, 1)} мл готового раствора.<br>
                    • Калорийность 1 ложки: ${safeToFixed(exactResult.details.kcalPerScoop, 2)} ккал.<br>
                    • Калорийность порции: ${safeToFixed(exactResult.details.kcalPerScoop * exactResult.details.scoopsPerServing, 1)} ккал.<br>
                    <em>Расчет: ${safeToFixed(requiredMixKcal, 0)} ккал / ${safeToFixed(exactResult.kcalPerMl, 4)} ккал/мл = ${safeToFixed(exactResult.requiredVolumeMl, 0)} мл раствора.</em>
                </div>
            </div>
        `;

        if (rationResultDiv) {
            rationResultDiv.innerHTML = dilutionInfo +
                '<div class="calculation-section only-exact">' +
                '<div>' +
                buildRationTableHTML(exactResult) +
                '</div>' +
                '</div>';

            rationResultDiv.style.display = 'block';
        }

        const totalWaterInRationExact = exactResult.requiredWaterMl;
        const additionalFluidExact = Math.max(0, totalFluidNeedMl - totalWaterInRationExact);

        if (additionalFluidResultDiv) {
            additionalFluidResultDiv.innerHTML = `
                <div class="results-section fluid-section">
                    <h4>💧 Расчет дополнительной жидкости</h4>
                    <div class="patient-metrics">
                        <div class="result-card">
                            <h5>Дополнительный объем жидкости</h5>
                            <p class="metric-value">${safeToFixed(additionalFluidExact, 0)} мл</p>
                            <p class="metric-status">ЖВО (${safeToFixed(totalFluidNeedMl, 0)} мл) - Вода в смеси (${safeToFixed(totalWaterInRationExact, 0)} мл)</p>
                        </div>
                    </div>
                </div>
            `;
            additionalFluidResultDiv.style.display = 'block';
        }

        if (exportBtn) exportBtn.style.display = 'inline-block';

        window.lastCalculationResult = {
            exactResult,
            selectedProduct,
            calculatedDailyNeed: dailyNeedMetric,
            mixKcalUsed: requiredMixKcal,
            feedingsPerDay,
            totalFluidNeedMl
        };

    } catch (error) {
        if (error.message.startsWith('MISSING_DATA')) {
            let msg = 'Для данного вида смеси нет данных по этому виду разведения.';
            if (error.message === 'MISSING_DATA_STANDARD') msg = 'Для выбранной смеси не заполнены данные разведения "как на банке".';
            if (error.message === 'MISSING_DATA_ORDINARY') msg = 'Для выбранной смеси не заполнены данные изокалорического разведения.';
            if (error.message === 'MISSING_DATA_HYPER') msg = 'Для выбранной смеси не заполнены данные гиперкалорического разведения.';

            if (rationResultDiv) {
                rationResultDiv.innerHTML = `<div class="results-section"><p class="error-message-inline">${msg}</p></div>`;
                rationResultDiv.style.display = 'block';
            }
            if (additionalFluidResultDiv) additionalFluidResultDiv.style.display = 'none';
            if (exportBtn) exportBtn.style.display = 'none';
        } else {
            console.error('Критическая ошибка расчета рациона (Детали):', error);
            showError('Критическая ошибка расчета: ' + (error.message || 'Неизвестная ошибка (проверьте консоль)'));
        }
    }
}


// --- ФУНКЦИИ УПРАВЛЕНИЯ ПРОДУКТАМИ ---

async function loadProductsToSelect() {
    const selectElement = document.getElementById('selectedProduct');
    if (!selectElement) return;

    try {
        selectElement.innerHTML = '<option value="">-- Загрузка продуктов... --</option>';
        const products = await ProductsAPI.getAll();

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

async function loadProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    try {
        const products = await ProductsAPI.getAll();
        const { data: { user } } = await supabase.auth.getUser();
        const isAuthenticated = !!user;

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Нет продуктов в базе данных</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${escapeHtml(product.name)}</td>
                <td>${product.calories || '—'}</td>
                <td>
                    <button class="btn-small btn-edit" onclick="editProduct(${product.id})" ${isAuthenticated ? '' : 'disabled'}>Редактировать</button>
                    <button class="btn-small btn-delete" onclick="deleteProduct(${product.id})" ${isAuthenticated ? '' : 'disabled'}>Удалить</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showError('Ошибка загрузки списка продуктов: ' + error.message);
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Ошибка загрузки данных</td></tr>';
    }
}


// --- ФУНКЦИИ МОДАЛЬНОГО ОКНА ---

async function openModal(productId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const modalTitle = document.getElementById('modalTitle');
    const saveProductBtn = document.getElementById('saveProductBtn');

    if (form) form.reset();
    document.getElementById('productId').value = '';

    await loadProductsTable();

    if (modalTitle) {
        modalTitle.textContent = productId ? 'Редактировать продукт' : 'Добавить новый продукт';
    }
    if (saveProductBtn) {
        saveProductBtn.textContent = productId ? 'Сохранить изменения' : 'Сохранить';
    }

    if (productId) {
        try {
            const product = await ProductsAPI.getById(productId);
            if (product) {
                // Заполнение полей формы (добавлены безопасные обращения к DOM)
                document.getElementById('productId').value = product.id;
                document.getElementById('productName').value = product.name || '';
                document.getElementById('productCalories').value = product.calories || '';
                document.getElementById('scoopWeight').value = product.scoopWeight || '';
                // P/F/C removed
                document.getElementById('packageAmount').value = product.packageAmount || '';

                document.getElementById('scoopsStandard').value = product.scoopsStandard || '';
                document.getElementById('waterStandard').value = product.waterStandard || '';
                document.getElementById('servingVolume_standard').value = product.servingVolume_standard || '';

                document.getElementById('scoopsOrdinary').value = product.scoopsOrdinary || '';
                document.getElementById('waterOrdinary').value = product.waterOrdinary || '';
                document.getElementById('servingVolume_ordinary').value = product.servingVolume_ordinary || '';

                document.getElementById('scoopsHyper').value = product.scoopsHyper || '';
                document.getElementById('waterHyper').value = product.waterHyper || '';
                document.getElementById('servingVolume_hyper').value = product.servingVolume_hyper || '';

                document.getElementById('productApplicationMethod').value = product.applicationMethod || '';
                document.getElementById('productDescription').value = product.description || '';
            } else {
                showError('Продукт не найден.');
                return;
            }
        } catch (error) {
            showError('Ошибка загрузки данных продукта: ' + error.message);
            return;
        }
    }

    if (modal) { // Безопасный вызов
        modal.style.display = 'block';
    }
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) { // Безопасный вызов
        modal.style.display = 'none';
    }
}

function initModal() {
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const searchMedpitanieBtn = document.getElementById('searchMedpitanieBtn');
    const productModal = document.getElementById('productModal');
    const productForm = document.getElementById('productForm');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    if (searchMedpitanieBtn) {
        searchMedpitanieBtn.addEventListener('click', () => openModal());
    }

    // Закрытие по клику вне модального окна
    if (productModal) {
        window.addEventListener('click', (event) => {
            if (event.target === productModal) {
                closeModal();
            }
        });
    }

    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const productId = document.getElementById('productId').value;
            const product = {
                // Добавлено || 0 для числовых полей
                name: document.getElementById('productName').value,
                calories: parseFloat(document.getElementById('productCalories').value) || 0,
                scoopWeight: parseFloat(document.getElementById('scoopWeight').value) || 0,
                packageAmount: parseFloat(document.getElementById('packageAmount').value) || 0,

                // Разведение "как на банке" (Standard)
                scoopsStandard: parseFloat(document.getElementById('scoopsStandard').value) || 0,
                waterStandard: parseFloat(document.getElementById('waterStandard').value) || 0,
                servingVolume_standard: parseFloat(document.getElementById('servingVolume_standard').value) || 0,

                // Обычное разведение
                scoopsOrdinary: parseFloat(document.getElementById('scoopsOrdinary').value) || 0,
                waterOrdinary: parseFloat(document.getElementById('waterOrdinary').value) || 0,
                servingVolume_ordinary: parseFloat(document.getElementById('servingVolume_ordinary').value) || 0,

                // Гиперкалорическое разведение
                scoopsHyper: parseFloat(document.getElementById('scoopsHyper').value) || 0,
                waterHyper: parseFloat(document.getElementById('waterHyper').value) || 0,
                servingVolume_hyper: parseFloat(document.getElementById('servingVolume_hyper').value) || 0,

                applicationMethod: document.getElementById('productApplicationMethod').value,
                description: document.getElementById('productDescription').value,
            };

            if (product.calories <= 0 || product.scoopWeight <= 0) {
                showError('Заполните все обязательные поля корректными числовыми значениями (Название, Ккал, Вес ложки).');
                return;
            }

            try {
                if (productId) {
                    await ProductsAPI.updateProduct(productId, product);
                    showSuccess('Продукт успешно обновлен!');
                } else {
                    await ProductsAPI.addProduct(product);
                    showSuccess('Продукт успешно добавлен!');
                }
                closeModal();
                await loadProductsToSelect();
                await loadProductsTable();
            } catch (error) {
                showError('Ошибка сохранения продукта: ' + error.message);
            }
        });
    }
}


// --- ФУНКЦИИ ИНИЦИАЛИЗАЦИИ И СЛУШАТЕЛЕЙ ---

function initRationListeners() {
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) { // Безопасная проверка
        calculateBtn.addEventListener('click', calculateRation);
    }

    // Добавляем слушатель на все поля, влияющие на расчет, для автоматического обновления
    const calculationInputs = [
        'requiredMixKcal', // <-- ДОБАВЛЕНО НОВОЕ ПОЛЕ
        'selectedProduct', 'feedingsPerDay', 'concentrationType'
    ];
    calculationInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', calculateRation);
            // Добавляем 'input' для поля калорийности, чтобы реагировать мгновенно
            if (id === 'requiredMixKcal') {
                element.addEventListener('input', calculateRation);
            }
        }
    });

    // Слушатели на параметры пациента
    const patientInputs = [
        'patientWeight', 'patientHeight', 'patientAge', 'patientGender', 'activityFactor'
    ];
    patientInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updatePatientMetrics);
            element.addEventListener('input', updatePatientMetrics);
            // ФИКС: Добавлен blur для мобильных устройств, где change/input могут не срабатывать
            element.addEventListener('blur', updatePatientMetrics);
        }
    });

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) { // Безопасная проверка
        exportBtn.addEventListener('click', exportToExcel);
    }
}

function initCalculator() {
    updatePatientMetrics();
}


// --- ФУНКЦИЯ ЭКСПОРТА В EXCEL ---

function exportToExcel() {
    if (!window.lastCalculationResult) {
        showError('Сначала выполните расчет рациона.');
        return;
    }

    // Извлечение обоих значений калорийности
    const {
        exactResult,
        selectedProduct,
        calculatedDailyNeed,
        mixKcalUsed,
        feedingsPerDay,
        totalFluidNeedMl
    } = window.lastCalculationResult;

    const totalWaterInRationExact = exactResult.requiredWaterMl;
    const additionalFluidExact = Math.max(0, totalFluidNeedMl - totalWaterInRationExact);


    const data = [
        ["Параметр", "Значение"],
        ["Продукт", selectedProduct.name],
        ["Состав порции", exactResult.baseServingDescription],
        ["Суточная потребность (расчет по метрикам), ккал", safeToFixed(calculatedDailyNeed, 0)], // Добавлено метрическое значение
        ["ПОТРЕБНОСТЬ ДЛЯ РАСЧЕТА СМЕСИ (ККАЛ)", safeToFixed(mixKcalUsed, 0)], // Добавлено значение, использованное для расчета
        ["Количество приемов", feedingsPerDay],
        ["Концентрация, ккал/мл", safeToFixed(exactResult.kcalPerMl, 2)],
        ["---", "---"],

        // НА ОДИН ПРИЕМ
        ["Ложек на прием, шт.", roundToTwo(exactResult.requiredScoopsPerMeal)],
        ["Воды на прием, мл", safeToFixed(exactResult.requiredWaterPerMeal, 0)],
        ["Объем готового р-ра на прием, мл", safeToFixed(exactResult.volumePerMealMl, 0)],
        ["Калорийность на прием, ккал", safeToFixed(exactResult.kcalPerMeal, 0)],
        ["---", "---"],

        // НА СУТКИ
        ["Вес сухой смеси, г", safeToFixed(exactResult.totalMixWeightGrams, 1)],
        ["Общее количество ложек, шт.", safeToFixed(exactResult.requiredScoopsTotal, 2)],
        ["Общее количество воды, мл", safeToFixed(exactResult.requiredWaterMl, 0)],
        ["Общий объем раствора, мл", safeToFixed(exactResult.requiredVolumeMl, 0)],
        ["Общая калорийность, ккал", safeToFixed(exactResult.totalCalculatedKcal, 0)],
        ["---", "---"],

        // РАСХОД
        ["На сколько суток хватит банки, дн.", exactResult.daysSupply > 0 ? safeToFixed(exactResult.daysSupply, 1) : 'Н/Д'],
        ["Сколько банок нужно на месяц (30 дн.), шт.", exactResult.canSupplyPerMonth > 0 ? safeToFixed(exactResult.canSupplyPerMonth, 1) : 'Н/Д'],
        ["---", "---"],

        // ЖВО
        ["Целевое ЖВО, мл", safeToFixed(totalFluidNeedMl, 0)],
        ["Вода из смеси, мл", safeToFixed(totalWaterInRationExact, 0)],
        ["Дополнительная жидкость, мл", safeToFixed(additionalFluidExact, 0)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Расчет рациона");

    const patientNameElement = document.getElementById('patientName');
    const patientName = (patientNameElement && patientNameElement.value) ? patientNameElement.value : 'Пациент';

    const filename = `Расчет_${selectedProduct.name.replace(/\s/g, '_')}_${patientName}_${new Date().toLocaleDateString()}.xlsx`;

    XLSX.writeFile(wb, filename);
    showSuccess('Данные успешно экспортированы в Excel!');
}

// --- ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ---

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Проверка Supabase, чтобы избежать ошибки
        if (!window.supabase) {
            showError("Критическая ошибка: Библиотека Supabase не загружена. Проверьте подключение в index.html");
            return;
        }

        // 2. Проверка статуса аутентификации при старте
        const { data: { user } } = await supabase.auth.getUser();
        updateAuthUI(user);

        // 3. Инициализация слушателей
        initAuthListeners();
        initCalculator();
        initRationListeners();
        initModal();

        // 4. Загрузка продуктов
        await loadProductsToSelect();

        // 5. Добавляем слушатель для отслеживания изменений сессии (вход/выход)
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

// Глобальные функции для кнопок
window.editProduct = async function (productId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await openModal(productId);
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