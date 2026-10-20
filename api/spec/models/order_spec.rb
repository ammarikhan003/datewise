require "rails_helper"

RSpec.describe Order do
  it "is valid from the factory" do
    expect(build(:order)).to be_valid
  end

  it "belongs to a product" do
    expect(build(:order, product: nil)).not_to be_valid
  end

  %i[delivery_date customer_name email address].each do |attribute|
    it "requires #{attribute}" do
      expect(build(:order, attribute => nil)).not_to be_valid
    end
  end

  it "rejects an email without an @ and a domain" do
    expect(build(:order, email: "ada.example.com")).not_to be_valid
    expect(build(:order, email: "ada@")).not_to be_valid
  end

  it "is confirmed by default" do
    expect(Order.new.status).to eq("confirmed")
  end

  it "only accepts known statuses" do
    expect(build(:order, status: "lost")).not_to be_valid
  end

  it "cannot outlive its product" do
    order = create(:order)

    expect { order.product.delete }.to raise_error(ActiveRecord::InvalidForeignKey)
  end
end
