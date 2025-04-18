#!/bin/bash

# This script helps purge sensitive data from your git repository history
# Run this with caution - it will rewrite your git history!

echo "⚠️  Warning: This script will rewrite your git history to remove sensitive data."
echo "Make sure you have pushed a clean version of your repository before running this."
echo "All collaborators will need to re-clone the repository after you force push."

read -p "Do you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

# BFG Repo Cleaner is a faster alternative to git-filter-branch
# Install it first: https://rtyley.github.io/bfg-repo-cleaner/
# Or use Homebrew: brew install bfg

if command -v bfg > /dev/null 2>&1; then
    echo "Using BFG Repo Cleaner to remove secrets..."
    
    # Create a text file with patterns to replace
    cat > secrets.txt << EOL
    # API Keys - replace with placeholder text
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY==>your_google_maps_api_key_here
    YELP_API_KEY==>your_yelp_api_key_here
    OPENAI_API_KEY==>your_openai_api_key_here
    IMGBB_API_KEY==>your_imgbb_api_key_here
    NEXT_PUBLIC_SUPABASE_URL==>your_supabase_url_here
    NEXT_PUBLIC_SUPABASE_ANON_KEY==>your_supabase_anon_key_here
    EDGE_CONFIG==>your_edge_config_url_here
EOL

    # Run BFG to replace the text
    bfg --replace-text secrets.txt

    # Delete the temporary file
    rm secrets.txt
    
    echo "Cleaning up repository..."
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    
    echo "Done! You can now force push your changes with: git push origin --force"
else
    echo "BFG Repo Cleaner not found. Using git filter-branch instead (slower)."
    echo "Consider installing BFG for faster processing: https://rtyley.github.io/bfg-repo-cleaner/"
    
    # Use git filter-branch as fallback
    # Warning: This is much slower than BFG
    git filter-branch --force --index-filter \
        "git ls-files -z | xargs -0 sed -i '' \
        -e 's/AIzaSyBVNtfwTl6GcXX8iYNfYU48okdfFDe1qv4/your_google_maps_api_key_here/g' \
        -e 's/Sh8jSCeXrUFjI26X21piX7fHoNu03a2Wo0L-18juOrvOrMdllBLGa9cAkasWGjikdKg3LIgtoY6BE4RSq6v6FKqsZB0kj51v8Gn8--ENxWEXSgnw8kTmXbxrUTsBaHYx/your_yelp_api_key_here/g' \
        -e 's/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/your_openai_api_key_here/g' \
        -e 's/8206ac51f84cf55a26908a117a6198bd/your_imgbb_api_key_here/g' \
        -e 's|https://sjrodpluambkmhrgustl.supabase.co|your_supabase_url_here|g' \
        -e 's|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcm9kcGx1YW1ia21ocmd1c3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDc0NjUsImV4cCI6MjA2MDQ4MzQ2NX0.kM94mvbCijaydXCwV-13mGXNXv9A867l3hoTbxijel0|your_supabase_anon_key_here|g' \
        -e 's|https://edge-config.vercel.com/ecfg_bhyehjoafwlr17wizfmb6r0t9x3v?token=8802d2e5-728d-4acb-b651-279f42722c97|your_edge_config_url_here|g'" \
    --tag-name-filter cat -- --all
    
    echo "Cleaning up repository..."
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    
    echo "Done! You can now force push your changes with: git push origin --force"
fi 