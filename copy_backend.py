import shutil
shutil.copy2("/tmp/deploy-update/marketing-prototype.service.ts", "/root/production-light/backend/src/modules/marketing/prototype/marketing-prototype.service.ts")
print("File copied")
