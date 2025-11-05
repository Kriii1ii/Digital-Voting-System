#!/usr/bin/env bash
# Initialize a single-node MongoDB replica set (retry until available)
set -e
MONGO_URI=${MONGO_URI:-"mongodb://localhost:27017"}
echo "Waiting for MongoDB at $MONGO_URI..."
for i in {1..30}; do
  if mongo --eval 'db.adminCommand({ping:1})' >/dev/null 2>&1; then
    echo "Mongo is up"
    break
  fi
  echo "Waiting... ($i)"
  sleep 1
done

echo "Initiating replica set rs0 (if not already initialized)"
mongo --eval 'rs.status()' >/dev/null 2>&1 || true
mongo --eval 'rs.initiate({_id: "rs0", members: [{ _id: 0, host: "localhost:27017" }]})' || true
echo "Replica set initiation requested. Check with: mongosh --eval 'rs.status()'"
