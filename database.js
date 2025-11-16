// Утилиты для работы с IndexedDB
class Database {
    constructor() {
        this.dbName = 'MedicalNutritionDB';
        this.dbVersion = 2; // Увеличиваем версию для добавления новых полей
        this.storeName = 'products';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion;

                // Создание хранилища, если оно не существует
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    objectStore.createIndex('name', 'name', { unique: false });
                }

                // Миграция с версии 1 на версию 2: добавление полей servingVolume
                if (oldVersion < 2) {
                    console.log('Миграция базы данных: добавление полей servingVolume_ordinary и servingVolume_hyper');
                    // Поля добавятся автоматически при следующем сохранении объектов
                    // IndexedDB позволяет хранить объекты с любыми свойствами
                }
            };
        });
    }

    async addProduct(product) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            transaction.onerror = (e) => reject(e.target.error);
            transaction.oncomplete = () => resolve(true);

            const request = store.add(product);
            request.onsuccess = () => resolve({ id: request.result });
            request.onerror = () => reject(request.error);
        });
    }

    async updateProduct(id, product) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            product.id = Number(id);

            const request = store.put(product);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteProduct(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const request = store.delete(Number(id));
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async getProductById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);

            const request = store.get(Number(id));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllProducts() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async searchProducts(searchTerm) {
        const allProducts = await this.getAllProducts();
        const term = searchTerm.toLowerCase();
        return allProducts.filter(product =>
            product.name.toLowerCase().includes(term)
        );
    }

    async bulkInsert(products) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            transaction.onerror = (e) => reject(e.target.error);
            transaction.oncomplete = () => resolve(true);

            for (const product of products) {
                const { id, ...productWithoutId } = product;
                store.add(productWithoutId);
            }
        });
    }
}

// Глобальный экземпляр базы данных и API
var db = new Database();

var ProductsAPI = {
    getAll: () => db.getAllProducts(),
    getById: (id) => db.getProductById(id),
    bulkInsert: (products) => db.bulkInsert(products),
    addProduct: (product) => db.addProduct(product),
    updateProduct: (id, product) => db.updateProduct(id, product),
    deleteProduct: (id) => db.deleteProduct(id),
};