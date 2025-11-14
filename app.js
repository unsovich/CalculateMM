// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    try {
        initSupabase();
        await db.init();
        await initializeInitialData();
        await loadProductsToSelect();
        initCalculator();
        initProductsSearch();
        initModal();
    } catch (error) {
        showError('Ошибка инициализации базы данных: ' + error.message);
    }
});

// Загрузка продуктов в выпадающий список
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

// Инициализация поиска продуктов
function initProductsSearch() {
    const searchBtn = document.getElementById('searchMedpitanieBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (!searchBtn) {
        console.error('Кнопка поиска не найдена: searchMedpitanieBtn');
        return;
    }
    
    if (!searchInput) {
        console.error('Поле ввода поиска не найдено: searchInput');
        return;
    }
    
    console.log('Инициализация поиска продуктов: элементы найдены');
    
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Кнопка поиска нажата');
        searchMedpitanie();
    });
    
    // Поиск по Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            console.log('Нажата клавиша Enter в поле поиска');
            const term = e.target.value.trim();
            if (term) {
                searchMedpitanie();
            }
        }
    });
}


// Открытие модального окна для добавления продукта
function openProductModal(product = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('modalTitle');
    
    if (product) {
        title.textContent = 'Редактировать продукт';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCalories').value = product.calories;
        document.getElementById('productProteins').value = product.proteins;
        document.getElementById('productFats').value = product.fats;
        document.getElementById('productCarbs').value = product.carbs;
        document.getElementById('productDescription').value = product.description || '';
    } else {
        title.textContent = 'Добавить продукт';
        form.reset();
        document.getElementById('productId').value = '';
    }
    
    modal.style.display = 'flex';
}

// Делаем функцию глобальной для использования в onclick
window.openProductModal = openProductModal;


// Инициализация модального окна
function initModal() {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProduct();
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Сохранение продукта
async function saveProduct() {
    const form = document.getElementById('productForm');
    const productId = document.getElementById('productId').value;
    
    const product = {
        name: document.getElementById('productName').value.trim(),
        calories: parseFloat(document.getElementById('productCalories').value),
        proteins: parseFloat(document.getElementById('productProteins').value),
        fats: parseFloat(document.getElementById('productFats').value),
        carbs: parseFloat(document.getElementById('productCarbs').value),
        description: document.getElementById('productDescription').value.trim()
    };
    
    try {
        if (productId) {
            await db.updateProduct(parseInt(productId), product);
            showSuccess('Продукт успешно обновлен');
        } else {
            await db.addProduct(product);
            showSuccess('Продукт успешно добавлен в базу данных');
        }
        
        document.getElementById('productModal').style.display = 'none';
        form.reset();
    } catch (error) {
        showError('Ошибка сохранения продукта: ' + error.message);
    }
}

// Поиск продуктов на medpitanie.ru
async function searchMedpitanie() {
    console.log('Функция searchMedpitanie вызвана');
    
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        console.error('Поле поиска не найдено');
        showError('Ошибка: поле поиска не найдено');
        return;
    }
    
    const searchTerm = searchInput.value.trim();
    console.log('Термин поиска:', searchTerm);
    
    if (!searchTerm) {
        showError('Введите название продукта для поиска');
        return;
    }
    
    const resultsDiv = document.getElementById('medpitanieResults');
    if (!resultsDiv) {
        console.error('Контейнер результатов поиска не найден');
        showError('Ошибка: контейнер результатов не найден');
        return;
    }
    
    console.log('Отображение результатов поиска');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = '<div class="loading">Поиск продуктов на medpitanie.ru...</div>';
    
    try {
        // Формируем URL для поиска на medpitanie.ru
        const searchUrl = `https://medpitanie.ru/search?q=${encodeURIComponent(searchTerm)}`;
        
        // Показываем ссылку на поиск и предлагаем добавить продукт вручную
        resultsDiv.innerHTML = `
            <div class="medpitanie-search-result">
                <h4>🔍 Поиск на medpitanie.ru</h4>
                <p>Для поиска продукта "<strong>${escapeHtml(searchTerm)}</strong>" откройте сайт medpitanie.ru:</p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin: 15px 0;">
                    <a href="${searchUrl}" target="_blank" class="external-link">🔗 Открыть поиск на medpitanie.ru</a>
                    <a href="https://medpitanie.ru" target="_blank" class="external-link">🌐 Главная страница medpitanie.ru</a>
                </div>
                <div class="hint" style="background: #f0f4f8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p><strong>Инструкция:</strong></p>
                    <ol style="margin-left: 20px; margin-top: 10px;">
                        <li>Откройте ссылку выше для поиска продукта</li>
                        <li>Найдите нужный продукт на сайте medpitanie.ru</li>
                        <li>Скопируйте данные о продукте (название, калории, белки, жиры, углеводы)</li>
                        <li>Если продукт не найден или вы хотите добавить его вручную, нажмите кнопку ниже</li>
                    </ol>
                </div>
                <button class="btn btn-primary" onclick="openProductModal()" style="margin-top: 10px; width: 100%;">+ Добавить продукт в базу (если не найден на сайте)</button>
            </div>
        `;
        
    } catch (error) {
        resultsDiv.innerHTML = `
            <div class="error-message">
                <p><strong>Не удалось выполнить поиск.</strong></p>
                <p>Попробуйте:</p>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li>Открыть <a href="https://medpitanie.ru" target="_blank">medpitanie.ru</a> в новой вкладке</li>
                    <li>Найти нужный продукт на сайте</li>
                    <li>Добавить его в базу данных вручную</li>
                </ul>
                <button class="btn btn-primary" onclick="openProductModal()" style="margin-top: 15px; width: 100%;">+ Добавить продукт вручную</button>
            </div>
        `;
    }
}

// Экспорт данных
async function exportData() {
    try {
        const data = await db.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products_backup.json';
        a.click();
        URL.revokeObjectURL(url);
        showSuccess('Данные успешно экспортированы');
    } catch (error) {
        showError('Ошибка экспорта данных: ' + error.message);
    }
}

// Инициализация калькулятора
function initCalculator() {
    document.getElementById('calculateBtn').addEventListener('click', calculateDiet);
    document.getElementById('exportResultBtn').addEventListener('click', exportResultToExcel);
    
    // Добавляем обработчики для автоматического расчета ИМТ и ОО
    const inputs = ['patientWeight', 'patientHeight', 'patientAge', 'patientGender'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        element.addEventListener('input', calculateBMIAndBMR);
        element.addEventListener('change', calculateBMIAndBMR);
    });
}

// Расчет основного обмена по разным формулам
function calculateBMR(weight, height, age, gender) {
    const ageYears = age;
    
    // Schofield для детей 0-3 лет
    if (ageYears < 3) {
        if (gender === 'male') {
            // Мальчики 0-3 лет: BMR = (0.167 * weight + 15.174 * height - 617.6) / 4.184
            return (0.167 * weight + 15.174 * height - 617.6) / 4.184;
        } else {
            // Девочки 0-3 лет: BMR = (0.071 * weight + 11.296 * height - 413.5) / 4.184
            return (0.071 * weight + 11.296 * height - 413.5) / 4.184;
        }
    }
    // Harris-Benedict для детей старше 3 лет
    else if (ageYears < 18) {
        if (gender === 'male') {
            // Мальчики: BMR = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
            return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            // Девочки: BMR = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
            return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }
    }
    // Миффлин-Сан Жеора для взрослых (18+)
    else {
        if (gender === 'male') {
            return 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            return 10 * weight + 6.25 * height - 5 * age - 161;
        }
    }
}

// Получить название формулы для отображения
function getBMRFormulaName(age) {
    if (age < 3) {
        return 'Schofield (0-3 года)';
    } else if (age < 18) {
        return 'Harris-Benedict (>3 лет)';
    } else {
        return 'Миффлин-Сан Жеора (взрослые)';
    }
}

// Расчет ИМТ и основного обмена
function calculateBMIAndBMR() {
    const weight = parseFloat(document.getElementById('patientWeight').value);
    const height = parseFloat(document.getElementById('patientHeight').value);
    const age = parseFloat(document.getElementById('patientAge').value);
    const gender = document.getElementById('patientGender').value;
    
    const metabolismInfo = document.getElementById('metabolismInfo');
    
    if (weight && height && age !== undefined && age !== null) {
        // Расчет ИМТ (только для детей старше 2 лет)
        let bmi = null;
        let bmiDisplay = '-';
        if (age >= 2) {
            const heightInMeters = height / 100;
            bmi = weight / (heightInMeters * heightInMeters);
            bmiDisplay = bmi.toFixed(1);
        }
        
        // Расчет основного обмена
        const bmr = calculateBMR(weight, height, age, gender);
        const formulaName = getBMRFormulaName(age);
        
        // Отображение результатов
        document.getElementById('bmiValue').textContent = bmiDisplay;
        if (age < 2) {
            document.getElementById('bmiInterpretation').textContent = 'ИМТ рассчитывается с 2 лет';
            document.getElementById('bmiInterpretation').className = 'info-interpretation';
        } else {
            // Интерпретация ИМТ
            let interpretation = '';
            let interpretationClass = '';
            if (bmi < 18.5) {
                interpretation = 'Недостаточный вес';
                interpretationClass = 'bmi-underweight';
            } else if (bmi < 25) {
                interpretation = 'Нормальный вес';
                interpretationClass = 'bmi-normal';
            } else if (bmi < 30) {
                interpretation = 'Избыточный вес';
                interpretationClass = 'bmi-overweight';
            } else {
                interpretation = 'Ожирение';
                interpretationClass = 'bmi-obese';
            }
            
            const interpretationEl = document.getElementById('bmiInterpretation');
            interpretationEl.textContent = interpretation;
            interpretationEl.className = `info-interpretation ${interpretationClass}`;
        }
        
        document.getElementById('bmrValue').textContent = Math.round(bmr);
        document.getElementById('bmrFormula').textContent = formulaName;
        
        metabolismInfo.style.display = 'block';
    } else {
        metabolismInfo.style.display = 'none';
    }
}

// Расчет разведения смеси
// Обычное разведение: 1 мерная ложка (обычно 4.6г) на 30мл воды = 100мл готовой смеси
// Гиперкалорическое разведение: 1 мерная ложка на 20мл воды = 75мл готовой смеси
function calculateDilution(productAmount, productCaloriesPer100g) {
    // Стандартные значения для сухих смесей
    const scoopWeight = 4.6; // граммы в одной мерной ложке
    const normalWaterPerScoop = 30; // мл воды на ложку (обычное разведение)
    const hyperWaterPerScoop = 20; // мл воды на ложку (гиперкалорическое)
    const normalVolumePerScoop = 100; // мл готовой смеси (обычное)
    const hyperVolumePerScoop = 75; // мл готовой смеси (гиперкалорическое)
    
    // Количество мерных ложек
    const scoops = productAmount / scoopWeight;
    
    // Обычное разведение
    const normalWater = scoops * normalWaterPerScoop;
    const normalVolume = scoops * normalVolumePerScoop;
    const normalCalories = (normalVolume / 100) * productCaloriesPer100g;
    
    // Гиперкалорическое разведение
    const hyperWater = scoops * hyperWaterPerScoop;
    const hyperVolume = scoops * hyperVolumePerScoop;
    const hyperCalories = (hyperVolume / 100) * productCaloriesPer100g;
    
    return {
        scoops: scoops,
        normal: {
            water: normalWater,
            volume: normalVolume,
            calories: normalCalories
        },
        hyper: {
            water: hyperWater,
            volume: hyperVolume,
            calories: hyperCalories
        }
    };
}

// Расчет рациона
async function calculateDiet() {
    const weight = parseFloat(document.getElementById('patientWeight').value);
    const height = parseFloat(document.getElementById('patientHeight').value);
    const age = parseFloat(document.getElementById('patientAge').value);
    const gender = document.getElementById('patientGender').value;
    const activityLevel = parseFloat(document.getElementById('activityLevel').value);
    const selectedProductId = document.getElementById('selectedProduct').value;

    if (!weight || !height || age === undefined || age === null) {
        showError('Пожалуйста, заполните все обязательные поля');
        return;
    }

    if (!selectedProductId) {
        showError('Пожалуйста, выберите смесь для расчета');
        return;
    }

    try {
        const bmr = calculateBMR(weight, height, age, gender);
        const totalCalories = Math.round(bmr * activityLevel);

        const proteins = Math.round(totalCalories * 0.15 / 4);
        const fats = Math.round(totalCalories * 0.30 / 9);
        const carbs = Math.round(totalCalories * 0.55 / 4);

        const selectedProduct = await ProductsAPI.getById(selectedProductId);

        if (!selectedProduct) {
            showError('Выбранный продукт не найден');
            return;
        }

        const diet = generateDietWithProduct(selectedProduct, totalCalories, proteins, fats, carbs);

        displayResults(totalCalories, proteins, fats, carbs, diet);

        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        showError('Ошибка расчета: ' + error.message);
    }
}

// Генерация рациона с использованием выбранного продукта
function generateDietWithProduct(product, targetCalories, targetProteins, targetFats, targetCarbs) {
    const diet = [];

    const productCaloriesPerGram = product.calories / 100;
    const amount = targetCalories / productCaloriesPerGram;

    const productCalories = (amount / 100) * product.calories;
    const productProteins = (amount / 100) * product.proteins;
    const productFats = (amount / 100) * product.fats;
    const productCarbs = (amount / 100) * product.carbs;

    diet.push({
        name: product.name,
        amount: Math.round(amount * 10) / 10,
        calories: Math.round(productCalories * 10) / 10,
        proteins: Math.round(productProteins * 10) / 10,
        fats: Math.round(productFats * 10) / 10,
        carbs: Math.round(productCarbs * 10) / 10,
        caloriesPer100g: product.calories
    });

    return diet;
}

// Генерация рациона
function generateDiet(products, targetCalories, targetProteins, targetFats, targetCarbs) {
    const diet = [];
    let currentCalories = 0;
    let currentProteins = 0;
    let currentFats = 0;
    let currentCarbs = 0;
    
    // Сортируем продукты по приоритету (более сбалансированные)
    const sortedProducts = [...products].sort((a, b) => {
        const balanceA = Math.abs(a.proteins - 20) + Math.abs(a.fats - 30) + Math.abs(a.carbs - 50);
        const balanceB = Math.abs(b.proteins - 20) + Math.abs(b.fats - 30) + Math.abs(b.carbs - 50);
        return balanceA - balanceB;
    });
    
    // Добавляем продукты пока не достигнем целевых значений
    for (const product of sortedProducts) {
        if (currentCalories >= targetCalories * 0.95) break;
        
        // Рассчитываем количество продукта (в граммах)
        const remainingCalories = targetCalories - currentCalories;
        const productCaloriesPerGram = product.calories / 100;
        let amount = Math.min(remainingCalories / productCaloriesPerGram, 300); // Максимум 300г за раз
        
        if (amount > 10) { // Минимум 10г
            const productCalories = (amount / 100) * product.calories;
            const productProteins = (amount / 100) * product.proteins;
            const productFats = (amount / 100) * product.fats;
            const productCarbs = (amount / 100) * product.carbs;
            
            diet.push({
                name: product.name,
                amount: Math.round(amount * 10) / 10,
                calories: Math.round(productCalories * 10) / 10,
                proteins: Math.round(productProteins * 10) / 10,
                fats: Math.round(productFats * 10) / 10,
                carbs: Math.round(productCarbs * 10) / 10,
                caloriesPer100g: product.calories
            });
            
            currentCalories += productCalories;
            currentProteins += productProteins;
            currentFats += productFats;
            currentCarbs += productCarbs;
        }
    }
    
    return diet;
}

// Отображение результатов
function displayResults(calories, proteins, fats, carbs, diet) {
    document.getElementById('totalCalories').textContent = calories;
    document.getElementById('totalProteins').textContent = proteins;
    document.getElementById('totalFats').textContent = fats;
    document.getElementById('totalCarbs').textContent = carbs;
    
    const dietTable = document.getElementById('dietTable');
    
    if (diet.length === 0) {
        dietTable.innerHTML = '<p class="empty-state">Не удалось сформировать рацион. Добавьте больше продуктов в базу.</p>';
        return;
    }
    
    const totalDietCalories = diet.reduce((sum, item) => sum + item.calories, 0);
    const totalDietProteins = diet.reduce((sum, item) => sum + item.proteins, 0);
    const totalDietFats = diet.reduce((sum, item) => sum + item.fats, 0);
    const totalDietCarbs = diet.reduce((sum, item) => sum + item.carbs, 0);
    
    // Рассчитываем разведение для каждого продукта
    const dietWithDilution = diet.map(item => {
        const dilution = calculateDilution(item.amount, item.caloriesPer100g);
        return { ...item, dilution };
    });
    
    // Суммируем разведение для всех продуктов
    const totalNormal = dietWithDilution.reduce((sum, item) => ({
        scoops: sum.scoops + item.dilution.scoops,
        water: sum.water + item.dilution.normal.water,
        volume: sum.volume + item.dilution.normal.volume,
        calories: sum.calories + item.dilution.normal.calories
    }), { scoops: 0, water: 0, volume: 0, calories: 0 });
    
    const totalHyper = dietWithDilution.reduce((sum, item) => ({
        scoops: sum.scoops + item.dilution.scoops,
        water: sum.water + item.dilution.hyper.water,
        volume: sum.volume + item.dilution.hyper.volume,
        calories: sum.calories + item.dilution.hyper.calories
    }), { scoops: 0, water: 0, volume: 0, calories: 0 });
    
    dietTable.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Продукт</th>
                    <th>Количество (г)</th>
                    <th>Мерные ложки</th>
                    <th>Калории</th>
                    <th>Белки (г)</th>
                    <th>Жиры (г)</th>
                    <th>Углеводы (г)</th>
                </tr>
            </thead>
            <tbody>
                ${dietWithDilution.map(item => `
                    <tr>
                        <td>${escapeHtml(item.name)}</td>
                        <td>${item.amount}</td>
                        <td>${item.dilution.scoops.toFixed(1)}</td>
                        <td>${item.calories.toFixed(1)}</td>
                        <td>${item.proteins.toFixed(1)}</td>
                        <td>${item.fats.toFixed(1)}</td>
                        <td>${item.carbs.toFixed(1)}</td>
                    </tr>
                `).join('')}
                <tr class="total-row">
                    <td><strong>Итого</strong></td>
                    <td><strong>${diet.reduce((sum, item) => sum + item.amount, 0).toFixed(1)}</strong></td>
                    <td><strong>${totalNormal.scoops.toFixed(1)}</strong></td>
                    <td><strong>${totalDietCalories.toFixed(1)}</strong></td>
                    <td><strong>${totalDietProteins.toFixed(1)}</strong></td>
                    <td><strong>${totalDietFats.toFixed(1)}</strong></td>
                    <td><strong>${totalDietCarbs.toFixed(1)}</strong></td>
                </tr>
            </tbody>
        </table>
        
        <div class="dilution-section">
            <h4>Разведение смеси</h4>
            <div class="dilution-cards">
                <div class="dilution-card">
                    <h5>Обычное разведение</h5>
                    <div class="dilution-info">
                        <div class="dilution-item">
                            <span class="dilution-label">Мерные ложки:</span>
                            <span class="dilution-value">${totalNormal.scoops.toFixed(1)}</span>
                        </div>
                        <div class="dilution-item">
                            <span class="dilution-label">Вода:</span>
                            <span class="dilution-value">${Math.round(totalNormal.water)} мл</span>
                        </div>
                        <div class="dilution-item">
                            <span class="dilution-label">Готовый объем:</span>
                            <span class="dilution-value">${Math.round(totalNormal.volume)} мл</span>
                        </div>
                        <div class="dilution-item">
                            <span class="dilution-label">Калорийность:</span>
                            <span class="dilution-value">${totalNormal.calories.toFixed(1)} ккал</span>
                        </div>
                    </div>
                </div>
                <div class="dilution-card">
                    <h5>Гиперкалорическое разведение</h5>
                    <div class="dilution-info">
                        <div class="dilution-item">
                            <span class="dilution-label">Мерные ложки:</span>
                            <span class="dilution-value">${totalHyper.scoops.toFixed(1)}</span>
                        </div>
                        <div class="dilution-item">
                            <span class="dilution-label">Вода:</span>
                            <span class="dilution-value">${Math.round(totalHyper.water)} мл</span>
                        </div>
                        <div class="dilution-item">
                            <span class="dilution-label">Готовый объем:</span>
                            <span class="dilution-value">${Math.round(totalHyper.volume)} мл</span>
                        </div>
                        <div class="dilution-item">
                            <span class="dilution-label">Калорийность:</span>
                            <span class="dilution-value">${totalHyper.calories.toFixed(1)} ккал</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Сохраняем данные для экспорта
    window.lastDietResult = { calories, proteins, fats, carbs, diet };
}

// Экспорт результата в Excel
function exportResultToExcel() {
    if (!window.lastDietResult) {
        showError('Нет данных для экспорта');
        return;
    }
    
    const { calories, proteins, fats, carbs, diet } = window.lastDietResult;
    
    // Создаем данные для экспорта
    const wsData = [
        ['Расчет рациона медицинского питания'],
        [],
        ['Параметры расчета'],
        ['Калорийность (ккал/день):', calories],
        ['Белки (г/день):', proteins],
        ['Жиры (г/день):', fats],
        ['Углеводы (г/день):', carbs],
        [],
        ['Рекомендуемый рацион'],
        ['Продукт', 'Количество (г)', 'Калории', 'Белки (г)', 'Жиры (г)', 'Углеводы (г)'],
        ...diet.map(item => [
            item.name,
            item.amount,
            item.calories.toFixed(1),
            item.proteins.toFixed(1),
            item.fats.toFixed(1),
            item.carbs.toFixed(1)
        ])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Рацион');
    
    XLSX.writeFile(wb, 'рацион_питания.xlsx');
    showSuccess('Результат экспортирован в Excel');
}

// Утилиты
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

// Инициализация начальных данных
async function initializeInitialData() {
    try {
        const existingProducts = await ProductsAPI.getAll();

        if (existingProducts.length === 0 && typeof initialProducts !== 'undefined') {
            console.log('Загрузка начальных данных продуктов в Supabase...');
            const productsToInsert = initialProducts.map(p => ({
                name: p.name,
                calories: p.calories,
                proteins: p.proteins,
                fats: p.fats,
                carbs: p.carbs,
                description: p.description || ''
            }));
            await ProductsAPI.bulkInsert(productsToInsert);
            console.log(`Загружено ${initialProducts.length} продуктов`);
        }
    } catch (error) {
        console.error('Ошибка загрузки начальных данных:', error);
    }
}
