echo "Copying"
rsync -av --exclude='node_modules' --exclude='assets' /back/ /opt/
cd /opt && npm install && (node-inspector --hidden assets/ --web-port=8081 &)
echo "copied"

echo "Syncing"
lsyncd /lsyncd_source

echo "serving"
cd /opt && nodemon --debug app.js
