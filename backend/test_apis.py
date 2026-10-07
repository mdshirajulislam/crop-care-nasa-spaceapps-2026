import httpx
import asyncio
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api/v1"

async def test_all_apis():
    print("========================================")
    print("🌾 STARTING END-TO-END BACKEND API AUDIT")
    print("========================================")

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Weather Forecast
        print("\n1. Testing Weather Forecast & Spray Advisor...")
        res = await client.get(f"{BASE_URL}/weather/forecast")
        assert res.status_code == 200, f"Weather failed: {res.status_code}"
        w_data = res.json()
        print(f"   [OK] Source: {w_data.get('source_label')}")
        print(f"   [OK] Today's Spray Advice: {w_data.get('pesticide_spray_advisor', {}).get('title_bn')}")
        print(f"   [OK] 7-Day Day Names: {[d.get('day_name_short_bn') for d in w_data.get('forecast', [])]}")
        # Verify no 'Big' or 'Venus'
        for d in w_data.get('forecast', []):
            assert "Big" not in d.get('day_name_short_bn', '')
            assert "Venus" not in d.get('day_name_short_bn', '')

        # 2. NASA POWER Climatology
        print("\n2. Testing NASA POWER 20-Yr Climatology...")
        res = await client.get(f"{BASE_URL}/weather/nasa-climatology")
        assert res.status_code == 200
        clim = res.json()
        print(f"   [OK] Source: {clim.get('source')}")
        print(f"   [OK] Months count: {len(clim.get('monthly', []))}")

        # 3. Planting Advisor
        print("\n3. Testing Planting Advisor Engine...")
        res = await client.get(f"{BASE_URL}/planting/advisor?crop_id=aman_rice&planting_date=2026-07-20")
        assert res.status_code == 200
        plant = res.json()
        print(f"   [OK] Crop: {plant.get('crop_name_bn')}")
        print(f"   [OK] Best Window: {plant.get('best_window', {}).get('window_text_bn')}")
        print(f"   [OK] Risky Window: {plant.get('risky_window', {}).get('window_text_bn')}")

        # 4. Disease Diagnosis & Dosage
        print("\n4. Testing Disease Diagnosis & Land Area Dosage Calculator...")
        res = await client.post(f"{BASE_URL}/disease/diagnose", json={
            "crop_hint": "আলুর লেট ব্লাইট",
            "land_area_bigha": 3.5
        })
        assert res.status_code == 200
        diag = res.json()
        print(f"   [OK] Disease: {diag.get('disease_name_bn')}")
        print(f"   [OK] Organic Remedy: {diag.get('treatment', {}).get('organic_home_remedy')[:40]}...")
        print(f"   [OK] Land Cost (3.5 Bigha): ৳ {diag.get('treatment', {}).get('calculated_cost_for_land', {}).get('total_estimated_bdt')}")

        # 5. Farm Diary & Expenses
        print("\n5. Testing Farm Diary & Expense Analytics...")
        res = await client.get(f"{BASE_URL}/diary/financial-summary")
        assert res.status_code == 200
        fin = res.json()
        print(f"   [OK] Total Expense: ৳ {fin.get('total_expense_bdt')}")
        print(f"   [OK] Cost per Bigha: ৳ {fin.get('cost_per_bigha_bdt')}")
        print(f"   [OK] Cost per Decimal: ৳ {fin.get('cost_per_decimal_bdt')}")

        # 6. AI Krishi Assistant Chat
        print("\n6. Testing AI Krishi Assistant Chatbot...")
        res = await client.post(f"{BASE_URL}/chat/ask", json={"message": "আমন ধানে ইউরিয়া সার প্রয়োগের নিয়ম কী?"})
        assert res.status_code == 200
        chat = res.json()
        print(f"   [OK] Assistant Reply: {chat.get('reply_bn')[:80]}...")

        # 7. Satellite Layer & NDVI
        print("\n7. Testing Satellite NDVI Layer...")
        res = await client.get(f"{BASE_URL}/satellite/ndvi-timeseries")
        assert res.status_code == 200
        print(f"   [OK] NDVI Timeseries Points: {len(res.json())}")

    print("\n========================================")
    print("✅ ALL BACKEND APIS ARE WORKING 100% PERFECTLY!")
    print("========================================")

if __name__ == "__main__":
    asyncio.run(test_all_apis())
