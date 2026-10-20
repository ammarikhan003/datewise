# Per-date overrides: a different capacity, or a day an admin has closed.
# Dates without a row use the column defaults (capacity 50, open).
class DeliveryDay < ApplicationRecord
  validates :date, presence: true, uniqueness: true
  validates :capacity, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  before_save { self.closed_reason = nil unless closed }
end
