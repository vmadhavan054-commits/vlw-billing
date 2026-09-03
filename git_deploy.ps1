git rm -r --cached node_modules
git add .gitignore
git add .
git commit -m "Add gitignore and source files"
git branch -M main
git remote add origin https://github.com/vmadhavan054-commits/vlw-billing.git 2>$null
git push -u origin main
