module Imports
  # Columns: name, slug, price_pence, lead_time_days, stock, image_url.
  # Prices are whole pence. A slug that already exists is skipped.
  class ProductImporter < CsvImporter
    private

    def model = Product
    def unique_by = :slug
    def required_columns = %w[name slug price_pence stock]

    def attributes_for(row)
      {
        name: row["name"],
        slug: row["slug"],
        price_pence: whole_number(row, "price_pence"),
        lead_time_days: whole_number(row, "lead_time_days", default: 0),
        stock: whole_number(row, "stock"),
        image_url: row["image_url"].presence
      }
    end
  end
end
