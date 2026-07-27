import shutil, os

base = "/root/production-light"
files = {
    "/tmp/deploy-update/use-marketing-prototype.ts": "frontend/src/components/marketing/use-marketing-prototype.ts",
    "/tmp/deploy-update/ManagementTaskClient.tsx": "frontend/src/app/(dashboard)/marketing/management-task/ManagementTaskClient.tsx",
}
for src, rel in files.items():
    dst = os.path.join(base, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
    print(f"Copied: {rel}")
