Remove-Item lambda_upload.zip
Compress-Archive index.js lambda_upload.zip
aws lambda update-function-code --function-name SketchesSkill --zip-file fileb://lambda_upload.zip
