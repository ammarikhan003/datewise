class Product < ApplicationRecord
  SLUG_FORMAT = /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/

  has_many :orders, dependent: :restrict_with_error

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true,
                   format: { with: SLUG_FORMAT, message: "must be lowercase words joined by hyphens" }
  validates :price_pence, presence: true
  validates :price_pence, :lead_time_days, :stock,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
end
