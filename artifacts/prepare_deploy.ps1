$includePath = Join-Path $PWD "include.txt"
$files = Get-ChildItem -Path backend, frontend, nginx.conf, docker-compose.prod.yml -Recurse | 
         Where-Object { $_.FullName -notmatch 'node_modules|\.next|\.git' } | 
         Where-Object { -not $_.PSIsContainer } |
         Select-Object -ExpandProperty FullName

$files | Out-File -FilePath $includePath -Encoding utf8
tar -czf deploy.tar.gz -T $includePath
Remove-Item $includePath
