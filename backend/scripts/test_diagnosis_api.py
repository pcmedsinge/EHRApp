"""
Quick test script for Diagnosis API endpoints
"""

import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"

async def test_diagnosis_api():
    """Test diagnosis API endpoints"""
    
    async with httpx.AsyncClient() as client:
        # 1. Login to get token
        print("=" * 60)
        print("1. Logging in...")
        response = await client.post(
            f"{BASE_URL}/auth/login",
            json={"username": "dr_sharma", "password": "doctor123"}
        )
        print(f"   Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   ❌ Login failed: {response.text}")
            return
        
        auth_data = response.json()
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"   ✅ Logged in successfully")
        
        # 2. Test ICD-10 search
        print("\n" + "=" * 60)
        print("2. Testing ICD-10 search (diabetes)...")
        response = await client.get(
            f"{BASE_URL}/icd10/search",
            params={"query": "diabetes", "limit": 5},
            headers=headers
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            results = response.json()
            print(f"   ✅ Found {len(results)} codes:")
            for code in results[:3]:
                print(f"      - {code['code']}: {code['description'][:50]}...")
        else:
            print(f"   ❌ Error: {response.text}")
        
        # 3. Test popular codes
        print("\n" + "=" * 60)
        print("3. Testing popular ICD-10 codes...")
        response = await client.get(
            f"{BASE_URL}/icd10/popular",
            params={"limit": 5},
            headers=headers
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            codes = response.json()
            print(f"   ✅ Top {len(codes)} popular codes:")
            for code in codes:
                print(f"      - {code['code']}: {code['description'][:40]}... (used {code['usage_count']} times)")
        else:
            print(f"   ❌ Error: {response.text}")
        
        # 4. Test common Indian codes
        print("\n" + "=" * 60)
        print("4. Testing common Indian codes...")
        response = await client.get(
            f"{BASE_URL}/icd10/common-indian",
            params={"limit": 5},
            headers=headers
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            codes = response.json()
            print(f"   ✅ Found {len(codes)} common codes:")
            for code in codes[:3]:
                print(f"      - {code['code']}: {code['description'][:50]}...")
        else:
            print(f"   ❌ Error: {response.text}")
        
        # 5. Get specific code details
        print("\n" + "=" * 60)
        print("5. Testing code details (I10)...")
        response = await client.get(
            f"{BASE_URL}/icd10/I10",
            headers=headers
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            code = response.json()
            print(f"   ✅ Code details:")
            print(f"      Code: {code['code']}")
            print(f"      Description: {code['description']}")
            print(f"      Category: {code['category']}")
            print(f"      Common in India: {code['common_in_india']}")
        else:
            print(f"   ❌ Error: {response.text}")
        
        # 6. Get first visit for diagnosis creation
        print("\n" + "=" * 60)
        print("6. Getting a visit for diagnosis test...")
        response = await client.get(
            f"{BASE_URL}/visits",
            params={"skip": 0, "limit": 1},
            headers=headers
        )
        print(f"   Status: {response.status_code}")
        
        visit = None
        if response.status_code == 200:
            visits = response.json()
            if visits:
                visit = visits[0]
                print(f"   ✅ Found visit: {visit['id']}")
                print(f"      Patient: {visit['patient_id']}")
            else:
                print("   ⚠️  No visits found, skipping diagnosis creation test")
        else:
            print(f"   ❌ Error: {response.text}")
        
        # 7. Create diagnosis WITH ICD-10 code
        if visit:
            print("\n" + "=" * 60)
            print("7. Testing diagnosis creation WITH ICD-10 code...")
            diagnosis_data = {
                "visit_id": visit["id"],
                "patient_id": visit["patient_id"],
                "icd10_code": "E11.9",
                "diagnosis_description": "Type 2 diabetes mellitus without complications, well controlled",
                "diagnosis_type": "primary",
                "status": "confirmed",
                "severity": "moderate"
            }
            response = await client.post(
                f"{BASE_URL}/diagnoses/",
                json=diagnosis_data,
                headers=headers
            )
            print(f"   Status: {response.status_code}")
            if response.status_code == 201:
                diagnosis = response.json()
                print(f"   ✅ Created diagnosis: {diagnosis['id']}")
                print(f"      ICD-10: {diagnosis['icd10_code']}")
                print(f"      Description: {diagnosis['diagnosis_description'][:50]}...")
                print(f"      Type: {diagnosis['diagnosis_type']}")
                print(f"      Status: {diagnosis['status']}")
                
                # 8. Get visit diagnoses
                print("\n" + "=" * 60)
                print("8. Testing get visit diagnoses...")
                response = await client.get(
                    f"{BASE_URL}/diagnoses/visit/{visit['id']}",
                    headers=headers
                )
                print(f"   Status: {response.status_code}")
                if response.status_code == 200:
                    diagnoses = response.json()
                    print(f"   ✅ Found {len(diagnoses)} diagnosis(es):")
                    for d in diagnoses:
                        print(f"      - {d.get('icd10_code', 'N/A')}: {d['diagnosis_description'][:40]}...")
                else:
                    print(f"   ❌ Error: {response.text}")
            else:
                print(f"   ❌ Error: {response.text}")
        
        print("\n" + "=" * 60)
        print("✅ All tests completed!")
        print("=" * 60)


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("DIAGNOSIS API TEST SUITE")
    print("=" * 60 + "\n")
    asyncio.run(test_diagnosis_api())
