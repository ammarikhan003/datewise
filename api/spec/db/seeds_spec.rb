require "rails_helper"

RSpec.describe "db/seeds.rb" do
  def load_seeds = expect { load Rails.root.join("db/seeds.rb") }

  it "imports the sample products, reporting the two deliberately bad rows" do
    load_seeds.to output(<<~OUT).to_stdout
      products.csv: 10 imported, 0 duplicates, 2 rejected
        line 7: price_pence is not a whole number (got "thirty-five")
        line 13: missing name
      bank_holidays.csv: 16 imported, 0 duplicates, 0 rejected
    OUT
    expect(Product.where(stock: 0).pluck(:slug)).to eq([ "scented-candle-gift-set" ])
    expect(Product.where(lead_time_days: 2).count).to eq(2)
  end

  it "is safe to run twice" do
    load_seeds.to output.to_stdout

    load_seeds.to output(/10 duplicates.*16 duplicates/m).to_stdout
    expect(Product.count).to eq(10)
    expect(BankHoliday.count).to eq(16)
  end
end
