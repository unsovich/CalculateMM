// Начальные данные продуктов медицинского питания
// ВНИМАНИЕ: Значения КБЖУ (Калории, Белки, Жиры, Углеводы) являются ПРИМЕРНЫМИ (450/18/16/58 на 100г) 
// и должны быть скорректированы в соответствии с фактическим составом продукта!

// initialData.js - начальные данные продуктов для базы данных

const initialProducts = [
    {
        name: "Нутризон Эдванст Пептик",
        calories: 456,
        proteins: 18.3,
        fats: 17.8,
        carbs: 51.6,
        scoopWeight: 14.5,
        packageAmount: 450,

        // Обычное разведение (1.0 ккал/мл)
        scoopsPerServing_ordinary: 4,
        waterPerServing_ordinary: 85,
        servingVolume_ordinary: 100,

        // Гиперкалорическое разведение (1.5 ккал/мл)
        scoopsPerServing_hyper: 6,
        waterPerServing_hyper: 77,
        servingVolume_hyper: 100,

        description: "Полуэлементная смесь для энтерального питания",
        applicationMethod: "Обычное: 4 ложки на 85 мл воды (100 мл готовой смеси). Гипер: 6 ложек на 77 мл воды (100 мл готовой смеси)."
    },
    {
        name: "Нутризон Энергия",
        calories: 500,
        proteins: 16.7,
        fats: 19.4,
        carbs: 61.1,
        scoopWeight: 15.0,
        packageAmount: 450,

        scoopsPerServing_ordinary: 4,
        waterPerServing_ordinary: 90,
        servingVolume_ordinary: 100,

        scoopsPerServing_hyper: 6,
        waterPerServing_hyper: 80,
        servingVolume_hyper: 100,

        description: "Высококалорийная смесь для энтерального питания",
        applicationMethod: "Обычное: 4 ложки на 90 мл воды. Гипер: 6 ложек на 80 мл воды."
    },
    {
        name: "Нутрини Мульти Файбер",
        calories: 400,
        proteins: 15.0,
        fats: 16.0,
        carbs: 48.0,
        scoopWeight: 13.0,
        packageAmount: 400,

        scoopsPerServing_ordinary: 4,
        waterPerServing_ordinary: 80,
        servingVolume_ordinary: 100,

        scoopsPerServing_hyper: 6,
        waterPerServing_hyper: 70,
        servingVolume_hyper: 100,

        description: "Полноценная смесь для детей с пищевыми волокнами",
        applicationMethod: "Обычное: 4 ложки на 80 мл воды. Гипер: 6 ложек на 70 мл воды."
    },
    {
        name: "Нутридринк Компакт",
        calories: 480,
        proteins: 18.0,
        fats: 18.7,
        carbs: 56.0,
        scoopWeight: 14.0,
        packageAmount: 420,

        scoopsPerServing_ordinary: 4,
        waterPerServing_ordinary: 85,
        servingVolume_ordinary: 100,

        scoopsPerServing_hyper: 6,
        waterPerServing_hyper: 75,
        servingVolume_hyper: 100,

        description: "Высокобелковая высококалорийная смесь",
        applicationMethod: "Обычное: 4 ложки на 85 мл воды. Гипер: 6 ложек на 75 мл воды."
    },
    {
        name: "Фрезубин Оригинал",
        calories: 420,
        proteins: 15.0,
        fats: 15.4,
        carbs: 51.0,
        scoopWeight: 12.5,
        packageAmount: 500,

        scoopsPerServing_ordinary: 4,
        waterPerServing_ordinary: 82,
        servingVolume_ordinary: 100,

        scoopsPerServing_hyper: 6,
        waterPerServing_hyper: 72,
        servingVolume_hyper: 100,

        description: "Стандартная смесь для энтерального питания",
        applicationMethod: "Обычное: 4 ложки на 82 мл воды. Гипер: 6 ложек на 72 мл воды."
    },
    {
        name: "Фрезубин Энергия",
        calories: 500,
        proteins: 16.7,
        fats: 19.4,
        carbs: 61.1,
        scoopWeight: 15.0,
        packageAmount: 500,

        scoopsPerServing_ordinary: 4,
        waterPerServing_ordinary: 90,
        servingVolume_ordinary: 100,

        scoopsPerServing_hyper: 6,
        waterPerServing_hyper: 80,
        servingVolume_hyper: 100,

        description: "Высококалорийная смесь",
        applicationMethod: "Обычное: 4 ложки на 90 мл воды. Гипер: 6 ложек на 80 мл воды."
    },
    {
        name: "Пептамен",
        calories: 440,
        proteins: 16.0,
        fats: 15.6,
        carbs: 55.0,
        scoopWeight: 13.5,
        packageAmount: 400,

        scoopsPerServing_ordinary: 4,
        waterPerServing_ordinary: 84,
        servingVolume_ordinary: 100,

        scoopsPerServing_hyper: 6,
        waterPerServing_hyper: 74,
        servingVolume_hyper: 100,

        description: "Полуэлементная смесь с пептидами",
        applicationMethod: "Обычное: 4 ложки на 84 мл воды. Гипер: 6 ложек на 74 мл воды."
    },
    {
        name: "Ресурс Оптимум",
        calories: 460,
        proteins: 17.5,
        fats: 17.2,
        carbs: 53.0,
        scoopWeight: 14.0,
        packageAmount: 400,

        scoopsPerServing_ordinary: 4,
        waterPerServing_ordinary: 86,
        servingVolume_ordinary: 100,

        scoopsPerServing_hyper: 6,
        waterPerServing_hyper: 76,
        servingVolume_hyper: 100,

        description: "Сбалансированная смесь для энтерального питания",
        applicationMethod: "Обычное: 4 ложки на 86 мл воды. Гипер: 6 ложек на 76 мл воды."
    },
    {
        name: "Нутриэн Стандарт",
        calories: 400,
        proteins: 14.0,
        fats: 14.8,
        carbs: 50.0,
        scoopWeight: 12.0,
        packageAmount: 350,

        scoopsPerServing_ordinary: 4,
        waterPerServing_ordinary: 80,
        servingVolume_ordinary: 100,

        scoopsPerServing_hyper: 6,
        waterPerServing_hyper: 70,
        servingVolume_hyper: 100,

        description: "Стандартная смесь отечественного производства",
        applicationMethod: "Обычное: 4 ложки на 80 мл воды. Гипер: 6 ложек на 70 мл воды."
    },
    {
        name: "Нутриэн Элементаль",
        calories: 430,
        proteins: 15.5,
        fats: 15.0,
        carbs: 54.0,
        scoopWeight: 13.0,
        packageAmount: 400,

        scoopsPerServing_ordinary: 4,
        waterPerServing_ordinary: 83,
        servingVolume_ordinary: 100,

        scoopsPerServing_hyper: 6,
        waterPerServing_hyper: 73,
        servingVolume_hyper: 100,

        description: "Элементная смесь для пациентов с нарушением пищеварения",
        applicationMethod: "Обычное: 4 ложки на 83 мл воды. Гипер: 6 ложек на 73 мл воды."
    },
    {
        name: "Берламин Модуляр",
        calories: 410,
        proteins: 15.0,
        fats: 14.5,
        carbs: 51.5,
        scoopWeight: 12.5,
        packageAmount: 450,

        scoopsPerServing_ordinary: 4,
        waterPerServing_ordinary: 81,
        servingVolume_ordinary: 100,

        scoopsPerServing_hyper: 6,
        waterPerServing_hyper: 71,
        servingVolume_hyper: 100,

        description: "Модульная смесь для индивидуального подбора питания",
        applicationMethod: "Обычное: 4 ложки на 81 мл воды. Гипер: 6 ложек на 71 мл воды."
    },
    {
        name: "Клинутрен Юниор",
        calories: 420,
        proteins: 16.0,
        fats: 16.8,
        carbs: 49.0,
        scoopWeight: 13.0,
        packageAmount: 400,

        scoopsPerServing_ordinary: 4,
        waterPerServing_ordinary: 82,
        servingVolume_ordinary: 100,

        scoopsPerServing_hyper: 6,
        waterPerServing_hyper: 72,
        servingVolume_hyper: 100,

        description: "Смесь для детей от 1 года до 10 лет",
        applicationMethod: "Обычное: 4 ложки на 82 мл воды. Гипер: 6 ложек на 72 мл воды."
    },
    {
        name: "Нутрикомп Стандарт",
        calories: 405,
        proteins: 14.5,
        fats: 15.0,
        carbs: 50.5,
        scoopWeight: 12.5,
        packageAmount: 500,

        scoopsPerServing_ordinary: 4,
        waterPerServing_ordinary: 81,
        servingVolume_ordinary: 100,

        scoopsPerServing_hyper: 6,
        waterPerServing_hyper: 71,
        servingVolume_hyper: 100,

        description: "Стандартная сбалансированная смесь",
        applicationMethod: "Обычное: 4 ложки на 81 мл воды. Гипер: 6 ложек на 71 мл воды."
    },
    {
        name: "Изокал",
        calories: 400,
        proteins: 13.4,
        fats: 13.3,
        carbs: 53.3,
        scoopWeight: 12.0,
        packageAmount: 400,

        scoopsPerServing_ordinary: 4,
        waterPerServing_ordinary: 80,
        servingVolume_ordinary: 100,

        scoopsPerServing_hyper: 6,
        waterPerServing_hyper: 70,
        servingVolume_hyper: 100,

        description: "Изокалорийная смесь для энтерального питания",
        applicationMethod: "Обычное: 4 ложки на 80 мл воды. Гипер: 6 ложек на 70 мл воды."
    },
    {
        name: "Нутрилон Пепти Гастро",
        calories: 450,
        proteins: 16.5,
        fats: 17.0,
        carbs: 52.0,
        scoopWeight: 13.5,
        packageAmount: 450,

        scoopsPerServing_ordinary: 4,
        waterPerServing_ordinary: 85,
        servingVolume_ordinary: 100,

        scoopsPerServing_hyper: 6,
        waterPerServing_hyper: 75,
        servingVolume_hyper: 100,

        description: "Специализированная смесь на основе гидролизата белка",
        applicationMethod: "Обычное: 4 ложки на 85 мл воды. Гипер: 6 ложек на 75 мл воды."
    }
];

// Функция для автоматического добавления недостающих полей
function normalizeProducts(products) {
    return products.map(product => {
        // Если поля объема не указаны, устанавливаем null (будет использоваться расчетное значение)
        return {
            name: product.name || '',
            calories: product.calories || null,
            proteins: product.proteins || null,
            fats: product.fats || null,
            carbs: product.carbs || null,
            description: product.description || '',
            applicationMethod: product.applicationMethod || '',

            scoopWeight: product.scoopWeight || null,
            packageAmount: product.packageAmount || null,

            scoopsPerServing_ordinary: product.scoopsPerServing_ordinary || null,
            waterPerServing_ordinary: product.waterPerServing_ordinary || null,
            servingVolume_ordinary: product.servingVolume_ordinary || null,

            scoopsPerServing_hyper: product.scoopsPerServing_hyper || null,
            waterPerServing_hyper: product.waterPerServing_hyper || null,
            servingVolume_hyper: product.servingVolume_hyper || null,
        };
    });
}

// Экспорт нормализованных продуктов (если используется как модуль)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initialProducts: normalizeProducts(initialProducts) };
}