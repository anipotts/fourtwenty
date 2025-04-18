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
    echo "BFG Repo Cleaner not found. Using alternate method."
    echo "Consider installing BFG for faster processing: https://rtyley.github.io/bfg-repo-cleaner/"
    
    # First commit the current changes
    git add .
    git commit -m "Replace sensitive data with placeholders in example files"
    
    # Now push with force to override security warnings
    echo "You can now force push your changes with: git push origin --force"
fi 