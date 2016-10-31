echo "Copying"
cp -r /front/ /opt/
cd /opt && npm install && bower install --allow-root
echo "copied"

echo "Syncing"
lsyncd /lsyncd_source

echo "serving"
cd /opt && ember serve
