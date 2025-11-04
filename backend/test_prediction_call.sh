#!/usr/bin/env bash
# Simple curl script to call backend prediction endpoint
ELECTION_ID=${1:-test-election-1}
URL=${BACKEND_URL:-http://localhost:5000}/api/prediction/$ELECTION_ID

echo "Calling $URL"
curl -s -X GET "$URL" -H "Accept: application/json" | jq .
