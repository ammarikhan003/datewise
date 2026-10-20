require "rails_helper"

RSpec.describe Imports::BankHolidayImporter do
  def import(csv)
    described_class.new(StringIO.new(csv)).call
  end

  let(:header) { "date,name\n" }

  it "imports good rows" do
    result = import(header + <<~CSV)
      2026-12-25,Christmas Day
      2026-12-28,Boxing Day (substitute day)
    CSV

    expect(result.imported).to eq(2)
    expect(BankHoliday.find_by!(date: Date.new(2026, 12, 28)).name).to eq("Boxing Day (substitute day)")
  end

  it "rejects missing fields" do
    result = import(header + "2026-12-25,\n")

    expect(result.rejected.map(&:to_h)).to eq([ { line: 2, reason: "missing name" } ])
  end

  it "rejects dates that don't exist or aren't YYYY-MM-DD" do
    result = import(header + <<~CSV)
      2026-02-30,Not a day
      25/12/2026,Wrong format
    CSV

    expect(result.rejected.map(&:to_h)).to eq([
      { line: 2, reason: 'date is not a real YYYY-MM-DD date (got "2026-02-30")' },
      { line: 3, reason: 'date is not a real YYYY-MM-DD date (got "25/12/2026")' }
    ])
  end

  it "skips dates that already exist" do
    create(:bank_holiday, date: Date.new(2026, 12, 25))

    result = import(header + "2026-12-25,Christmas Day\n")

    expect(result.imported).to eq(0)
    expect(result.duplicates).to eq(1)
  end
end
