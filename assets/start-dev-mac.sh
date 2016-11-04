echo "Copying"
cd /front && cp -r app config tests public vendor bower.json package.json /opt/
cd /opt && npm install && bower install --allow-root ember build --environment=development && \
echo "copied"

echo "Syncing"
lsyncd /lsyncd_source

echo "serving"
cd /opt && ember serve --insecure-proxy true --ssl true --ssl-key /opt/ssl/nginx.key --ssl-cert /opt/ssl/nginx.crt
