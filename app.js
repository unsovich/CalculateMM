// app.js

// Вспомогательные функции
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const inlineErrorDiv = document.querySelector('.error-message-inline') || document.getElementById('errorMessage');

    inlineErrorDiv.textContent = message;
    inlineErrorDiv.style.display = 'block';
    inlineErrorDiv.className = 'error-message error-message-inline';

    setTimeout(() => {
        inlineErrorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('errorMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    successDiv.className = 'success-message success-message-inline';
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

function roundToTwo(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return 0;
    }
    return Math.round(num * 100) / 100;
}

// --- Инициализация Supabase ---
// !!! ВНИМАНИЕ: ПРОБЛЕМА С АВТОРИЗАЦИЕЙ СВЯЗАНА С НЕВЕРНЫМ КЛЮЧОМ !!!
// Здесь необходимо использовать **ПУБЛИЧНЫЙ КЛЮЧ ANON** из настроек Supabase,
// а не service_role ключ. Ваш предыдущий ключ, вероятно, был отозван.
// ПОЖАЛУЙСТА, ЗАМЕНИТЕ ЭТОТ КЛЮЧ НА ВАШ АКТУАЛЬНЫЙ ПУБЛИЧНЫЙ ANON KEY.
const SUPABASE_URL = 'https://kyxyuhttgyfihakaajsn.supabase.co';
// !!! ЗАМЕНИТЕ ЭТОТ КЛЮЧ НА ВАШ ПУБЛИЧНЫЙ ANON KEY !!!
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5eHl1aHR0Z3lmaWhha2FhanNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNzM5MjgyNywiZXhwIjoxNzM4OTI4ODI3fQ.x0GfxNq6Aq2UReH-IGO2iQ_x5zJLX4M';

// Корректная инициализация клиента Supabase, используя глобальный объект из CDN
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

if (!supabase) {
    console.error("Supabase client failed to initialize.");
}


// --- Логика Авторизации (Supabase Auth) ---

const authMessage = document.getElementById('authMessage');
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');

function updateAuthUI(user) {
    if (user) {
        authMessage.textContent = `Вы вошли как ${user.email}`;
        signInBtn.style.display = 'none';
        signOutBtn.style.display = 'inline-block';
    } else {
        authMessage.textContent = 'Вы не авторизованы.';
        signInBtn.style.display = 'inline-block';
        signOutBtn.style.display = 'none';
    }
}

// 1. Обработчики кнопок
signInBtn?.addEventListener('click', async () => {
    if (!supabase) return showError("Ошибка подключения к базе данных. Проверьте ключ Supabase.");
    const email = prompt("Введите Email для входа (через магическую ссылку Supabase):");
    if (email) {
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: window.location.origin
            }
        });
        if (error) {
            showError('Ошибка входа: ' + error.message);
        } else {
            showSuccess('Проверьте Ваш Email для входа! (Если письма нет, проверьте папку "Спам")');
        }
    }
});

signOutBtn?.addEventListener('click', async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
        showError('Ошибка выхода: ' + error.message);
    } else {
        showSuccess('Вы успешно вышли из системы');
    }
});

// 2. Слушатель изменений состояния авторизации
if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
        updateAuthUI(session?.user);
        // Обновляем таблицу продуктов для включения/отключения кнопок редактирования/удаления
        loadProductsTable();
    });
}


// --- ProductsAPI (Взаимодействие с базой данных) ---

// Этот объект используется для абстракции работы с Supabase
const ProductsAPI = {
    tableName: 'products',

    // Получение всех продуктов
    async getAll() {
        if (!supabase) throw new Error("Supabase клиент не инициализирован.");
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Получение продукта по ID
    async getById(id) {
        if (!supabase) throw new Error("Supabase клиент не инициализирован.");
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Сохранение/Обновление продукта
    async save(productData) {
        if (!supabase) throw new Error("Supabase клиент не инициализирован.");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error("Для сохранения продуктов необходимо войти в систему.");
        }

        // Добавляем user_id для политики RLS
        productData.user_id = user.id;

        let result;
        if (productData.id) {
            // Обновление
            const { id, ...updateData } = productData;
            result = await supabase
                .from(this.tableName)
                .update(updateData)
                .eq('id', id)
                .select();
        } else {
            // Создание
            result = await supabase
                .from(this.tableName)
                .insert([productData])
                .select();
        }

        if (result.error) throw result.error;
        return result.data[0];
    },

    // Удаление продукта
    async deleteProduct(id) {
        if (!supabase) throw new Error("Supabase клиент не инициализирован.");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error("Для удаления продуктов необходимо войти в систему.");
        }

        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', id)
            .eq('user_id', user.id); // Убедимся, что удаляем только свои продукты

        if (error) throw error;
    }
};


// --- Функции Калькулятора ---

// 1. Расчеты
function calculateBMI(weight, height) {
    if (!weight || !height) {
        return { bmi: 0, status: 'Введите данные' };
    }
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    let status = '';
    if (bmi < 16) status = 'Выраженный дефицит массы';
    else if (bmi >= 16 && bmi < 18.5) status = 'Недостаточная масса';
    else if (bmi >= 18.5 && bmi < 25) status = 'Норма';
    else if (bmi >= 25 && bmi < 30) status = 'Избыточная масса (предожирение)';
    else if (bmi >= 30 && bmi < 35) status = 'Ожирение I степени';
    else if (bmi >= 35 && bmi < 40) status = 'Ожирение II степени';
    else status = 'Ожирение III степени';

    return { bmi, status };
}

function calculateBMR(weight, height, age, gender) {
    if (!weight || !height || !age) return 0;

    let bmr;
    if (gender === 'male') {
        bmr = 88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age);
    } else {
        bmr = 447.6 + (9.2 * weight) + (3.1 * height) - (4.3 * age);
    }
    return Math.round(bmr);
}

function calculateDailyNeed(bmr, activityFactor) {
    return Math.round(bmr * parseFloat(activityFactor));
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

// 2. Главный расчет рациона
function calculateRation() {
    // Получение данных из полей ввода
    const weight = parseFloat(document.getElementById('patientWeight').value);
    const height = parseFloat(document.getElementById('patientHeight').value);
    const age = parseInt(document.getElementById('patientAge').value);
    const gender = document.getElementById('patientGender').value;
    const activityFactor = document.getElementById('activityFactor').value;
    const numMeals = parseInt(document.getElementById('numMeals').value);

    // Расчет основных индексов (всегда должен работать, даже при нулевых/пустых полях)
    const { bmi, status: bmiStatus } = calculateBMI(weight, height);
    const bmr = calculateBMR(weight, height, age, gender);
    const dailyNeed = calculateDailyNeed(bmr, activityFactor);

    // Обновление результатов в UI для ИМТ, ОО, СП
    document.getElementById('bmiResult').textContent = `${roundToTwo(bmi)} кг/м²`;
    document.getElementById('bmiStatus').textContent = bmiStatus;
    document.getElementById('bmrResult').textContent = `${bmr} ккал/сутки`;
    document.getElementById('dailyNeedResult').textContent = `${dailyNeed} ккал/сутки`;
    document.getElementById('dailyNeedResult').dataset.dailyNeed = dailyNeed;
    document.getElementById('dailyNeedStatus').textContent = `ОО (${bmr}) * ФА (${activityFactor})`;


    // Расчет жидкости
    const fluidNeed = calculateFluidNeed(weight);
    document.getElementById('totalFluidNeed').textContent = `${fluidNeed.total} мл/сутки`;
    document.getElementById('fluidStatus').textContent = fluidNeed.total > 0 ? 'Расчет по формуле Холлидея-Сегара' : 'Введите данные';
    document.getElementById('fluidBreakdown').innerHTML = fluidNeed.breakdown;

    // Обновление плейсхолдера для дополнительной жидкости (если нет специфичной логики)
    document.getElementById('additionalFluidNeedValue').textContent = `${Math.max(0, fluidNeed.total - 0)} мл`; // Placeholder: total fluid - fluid from ration
    document.querySelector('#additionalFluidResult .metric-status').textContent = 'Требуется ввод данных';


    // --- Расчет рациона питания ---
    const productSelect = document.getElementById('selectedProduct');
    const selectedProductId = productSelect.value;
    const concentrationType = document.getElementById('concentrationType').value;
    const rationResultDiv = document.getElementById('rationResult');

    if (dailyNeed <= 1 || !selectedProductId || numMeals <= 0) {
        rationResultDiv.innerHTML = '<p class="error-message-inline">Введите данные пациента, выберите смесь и количество приемов.</p>';
        return;
    }

    // Поиск выбранного продукта из глобального списка
    const allProducts = window.PRODUCT_DATA || [];
    const selectedProduct = allProducts.find(p => String(p.id) === selectedProductId);

    if (!selectedProduct) {
        rationResultDiv.innerHTML = '<p class="error-message-inline">Продукт не найден в базе данных. Попробуйте обновить страницу или проверить подключение к Supabase.</p>';
        return;
    }

    // 3. Вычисление параметров для выбранной концентрации
    const isOrdinary = concentrationType === 'ordinary';
    const kcalPerMl = isOrdinary ? 1.0 : 1.5;
    const scoops = isOrdinary ? selectedProduct.scoopsOrdinary : selectedProduct.scoopsHyper;
    const water = isOrdinary ? selectedProduct.waterOrdinary : selectedProduct.waterHyper;
    const servingVolume = isOrdinary ? selectedProduct.servingVolume_ordinary : selectedProduct.servingVolume_hyper;
    const scoopWeight = selectedProduct.scoopWeight;

    // Проверка наличия данных для разведения
    if (!scoops || !water || !servingVolume || !scoopWeight) {
        rationResultDiv.innerHTML = `<p class="error-message-inline">Для выбранного продукта (${concentrationType === 'ordinary' ? 'Обычное' : 'Гиперкалорическое'}) не заданы параметры разведения. Пожалуйста, заполните: **${scoops ? '' : 'ложки,'} ${water ? '' : 'вода,'} ${servingVolume ? '' : 'объем,'} ${scoopWeight ? '' : 'вес ложки'}** в разделе "Управление продуктами".</p>`;
        return;
    }

    // Расчет общего объема смеси
    const totalVolumeLiters = dailyNeed / (kcalPerMl * 1000); // Общий объем в литрах
    const totalVolumeMl = Math.round(totalVolumeLiters * 1000); // Общий объем в мл

    // Расчет порций
    const totalServings = Math.ceil(totalVolumeMl / servingVolume);
    const totalPowderGrams = totalServings * scoops * scoopWeight;
    const totalPowderScoops = totalServings * scoops;

    // Расчет на один прием пищи
    const volumePerMeal = roundToTwo(totalVolumeMl / numMeals);
    const mealsPerDay = numMeals;

    // Дополнительные расчеты
    const proteinDailyGrams = (totalPowderGrams / 100) * selectedProduct.proteins;
    const fatDailyGrams = (totalPowderGrams / 100) * selectedProduct.fats;
    const carbDailyGrams = (totalPowderGrams / 100) * selectedProduct.carbs;

    // Энергетическая ценность
    const proteinKcal = Math.round(proteinDailyGrams * 4);
    const fatKcal = Math.round(fatDailyGrams * 9);
    const carbKcal = Math.round(carbDailyGrams * 4);
    const totalCalculatedKcal = proteinKcal + fatKcal + carbKcal;

    // Расчет дополнительной жидкости
    // Общее количество воды в смеси: (объем_порции - вес_порошка_в_порции) * количество_порций
    // Используем упрощенный расчет воды: (Общий объем - Общий вес порошка в мл, где 1г ~ 1мл)
    const totalWaterInRation = Math.round(totalVolumeMl - totalPowderGrams);
    const additionalFluid = Math.max(0, fluidNeed.total - totalWaterInRation);

    // Обновление плейсхолдера для дополнительной жидкости
    document.getElementById('additionalFluidNeedValue').textContent = `${additionalFluid} мл`;
    document.querySelector('#additionalFluidResult .metric-status').textContent = `ЖВО (${fluidNeed.total} мл) - Вода в смеси (${totalWaterInRation} мл)`;


    // Вывод результатов
    rationResultDiv.innerHTML = `
        <div class="results-section">
            <h4>📄 Расчет рациона: ${escapeHtml(selectedProduct.name)} (${kcalPerMl.toFixed(1)} ккал/мл)</h4>
            
            <div class="result-row ration-summary-row">
                <div class="result-card result-portion-volume ration-summary-card">
                    <h5>Общий объем смеси</h5>
                    <p class="small-metric-value">${totalVolumeMl} мл</p>
                    <p class="metric-status">Расчетная потребность</p>
                </div>
                <div class="result-card result-portion-powder ration-summary-card">
                    <h5>Смеси на сутки</h5>
                    <p class="small-metric-value">${roundToTwo(totalPowderGrams)} г</p>
                    <p class="metric-status">Или ${roundToTwo(totalPowderScoops)} мерных ложек</p>
                </div>
            </div>

            <table class="results-table">
                <thead>
                    <tr>
                        <th>Параметр</th>
                        <th>Значение</th>
                        <th>Единица</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td data-label="Количество приемов">Количество приемов пищи</td>
                        <td class="highlight">${mealsPerDay}</td>
                        <td>шт/сутки</td>
                    </tr>
                    <tr>
                        <td data-label="Объем на прием">Объем на один прием пищи</td>
                        <td class="highlight">${volumePerMeal}</td>
                        <td>мл</td>
                    </tr>
                    <tr>
                        <td data-label="Порошок на прием">Порошок на один прием пищи</td>
                        <td>${roundToTwo(totalPowderGrams / mealsPerDay)}</td>
                        <td>г</td>
                    </tr>
                    <tr>
                        <td data-label="Кал/мл">Энергетическая плотность</td>
                        <td>${kcalPerMl.toFixed(1)}</td>
                        <td>ккал/мл</td>
                    </tr>
                </tbody>
            </table>

            <h4 style="margin-top: 20px;">🍚 Состав рациона в сутки (Р-Ж-У)</h4>
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Нутриент</th>
                        <th>Кол-во (г)</th>
                        <th>Ккал</th>
                        <th>% от общей ккал</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td data-label="Белки">Белки</td>
                        <td>${roundToTwo(proteinDailyGrams)}</td>
                        <td>${proteinKcal}</td>
                        <td>${roundToTwo((proteinKcal / dailyNeed) * 100)}%</td>
                    </tr>
                    <tr>
                        <td data-label="Жиры">Жиры</td>
                        <td>${roundToTwo(fatDailyGrams)}</td>
                        <td>${fatKcal}</td>
                        <td>${roundToTwo((fatKcal / dailyNeed) * 100)}%</td>
                    </tr>
                    <tr>
                        <td data-label="Углеводы">Углеводы</td>
                        <td>${roundToTwo(carbDailyGrams)}</td>
                        <td>${carbKcal}</td>
                        <td>${roundToTwo((carbKcal / dailyNeed) * 100)}%</td>
                    </tr>
                    <tr>
                        <td data-label="Итого" class="highlight">Итого (расч.)</td>
                        <td class="highlight">—</td>
                        <td class="highlight">${totalCalculatedKcal}</td>
                        <td class="highlight">${roundToTwo((totalCalculatedKcal / dailyNeed) * 100)}%</td>
                    </tr>
                </tbody>
            </table>

            <h4 style="margin-top: 20px;">📦 Расход продукта (на ${totalServings} порций)</h4>
            <p style="font-size: 0.9em;">Для приготовления ${totalVolumeMl} мл смеси потребуется примерно <b>${Math.ceil(totalPowderGrams / selectedProduct.packageAmount)}</b> банок по ${selectedProduct.packageAmount} г.</p>
        </div>
    `;
}


// --- Логика модального окна и базы продуктов ---

const productModal = document.getElementById('productModal');
const searchMedpitanieBtn = document.getElementById('searchMedpitanieBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const productForm = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');

// Открытие модального окна
async function openModal(productId = null) {
    productForm.reset();
    document.getElementById('productId').value = '';

    // Проверка авторизации
    const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    const isAuthenticated = !!user;

    if (!isAuthenticated) {
        // Если не авторизован, открываем модальное окно только для просмотра
        modalTitle.textContent = 'База продуктов (только просмотр)';
        showError('Для добавления, редактирования и удаления продуктов необходимо войти в систему.');
        // Скрываем форму для неавторизованных пользователей
        document.querySelector('#productForm h3:nth-of-type(1)').style.display = 'none'; // Состав
        document.querySelector('#productForm h3:nth-of-type(2)').style.display = 'none'; // Структура
        document.querySelector('#productForm h3:nth-of-type(3)').style.display = 'none'; // Обычное
        document.querySelector('#productForm h3:nth-of-type(4)').style.display = 'none'; // Гиперкалорическое
        productForm.style.display = 'none';
    } else {
        // Авторизован: отображаем форму
        document.querySelector('#productForm h3:nth-of-type(1)').style.display = 'block';
        document.querySelector('#productForm h3:nth-of-type(2)').style.display = 'block';
        document.querySelector('#productForm h3:nth-of-type(3)').style.display = 'block';
        document.querySelector('#productForm h3:nth-of-type(4)').style.display = 'block';
        productForm.style.display = 'block';

        if (productId) {
            // Редактирование
            modalTitle.textContent = 'Редактировать продукт';
            try {
                const product = await ProductsAPI.getById(productId);
                if (!product) throw new Error('Продукт не найден');

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

            } catch (error) {
                showError('Ошибка загрузки продукта для редактирования: ' + error.message);
                // Если не удалось загрузить, переходим в режим добавления
                modalTitle.textContent = 'Добавить новый продукт';
                document.getElementById('productId').value = '';
            }
        } else {
            // Добавление
            modalTitle.textContent = 'Добавить новый продукт';
        }
    }

    await loadProductsTable(); // Загружаем таблицу в любом случае
    productModal.style.display = 'block';
}

// Закрытие модального окна
function closeModal() {
    productModal.style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
}

// Загрузка продуктов в выпадающий список калькулятора (ТОЛЬКО SUPABASE)
async function loadProductsToSelect() {
    const select = document.getElementById('selectedProduct');
    if (!select) return;

    let finalProducts = [];
    select.innerHTML = '<option value="">-- Загрузка... --</option>'; // Сообщение о загрузке

    try {
        finalProducts = await ProductsAPI.getAll();
        // Сохраняем глобально для использования в calculateRation
        window.PRODUCT_DATA = finalProducts;
    } catch (error) {
        console.error('Ошибка загрузки продуктов из Supabase:', error);
        // Выводим ошибку для пользователя
        showError('Ошибка загрузки продуктов: ' + (error.message.includes('client not initialized') ? 'Ошибка ключа/подключения Supabase.' : error.message));
        select.innerHTML = '<option value="">-- Ошибка загрузки продуктов --</option>';
        calculateRation(); // Запускаем расчет, чтобы хотя бы ИМТ/ОО/СП обновились
        return;
    }

    select.innerHTML = '';

    if (finalProducts.length === 0) {
        select.innerHTML = '<option value="">-- Нет продуктов в базе --</option>';
        calculateRation();
        return;
    }

    select.innerHTML = finalProducts.map(product =>
        `<option value="${product.id}">${escapeHtml(product.name)}</option>`
    ).join('');

    // Сразу запускаем расчет для первого продукта
    calculateRation();
}

// Загрузка продуктов в таблицу модального окна
async function loadProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    try {
        const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
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

// Глобальные функции для кнопок (нужны для вызова из HTML атрибутов onclick)
window.editProduct = async function (productId) {
    if (!supabase) return showError("Ошибка подключения к базе данных. Проверьте ключ Supabase.");
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await openModal(productId);
    } else {
        showError('Для редактирования продуктов необходимо войти в систему.');
    }
};

window.deleteProduct = async function (productId) {
    if (!supabase) return showError("Ошибка подключения к базе данных. Проверьте ключ Supabase.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showError('Для удаления продуктов необходимо войти в систему.');
        return;
    }

    // Проверка, что пользователь не пытается удалить системный ID, если таковые предусмотрены (например, ID <= 100)
    if (productId && productId <= 100) {
        showError('Удаление системных продуктов (ID 1-100) запрещено.');
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

// --- Инициализация слушателей ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Слушатели калькулятора
    const inputs = ['patientWeight', 'patientHeight', 'patientAge', 'patientGender', 'activityFactor', 'selectedProduct', 'concentrationType', 'numMeals'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', calculateRation);
        }
    });

    // 2. Слушатели модального окна
    searchMedpitanieBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === productModal) {
            closeModal();
        }
    });

    // 3. Сохранение продукта
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            id: document.getElementById('productId').value || null,
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

            scoopsHyper: parseFloat(document.getElementById('productScoopsHyper').value) || null,
            waterHyper: parseFloat(document.getElementById('productWaterHyper').value) || null,
            servingVolume_hyper: parseFloat(document.getElementById('servingVolume_hyper').value) || null,

            applicationMethod: document.getElementById('productApplicationMethod').value,
            description: document.getElementById('productDescription').value,
        };

        if (data.id && data.id <= 100) {
            showError('Запрещено редактировать продукты с ID от 1 до 100 (данные по умолчанию). Используйте ID > 100.');
            return;
        }

        try {
            await ProductsAPI.save(data);
            showSuccess(`Продукт "${data.name}" успешно ${data.id ? 'обновлен' : 'добавлен'}`);
            closeModal();
            // Перезагрузка списка для калькулятора и таблицы
            await loadProductsToSelect();
            await loadProductsTable();

        } catch (error) {
            showError('Ошибка сохранения продукта: ' + error.message);
        }
    });

    // 4. Первоначальная загрузка данных
    loadProductsToSelect();

    // Инициализация UI для авторизации (первая проверка)
    if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            updateAuthUI(session?.user);
        });
    } else {
        showError("Критическая ошибка: Не удалось инициализировать Supabase. Проверьте ключ и подключение.");
        calculateRation(); // Попытка обновить индексы, несмотря на ошибку
    }
});