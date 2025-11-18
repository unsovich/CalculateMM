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
    const exportBtn = document.getElementById('exportBtn');


    // Элементы, которые нужно показать/скрыть
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');
    const signInBtn = document.getElementById('signInBtn');
    const signUpBtn = document.getElementById('signUpBtn');

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
    // Обновляем состояние таблицы продуктов
    loadProductsTable();
}

async function signUpUser(email, password) {
    try {
        // Проверяем, существует ли пользователь, чтобы избежать ошибки при включенном email-confirmation
        const { data: { user: existingUser } } = await supabase.auth.admin.getUserByEmail(email);
        if (existingUser && existingUser.confirmed_at) {
            showError('Ошибка: Пользователь с таким email уже существует и подтвержден.');
            return;
        }

        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw new Error(error.message);

        showSuccess('Регистрация успешна! Проверьте почту для подтверждения.');
        // Если настроено подтверждение почты, пользователь не войдет сразу
        // Если нет, вызываем проверку статуса
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
        // Убедитесь, что RLS разрешает чтение для анонимного пользователя
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true }); // Добавим сортировку для удобства
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
            .single(); // Ожидаем один результат
        if (error) {
            if (error.code !== 'PGRST116') return null; // Ошибка "не найдено"
            throw new Error(error.message);
        }
        return data;
    },

    async addProduct(product) {
        // Требуется роль 'authenticated' для INSERT (настройка RLS)
        const { data, error } = await supabase.from('products').insert([product]).select();
        if (error) throw new Error(error.message);
        return data[0];
    },

    async updateProduct(id, product) {
        // Требуется роль 'authenticated' для UPDATE (настройка RLS)
        const numericId = parseInt(id, 10);
        const { data, error } = await supabase.from('products').update(product).eq('id', numericId).select();
        if (error) throw new Error(error.message);
        return data[0];
    },

    async deleteProduct(id) {
        // Требуется роль 'authenticated' для DELETE (настройка RLS)
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
        // Формула Харриса-Бенедикта (исходная, 1919 г.)
        if (gender === 'male') {
            bmr = 66.5 + (13.75 * weight) + (5.003 * height) - (6.75 * age);
        } else {
            bmr = 655.1 + (9.563 * weight) + (1.850 * height) - (4.676 * age);
        }
        return bmr;
    }
    return null;
}

function getProteinTarget(weight, proteinNeedPerKg) {
    return weight > 0 ? weight * proteinNeedPerKg : 0;
}

/**
 * Расчет суточной потребности в жидкости (ЖВО) по формуле Holliday-Segar 4-2-1.
 * @param {number} weight - Вес пациента в кг.
 * @returns {number} Объем жидкости в мл.
 */
function getFluidNeed(weight) {
    if (weight <= 0) {
        return 0;
    }

    let totalFluid = 0;

    if (weight > 20) {
        // Больше 20 кг: 20 мл/кг для веса свыше 20 кг
        totalFluid += (weight - 20) * 20;
        // Первые 20 кг = 1500 мл (10*100 + 10*50)
        totalFluid += 1500;
    } else if (weight > 10) {
        // 11-20 кг: 50 мл/кг для веса с 11 до 20 кг
        totalFluid += (weight - 10) * 50;
        // Первые 10 кг = 1000 мл (10*100)
        totalFluid += 1000;
    } else {
        // 0-10 кг: 100 мл/кг
        totalFluid = weight * 100;
    }

    return totalFluid;
}

function updatePatientMetrics() {
    const weight = parseFloat(document.getElementById('patientWeight').value);
    const height = parseFloat(document.getElementById('patientHeight').value);
    const age = parseFloat(document.getElementById('patientAge').value);
    const gender = document.getElementById('patientGender').value;
    const activityFactorValue = parseFloat(document.getElementById('activityFactor').value) || 1.2;
    const proteinNeedPerKg = parseFloat(document.getElementById('proteinNeed').value) || 1.5;

    const bmiResult = document.getElementById('bmiResult');
    const bmiStatus = document.getElementById('bmiStatus');
    const bmrResult = document.getElementById('bmrResult');
    const dailyNeedResult = document.getElementById('dailyNeedResult');
    const dailyNeedStatus = document.getElementById('dailyNeedStatus');
    const fluidNeedResult = document.getElementById('fluidNeedResult');
    const fluidNeedStatus = document.getElementById('fluidNeedStatus');
    const proteinTargetResult = document.getElementById('proteinTargetResult');
    const proteinTargetStatus = document.getElementById('proteinTargetStatus');

    const activityFactorSelect = document.getElementById('activityFactor');
    const activityFactorText = activityFactorSelect.options[activityFactorSelect.selectedIndex].text.split(' - ')[1] || 'Не задан';

    const bmi = calculateBMI(weight, height);
    const bmr = calculateBMR(weight, height, age, gender);
    const proteinTarget = getProteinTarget(weight, proteinNeedPerKg);
    const fluidNeed = getFluidNeed(weight); // Используем Holliday-Segar

    let dailyNeed = null;

    // Обновление ИМТ
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
        bmiResult.textContent = `${bmi.toFixed(1)} кг/м²`;
        bmiStatus.textContent = status;
    } else {
        bmiResult.textContent = '0.0 кг/м²';
        bmiStatus.textContent = 'Введите данные';
        bmiStatus.style.color = '#95a5a6';
    }

    // Обновление ОО и Суточной потребности
    if (bmr) {
        bmrResult.textContent = `${bmr.toFixed(0)} ккал/сутки`;
        dailyNeed = bmr * activityFactorValue;
        dailyNeedResult.textContent = `${dailyNeed.toFixed(0)} ккал/сутки`;
        dailyNeedResult.style.color = '#e67e22';
        dailyNeedStatus.textContent = `ОО * ${activityFactorValue.toFixed(1)} (${activityFactorText})`;
    } else {
        bmrResult.textContent = '0 ккал/сутки';
        dailyNeedResult.textContent = '0 ккал/сутки';
        dailyNeedResult.style.color = '#34495e';
        dailyNeedStatus.textContent = 'ОО * Фактор активности';
    }

    // Обновление ЖВО (используем Holliday-Segar)
    fluidNeedResult.textContent = `${fluidNeed.toFixed(0)} мл/сутки`;
    fluidNeedResult.style.color = '#9b59b6';
    fluidNeedStatus.textContent = `Формула: Holliday-Segar 4-2-1`; // Обновлено
    fluidNeedResult.dataset.totalFluid = fluidNeed.toFixed(0); // Сохраняем ЖВО для дальнейшего расчета


    // Обновление Целевого белка
    proteinTargetResult.textContent = `${proteinTarget.toFixed(0)} г/сутки`;
    proteinTargetResult.style.color = '#c0392b';
    proteinTargetStatus.textContent = `Вес * ${proteinNeedPerKg.toFixed(1)} г/кг`;

    // Сохраняем суточную потребность в атрибуте для использования в calculateRation
    dailyNeedResult.dataset.dailyNeed = dailyNeed ? dailyNeed.toFixed(0) : '0';

    // Сбрасываем/обновляем расчет рациона
    calculateRation();
}

// --- ФУНКЦИИ РАСЧЕТА РАЦИОНА ---

/**
 * Основная функция расчета рациона.
 * @param {object} product - Выбранный продукт из базы.
 * @param {number} dailyNeed - Суточная потребность в ккал.
 * @param {number} feedingsPerDay - Количество приемов в сутки.
 * @param {string} concentrationType - 'ordinary' или 'hypercaloric'.
 * @param {number} scoopRounding - Шаг округления ложек (0, 0.5, 1.0).
 * @returns {object} Объект с точным и округленным результатом.
 */
function runCalculation(product, dailyNeed, feedingsPerDay, concentrationType, scoopRounding) {
    // Безопасное чтение числовых полей продукта, предотвращающее ошибки с NaN/null (Fix 2: Robustness)
    const productCalories = product.calories || 0;
    const productScoopWeight = product.scoopWeight || 0;
    const productProteins = product.proteins || 0;
    const productFats = product.fats || 0;
    const productCarbs = product.carbs || 0;

    const scoopsOrdinary = product.scoopsOrdinary || 0;
    const waterOrdinary = product.waterOrdinary || 0;
    const servingVolumeOrdinary = product.servingVolume_ordinary || 0;
    const scoopsHyper = product.scoopsHyper || 0;
    const waterHyper = product.waterHyper || 0;
    const servingVolumeHyper = product.servingVolume_hyper || 0;
    const packageAmount = product.packageAmount || 0;

    // 1. Определение параметров разведения
    const isOrdinary = concentrationType === 'ordinary';

    // Базовые метрики для одной ложки (Ккал, Б, Ж, У на 1 ложку)
    const kcalPerScoop = (productCalories * productScoopWeight) / 100;
    const proteinPerScoop = (productProteins * productScoopWeight) / 100;
    const fatPerScoop = (productFats * productScoopWeight) / 100;
    const carbsPerScoop = (productCarbs * productScoopWeight) / 100;

    let scoopsPerServing, waterPerServing, servingVolume, baseServingDescription;

    if (isOrdinary) {
        // --- ОБЫЧНОЕ РАЗВЕДЕНИЕ (ОСНОВАНО НА ДАННЫХ ПРОДУКТА) ---
        scoopsPerServing = scoopsOrdinary;
        waterPerServing = waterOrdinary;
        servingVolume = servingVolumeOrdinary;
        baseServingDescription = `${scoopsPerServing} ложек на ${waterPerServing} мл воды`;

        // Проверка, что продукт настроен
        if (servingVolume === 0 || scoopsPerServing === 0) {
            throw new Error(`Продукт "${product.name}" не настроен для обычного разведения. Проверьте "Ложки на порцию" и "Объем готового раствора".`);
        }

    } else { // Hypercaloric
        let useHyperParams = (scoopsHyper > 0 && waterHyper > 0 && servingVolumeHyper > 0);

        if (useHyperParams) {
            // --- ГИПЕРКАЛОРИЧЕСКОЕ РАЗВЕДЕНИЕ (ИЗ БАЗЫ) ---
            scoopsPerServing = scoopsHyper;
            waterPerServing = waterHyper;
            servingVolume = servingVolumeHyper;
            baseServingDescription = `${scoopsPerServing} ложек на ${waterPerServing} мл воды`;

        } else {
            // --- ГИПЕРКАЛОРИЧЕСКОЕ РАЗВЕДЕНИЕ (ФОЛЛБЭК 1.5x) ---

            // 1. Проверяем наличие обычного разведения для фоллбэка
            if (scoopsOrdinary <= 0 || waterOrdinary <= 0 || servingVolumeOrdinary <= 0) {
                throw new Error(`Продукт "${product.name}" не настроен для гиперкалорического разведения и не имеет данных для фоллбэка (обычное разведение).`);
            }

            // 2. Увеличиваем сухую смесь в 1.5 раза
            scoopsPerServing = roundToTwo(scoopsOrdinary * 1.5);

            // 3. Воду оставляем прежней
            waterPerServing = waterOrdinary;

            // 4. Расчет нового объема готового раствора
            // Предполагаем, что объем порошка на ложку постоянен: (Объем об.р-ра - Вода об.р-ра) / Ложки об.р-ра
            const powderVolumePerScoop = (servingVolumeOrdinary - waterOrdinary) / scoopsOrdinary;
            servingVolume = (scoopsPerServing * powderVolumePerScoop) + waterPerServing;

            baseServingDescription = `${scoopsPerServing.toFixed(1)} ложек на ${waterPerServing} мл воды (1.5x фоллбэк)`;

            if (servingVolume === 0 || scoopsPerServing === 0) {
                throw new Error('Ошибка расчета параметров гиперкалорического разведения (фоллбэк). Проверьте данные обычного разведения.');
            }
        }
    }


    // Ккал в готовой порции (ScoopsPerServing ложек)
    const kcalPerServing = kcalPerScoop * scoopsPerServing;

    // Концентрация (Ккал/мл)
    const concentration = kcalPerServing / servingVolume;
    if (concentration === 0 || isNaN(concentration) || !isFinite(concentration)) {
        throw new Error('Ошибка расчета концентрации. Проверьте данные продукта (Ккал/100г, Вес ложки, Объем порции).');
    }

    // 2. Расчет Точного рациона (exactResult)

    // Общий необходимый объем готового раствора (мл)
    const requiredVolumeMl = dailyNeed / concentration;

    // Общее количество ложек в сутки (шт.)
    const requiredScoopsTotal = (requiredVolumeMl / servingVolume) * scoopsPerServing;

    // Общее количество воды в рационе
    const totalWaterInRationExact = (requiredScoopsTotal / scoopsPerServing) * waterPerServing;

    // --- РАСЧЕТ ТОЧНЫХ СУТОЧНЫХ НУТРИЕНТОВ И ВЕСА СМЕСИ ---
    const totalMixWeightGramsExact = requiredScoopsTotal * productScoopWeight;
    const totalKcalExact = kcalPerScoop * requiredScoopsTotal;
    const totalProteinGramsExact = proteinPerScoop * requiredScoopsTotal;
    const totalFatGramsExact = fatPerScoop * requiredScoopsTotal;
    const totalCarbsGramsExact = carbsPerScoop * requiredScoopsTotal;

    // Расчет дней до окончания упаковки
    const daysSupplyExact = (packageAmount > 0 && totalMixWeightGramsExact > 0)
        ? (packageAmount / totalMixWeightGramsExact)
        : 0;

    // NEW: Сколько банок нужно на месяц (30 дней)
    const canSupplyPerMonthExact = daysSupplyExact > 0 ? (30 / daysSupplyExact) : 0;

    const exactResult = {
        // Метрики
        concentration,
        kcalPerMl: concentration,
        scoopsPerServing,
        waterPerServing,
        baseServingDescription: baseServingDescription,
        feedingsPerDay: feedingsPerDay, // Добавлено

        // Суточные итоги
        totalCalculatedKcal: totalKcalExact,
        totalProteinGrams: totalProteinGramsExact,
        totalFatGrams: totalFatGramsExact,
        totalCarbsGrams: totalCarbsGramsExact,
        totalMixWeightGrams: totalMixWeightGramsExact,
        requiredVolumeMl: requiredVolumeMl,
        requiredScoopsTotal: requiredScoopsTotal,
        requiredWaterMl: totalWaterInRationExact,
        dailyVolumeLitres: requiredVolumeMl / 1000,
        daysSupply: daysSupplyExact,
        canSupplyPerMonth: canSupplyPerMonthExact, // ДОБАВЛЕНО

        // На один прием
        requiredScoopsPerMeal: requiredScoopsTotal / feedingsPerDay,
        requiredWaterPerMeal: totalWaterInRationExact / feedingsPerDay,
        volumePerMealMl: requiredVolumeMl / feedingsPerDay,
        kcalPerMeal: totalKcalExact / feedingsPerDay,
        proteinPerMeal: totalProteinGramsExact / feedingsPerDay,
        fatPerMeal: totalFatGramsExact / feedingsPerDay,
        carbsPerMeal: totalCarbsGramsExact / feedingsPerDay,
    };


    // 3. Расчет Упрощенного рациона (roundedResult)

    // Округление ложек на прием
    let roundedScoopsPerMeal = exactResult.requiredScoopsPerMeal;
    if (scoopRounding > 0) {
        roundedScoopsPerMeal = Math.round(exactResult.requiredScoopsPerMeal / scoopRounding) * scoopRounding;
        // Минимальное значение = 1 шаг округления, если потребность в ложках не нулевая
        if (roundedScoopsPerMeal < scoopRounding && exactResult.requiredScoopsPerMeal > 0) roundedScoopsPerMeal = scoopRounding;
    }


    // Пересчитываем общее количество ложек в сутки на основе округления
    const roundedScoopsTotal = roundedScoopsPerMeal * feedingsPerDay;

    // Пересчитываем общий объем воды в сутки (мл) на основе округления ложек
    // (Ложек всего / Ложек на порцию) * Воды на порцию
    let requiredWaterMl = (roundedScoopsTotal / scoopsPerServing) * waterPerServing;

    // Округление общего объема воды (кратное 10 для удобства)
    if (requiredWaterMl % 10 !== 0) {
        requiredWaterMl = Math.round(requiredWaterMl / 10) * 10;
    }

    // Пересчитываем количество воды на прием
    const roundedWaterPerMeal = requiredWaterMl / feedingsPerDay;

    // Пересчитываем общий объем раствора (объем готовой порции / ложек на порцию * ложек всего)
    const roundedVolumeMl = (servingVolume / scoopsPerServing) * roundedScoopsTotal;

    // --- РАСЧЕТ ОКРУГЛЕННЫХ СУТОЧНЫХ НУТРИЕНТОВ И ВЕСА СМЕСИ ---
    const totalMixWeightGramsRounded = roundedScoopsTotal * productScoopWeight;
    const totalKcalRounded = kcalPerScoop * roundedScoopsTotal;
    const totalProteinGramsRounded = proteinPerScoop * roundedScoopsTotal;
    const totalFatGramsRounded = fatPerScoop * roundedScoopsTotal;
    const totalCarbsGramsRounded = carbsPerScoop * roundedScoopsTotal;

    // Расчет дней до окончания упаковки
    const daysSupplyRounded = (packageAmount > 0 && totalMixWeightGramsRounded > 0)
        ? (packageAmount / totalMixWeightGramsRounded)
        : 0;

    // NEW: Сколько банок нужно на месяц (30 дней)
    const canSupplyPerMonthRounded = daysSupplyRounded > 0 ? (30 / daysSupplyRounded) : 0;


    const roundedResult = {
        // Метрики
        concentration,
        kcalPerMl: concentration,
        scoopsPerServing,
        waterPerServing,
        baseServingDescription: baseServingDescription,
        feedingsPerDay: feedingsPerDay, // Добавлено

        // Суточные итоги
        totalCalculatedKcal: totalKcalRounded,
        totalProteinGrams: totalProteinGramsRounded,
        totalFatGrams: totalFatGramsRounded,
        totalCarbsGrams: totalCarbsGramsRounded,
        totalMixWeightGrams: totalMixWeightGramsRounded,
        requiredVolumeMl: roundedVolumeMl,
        requiredScoopsTotal: roundedScoopsTotal,
        requiredWaterMl: requiredWaterMl,
        dailyVolumeLitres: roundedVolumeMl / 1000,
        daysSupply: daysSupplyRounded,
        canSupplyPerMonth: canSupplyPerMonthRounded, // ДОБАВЛЕНО

        // На один прием
        requiredScoopsPerMeal: roundedScoopsPerMeal,
        requiredWaterPerMeal: roundedWaterPerMeal,
        volumePerMealMl: roundedVolumeMl / feedingsPerDay,
        kcalPerMeal: totalKcalRounded / feedingsPerDay,
        proteinPerMeal: totalProteinGramsRounded / feedingsPerDay,
        fatPerMeal: totalFatGramsRounded / feedingsPerDay,
        carbsPerMeal: totalCarbsGramsRounded / feedingsPerDay,
    };

    return { exact: exactResult, rounded: roundedResult, roundedScoopsPerMeal };
}

/**
 * Генерирует HTML-таблицу с результатами расчета в новом формате.
 * @param {object} result - Результат расчета (exactResult или roundedResult).
 * @returns {string} HTML-код таблицы.
 */
function buildRationTableHTML(result) {
    const tableHTML = `
        <table class="results-table">
            <thead>
                <tr>
                    <th colspan="2">На один прием (Количество приемов: ${result.feedingsPerDay})</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Ложек</td>
                    <td class="highlight">${roundToTwo(result.requiredScoopsPerMeal)} шт.</td>
                </tr>
                <tr>
                    <td>Воды</td>
                    <td class="highlight">${roundToTwo(result.requiredWaterPerMeal)} мл</td>
                </tr>
                <tr>
                    <td>Готовый раствор (прибл.)</td>
                    <td class="highlight">${result.volumePerMealMl.toFixed(0)} мл</td>
                </tr>
                <tr>
                    <td>Калорийность</td>
                    <td>${result.kcalPerMeal.toFixed(0)} ккал</td>
                </tr>
                <tr>
                    <td>Белки</td>
                    <td>${result.proteinPerMeal.toFixed(1)} г</td>
                </tr>
                <tr>
                    <td>Жиры</td>
                    <td>${result.fatPerMeal.toFixed(1)} г</td>
                </tr>
                <tr>
                    <td>Углеводы</td>
                    <td>${result.carbsPerMeal.toFixed(1)} г</td>
                </tr>
            </tbody>

            <thead>
                <tr>
                    <th colspan="2">На сутки (Итого)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Вес сухой смеси</td>
                    <td class="highlight">${result.totalMixWeightGrams.toFixed(1)} г</td>
                </tr>
                <tr>
                    <td>Общее количество ложек</td>
                    <td>${result.requiredScoopsTotal.toFixed(2)} шт.</td>
                </tr>
                <tr>
                    <td>Общее количество воды</td>
                    <td class="highlight">${result.requiredWaterMl.toFixed(0)} мл</td>
                </tr>
                <tr>
                    <td>Общий объем раствора (прибл.)</td>
                    <td class="highlight">${result.requiredVolumeMl.toFixed(0)} мл (${result.dailyVolumeLitres.toFixed(2)} л)</td>
                </tr>
                <tr>
                    <td>Калорийность</td>
                    <td>${result.totalCalculatedKcal.toFixed(0)} ккал</td>
                </tr>
                <tr>
                    <td>Белки</td>
                    <td>${result.totalProteinGrams.toFixed(1)} г</td>
                </tr>
                <tr>
                    <td>Жиры</td>
                    <td>${result.totalFatGrams.toFixed(1)} г</td> </tr>
                <tr>
                    <td>Углеводы</td>
                    <td>${result.totalCarbsGrams.toFixed(1)} г</td> </tr>
            </tbody>

            <thead>
                <tr>
                    <th colspan="2">Расход продукта</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>На сколько суток хватит банки смеси</td>
                    <td class="highlight">${result.daysSupply > 0 ? result.daysSupply.toFixed(1) + ' дн.' : 'Н/Д (Вес упаковки не указан)'}</td>
                </tr>
                <tr>
                    <td>Сколько банок нужно на месяц (30 дн.)</td>
                    <td class="highlight">${result.canSupplyPerMonth > 0 ? result.canSupplyPerMonth.toFixed(1) + ' шт.' : 'Н/Д (Вес упаковки не указан)'}</td>
                </tr>
            </tbody>
        </table>
    `;
    return tableHTML;
}


function calculateRation() {
    const rationResultDiv = document.getElementById('rationResult');
    const additionalFluidResultDiv = document.getElementById('additionalFluidResult');
    rationResultDiv.style.display = 'none';
    additionalFluidResultDiv.style.display = 'none';

    const exportBtn = document.getElementById('exportBtn');
    exportBtn.style.display = 'none';

    const dailyNeed = parseFloat(document.getElementById('dailyNeedResult').dataset.dailyNeed);
    const totalFluidNeedMl = parseFloat(document.getElementById('fluidNeedResult').dataset.totalFluid) || 0;
    const selectedProductId = document.getElementById('selectedProduct').value;
    const feedingsPerDay = parseInt(document.getElementById('feedingsPerDay').value, 10);
    const concentrationType = document.getElementById('concentrationType').value;
    const scoopRounding = parseFloat(document.getElementById('scoopsPerMealRounding').value);

    if (dailyNeed <= 0 || !selectedProductId || feedingsPerDay <= 0) {
        return;
    }

    let selectedProduct = null;
    try {
        // Асинхронный вызов, чтобы получить полную информацию о продукте
        ProductsAPI.getById(selectedProductId).then(product => {
            selectedProduct = product;

            if (!selectedProduct) {
                showError('Не удалось найти данные выбранного продукта.');
                return;
            }

            const { exact: exactResult, rounded: roundedResult, roundedScoopsPerMeal } = runCalculation(
                selectedProduct,
                dailyNeed,
                feedingsPerDay,
                concentrationType,
                scoopRounding
            );


            // --- 1. Вывод результатов рациона ---

            const concentrationName = concentrationType === 'ordinary'
                ? 'Обычное разведение' // Убрано "(1 Ккал/мл)"
                : 'Гиперкалорическое разведение';

            // Формируем блок с общей информацией о разведении
            const dilutionInfo = `
                <div class="results-section">
                    <h4>📄 Расчет рациона: ${escapeHtml(selectedProduct.name)}</h4>
                    <p class="ration-summary-compact">
                        <strong>Тип разведения:</strong> ${concentrationName}.
                        <strong>Концентрация:</strong> ${exactResult.kcalPerMl.toFixed(2)} ккал/мл.
                        <strong>Базовая порция:</strong> ${exactResult.baseServingDescription}.
                        </p>
                </div>
            `;

            // --- Структуры для выравнивания таблиц ---

            // Точный расчет: использует пустой элемент для компенсации высоты блока статуса
            const exactStatus = `
                <div class="status-block-wrapper">
                    <p class="metric-status status-subtext">Расчет для полного удовлетворения потребности в Ккал</p>
                    <p class="metric-status status-caloric-change empty-placeholder">&nbsp;</p>
                </div>
            `;

            // Упрощенный расчет: содержит сообщение об изменении калоража
            const caloricChange = roundedResult.totalCalculatedKcal - dailyNeed;
            const waterRoundingInfo = (roundedResult.requiredWaterMl % 10 !== 0) ? '' : `Вода округлена до ${roundedResult.requiredWaterMl.toFixed(0)} мл (кратное 10).`;

            const roundedStatus = `
                <div class="status-block-wrapper">
                    <p class="metric-status status-subtext">Расчет с округлением ложек на прием до ${roundedScoopsPerMeal} шт. ${waterRoundingInfo}</p>
                    <p class="metric-status status-caloric-change">
                        <strong>Изменение калоража:</strong> ${caloricChange > 0 ? '+' : ''}${caloricChange.toFixed(0)} ккал.
                        (${roundToTwo((roundedResult.totalCalculatedKcal / dailyNeed) * 100)}% от потребности)
                    </p>
                </div>
            `;

            // Выводим результаты в две секции
            rationResultDiv.innerHTML = dilutionInfo +
                '<div class="calculation-grid">' +
                // Колонка 1: Точный расчет
                '<div>' +
                '<h4>Точный расчет рациона</h4>' +
                exactStatus +
                buildRationTableHTML(exactResult) +
                '</div>' +

                // Колонка 2: Упрощенный расчет
                '<div>' +
                '<h4>Упрощенный расчет рациона (Округление)</h4>' +
                roundedStatus +
                buildRationTableHTML(roundedResult) +
                '</div>' +
                '</div>';

            rationResultDiv.style.display = 'block';

            // --- 2. Расчет и вывод дополнительной жидкости (перенесен в самый низ) ---

            // Расчет для Точного рациона
            const totalWaterInRationExact = exactResult.requiredWaterMl;
            const additionalFluidExact = Math.max(0, totalFluidNeedMl - totalWaterInRationExact);

            // Расчет для Округленного рациона
            const totalWaterInRationRounded = roundedResult.requiredWaterMl;
            const additionalFluidRounded = Math.max(0, totalFluidNeedMl - totalWaterInRationRounded);

            // Формирование HTML для дополнительной жидкости
            additionalFluidResultDiv.innerHTML = `
                <div class="results-section fluid-section">
                    <h4>💧 Расчет дополнительной жидкости</h4>
                    <div class="patient-metrics">
                        <div class="result-card">
                            <h5>Для Точного Рациона</h5>
                            <p class="metric-value">${additionalFluidExact.toFixed(0)} мл</p>
                            <p class="metric-status">ЖВО (${totalFluidNeedMl.toFixed(0)} мл) - Вода в смеси (${totalWaterInRationExact.toFixed(0)} мл)</p>
                        </div>
                        <div class="result-card">
                            <h5>Для Округленного Рациона</h5>
                            <p class="metric-value">${additionalFluidRounded.toFixed(0)} мл</p>
                            <p class="metric-status">ЖВО (${totalFluidNeedMl.toFixed(0)} мл) - Вода в смеси (${totalWaterInRationRounded.toFixed(0)} мл)</p>
                        </div>
                    </div>
                </div>
            `;
            additionalFluidResultDiv.style.display = 'block'; // Показываем в конце


            exportBtn.style.display = 'inline-block';
            window.lastCalculationResult = { exactResult, roundedResult, selectedProduct, dailyNeed, feedingsPerDay, totalFluidNeedMl };

        }).catch(error => {
            // Исправлена ошибка в .catch, чтобы показать более подробную информацию, если возможно
            console.error('Ошибка при получении данных продукта (Детали):', error);
            showError('Ошибка при получении данных продукта: ' + error.message);
        });

    } catch (error) {
        showError('Ошибка расчета рациона: ' + error.message);
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

        // Проверяем, был ли расчет, и если да, пересчитываем его
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
    form.reset();
    document.getElementById('productId').value = '';

    await loadProductsTable(); // Обновляем таблицу при открытии

    if (productId) {
        modalTitle.textContent = 'Редактировать продукт';
        saveProductBtn.textContent = 'Сохранить изменения';
        try {
            const product = await ProductsAPI.getById(productId);
            if (product) {
                document.getElementById('productId').value = product.id;
                document.getElementById('productName').value = product.name || '';
                document.getElementById('productCalories').value = product.calories || '';
                document.getElementById('scoopWeight').value = product.scoopWeight || '';
                document.getElementById('proteins').value = product.proteins || '';
                document.getElementById('fats').value = product.fats || '';
                document.getElementById('carbs').value = product.carbs || '';
                document.getElementById('packageAmount').value = product.packageAmount || '';

                // Обычное разведение
                document.getElementById('scoopsOrdinary').value = product.scoopsOrdinary || '';
                document.getElementById('waterOrdinary').value = product.waterOrdinary || '';
                document.getElementById('servingVolume_ordinary').value = product.servingVolume_ordinary || '';

                // Гиперкалорическое разведение
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
    } else {
        modalTitle.textContent = 'Добавить новый продукт';
        saveProductBtn.textContent = 'Сохранить';
    }

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

function initModal() {
    document.getElementById('openModalBtn').addEventListener('click', () => openModal());
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);

    // Закрытие по клику вне модального окна
    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('productModal')) {
            closeModal();
        }
    });

    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const productId = document.getElementById('productId').value;
        const product = {
            // Добавлено || 0 для числовых полей, где это было пропущено ранее
            name: document.getElementById('productName').value,
            calories: parseFloat(document.getElementById('productCalories').value) || 0,
            proteins: parseFloat(document.getElementById('proteins').value) || 0,
            fats: parseFloat(document.getElementById('fats').value) || 0,
            carbs: parseFloat(document.getElementById('carbs').value) || 0,
            scoopWeight: parseFloat(document.getElementById('scoopWeight').value) || 0,
            packageAmount: parseFloat(document.getElementById('packageAmount').value) || 0,

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

        if (product.calories <= 0 || product.scoopWeight <= 0 || product.proteins < 0 || product.scoopsOrdinary <= 0 || product.servingVolume_ordinary <= 0) {
            showError('Заполните все обязательные поля корректными числовыми значениями (Название, Ккал, Белок, Вес ложки, Параметры обычного разведения).');
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


// --- ФУНКЦИИ ИНИЦИАЛИЗАЦИИ И СЛУШАТЕЛЕЙ ---

function initRationListeners() {
    document.getElementById('calculateBtn').addEventListener('click', calculateRation);

    // Добавляем слушатель на все поля, влияющие на расчет, для автоматического обновления
    const calculationInputs = [
        'selectedProduct', 'feedingsPerDay', 'scoopsPerMealRounding', 'concentrationType'
    ];
    calculationInputs.forEach(id => {
        document.getElementById(id).addEventListener('change', calculateRation);
    });

    // Слушатели на параметры пациента
    const patientInputs = [
        'patientWeight', 'patientHeight', 'patientAge', 'patientGender', 'activityFactor', 'proteinNeed'
    ];
    patientInputs.forEach(id => {
        document.getElementById(id).addEventListener('change', updatePatientMetrics);
        document.getElementById(id).addEventListener('input', updatePatientMetrics);
    });

    document.getElementById('exportBtn').addEventListener('click', exportToExcel);
}

function initCalculator() {
    // Выполняем первоначальный расчет метрик
    updatePatientMetrics();
}


// --- ФУНКЦИЯ ЭКСПОРТА В EXCEL ---

function exportToExcel() {
    if (!window.lastCalculationResult) {
        showError('Сначала выполните расчет рациона.');
        return;
    }

    const { exactResult, roundedResult, selectedProduct, dailyNeed, feedingsPerDay, totalFluidNeedMl } = window.lastCalculationResult;

    const caloricChange = roundedResult.totalCalculatedKcal - dailyNeed;
    const totalWaterInRationExact = exactResult.requiredWaterMl;
    const additionalFluidExact = Math.max(0, totalFluidNeedMl - totalWaterInRationExact);
    const totalWaterInRationRounded = roundedResult.requiredWaterMl;
    const additionalFluidRounded = Math.max(0, totalFluidNeedMl - totalWaterInRationRounded);


    const data = [
        ["Параметр", "Точный расчет", "Упрощенный расчет"],
        ["Продукт", selectedProduct.name, selectedProduct.name],
        ["Состав порции", exactResult.baseServingDescription, roundedResult.baseServingDescription],
        ["Суточная потребность, ккал", dailyNeed, dailyNeed],
        ["Количество приемов", feedingsPerDay, feedingsPerDay],
        ["Концентрация, ккал/мл", exactResult.kcalPerMl.toFixed(2), roundedResult.kcalPerMl.toFixed(2)],
        ["---", "---", "---"],

        // НА ОДИН ПРИЕМ
        ["Ложек на прием, шт.", roundToTwo(exactResult.requiredScoopsPerMeal), roundToTwo(roundedResult.requiredScoopsPerMeal)],
        ["Воды на прием, мл", roundToTwo(exactResult.requiredWaterPerMeal), roundToTwo(roundedResult.requiredWaterPerMeal)],
        ["Объем готового р-ра на прием, мл", exactResult.volumePerMealMl.toFixed(0), roundedResult.volumePerMealMl.toFixed(0)],
        ["Калорийность на прием, ккал", exactResult.kcalPerMeal.toFixed(0), roundedResult.kcalPerMeal.toFixed(0)],
        ["Белки на прием, г", exactResult.proteinPerMeal.toFixed(1), roundedResult.proteinPerMeal.toFixed(1)],
        ["Жиры на прием, г", exactResult.fatPerMeal.toFixed(1), roundedResult.fatPerMeal.toFixed(1)],
        ["Углеводы на прием, г", exactResult.carbsPerMeal.toFixed(1), roundedResult.carbsPerMeal.toFixed(1)],
        ["---", "---", "---"],

        // НА СУТКИ
        ["Вес сухой смеси, г", exactResult.totalMixWeightGrams.toFixed(1), roundedResult.totalMixWeightGrams.toFixed(1)],
        ["Общее количество ложек, шт.", exactResult.requiredScoopsTotal.toFixed(2), roundedResult.requiredScoopsTotal.toFixed(2)],
        ["Общее количество воды, мл", exactResult.requiredWaterMl.toFixed(0), roundedResult.requiredWaterMl.toFixed(0)],
        ["Общий объем раствора, мл", exactResult.requiredVolumeMl.toFixed(0), roundedResult.requiredVolumeMl.toFixed(0)],
        ["Общая калорийность, ккал", exactResult.totalCalculatedKcal.toFixed(0), roundedResult.totalCalculatedKcal.toFixed(0)],
        ["Общее количество белка, г", exactResult.totalProteinGrams.toFixed(1), roundedResult.totalProteinGrams.toFixed(1)],
        ["Общее количество жиров, г", exactResult.totalFatGrams.toFixed(1), roundedResult.totalFatGrams.toFixed(1)],
        ["Общее количество углеводов, г", exactResult.totalCarbsGrams.toFixed(1), roundedResult.totalCarbsGrams.toFixed(1)],
        ["---", "---", "---"],

        // РАСХОД
        ["На сколько суток хватит банки, дн.", exactResult.daysSupply > 0 ? exactResult.daysSupply.toFixed(1) : 'Н/Д', roundedResult.daysSupply > 0 ? roundedResult.daysSupply.toFixed(1) : 'Н/Д'],
        ["Сколько банок нужно на месяц (30 дн.), шт.", exactResult.canSupplyPerMonth > 0 ? exactResult.canSupplyPerMonth.toFixed(1) : 'Н/Д', roundedResult.canSupplyPerMonth > 0 ? roundedResult.canSupplyPerMonth.toFixed(1) : 'Н/Д'], // ДОБАВЛЕНО
        ["---", "---", "---"],

        // ЖВО
        ["Целевое ЖВО, мл", totalFluidNeedMl.toFixed(0), totalFluidNeedMl.toFixed(0)],
        ["Вода из смеси, мл", totalWaterInRationExact.toFixed(0), totalWaterInRationRounded.toFixed(0)],
        ["Дополнительная жидкость, мл", additionalFluidExact.toFixed(0), additionalFluidRounded.toFixed(0)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Добавление калоража с округлением
    XLSX.utils.sheet_add_aoa(ws, [
        ["Изменение калоража:", "", `${caloricChange > 0 ? '+' : ''}${caloricChange.toFixed(0)} ккал`]
    ], { origin: -1 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Расчет рациона");

    const patientName = document.getElementById('patientName') ? document.getElementById('patientName').value : 'Пациент';
    const filename = `Расчет_${selectedProduct.name.replace(/\s/g, '_')}_${patientName}_${new Date().toLocaleDateString()}.xlsx`;

    XLSX.writeFile(wb, filename);
    showSuccess('Данные успешно экспортированы в Excel!');
}

// --- ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ---

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Проверка статуса аутентификации при старте
        const { data: { user } } = await supabase.auth.getUser();
        updateAuthUI(user);

        // 2. Инициализация слушателей
        initAuthListeners();
        initCalculator();
        initRationListeners();
        initModal();

        // 3. Загрузка продуктов
        await loadProductsToSelect();

        // Добавляем слушатель для отслеживания изменений сессии (вход/выход)
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

// Глобальные функции для кнопок (нужны для вызова из HTML атрибутов onclick)
// Добавлена проверка авторизации перед действием
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