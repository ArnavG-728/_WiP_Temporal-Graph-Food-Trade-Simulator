# 📥 Bulk Download Quick Reference

## What You're Downloading

### ✅ **Use "Normalized" versions** - 271 MB total

**4 Files to Download:**

1. **Production** (~80 MB)
   - https://fenixservices.fao.org/faostat/static/bulkdownloads/Production_Crops_Livestock_E_All_Data_(Normalized).zip

2. **Trade** (~60 MB)
   - https://fenixservices.fao.org/faostat/static/bulkdownloads/Trade_Crops_Livestock_E_All_Data_(Normalized).zip

3. **Food Balance** (~40 MB)
   - https://fenixservices.fao.org/faostat/static/bulkdownloads/FoodBalanceSheets_E_All_Data_(Normalized).zip

4. **Bilateral Trade Matrix** (~50 MB)
   - https://fenixservices.fao.org/faostat/static/bulkdownloads/Trade_DetailedTradeMatrix_E_All_Data_(Normalized).zip

---

## After Download

### Step 1: Extract ZIP Files
Extract all 4 ZIP files. You'll get CSV files.

### Step 2: Place CSVs in Bulk Folder
Move the CSV files to:
```
backend/app/data/raw/bulk/
```

Expected files:
- `Production_Crops_Livestock_E_All_Data_(Normalized).csv`
- `Trade_Crops_Livestock_E_All_Data_(Normalized).csv`
- `FoodBalanceSheets_E_All_Data_(Normalized).csv`
- `Trade_DetailedTradeMatrix_E_All_Data_(Normalized).csv`

### Step 3: Filter the Data
```bash
cd backend
venv\Scripts\activate
python -m app.data.bulk_filter
```

This will:
- ✅ Filter to **10 key crops** (Wheat, Rice, Maize, Soybeans, etc.)
- ✅ Filter to **2018-2021** years
- ✅ Keep **ALL countries** (not just 5)
- ✅ Reduce file size from 271 MB to ~5-10 MB
- ✅ Save to `app/data/raw/faostat_*.csv`

### Step 4: Run the Pipeline
```bash
python run_data_pipeline.py --manual
```

---

## Key Crops Included (10 items)

1. **Wheat** - Major cereal
2. **Rice** - Staple food
3. **Maize (Corn)** - Feed and food
4. **Soybeans** - Oilseed and protein
5. **Potatoes** - Vegetable staple
6. **Bananas** - Fruit export
7. **Cattle** - Livestock
8. **Chickens** - Poultry
9. **Cereals, Total** - Aggregate
10. **Vegetables, Total** - Aggregate

**Why these?** They represent major food groups and are heavily traded globally.

---

## What You'll Get

### All Countries (~200)
- Not just 5 MVP countries
- Full global trade network
- Can filter to specific countries later

### 4 Years (2018-2021)
- Recent historical data
- Enough for temporal analysis
- Can extend later

### Manageable Size
- Original: 271 MB (too large for Excel)
- Filtered: ~5-10 MB (Excel-friendly)
- Still comprehensive

---

## Timeline

1. **Download**: 5-10 minutes (depending on internet)
2. **Extract**: 1-2 minutes
3. **Filter**: 2-3 minutes (script processes automatically)
4. **Total**: ~15 minutes

---

## When You're Ready

**Tell me when you've:**
1. ✅ Downloaded all 4 ZIP files
2. ✅ Extracted the CSVs
3. ✅ Placed them in `backend/app/data/raw/bulk/`

**Then I'll help you:**
1. Run the filter script
2. Process the data
3. Continue to Phase 3!

---

**Take your time - I'll wait for your signal to continue!** 🚀
