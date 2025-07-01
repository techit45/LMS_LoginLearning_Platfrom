#!/bin/bash

# Fix escape characters in ForumTopicCard.jsx
sed -i '' 's/className=\\"/className="/g' "/Users/techit/Desktop/Code/New Web Login/src/components/ForumTopicCard.jsx"
sed -i '' 's/\\" /\" /g' "/Users/techit/Desktop/Code/New Web Login/src/components/ForumTopicCard.jsx"
sed -i '' 's/\\"/"/g' "/Users/techit/Desktop/Code/New Web Login/src/components/ForumTopicCard.jsx"

echo "Fixed quote escaping in ForumTopicCard.jsx"