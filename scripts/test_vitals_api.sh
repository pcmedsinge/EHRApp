#!/bin/bash
# Test Vitals API endpoints

echo "🔐 Getting authentication token..."
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Failed to get token"
    exit 1
fi

echo "✅ Token obtained"

# Use existing patient
PATIENT_ID="0330eb63-37f1-48a4-a0b7-cfb21e20d5e0"

# Create a visit first
echo -e "\n📋 Creating visit..."
VISIT_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/visits/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"patient_id\":\"${PATIENT_ID}\",\"visit_type\":\"consultation\",\"chief_complaint\":\"Testing vitals\"}")

VISIT_ID=$(echo "$VISIT_RESPONSE" | jq -r '.id')

if [ "$VISIT_ID" = "null" ]; then
    echo "❌ Failed to create visit"
    echo "$VISIT_RESPONSE"
    exit 1
fi

echo "✅ Visit created: $VISIT_ID"

# Test 1: Create vitals
echo -e "\n📊 Test 1: Creating vitals record..."
VITAL_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/vitals/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"visit_id\":\"${VISIT_ID}\",
    \"patient_id\":\"${PATIENT_ID}\",
    \"bp_systolic\":120,
    \"bp_diastolic\":80,
    \"pulse\":75,
    \"temperature\":37.0,
    \"spo2\":98,
    \"height_cm\":170,
    \"weight_kg\":70
  }")

VITAL_ID=$(echo "$VITAL_RESPONSE" | jq -r '.id')

if [ "$VITAL_ID" = "null" ]; then
    echo "❌ Failed to create vitals"
    echo "$VITAL_RESPONSE"
    exit 1
fi

echo "✅ Vitals created successfully"
echo "$VITAL_RESPONSE" | jq '{id, bp_systolic, bp_diastolic, pulse, temperature, bmi}'

# Test 2: Get vitals by visit
echo -e "\n📊 Test 2: Getting vitals for visit..."
curl -s -X GET "http://localhost:8000/api/v1/vitals/visit/${VISIT_ID}" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Test 3: Get patient vitals history
echo -e "\n📊 Test 3: Getting patient vitals history..."
curl -s -X GET "http://localhost:8000/api/v1/vitals/patient/${PATIENT_ID}" \
  -H "Authorization: Bearer $TOKEN" | jq 'length'

# Test 4: Get latest vitals
echo -e "\n📊 Test 4: Getting latest vitals..."
curl -s -X GET "http://localhost:8000/api/v1/vitals/patient/${PATIENT_ID}/latest" \
  -H "Authorization: Bearer $TOKEN" | jq '{id, bmi, recorded_at}'

echo -e "\n✅ All tests completed!"
