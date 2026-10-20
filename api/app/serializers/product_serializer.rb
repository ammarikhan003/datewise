# Customers see whether a product is in stock, not the exact count.
module ProductSerializer
  def self.call(product)
    {
      slug: product.slug,
      name: product.name,
      price_pence: product.price_pence,
      lead_time_days: product.lead_time_days,
      in_stock: product.stock.positive?,
      image_url: product.image_url
    }
  end
end
