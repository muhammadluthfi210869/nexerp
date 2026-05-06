$ip = "5.223.80.88"
$password = "xcTALimEkHTs"

Write-Host "STEP 1: Creating fresh archive..." -ForegroundColor Cyan
tar -czf deploy.tar.gz --exclude=node_modules --exclude=.next --exclude=.git backend frontend nginx.conf docker-compose.prod.yml

Write-Host "STEP 2: Uploading archive..." -ForegroundColor Cyan
scp -o StrictHostKeyChecking=no deploy.tar.gz "root@${ip}:/root/"

Write-Host "STEP 3: Building ERP System..." -ForegroundColor Green
$remoteCmd = "cd /root; tar -xzf deploy.tar.gz; docker compose -f docker-compose.prod.yml up -d --build"
ssh -t -o StrictHostKeyChecking=no "root@${ip}" $remoteCmd

Write-Host "DONE! Check http://$ip" -ForegroundColor Yellow
