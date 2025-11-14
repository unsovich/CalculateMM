// Supabase client configuration
const SUPABASE_URL = 'https://ybefmfmslivahashwelc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZWZtZm1zbGl2YWhhc2h3ZWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwODIzMDcsImV4cCI6MjA3ODY1ODMwN30.76ypDCzxdmYuGr2Q3HG-as32rGu70sh6yrsD4zrFWk4';

let supabaseClient = null;

// Initialize Supabase client
function initSupabase() {
    if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized');
        return supabaseClient;
    }
    console.error('Failed to initialize Supabase client');
    return null;
}

// Products API
const ProductsAPI = {
    async getAll() {
        if (!supabaseClient) return [];
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching products:', error);
            return [];
        }
        return data || [];
    },

    async getById(id) {
        if (!supabaseClient) return null;
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching product:', error);
            return null;
        }
        return data;
    },

    async create(product) {
        if (!supabaseClient) throw new Error('Supabase not initialized');
        const { data, error } = await supabaseClient
            .from('products')
            .insert([product])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id, product) {
        if (!supabaseClient) throw new Error('Supabase not initialized');
        const { data, error } = await supabaseClient
            .from('products')
            .update(product)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id) {
        if (!supabaseClient) throw new Error('Supabase not initialized');
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async search(searchTerm) {
        if (!supabaseClient) return [];
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .ilike('name', `%${searchTerm}%`)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error searching products:', error);
            return [];
        }
        return data || [];
    },

    async bulkInsert(products) {
        if (!supabaseClient) throw new Error('Supabase not initialized');
        const { data, error } = await supabaseClient
            .from('products')
            .insert(products)
            .select();

        if (error) throw error;
        return data;
    }
};
