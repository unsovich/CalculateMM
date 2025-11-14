/*
  # Create products table for medical nutrition calculator

  1. New Tables
    - `products`
      - `id` (uuid, primary key) - Unique product identifier
      - `name` (text, not null) - Product name
      - `calories` (numeric, not null) - Calories per 100g
      - `proteins` (numeric, not null) - Proteins per 100g
      - `fats` (numeric, not null) - Fats per 100g
      - `carbs` (numeric, not null) - Carbs per 100g
      - `description` (text) - Optional product description
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `products` table
    - Add policy for public read access (all users can view products)
    - Add policy for authenticated users to manage products

  3. Important Notes
    - Products are shared across all users
    - Public read access allows anyone to view product database
    - Only authenticated users can add/edit/delete products
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  calories numeric NOT NULL CHECK (calories >= 0),
  proteins numeric NOT NULL CHECK (proteins >= 0),
  fats numeric NOT NULL CHECK (fats >= 0),
  carbs numeric NOT NULL CHECK (carbs >= 0),
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to all products
CREATE POLICY "Anyone can view products"
  ON products
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert products
CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update products
CREATE POLICY "Authenticated users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete products
CREATE POLICY "Authenticated users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index on name for faster search
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();