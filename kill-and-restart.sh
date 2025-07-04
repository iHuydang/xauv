#!/bin/bash

echo "🔧 Killing all Node processes..."
pkill -f node || true
pkill -f tsx || true

echo "⏳ Waiting for ports to be released..."
sleep 3

echo "🚀 Starting application..."
npm run dev