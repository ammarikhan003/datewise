require "rails_helper"

RSpec.describe Imports::ProductImporter do
  def import(csv)
    described_class.new(StringIO.new(csv)).call
  end

  let(:header) { "name,slug,price_pence,lead_time_days,stock,image_url\n" }

  it "imports good rows" do
    result = import(header + <<~CSV)
      Red Roses,red-roses,3500,0,20,https://example.com/roses.jpg
      Engraved Mug,engraved-mug,1800,2,5,
    CSV

    expect(result.imported).to eq(2)
    expect(result.rejected).to be_empty
    expect(Product.find_by!(slug: "engraved-mug"))
      .to have_attributes(name: "Engraved Mug", price_pence: 1800, lead_time_days: 2, stock: 5, image_url: nil)
  end

  it "defaults lead time to zero when the column is blank" do
    import(header + "Tulips,tulips,2000,,8,\n")

    expect(Product.find_by!(slug: "tulips").lead_time_days).to eq(0)
  end

  it "trims whitespace around values" do
    import(header + "  Tulips , tulips ,2000,0,8,\n")

    expect(Product.find_by!(slug: "tulips").name).to eq("Tulips")
  end

  it "rejects rows with missing required fields, naming each one" do
    result = import(header + ",tulips,,0,8,\n")

    expect(result.imported).to eq(0)
    expect(result.rejected.map(&:to_h)).to eq([ { line: 2, reason: "missing name, price_pence" } ])
  end

  it "rejects numbers that aren't whole numbers" do
    result = import(header + <<~CSV)
      Tulips,tulips,twenty,0,8,
      Lilies,lilies,2000,0,8.5,
    CSV

    expect(result.rejected.map(&:to_h)).to eq([
      { line: 2, reason: 'price_pence is not a whole number (got "twenty")' },
      { line: 3, reason: 'stock is not a whole number (got "8.5")' }
    ])
  end

  it "rejects rows the model rejects, with the model's message" do
    result = import(header + <<~CSV)
      Tulips,tulips,-100,0,8,
      Lilies,Lilies Large,2000,0,8,
    CSV

    expect(result.rejected.map(&:to_h)).to eq([
      { line: 2, reason: "Price pence must be greater than or equal to 0" },
      { line: 3, reason: "Slug must be lowercase words joined by hyphens" }
    ])
  end

  it "skips slugs that already exist, in the database or earlier in the file" do
    create(:product, slug: "red-roses")

    result = import(header + <<~CSV)
      Red Roses,red-roses,3500,0,20,
      Tulips,tulips,2000,0,8,
      Tulips again,tulips,2100,0,8,
    CSV

    expect(result.imported).to eq(1)
    expect(result.duplicates).to eq(2)
    expect(result.rejected).to be_empty
    expect(Product.find_by!(slug: "tulips").name).to eq("Tulips")
  end

  it "is safe to run twice" do
    csv = header + "Tulips,tulips,2000,0,8,\n"
    import(csv)

    result = import(csv)

    expect(result.imported).to eq(0)
    expect(result.duplicates).to eq(1)
    expect(Product.count).to eq(1)
  end

  it "keeps good rows when other rows are bad" do
    result = import(header + <<~CSV)
      Tulips,tulips,2000,0,8,
      ,broken,2000,0,8,
      Lilies,lilies,2200,0,4,
    CSV

    expect(result.imported).to eq(2)
    expect(result.rejected.map(&:line)).to eq([ 3 ])
  end

  it "ignores blank lines" do
    result = import(header + "Tulips,tulips,2000,0,8,\n\n")

    expect(result.imported).to eq(1)
    expect(result.rejected).to be_empty
  end

  it "does nothing for a header-only file" do
    result = import(header)

    expect([ result.imported, result.duplicates, result.rejected ]).to eq([ 0, 0, [] ])
  end
end
