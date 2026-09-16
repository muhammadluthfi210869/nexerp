#!/usr/bin/env bash
hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
hook_name="$(basename "$0")"
hook_path="${hook_dir}/${hook_name}"
[ -f "${hook_path}" ] && exec "${hook_path}" "$@"
exit 0
