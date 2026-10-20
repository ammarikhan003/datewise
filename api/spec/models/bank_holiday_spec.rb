require "rails_helper"

RSpec.describe BankHoliday do
  it "is valid from the factory" do
    expect(build(:bank_holiday)).to be_valid
  end

  %i[date name].each do |attribute|
    it "requires #{attribute}" do
      expect(build(:bank_holiday, attribute => nil)).not_to be_valid
    end
  end

  it "allows only one holiday per date" do
    create(:bank_holiday, date: Date.new(2026, 12, 25))

    expect(build(:bank_holiday, date: Date.new(2026, 12, 25))).not_to be_valid
  end
end
