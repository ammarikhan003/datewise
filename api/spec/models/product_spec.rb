require "rails_helper"

RSpec.describe Product do
  it "is valid from the factory" do
    expect(build(:product)).to be_valid
  end

  it "defaults lead time and stock to zero" do
    product = Product.new

    expect(product.lead_time_days).to eq(0)
    expect(product.stock).to eq(0)
  end

  %i[name slug price_pence].each do |attribute|
    it "requires #{attribute}" do
      product = build(:product, attribute => nil)

      expect(product).not_to be_valid
      expect(product.errors[attribute]).to include("can't be blank")
    end
  end

  it "requires a unique slug" do
    create(:product, slug: "red-roses")

    expect(build(:product, slug: "red-roses")).not_to be_valid
  end

  it "only accepts lowercase words joined by hyphens as a slug" do
    expect(build(:product, slug: "red-roses-12")).to be_valid
    expect(build(:product, slug: "Red Roses")).not_to be_valid
    expect(build(:product, slug: "red--roses")).not_to be_valid
    expect(build(:product, slug: "-red-roses")).not_to be_valid
  end

  %i[price_pence stock lead_time_days].each do |attribute|
    it "only accepts a whole number of zero or more for #{attribute}" do
      expect(build(:product, attribute => 0)).to be_valid
      expect(build(:product, attribute => -1)).not_to be_valid
      expect(build(:product, attribute => 1.5)).not_to be_valid
    end

    it "rejects a negative #{attribute} at the database level too" do
      product = create(:product)

      expect { product.update_column(attribute, -1) }
        .to raise_error(ActiveRecord::StatementInvalid, /check/i)
    end
  end
end
