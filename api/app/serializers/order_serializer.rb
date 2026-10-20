module OrderSerializer
  def self.call(order)
    {
      id: order.id,
      delivery_date: order.delivery_date,
      status: order.status,
      customer_name: order.customer_name,
      email: order.email,
      address: order.address,
      created_at: order.created_at,
      product: order.product.slice(:slug, :name, :price_pence)
    }
  end
end
