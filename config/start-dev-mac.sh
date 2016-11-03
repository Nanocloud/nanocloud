# Let's copy the source code in a directory outside a docker mount point to maximize compilation performance
echo "Copying"
cd /back/ && cp -r app.js api config /opt/
echo "copied"

# Let's download dependencies
echo "Installing deps"
cd /opt && npm install &&
echo "Deps installed"

# Let's sync source code between docker mount point and the folder inside the container
echo "Syncing"
lsyncd /lsyncd_source

echo "serving"
cd /opt && (node-inspector --hidden assets/ --web-port=8081 &) && nodemon --debug app.js
