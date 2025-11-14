// Утилиты для работы с IndexedDB
class Database {
    constructor() {
        this.dbName = 'MedicalNutritionDB';
        this.dbVersion = 1;
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
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    objectStore.createIndex('name', 'name', { unique: false });
                }
            };
        });
    }

    async addProduct(product) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        return store.add(product);
    }

    async updateProduct(id, product) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        product.id = id;
        return store.put(product);
    }

    async deleteProduct(id) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        return store.delete(id);
    }

    async getProduct(id) {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        return store.get(id);
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

    async exportData() {
        const products = await this.getAllProducts();
        return JSON.stringify(products, null, 2);
    }

    async importData(jsonData) {
        try {
            const products = JSON.parse(jsonData);
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // Очищаем существующие данные
            await store.clear();
            
            // Добавляем новые данные
            for (const product of products) {
                if (product.id) {
                    delete product.id; // Удаляем id для автоинкремента
                }
                await store.add(product);
            }
            
            return true;
        } catch (error) {
            throw new Error('Ошибка импорта данных: ' + error.message);
        }
    }
}

// Глобальный экземпляр базы данных
const db = new Database();
