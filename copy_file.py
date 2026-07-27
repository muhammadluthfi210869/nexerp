import shutil, os
src = '/tmp/deploy-update/ManagementTaskClient.tsx'
dst = '/root/production-light/frontend/src/app/(dashboard)/marketing/management-task/ManagementTaskClient.tsx'
os.makedirs(os.path.dirname(dst), exist_ok=True)
shutil.copy2(src, dst)
print('File copied')
