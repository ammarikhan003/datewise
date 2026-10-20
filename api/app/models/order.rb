class Order < ApplicationRecord
  STATUSES = %w[confirmed].freeze

  belongs_to :product

  validates :delivery_date, :customer_name, :address, presence: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :status, inclusion: { in: STATUSES }
end
