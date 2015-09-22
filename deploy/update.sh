. envs.sh

# zip everything
zip -r index.zip index.js config.js package.json node_modules/*

# update function fileb:// is needed for .zip file
aws lambda update-function-code\
  --function-name "$function"\
  --zip-file fileb://index.zip
